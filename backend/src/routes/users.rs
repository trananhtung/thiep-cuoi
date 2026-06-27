//! Auth routes: register, login, logout, me.
//! User invitation routes: list owned invitations, claim orphan, update invitation.

use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{header, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::Row;

use crate::auth::{clear_cookie, create_session, set_cookie, AuthUser};
use crate::error::{AppError, AppResult};
use crate::util::{now_iso, parse_body};
use crate::state::AppState;

// ─── POST /api/auth/register ──────────────────────────────────────────────────

pub async fn register(State(st): State<AppState>, bytes: Bytes) -> impl IntoResponse {
    let body = parse_body(&bytes);

    let email = body.get("email").and_then(|v| v.as_str()).unwrap_or("").trim().to_lowercase();
    let password = body.get("password").and_then(|v| v.as_str()).unwrap_or("");

    if email.is_empty() || !email.contains('@') {
        return Err(AppError::bad_request("Email không hợp lệ."));
    }
    if password.len() < 6 {
        return Err(AppError::bad_request("Mật khẩu phải có ít nhất 6 ký tự."));
    }
    if password.len() > 128 {
        return Err(AppError::bad_request("Mật khẩu quá dài."));
    }

    // Check duplicate email
    let exists = sqlx::query("SELECT 1 FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&st.pool)
        .await?;
    if exists.is_some() {
        return Err(AppError::bad_request("Email này đã được đăng ký."));
    }

    let password_hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)
        .map_err(|_| AppError::internal("Lỗi mã hoá mật khẩu."))?;

    let user_id: i64 = sqlx::query(
        "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?) RETURNING id",
    )
    .bind(&email)
    .bind(&password_hash)
    .bind(now_iso())
    .fetch_one(&st.pool)
    .await?
    .get("id");

    let token = create_session(&st.pool, user_id).await?;

    Ok((
        StatusCode::CREATED,
        [(header::SET_COOKIE, set_cookie(&token))],
        Json(json!({ "id": user_id, "email": email })),
    ))
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

pub async fn login(State(st): State<AppState>, bytes: Bytes) -> impl IntoResponse {
    let body = parse_body(&bytes);

    let email = body.get("email").and_then(|v| v.as_str()).unwrap_or("").trim().to_lowercase();
    let password = body.get("password").and_then(|v| v.as_str()).unwrap_or("");

    let row = sqlx::query("SELECT id, password_hash FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&st.pool)
        .await?;

    // Same error for wrong email or wrong password (prevents enumeration)
    let err = || AppError::bad_request("Email hoặc mật khẩu không đúng.");

    let row = row.ok_or_else(err)?;
    let hash: String = row.get("password_hash");
    let user_id: i64 = row.get("id");

    let valid = bcrypt::verify(password, &hash).map_err(|_| AppError::internal("Lỗi xác thực."))?;
    if !valid {
        return Err(err());
    }

    let token = create_session(&st.pool, user_id).await?;

    Ok((
        StatusCode::OK,
        [(header::SET_COOKIE, set_cookie(&token))],
        Json(json!({ "id": user_id, "email": email })),
    ))
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

pub async fn logout(State(st): State<AppState>, user: AuthUser) -> impl IntoResponse {
    // Delete the session from DB (best-effort)
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = ? AND expires_at >= ?")
        .bind(user.user_id)
        .bind(now_iso())
        .execute(&st.pool)
        .await;

    (
        StatusCode::OK,
        [(header::SET_COOKIE, clear_cookie())],
        Json(json!({ "ok": true })),
    )
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

pub async fn me(user: AuthUser) -> Json<Value> {
    Json(json!({ "id": user.user_id, "email": user.email }))
}

// ─── GET /api/user/invitations ────────────────────────────────────────────────

pub async fn list_invitations(
    State(st): State<AppState>,
    user: AuthUser,
) -> AppResult<Json<Value>> {
    let rows = sqlx::query(
        "SELECT slug, template, data, views, created_at \
         FROM invitations WHERE owner_id = ? ORDER BY created_at DESC",
    )
    .bind(user.user_id)
    .fetch_all(&st.pool)
    .await?;

    let items: Vec<Value> = rows
        .iter()
        .map(|r| {
            let data_str: String = r.get("data");
            let data: Value = serde_json::from_str(&data_str).unwrap_or_else(|_| json!({}));
            let groom = data.get("groom").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let bride = data.get("bride").and_then(|v| v.as_str()).unwrap_or("").to_string();
            json!({
                "slug": r.get::<String, _>("slug"),
                "template": r.get::<String, _>("template"),
                "groom": groom,
                "bride": bride,
                "views": r.get::<i64, _>("views"),
                "createdAt": r.get::<String, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "invitations": items })))
}

// ─── POST /api/invitations/:slug/claim ────────────────────────────────────────
// Nhận thiệp mồ côi về tài khoản bằng manage_token cũ.

pub async fn claim_invitation(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    user: AuthUser,
    bytes: Bytes,
) -> AppResult<Json<Value>> {
    let body = parse_body(&bytes);
    let token = body.get("manageToken").and_then(|v| v.as_str()).unwrap_or("");

    if token.is_empty() {
        return Err(AppError::bad_request("Thiếu manage token."));
    }

    let row = sqlx::query("SELECT owner_id, manage_token FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(AppError::not_found_invitation)?;

    let existing_owner: Option<i64> = row.try_get("owner_id").ok().flatten();
    if existing_owner.is_some() {
        return Err(AppError::bad_request("Thiệp này đã có chủ."));
    }

    let stored_token: String = row.get("manage_token");
    if token != stored_token {
        return Err(AppError::bad_request("Mã token không đúng."));
    }

    sqlx::query("UPDATE invitations SET owner_id = ? WHERE slug = ?")
        .bind(user.user_id)
        .bind(&slug)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "ok": true, "slug": slug })))
}
