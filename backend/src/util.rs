use axum::body::Bytes;
use chrono::{SecondsFormat, Utc};
use serde::Deserialize;
use serde_json::{json, Value};

/// Tolerant JSON body parse (matches Express `req.body || {}`): empty or invalid → `{}`.
pub fn parse_body(bytes: &Bytes) -> Value {
    if bytes.is_empty() {
        return json!({});
    }
    serde_json::from_slice(bytes).unwrap_or_else(|_| json!({}))
}

/// `new Date().toISOString()` equivalent: e.g. `2026-06-22T10:51:17.919Z`.
pub fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

#[derive(Deserialize)]
pub struct NameQuery {
    pub name: Option<String>,
}

/// `?token=...` query param carrying a `manage_token` for token-based
/// authorization of management actions.
#[derive(Deserialize, Default)]
pub struct ManageQuery {
    pub token: Option<String>,
}
