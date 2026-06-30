use axum::body::Bytes;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};
use sqlx::Row;

use crate::auth::{can_manage, MaybeAuth};
use crate::error::{AppError, AppResult};
use crate::normalize as nz;
use crate::normalize::{clean_text, clean_trim, field};
use crate::state::AppState;
use crate::util::{now_iso, parse_body, ManageQuery, NameQuery};

const VALID_TEMPLATES: [&str; 12] = [
    "truyen-thong", "hien-dai", "pastel", "hoang-gia", "xanh-la", "do-ruou", "anh-dao",
    "long-phung", "mai-trang", "lam-ngoc", "hong-kim", "luc-bao",
];

/// POST /api/invitations
///
/// Anonymous-friendly: a guest can create a card without an account. When
/// logged in, the card is owned by that user; otherwise it is ownerless and
/// managed via the returned `manageToken`.
pub async fn create(State(st): State<AppState>, MaybeAuth(user): MaybeAuth, bytes: Bytes) -> AppResult<(StatusCode, Json<Value>)> {
    let body = parse_body(&bytes);

    let groom = clean_trim(field(&body, "groom"), 80);
    let bride = clean_trim(field(&body, "bride"), 80);
    let wedding_date = clean_trim(field(&body, "weddingDate"), 40);

    if groom.is_empty() || bride.is_empty() {
        return Err(AppError::bad_request("Vui lòng nhập tên cô dâu và chú rể."));
    }
    if wedding_date.is_empty() {
        return Err(AppError::bad_request("Vui lòng chọn ngày cưới."));
    }

    let template = match body.get("template").and_then(|v| v.as_str()) {
        Some(t) if VALID_TEMPLATES.contains(&t) => t.to_string(),
        _ => "truyen-thong".to_string(),
    };

    // Mirror the JS data-object key order exactly (preserve_order keeps it stable).
    let livestream = {
        let s = nz::js_string(field(&body, "livestreamUrl"));
        let l = s.trim().to_ascii_lowercase();
        if l.starts_with("http://") || l.starts_with("https://") {
            clean_trim(field(&body, "livestreamUrl"), 500)
        } else {
            String::new()
        }
    };

    let data = json!({
        "groom": groom,
        "bride": bride,
        "weddingDate": wedding_date,
        "invitation": clean_text(field(&body, "invitation"), 600),
        "story": clean_text(field(&body, "story"), 1000),
        "loveStory": nz::parse_love_story(field(&body, "loveStory")),
        "photoUrl": clean_trim(field(&body, "photoUrl"), 500),
        "gallery": nz::parse_gallery(field(&body, "gallery")),
        "musicUrl": clean_trim(field(&body, "musicUrl"), 500),
        "livestreamUrl": livestream,
        "intro": nz::intro_on(field(&body, "intro")),
        "saveTheDate": nz::opt_in(field(&body, "saveTheDate")),
        "thankYou": {
            "enabled": nz::opt_in(field(&body, "thankYouEnabled")),
            "message": clean_text(field(&body, "thankYouMsg"), 600),
        },
        "faq": nz::parse_faq(field(&body, "faq")),
        "events": nz::parse_events(field(&body, "events")),
        "stays": nz::parse_stays(field(&body, "stays")),
        "timeline": nz::parse_timeline(field(&body, "timeline")),
        "dressCode": {
            "text": clean_trim(field(&body, "dressText"), 200),
            "colors": nz::parse_colors(field(&body, "dressColors")),
        },
        "parents": {
            "groomFather": clean_text(field(&body, "groomFather"), 120),
            "groomMother": clean_text(field(&body, "groomMother"), 120),
            "brideFather": clean_text(field(&body, "brideFather"), 120),
            "brideMother": clean_text(field(&body, "brideMother"), 120),
        },
        "groomVenue": {
            "name": clean_text(field(&body, "groomVenueName"), 200),
            "address": clean_text(field(&body, "groomVenueAddress"), 300),
            "mapUrl": clean_trim(field(&body, "groomMapUrl"), 500),
            "time": clean_text(field(&body, "groomTime"), 80),
            "ceremony": clean_text(field(&body, "groomCeremony"), 40),
        },
        "brideVenue": {
            "name": clean_text(field(&body, "brideVenueName"), 200),
            "address": clean_text(field(&body, "brideVenueAddress"), 300),
            "mapUrl": clean_trim(field(&body, "brideMapUrl"), 500),
            "time": clean_text(field(&body, "brideTime"), 80),
            "ceremony": clean_text(field(&body, "brideCeremony"), 40),
        },
        "gift": {
            "enabled": nz::opt_in(field(&body, "giftEnabled")),
            "note": clean_text(field(&body, "giftNote"), 300),
            "groom": {
                "bank": clean_trim(field(&body, "giftGroomBank"), 40),
                "account": nz::alnum_only(&clean_text(field(&body, "giftGroomAccount"), 40)),
                "name": clean_trim(field(&body, "giftGroomName"), 120),
            },
            "bride": {
                "bank": clean_trim(field(&body, "giftBrideBank"), 40),
                "account": nz::alnum_only(&clean_text(field(&body, "giftBrideAccount"), 40)),
                "name": clean_trim(field(&body, "giftBrideName"), 120),
            },
        },
    });

    let base = {
        let s = nz::slugify(&format!("{groom}-{bride}"));
        if s.is_empty() {
            "thiep-cuoi".to_string()
        } else {
            s
        }
    };

    let mut slug = None;
    for _ in 0..6 {
        let candidate = format!("{base}-{}", nz::random_id(5));
        let exists = sqlx::query("SELECT 1 FROM invitations WHERE slug = ?")
            .bind(&candidate)
            .fetch_optional(&st.pool)
            .await?;
        if exists.is_none() {
            slug = Some(candidate);
            break;
        }
    }
    let slug = slug.ok_or_else(|| AppError::internal("Không tạo được mã thiệp, thử lại."))?;

    let manage_token = nz::random_id(16);
    sqlx::query(
        "INSERT INTO invitations (slug, manage_token, template, data, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&slug)
    .bind(&manage_token)
    .bind(&template)
    .bind(serde_json::to_string(&data).unwrap())
    .bind(user.as_ref().map(|u| u.user_id))
    .bind(now_iso())
    .execute(&st.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(json!({ "slug": slug, "manageToken": manage_token }))))
}

/// GET /api/invitations/:slug
pub async fn get_invitation(
    State(st): State<AppState>,
    Path(slug): Path<String>,
) -> AppResult<Json<Value>> {
    let row = sqlx::query("SELECT slug, template, data, seating, created_at FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;

    let seating_str: String = row.get("seating");
    let has_seating = serde_json::from_str::<Value>(&seating_str)
        .ok()
        .and_then(|s| s.get("tables").and_then(|t| t.as_array()).map(|tables| {
            tables.iter().any(|tb| {
                tb.get("guests").and_then(|g| g.as_array()).map(|g| !g.is_empty()).unwrap_or(false)
            })
        }))
        .unwrap_or(false);

    let data_str: String = row.get("data");
    let data: Value = serde_json::from_str(&data_str).unwrap_or_else(|_| json!({}));

    Ok(Json(json!({
        "slug": row.get::<String, _>("slug"),
        "template": row.get::<String, _>("template"),
        "data": data,
        "hasSeating": has_seating,
        "createdAt": row.get::<String, _>("created_at"),
    })))
}

/// GET /api/invitations/:slug/find-table
pub async fn find_table(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    Query(q): Query<NameQuery>,
) -> AppResult<Json<Value>> {
    let row = sqlx::query("SELECT seating FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;

    let name_val = json!(q.name.unwrap_or_default());
    let query_name = clean_trim(&name_val, 80).to_lowercase();
    if query_name.is_empty() {
        return Err(AppError::bad_request("Vui lòng nhập tên."));
    }

    let seating_str: String = row.get("seating");
    let seating: Value = serde_json::from_str(&seating_str).unwrap_or_else(|_| json!({}));
    let mut table = String::new();
    if let Some(tables) = seating.get("tables").and_then(|t| t.as_array()) {
        for tb in tables {
            if let Some(guests) = tb.get("guests").and_then(|g| g.as_array()) {
                if guests.iter().any(|g| nz::js_string(g).trim().to_lowercase() == query_name) {
                    table = tb.get("name").and_then(|n| n.as_str()).unwrap_or("Bàn").to_string();
                }
            }
        }
    }

    Ok(Json(json!({ "found": !table.is_empty(), "table": table })))
}

/// PUT /api/invitations/:slug
///
/// Editable by the logged-in owner, or by anyone holding the `manage_token`
/// (passed as `?token=`), so anonymous creators can keep editing their card.
pub async fn update(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    Query(q): Query<ManageQuery>,
    MaybeAuth(user): MaybeAuth,
    bytes: Bytes,
) -> AppResult<Json<Value>> {
    // Verify ownership (owner session) or manage_token.
    let row = sqlx::query("SELECT owner_id, manage_token FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;

    let owner_id: Option<i64> = row.try_get("owner_id").ok().flatten();
    let stored_token: String = row.get("manage_token");
    if !can_manage(owner_id, &stored_token, user.as_ref(), q.token.as_deref()) {
        return Err(AppError::forbidden("Bạn không có quyền chỉnh sửa thiệp này."));
    }

    let body = parse_body(&bytes);

    let groom = clean_trim(field(&body, "groom"), 80);
    let bride = clean_trim(field(&body, "bride"), 80);
    let wedding_date = clean_trim(field(&body, "weddingDate"), 40);

    if groom.is_empty() || bride.is_empty() {
        return Err(AppError::bad_request("Vui lòng nhập tên cô dâu và chú rể."));
    }
    if wedding_date.is_empty() {
        return Err(AppError::bad_request("Vui lòng chọn ngày cưới."));
    }

    let template = match body.get("template").and_then(|v| v.as_str()) {
        Some(t) if VALID_TEMPLATES.contains(&t) => t.to_string(),
        _ => {
            // Keep existing template if not provided
            let cur = sqlx::query("SELECT template FROM invitations WHERE slug = ?")
                .bind(&slug)
                .fetch_one(&st.pool)
                .await?;
            cur.get::<String, _>("template")
        }
    };

    let livestream = {
        let s = nz::js_string(field(&body, "livestreamUrl"));
        let l = s.trim().to_ascii_lowercase();
        if l.starts_with("http://") || l.starts_with("https://") {
            clean_trim(field(&body, "livestreamUrl"), 500)
        } else {
            String::new()
        }
    };

    let data = json!({
        "groom": groom,
        "bride": bride,
        "weddingDate": wedding_date,
        "invitation": clean_text(field(&body, "invitation"), 600),
        "story": clean_text(field(&body, "story"), 1000),
        "loveStory": nz::parse_love_story(field(&body, "loveStory")),
        "photoUrl": clean_trim(field(&body, "photoUrl"), 500),
        "gallery": nz::parse_gallery(field(&body, "gallery")),
        "musicUrl": clean_trim(field(&body, "musicUrl"), 500),
        "livestreamUrl": livestream,
        "intro": nz::intro_on(field(&body, "intro")),
        "saveTheDate": nz::opt_in(field(&body, "saveTheDate")),
        "thankYou": {
            "enabled": nz::opt_in(field(&body, "thankYouEnabled")),
            "message": clean_text(field(&body, "thankYouMsg"), 600),
        },
        "faq": nz::parse_faq(field(&body, "faq")),
        "events": nz::parse_events(field(&body, "events")),
        "stays": nz::parse_stays(field(&body, "stays")),
        "timeline": nz::parse_timeline(field(&body, "timeline")),
        "dressCode": {
            "text": clean_trim(field(&body, "dressText"), 200),
            "colors": nz::parse_colors(field(&body, "dressColors")),
        },
        "parents": {
            "groomFather": clean_text(field(&body, "groomFather"), 120),
            "groomMother": clean_text(field(&body, "groomMother"), 120),
            "brideFather": clean_text(field(&body, "brideFather"), 120),
            "brideMother": clean_text(field(&body, "brideMother"), 120),
        },
        "groomVenue": {
            "name": clean_text(field(&body, "groomVenueName"), 200),
            "address": clean_text(field(&body, "groomVenueAddress"), 300),
            "mapUrl": clean_trim(field(&body, "groomMapUrl"), 500),
            "time": clean_text(field(&body, "groomTime"), 80),
            "ceremony": clean_text(field(&body, "groomCeremony"), 40),
        },
        "brideVenue": {
            "name": clean_text(field(&body, "brideVenueName"), 200),
            "address": clean_text(field(&body, "brideVenueAddress"), 300),
            "mapUrl": clean_trim(field(&body, "brideMapUrl"), 500),
            "time": clean_text(field(&body, "brideTime"), 80),
            "ceremony": clean_text(field(&body, "brideCeremony"), 40),
        },
        "gift": {
            "enabled": nz::opt_in(field(&body, "giftEnabled")),
            "note": clean_text(field(&body, "giftNote"), 300),
            "groom": {
                "bank": clean_trim(field(&body, "giftGroomBank"), 40),
                "account": nz::alnum_only(&clean_text(field(&body, "giftGroomAccount"), 40)),
                "name": clean_trim(field(&body, "giftGroomName"), 120),
            },
            "bride": {
                "bank": clean_trim(field(&body, "giftBrideBank"), 40),
                "account": nz::alnum_only(&clean_text(field(&body, "giftBrideAccount"), 40)),
                "name": clean_trim(field(&body, "giftBrideName"), 120),
            },
        },
    });

    sqlx::query("UPDATE invitations SET template = ?, data = ? WHERE slug = ?")
        .bind(&template)
        .bind(serde_json::to_string(&data).unwrap())
        .bind(&slug)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "ok": true, "slug": slug })))
}

/// POST /api/invitations/:slug/view
pub async fn bump_view(
    State(st): State<AppState>,
    Path(slug): Path<String>,
) -> AppResult<Json<Value>> {
    let res = sqlx::query("UPDATE invitations SET views = views + 1 WHERE slug = ?")
        .bind(&slug)
        .execute(&st.pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found_invitation());
    }
    let row = sqlx::query("SELECT views FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_one(&st.pool)
        .await?;
    Ok(Json(json!({ "views": row.get::<i64, _>("views") })))
}
