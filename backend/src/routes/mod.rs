pub mod invitations;
pub mod pages;
pub mod photos;
pub mod rsvps;
pub mod seating;
pub mod users;

use axum::extract::DefaultBodyLimit;
use axum::http::{header, HeaderValue, StatusCode};
use axum::response::{Html, IntoResponse};
use axum::routing::{delete, get, post};
use axum::Router;
use tower::ServiceBuilder;
use tower_http::services::ServeDir;
use tower_http::set_header::SetResponseHeaderLayer;

use crate::state::AppState;

const BODY_LIMIT: usize = 3 * 1024 * 1024; // matches express.json({limit:'3mb'})

pub fn build_router(state: AppState) -> Router {
    // /uploads: static files with nosniff + inline (matches the Express static config).
    let uploads_service = ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            header::X_CONTENT_TYPE_OPTIONS,
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            header::CONTENT_DISPOSITION,
            HeaderValue::from_static("inline"),
        ))
        // Mirror Express static maxAge:'7d' so cached guest photos match the Node server.
        .layer(SetResponseHeaderLayer::overriding(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=604800"),
        ))
        .service(ServeDir::new(state.cfg.uploads_dir.clone()));

    // Fallback: serve frontend/dist static assets, custom 404.html for misses.
    let nf_dir = state.cfg.public_dir.clone();
    let not_found_svc = tower::service_fn(move |_req: axum::http::Request<axum::body::Body>| {
        let nf_dir = nf_dir.clone();
        async move {
            let body = std::fs::read_to_string(nf_dir.join("404.html"))
                .unwrap_or_else(|_| "Not found".to_string());
            Ok::<_, std::convert::Infallible>((StatusCode::NOT_FOUND, Html(body)).into_response())
        }
    });
    let static_service = ServeDir::new(state.cfg.public_dir.clone()).not_found_service(not_found_svc);

    // /_astro: Astro's content-hashed bundles. Filenames change on every content
    // change, so the contents are immutable — cache them for a year.
    let astro_assets = ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        ))
        .service(ServeDir::new(state.cfg.public_dir.join("_astro")));

    let api = Router::new()
        // Auth
        .route("/auth/register", post(users::register))
        .route("/auth/login", post(users::login))
        .route("/auth/logout", post(users::logout))
        .route("/auth/me", get(users::me))
        // User account
        .route("/user/invitations", get(users::list_invitations))
        // Invitations
        .route("/invitations", post(invitations::create))
        .route("/invitations/:slug", get(invitations::get_invitation).put(invitations::update))
        .route("/invitations/:slug/claim", post(users::claim_invitation))
        .route("/invitations/:slug/find-table", get(invitations::find_table))
        .route("/invitations/:slug/view", post(invitations::bump_view))
        .route("/invitations/:slug/rsvp", post(rsvps::create_rsvp))
        .route("/invitations/:slug/rsvps", get(rsvps::list_rsvps))
        .route("/invitations/:slug/rsvps/:id", delete(rsvps::delete_rsvp))
        .route("/invitations/:slug/seating", post(seating::save_seating))
        .route("/invitations/:slug/wishes", get(rsvps::wishes))
        .route("/invitations/:slug/photos", post(photos::upload_photo).get(photos::list_photos));

    Router::new()
        .nest("/api", api)
        .nest_service("/uploads", uploads_service)
        .nest_service("/_astro", astro_assets)
        .route("/", get(pages::index))
        .route("/thiep/:slug", get(pages::thiep_page))
        .route("/quanly/:slug", get(pages::manage))
        .route("/dang-ky", get(pages::static_page))
        .route("/dang-nhap", get(pages::static_page))
        .route("/tai-khoan", get(pages::static_page))
        .route("/chinh-sua", get(pages::static_page))
        .route("/mau-thiep", get(pages::mau_thiep))
        .route("/xem-ngay", get(pages::xem_ngay))
        .route("/mam-qua", get(pages::mam_qua))
        .route("/checklist", get(pages::checklist))
        .route("/nghi-le", get(pages::nghi_le))
        .route("/ngan-sach", get(pages::ngan_sach))
        .route("/quyen-rieng-tu", get(pages::quyen_rieng_tu))
        .fallback_service(static_service)
        .layer(DefaultBodyLimit::max(BODY_LIMIT))
        .with_state(state)
}
