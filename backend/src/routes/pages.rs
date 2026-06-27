//! Page routes. These serve the built Astro frontend from `frontend/dist` (via
//! `public_dir`), including server-side Open Graph injection on `/thiep/:slug`
//! (critical for Zalo/Facebook link previews). The static HTML is produced by
//! `npm run build` in `frontend/`; this server stays framework-agnostic.

use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{Html, IntoResponse, Response};
use serde_json::{json, Value};
use sqlx::Row;

use crate::state::AppState;

/// Escape a value for use inside an HTML attribute (mirrors JS `escAttr`).
fn esc_attr(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\n', " ")
}

fn is_http(s: &str) -> bool {
    let l = s.trim().to_ascii_lowercase();
    l.starts_with("http://") || l.starts_with("https://")
}

fn read_public(state: &AppState, name: &str) -> std::io::Result<String> {
    std::fs::read_to_string(state.cfg.public_dir.join(name))
}

fn host_of(headers: &HeaderMap) -> String {
    headers
        .get(header::HOST)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("localhost")
        .to_string()
}

/// GET /thiep/:slug
pub async fn thiep_page(
    State(st): State<AppState>,
    Path(slug): Path<String>,
    headers: HeaderMap,
) -> Response {
    let mut html = match read_public(&st, "invite.html") {
        Ok(h) => h,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "invite.html missing").into_response(),
    };

    let row = sqlx::query("SELECT data FROM invitations WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await
        .ok()
        .flatten();

    if let Some(row) = row {
        let data_str: String = row.get("data");
        let d: Value = serde_json::from_str(&data_str).unwrap_or_else(|_| json!({}));
        let groom = d.get("groom").and_then(|v| v.as_str()).unwrap_or("");
        let bride = d.get("bride").and_then(|v| v.as_str()).unwrap_or("");
        let title = format!("Thiệp cưới {groom} & {bride}").trim().to_string();

        let invitation = d.get("invitation").and_then(|v| v.as_str()).unwrap_or("").trim();
        let desc: String = if invitation.is_empty() {
            "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi!".to_string()
        } else {
            invitation.to_string()
        };
        let desc: String = desc.chars().take(200).collect();

        let scheme = headers
            .get("x-forwarded-proto")
            .and_then(|h| h.to_str().ok())
            .unwrap_or("http");
        let url = format!("{scheme}://{}/thiep/{}", host_of(&headers), urlencode(&slug));

        let mut img = d.get("photoUrl").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
        if !is_http(&img) {
            if let Some(g) = d.get("gallery").and_then(|v| v.as_array()) {
                img = g
                    .iter()
                    .filter_map(|x| x.as_str())
                    .find(|s| is_http(s))
                    .unwrap_or("")
                    .trim()
                    .to_string();
            }
        }
        if !is_http(&img) {
            img = String::new();
        }

        let mut tags = vec![
            r#"<meta property="og:type" content="website" />"#.to_string(),
            r#"<meta property="og:site_name" content="Thiệp Cưới Online" />"#.to_string(),
            format!(r#"<meta property="og:title" content="{}" />"#, esc_attr(&title)),
            format!(r#"<meta property="og:description" content="{}" />"#, esc_attr(&desc)),
            format!(r#"<meta property="og:url" content="{}" />"#, esc_attr(&url)),
        ];
        if !img.is_empty() {
            tags.push(format!(r#"<meta property="og:image" content="{}" />"#, esc_attr(&img)));
        }
        tags.push(format!(
            r#"<meta name="twitter:card" content="{}" />"#,
            if img.is_empty() { "summary" } else { "summary_large_image" }
        ));
        tags.push(format!(r#"<meta name="twitter:title" content="{}" />"#, esc_attr(&title)));
        tags.push(format!(r#"<meta name="twitter:description" content="{}" />"#, esc_attr(&desc)));
        if !img.is_empty() {
            tags.push(format!(r#"<meta name="twitter:image" content="{}" />"#, esc_attr(&img)));
        }

        let joined = tags.join("\n  ");
        html = html.replacen("</head>", &format!("  {joined}\n</head>"), 1);
        html = replace_title(&html, &esc_attr(&title));
    }

    Html(html).into_response()
}

/// Replace the first `<title>...</title>` (mirrors JS regex replace).
fn replace_title(html: &str, title: &str) -> String {
    if let Some(start) = html.find("<title>") {
        if let Some(rel_end) = html[start..].find("</title>") {
            let end = start + rel_end + "</title>".len();
            let mut out = String::with_capacity(html.len());
            out.push_str(&html[..start]);
            out.push_str(&format!("<title>{title}</title>"));
            out.push_str(&html[end..]);
            return out;
        }
    }
    html.to_string()
}

/// Minimal `encodeURIComponent` for slugs (slugs are already URL-safe; encode the rest).
fn urlencode(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(b as char),
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

async fn serve(st: &AppState, name: &str) -> Response {
    match read_public(st, name) {
        Ok(h) => Html(h).into_response(),
        Err(_) => not_found(State(st.clone())).await,
    }
}

pub async fn index(State(st): State<AppState>) -> Response {
    serve(&st, "index.html").await
}
pub async fn manage(State(st): State<AppState>, Path(_slug): Path<String>) -> Response {
    serve(&st, "manage.html").await
}
pub async fn mau_thiep(State(st): State<AppState>) -> Response {
    serve(&st, "mau-thiep.html").await
}
pub async fn xem_ngay(State(st): State<AppState>) -> Response {
    serve(&st, "xem-ngay.html").await
}
pub async fn mam_qua(State(st): State<AppState>) -> Response {
    serve(&st, "mam-qua.html").await
}
pub async fn checklist(State(st): State<AppState>) -> Response {
    serve(&st, "checklist.html").await
}
pub async fn nghi_le(State(st): State<AppState>) -> Response {
    serve(&st, "nghi-le.html").await
}
pub async fn ngan_sach(State(st): State<AppState>) -> Response {
    serve(&st, "ngan-sach.html").await
}
pub async fn quyen_rieng_tu(State(st): State<AppState>) -> Response {
    serve(&st, "quyen-rieng-tu.html").await
}

pub async fn not_found(State(st): State<AppState>) -> Response {
    match read_public(&st, "404.html") {
        Ok(h) => (StatusCode::NOT_FOUND, Html(h)).into_response(),
        Err(_) => (StatusCode::NOT_FOUND, "Not found").into_response(),
    }
}
