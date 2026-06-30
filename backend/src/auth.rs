//! Session cookie helpers + `AuthUser` request extractor.
//!
//! Sessions are stored in the `sessions` table. The cookie value is a random
//! 32-byte token (base64url-encoded) that maps to a row in `sessions`.

use axum::extract::FromRequestParts;
use axum::http::{header, request::Parts, StatusCode};
use axum::Json;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand::RngCore;
use serde_json::{json, Value};
use sqlx::Row;

use crate::state::AppState;
use crate::util::now_iso;

pub const COOKIE_NAME: &str = "__sid";
const SESSION_DAYS: i64 = 30;

// ─── helpers ──────────────────────────────────────────────────────────────────

/// Generate a new random session token (43-char base64url string).
pub fn new_token() -> String {
    let mut buf = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut buf);
    URL_SAFE_NO_PAD.encode(buf)
}

/// ISO-8601 datetime `SESSION_DAYS` from now.
fn expiry_iso() -> String {
    use chrono::{Duration, Utc};
    (Utc::now() + Duration::days(SESSION_DAYS)).format("%Y-%m-%dT%H:%M:%SZ").to_string()
}

/// Build a `Set-Cookie` header value for the session token.
pub fn set_cookie(token: &str) -> String {
    format!(
        "{COOKIE_NAME}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={}",
        SESSION_DAYS * 86400
    )
}

/// Build a `Set-Cookie` header that expires the session cookie immediately.
pub fn clear_cookie() -> String {
    format!("{COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
}

/// Create a session in the DB for `user_id` and return the token.
pub async fn create_session(pool: &sqlx::SqlitePool, user_id: i64) -> Result<String, sqlx::Error> {
    let token = new_token();
    let expires = expiry_iso();
    sqlx::query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(&token)
        .bind(user_id)
        .bind(&expires)
        .execute(pool)
        .await?;
    Ok(token)
}

/// Extract the raw session token from the `Cookie` header, if present.
fn extract_token(parts: &Parts) -> Option<&str> {
    let cookie_hdr = parts.headers.get(header::COOKIE)?.to_str().ok()?;
    cookie_hdr.split(';').find_map(|c| {
        let c = c.trim();
        c.strip_prefix(&format!("{COOKIE_NAME}="))
    })
}

// ─── extractor ────────────────────────────────────────────────────────────────

/// Logged-in user extracted from the session cookie. Rejects with 401 if
/// the cookie is missing, invalid, or expired.
#[derive(Clone, Debug)]
pub struct AuthUser {
    pub user_id: i64,
    pub email: String,
}

#[axum::async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = (StatusCode, Json<Value>);

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = extract_token(parts).ok_or_else(unauthorized)?;

        let row = sqlx::query(
            "SELECT s.user_id, s.expires_at, u.email \
             FROM sessions s JOIN users u ON u.id = s.user_id \
             WHERE s.id = ?",
        )
        .bind(token)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| unauthorized())?
        .ok_or_else(unauthorized)?;

        let expires: String = row.get("expires_at");
        if expires < now_iso() {
            // Clean up expired session asynchronously (fire and forget)
            let _ = sqlx::query("DELETE FROM sessions WHERE id = ?")
                .bind(token)
                .execute(&state.pool)
                .await;
            return Err(unauthorized());
        }

        Ok(AuthUser {
            user_id: row.get("user_id"),
            email: row.get("email"),
        })
    }
}

/// Decide whether a requester may manage an invitation.
///
/// Management is granted to either (a) the logged-in owner, or (b) anyone
/// holding the invitation's `manage_token`. This is what lets a guest create
/// a card anonymously and keep managing it via a token link, while a
/// registered owner manages it through their session — "build first,
/// register later".
pub fn can_manage(
    owner_id: Option<i64>,
    stored_token: &str,
    user: Option<&AuthUser>,
    provided_token: Option<&str>,
) -> bool {
    if let (Some(u), Some(oid)) = (user, owner_id) {
        if u.user_id == oid {
            return true;
        }
    }
    matches!(provided_token, Some(t) if !t.is_empty() && t == stored_token)
}

/// Optional auth — returns `None` instead of rejecting when not logged in.
pub struct MaybeAuth(pub Option<AuthUser>);

#[axum::async_trait]
impl FromRequestParts<AppState> for MaybeAuth {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        Ok(MaybeAuth(AuthUser::from_request_parts(parts, state).await.ok()))
    }
}

fn unauthorized() -> (StatusCode, Json<Value>) {
    (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Bạn chưa đăng nhập." })))
}
