use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::{json, Value};
use sqlx::Row;

use crate::error::{AppError, AppResult};
use crate::normalize::{clean_trim, field, opt_in, random_id};
use crate::state::AppState;
use crate::util::{now_iso, parse_body};

const MAX_PHOTOS: i64 = 200;
const MAX_BYTES_PER_SLUG: i64 = 60 * 1024 * 1024;
const MAX_PHOTO_BYTES: usize = 2 * 1024 * 1024;

fn ext_for(mime: &str) -> Option<&'static str> {
    match mime {
        "image/jpeg" => Some("jpg"),
        "image/png" => Some("png"),
        "image/webp" => Some("webp"),
        _ => None,
    }
}

/// Parse `data:(image/jpeg|png|webp);base64,<payload>` — payload must be all base64 chars.
fn parse_data_url(s: &str) -> Option<(&str, &str)> {
    let rest = s.strip_prefix("data:")?;
    let (mime, payload) = rest.split_once(";base64,")?;
    if ext_for(mime).is_none() {
        return None;
    }
    if payload.is_empty() || !payload.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'+' || b == b'/' || b == b'=') {
        return None;
    }
    Some((mime, payload))
}

fn image_magic_ok(buf: &[u8], mime: &str) -> bool {
    match mime {
        "image/jpeg" => buf.len() >= 3 && buf[0] == 0xFF && buf[1] == 0xD8 && buf[2] == 0xFF,
        "image/png" => {
            buf.len() >= 8 && buf[..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        }
        "image/webp" => buf.len() >= 12 && &buf[0..4] == b"RIFF" && &buf[8..12] == b"WEBP",
        _ => false,
    }
}

/// POST /api/invitations/:slug/photos
pub async fn upload_photo(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    bytes: Bytes,
) -> AppResult<(StatusCode, Json<Value>)> {
    let exists = sqlx::query("SELECT slug FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?;
    if exists.is_none() {
        return Err(AppError::not_found_invitation());
    }

    let body = parse_body(&bytes);
    if !opt_in(field(&body, "consent")) {
        return Err(AppError::bad_request("Vui lòng đồng ý cho phép lưu ảnh để tiếp tục."));
    }

    let image = field(&body, "image").as_str().unwrap_or("");
    let (mime, payload) = parse_data_url(image).ok_or_else(|| AppError::bad_request("Ảnh không hợp lệ."))?;
    let ext = ext_for(mime).unwrap();
    let buf = STANDARD.decode(payload).map_err(|_| AppError::bad_request("Ảnh không hợp lệ."))?;

    if buf.is_empty() {
        return Err(AppError::bad_request("Ảnh rỗng."));
    }
    if buf.len() > MAX_PHOTO_BYTES {
        return Err(AppError::new(StatusCode::PAYLOAD_TOO_LARGE, "Ảnh quá lớn (tối đa 2MB)."));
    }
    if !image_magic_ok(&buf, mime) {
        return Err(AppError::bad_request("Tệp không phải ảnh hợp lệ."));
    }

    let agg = sqlx::query("SELECT COUNT(*) AS n, COALESCE(SUM(bytes),0) AS total FROM photos WHERE slug = ?")
        .bind(&slug)
        .fetch_one(&st.pool)
        .await?;
    let n: i64 = agg.get("n");
    let total: i64 = agg.get("total");
    if n >= MAX_PHOTOS {
        return Err(AppError::new(StatusCode::TOO_MANY_REQUESTS, "Album đã đầy (tối đa 200 ảnh)."));
    }
    if total + buf.len() as i64 > MAX_BYTES_PER_SLUG {
        return Err(AppError::new(StatusCode::TOO_MANY_REQUESTS, "Album đã đạt giới hạn dung lượng."));
    }

    let id = random_id(12);
    let file = format!("{id}.{ext}");
    let dir = st.cfg.uploads_dir.join(&slug);
    let file_path = dir.join(&file);
    if tokio::fs::create_dir_all(&dir).await.is_err()
        || tokio::fs::write(&file_path, &buf).await.is_err()
    {
        return Err(AppError::internal("Không lưu được ảnh, thử lại."));
    }

    let uploader = clean_trim(field(&body, "uploader"), 80);
    let insert = sqlx::query("INSERT INTO photos (id, slug, file, uploader, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(&id)
        .bind(&slug)
        .bind(&file)
        .bind(&uploader)
        .bind(buf.len() as i64)
        .bind(now_iso())
        .execute(&st.pool)
        .await;
    if insert.is_err() {
        let _ = tokio::fs::remove_file(&file_path).await;
        return Err(AppError::internal("Không lưu được ảnh, thử lại."));
    }

    Ok((
        StatusCode::CREATED,
        Json(json!({ "id": id, "url": format!("/uploads/{slug}/{file}"), "uploader": uploader })),
    ))
}

/// GET /api/invitations/:slug/photos
pub async fn list_photos(
    State(st): State<AppState>,
    Path(slug): Path<String>,
) -> AppResult<Json<Value>> {
    let exists = sqlx::query("SELECT slug FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?;
    if exists.is_none() {
        return Err(AppError::not_found_invitation());
    }
    let rows = sqlx::query(
        "SELECT id, file, uploader, created_at FROM photos WHERE slug = ? ORDER BY created_at DESC, id DESC LIMIT 200",
    )
    .bind(&slug)
    .fetch_all(&st.pool)
    .await?;

    let photos: Vec<Value> = rows
        .iter()
        .map(|r| {
            let file: String = r.get("file");
            json!({
                "id": r.get::<String, _>("id"),
                "url": format!("/uploads/{slug}/{file}"),
                "uploader": r.get::<Option<String>, _>("uploader"),
                "createdAt": r.get::<String, _>("created_at"),
            })
        })
        .collect();
    let total = photos.len();
    Ok(Json(json!({ "photos": photos, "total": total })))
}
