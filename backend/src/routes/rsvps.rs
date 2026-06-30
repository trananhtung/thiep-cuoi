use axum::body::Bytes;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};
use sqlx::Row;

use crate::auth::{can_manage, MaybeAuth};
use crate::error::{AppError, AppResult};
use crate::normalize::{clean_text, clean_trim, field, opt_in};
use crate::state::AppState;
use crate::util::{now_iso, parse_body, ManageQuery};

/// POST /api/invitations/:slug/rsvp
pub async fn create_rsvp(
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
    let name = clean_trim(field(&body, "name"), 120);
    if name.is_empty() {
        return Err(AppError::bad_request("Vui lòng nhập tên của bạn."));
    }
    if !opt_in(field(&body, "consent")) {
        return Err(AppError::bad_request(
            "Vui lòng đồng ý cho phép lưu thông tin để tiếp tục.",
        ));
    }

    // attending: false/'no' => 0, else 1
    let attending = match field(&body, "attending") {
        Value::Bool(false) => 0,
        v if v.as_str() == Some("no") => 0,
        _ => 1,
    };

    let mut guests = field(&body, "guests").as_i64().unwrap_or_else(|| {
        // parseInt-style: try parsing a string
        field(&body, "guests").as_str().and_then(|s| s.trim().parse::<i64>().ok()).unwrap_or(0)
    });
    if guests < 1 {
        guests = 1;
    }
    if guests > 20 {
        guests = 20;
    }

    let message = clean_text(field(&body, "message"), 500);
    let diet = if field(&body, "diet").as_str() == Some("chay") { "chay" } else { "man" };
    let stored_guests = if attending == 1 { guests } else { 0 };

    sqlx::query(
        "INSERT INTO rsvps (slug, name, attending, guests, message, diet, consent, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
    )
    .bind(&slug)
    .bind(&name)
    .bind(attending)
    .bind(stored_guests)
    .bind(&message)
    .bind(diet)
    .bind(now_iso())
    .execute(&st.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(json!({ "ok": true }))))
}

/// GET /api/invitations/:slug/rsvps  (chủ thiệp hoặc có manage_token)
pub async fn list_rsvps(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    Query(q): Query<ManageQuery>,
    MaybeAuth(user): MaybeAuth,
) -> AppResult<Json<Value>> {
    let inv = sqlx::query("SELECT owner_id, manage_token, views, seating FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;

    let owner_id: Option<i64> = inv.try_get("owner_id").ok().flatten();
    let stored_token: String = inv.get("manage_token");
    if !can_manage(owner_id, &stored_token, user.as_ref(), q.token.as_deref()) {
        return Err(AppError::forbidden("Bạn không có quyền xem danh sách này."));
    }

    let rows = sqlx::query(
        "SELECT id, name, attending, guests, message, diet, created_at FROM rsvps WHERE slug = ? ORDER BY id DESC",
    )
    .bind(&slug)
    .fetch_all(&st.pool)
    .await?;

    let mut rsvps = Vec::with_capacity(rows.len());
    let mut attending_count = 0i64;
    let mut total_guests = 0i64;
    let mut veg_guests = 0i64;
    for r in &rows {
        let attending: i64 = r.get("attending");
        let guests: i64 = r.get("guests");
        let diet: String = r.get("diet");
        if attending != 0 {
            attending_count += 1;
            total_guests += guests;
            if diet == "chay" {
                veg_guests += guests;
            }
        }
        rsvps.push(json!({
            "id": r.get::<i64, _>("id"),
            "name": r.get::<String, _>("name"),
            "attending": attending,
            "guests": guests,
            "message": r.get::<Option<String>, _>("message"),
            "diet": diet,
            "created_at": r.get::<String, _>("created_at"),
        }));
    }

    let total = rows.len() as i64;
    let seating_str: String = inv.get("seating");
    let seating: Value = serde_json::from_str(&seating_str)
        .unwrap_or_else(|_| json!({ "tables": [], "pool": [] }));
    let views: i64 = inv.try_get("views").unwrap_or(0);

    Ok(Json(json!({
        "rsvps": rsvps,
        "seating": seating,
        "stats": {
            "total": total,
            "attending": attending_count,
            "declined": total - attending_count,
            "totalGuests": total_guests,
            "vegGuests": veg_guests,
            "views": views,
        },
    })))
}

/// DELETE /api/invitations/:slug/rsvps/:id  (chủ thiệp hoặc có manage_token)
pub async fn delete_rsvp(
    State(st): State<AppState>,
    Path((slug, id)): Path<(String, String)>,
    Query(q): Query<ManageQuery>,
    MaybeAuth(user): MaybeAuth,
) -> AppResult<Json<Value>> {
    let inv = sqlx::query("SELECT owner_id, manage_token FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;
    let owner_id: Option<i64> = inv.try_get("owner_id").ok().flatten();
    let stored_token: String = inv.get("manage_token");
    if !can_manage(owner_id, &stored_token, user.as_ref(), q.token.as_deref()) {
        return Err(AppError::forbidden("Bạn không có quyền xoá RSVP này."));
    }
    let res = sqlx::query("DELETE FROM rsvps WHERE id = ? AND slug = ?")
        .bind(&id)
        .bind(&slug)
        .execute(&st.pool)
        .await?;
    Ok(Json(json!({ "ok": true, "deleted": res.rows_affected() })))
}

/// GET /api/invitations/:slug/wishes
pub async fn wishes(
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
        "SELECT name, attending, message, created_at FROM rsvps WHERE slug = ? AND message IS NOT NULL AND TRIM(message) <> '' ORDER BY id DESC LIMIT 100",
    )
    .bind(&slug)
    .fetch_all(&st.pool)
    .await?;

    let wishes: Vec<Value> = rows
        .iter()
        .map(|r| json!({
            "name": r.get::<String, _>("name"),
            "attending": r.get::<i64, _>("attending"),
            "message": r.get::<Option<String>, _>("message"),
            "created_at": r.get::<String, _>("created_at"),
        }))
        .collect();
    let total = wishes.len();
    Ok(Json(json!({ "wishes": wishes, "total": total })))
}
