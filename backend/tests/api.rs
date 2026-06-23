//! Integration tests for the API contract — exercised via `oneshot` against a temp DB.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::Router;
use base64::{engine::general_purpose::STANDARD, Engine};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

use thiep_backend::config::Config;
use thiep_backend::state::AppState;
use thiep_backend::{db, routes};

async fn make_app() -> (Router, tempfile::TempDir) {
    let dir = tempfile::tempdir().unwrap();
    let db_path = dir.path().join("t.db");
    let pool = db::connect(db_path.to_str().unwrap()).await.unwrap();
    let mut cfg = Config::from_env();
    cfg.db_path = db_path.to_string_lossy().into_owned();
    cfg.uploads_dir = dir.path().join("uploads");
    cfg.public_dir = std::path::PathBuf::from("../public");
    (routes::build_router(AppState::new(pool, cfg)), dir)
}

async fn call(app: &Router, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
    let builder = Request::builder().method(method).uri(uri);
    let request = match body {
        Some(v) => builder
            .header("content-type", "application/json")
            .body(Body::from(v.to_string()))
            .unwrap(),
        None => builder.body(Body::empty()).unwrap(),
    };
    let resp = app.clone().oneshot(request).await.unwrap();
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let val: Value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, val)
}

async fn create_basic(app: &Router) -> (String, String) {
    let (status, body) = call(
        app,
        "POST",
        "/api/invitations",
        Some(json!({
            "groom": "Nguyễn Văn A",
            "bride": "Trần Thị B",
            "weddingDate": "2027-01-01T10:00",
            "template": "hien-dai",
            "events": "Lễ cưới | 10:00 | Nhà hàng X | https://maps.google.com/?q=1.2,3.4"
        })),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let slug = body["slug"].as_str().unwrap().to_string();
    let token = body["manageToken"].as_str().unwrap().to_string();
    assert_eq!(token.len(), 16);
    (slug, token)
}

#[tokio::test]
async fn create_requires_names_and_date() {
    let (app, _d) = make_app().await;
    let (s, b) = call(&app, "POST", "/api/invitations", Some(json!({"bride": "B", "weddingDate": "x"}))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);
    assert_eq!(b["error"], "Vui lòng nhập tên cô dâu và chú rể.");

    let (s, b) = call(&app, "POST", "/api/invitations", Some(json!({"groom": "A", "bride": "B"}))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);
    assert_eq!(b["error"], "Vui lòng chọn ngày cưới.");
}

#[tokio::test]
async fn create_get_roundtrip() {
    let (app, _d) = make_app().await;
    let (slug, _tok) = create_basic(&app).await;

    let (s, b) = call(&app, "GET", &format!("/api/invitations/{slug}"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(b["template"], "hien-dai");
    assert_eq!(b["data"]["groom"], "Nguyễn Văn A");
    assert_eq!(b["hasSeating"], false);
    // event mapUrl with comma preserved
    assert_eq!(b["data"]["events"][0]["mapUrl"], "https://maps.google.com/?q=1.2,3.4");
    // data blob key order matches the legacy server
    let keys: Vec<&str> = b["data"].as_object().unwrap().keys().map(|s| s.as_str()).collect();
    assert_eq!(keys[0], "groom");
    assert_eq!(keys[1], "bride");
    assert_eq!(keys[2], "weddingDate");
}

#[tokio::test]
async fn get_unknown_is_404() {
    let (app, _d) = make_app().await;
    let (s, b) = call(&app, "GET", "/api/invitations/nope", None).await;
    assert_eq!(s, StatusCode::NOT_FOUND);
    assert_eq!(b["error"], "Không tìm thấy thiệp.");
}

#[tokio::test]
async fn rsvp_consent_gate_and_stats() {
    let (app, _d) = make_app().await;
    let (slug, token) = create_basic(&app).await;

    // missing consent -> 400
    let (s, b) = call(&app, "POST", &format!("/api/invitations/{slug}/rsvp"),
        Some(json!({"name": "Khách 1", "attending": true, "guests": 3}))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);
    assert_eq!(b["error"], "Vui lòng đồng ý cho phép lưu thông tin để tiếp tục.");

    // missing name -> 400
    let (s, _b) = call(&app, "POST", &format!("/api/invitations/{slug}/rsvp"),
        Some(json!({"consent": true}))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);

    // valid attending=3 chay
    let (s, _b) = call(&app, "POST", &format!("/api/invitations/{slug}/rsvp"),
        Some(json!({"name": "Khách 1", "attending": true, "guests": 3, "diet": "chay", "consent": "yes", "message": "Chúc mừng"}))).await;
    assert_eq!(s, StatusCode::CREATED);
    // declined: guests stored as 0
    let (s, _b) = call(&app, "POST", &format!("/api/invitations/{slug}/rsvp"),
        Some(json!({"name": "Khách 2", "attending": "no", "guests": 5, "consent": true}))).await;
    assert_eq!(s, StatusCode::CREATED);

    // list without token -> 403
    let (s, _b) = call(&app, "GET", &format!("/api/invitations/{slug}/rsvps?token=wrong"), None).await;
    assert_eq!(s, StatusCode::FORBIDDEN);

    // list with token -> stats correct
    let (s, b) = call(&app, "GET", &format!("/api/invitations/{slug}/rsvps?token={token}"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(b["stats"]["total"], 2);
    assert_eq!(b["stats"]["attending"], 1);
    assert_eq!(b["stats"]["declined"], 1);
    assert_eq!(b["stats"]["totalGuests"], 3);
    assert_eq!(b["stats"]["vegGuests"], 3);

    // wishes only includes the one with a message
    let (s, b) = call(&app, "GET", &format!("/api/invitations/{slug}/wishes"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(b["total"], 1);
    assert_eq!(b["wishes"][0]["name"], "Khách 1");
}

#[tokio::test]
async fn seating_and_find_table() {
    let (app, _d) = make_app().await;
    let (slug, token) = create_basic(&app).await;

    let (s, _b) = call(&app, "POST", &format!("/api/invitations/{slug}/seating?token=wrong"),
        Some(json!({"tables": []}))).await;
    assert_eq!(s, StatusCode::FORBIDDEN);

    let (s, b) = call(&app, "POST", &format!("/api/invitations/{slug}/seating?token={token}"),
        Some(json!({"tables": [{"name": "Bàn VIP", "guests": ["Cô Lan", "Chú Ba"]}], "pool": ["Ai đó"]}))).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(b["seating"]["tables"][0]["name"], "Bàn VIP");

    // find-table: known guest (case-insensitive)
    let (s, b) = call(&app, "GET", &format!("/api/invitations/{slug}/find-table?name=cô%20lan"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(b["found"], true);
    assert_eq!(b["table"], "Bàn VIP");

    // unknown guest
    let (_s, b) = call(&app, "GET", &format!("/api/invitations/{slug}/find-table?name=nobody"), None).await;
    assert_eq!(b["found"], false);

    // hasSeating now true
    let (_s, b) = call(&app, "GET", &format!("/api/invitations/{slug}"), None).await;
    assert_eq!(b["hasSeating"], true);
}

#[tokio::test]
async fn view_counter_increments() {
    let (app, _d) = make_app().await;
    let (slug, _t) = create_basic(&app).await;
    let (s, b) = call(&app, "POST", &format!("/api/invitations/{slug}/view"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(b["views"], 1);
    let (_s, b) = call(&app, "POST", &format!("/api/invitations/{slug}/view"), None).await;
    assert_eq!(b["views"], 2);
}

#[tokio::test]
async fn photo_upload_validation() {
    let (app, _d) = make_app().await;
    let (slug, _t) = create_basic(&app).await;

    // no consent
    let (s, _b) = call(&app, "POST", &format!("/api/invitations/{slug}/photos"),
        Some(json!({"image": "data:image/png;base64,iVBORw0KGgo="}))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);

    // invalid data url
    let (s, b) = call(&app, "POST", &format!("/api/invitations/{slug}/photos"),
        Some(json!({"consent": true, "image": "notanimage"}))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);
    assert_eq!(b["error"], "Ảnh không hợp lệ.");

    // valid PNG (magic bytes ok)
    let png: Vec<u8> = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01, 0x02];
    let data_url = format!("data:image/png;base64,{}", STANDARD.encode(&png));
    let (s, b) = call(&app, "POST", &format!("/api/invitations/{slug}/photos"),
        Some(json!({"consent": true, "image": data_url, "uploader": "Bạn thân"}))).await;
    assert_eq!(s, StatusCode::CREATED);
    assert_eq!(b["uploader"], "Bạn thân");
    assert!(b["url"].as_str().unwrap().starts_with(&format!("/uploads/{slug}/")));

    // wrong magic bytes for declared mime -> 400
    let fake: Vec<u8> = vec![0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
    let data_url = format!("data:image/png;base64,{}", STANDARD.encode(&fake));
    let (s, b) = call(&app, "POST", &format!("/api/invitations/{slug}/photos"),
        Some(json!({"consent": true, "image": data_url}))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);
    assert_eq!(b["error"], "Tệp không phải ảnh hợp lệ.");

    // list shows 1 photo
    let (_s, b) = call(&app, "GET", &format!("/api/invitations/{slug}/photos"), None).await;
    assert_eq!(b["total"], 1);
}

#[tokio::test]
async fn delete_rsvp_requires_token() {
    let (app, _d) = make_app().await;
    let (slug, token) = create_basic(&app).await;
    call(&app, "POST", &format!("/api/invitations/{slug}/rsvp"),
        Some(json!({"name": "X", "consent": true}))).await;

    let (s, _b) = call(&app, "DELETE", &format!("/api/invitations/{slug}/rsvps/1?token=wrong"), None).await;
    assert_eq!(s, StatusCode::FORBIDDEN);

    let (s, b) = call(&app, "DELETE", &format!("/api/invitations/{slug}/rsvps/1?token={token}"), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(b["deleted"], 1);
}
