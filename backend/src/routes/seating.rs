use axum::body::Bytes;
use axum::extract::{Path, Query, State};
use axum::Json;
use serde_json::{json, Value};
use sqlx::Row;

use crate::error::{AppError, AppResult};
use crate::normalize::{clean_trim, field};
use crate::state::AppState;
use crate::util::{parse_body, TokenQuery};

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

/// POST /api/invitations/:slug/seating?token=
pub async fn save_seating(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    Query(q): Query<TokenQuery>,
    bytes: Bytes,
) -> AppResult<Json<Value>> {
    let inv = sqlx::query("SELECT manage_token FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;
    let token: String = inv.get("manage_token");
    if q.token.as_deref() != Some(token.as_str()) {
        return Err(AppError::forbidden("Mã quản lý không đúng."));
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
