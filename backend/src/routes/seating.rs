use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::Json;
use serde_json::{json, Value};
use sqlx::Row;

use crate::auth::AuthUser;
use crate::error::{AppError, AppResult};
use crate::normalize::{clean_trim, field};
use crate::state::AppState;
use crate::util::parse_body;

fn clean_names(v: &Value) -> Vec<Value> {
    let arr = match v {
        Value::Array(a) => a.clone(),
        _ => vec![],
    };
    arr.iter()
        .map(|n| clean_trim(n, 80))
        .filter(|n| !n.is_empty())
        .take(500)
        .map(Value::String)
        .collect()
}

/// POST /api/invitations/:slug/seating  (yêu cầu đăng nhập + là chủ thiệp)
pub async fn save_seating(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    user: AuthUser,
    bytes: Bytes,
) -> AppResult<Json<Value>> {
    let inv = sqlx::query("SELECT owner_id FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;
    let owner_id: Option<i64> = inv.try_get("owner_id").ok().flatten();
    if owner_id != Some(user.user_id) {
        return Err(AppError::forbidden("Bạn không có quyền cập nhật sơ đồ bàn này."));
    }

    let body = parse_body(&bytes);
    let tables: Vec<Value> = match field(&body, "tables") {
        Value::Array(a) => a
            .iter()
            .take(100)
            .map(|tb| {
                let name = {
                    let n = clean_trim(field(tb, "name"), 60);
                    if n.is_empty() {
                        "Bàn".to_string()
                    } else {
                        n
                    }
                };
                json!({ "name": name, "guests": clean_names(field(tb, "guests")) })
            })
            .collect(),
        _ => vec![],
    };

    let seating = json!({ "tables": tables, "pool": clean_names(field(&body, "pool")) });

    sqlx::query("UPDATE invitations SET seating = ? WHERE slug = ?")
        .bind(serde_json::to_string(&seating).unwrap())
        .bind(&slug)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "ok": true, "seating": seating })))
}
