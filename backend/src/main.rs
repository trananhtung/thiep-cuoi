use thiep_backend::config::Config;
use thiep_backend::state::AppState;
use thiep_backend::{db, routes};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let cfg = Config::from_env();

    // Ensure uploads dir exists (mirrors the Express startup).
    if let Err(e) = std::fs::create_dir_all(&cfg.uploads_dir) {
        eprintln!("Không tạo được thư mục uploads: {e}");
    }

    let pool = db::connect(&cfg.db_path)
        .await
        .expect("Không kết nối được cơ sở dữ liệu");

    let port = cfg.port;
    let app = routes::build_router(AppState::new(pool, cfg));

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .expect("Không mở được cổng");
    tracing::info!("Thiệp cưới (Rust) chạy tại http://localhost:{port}");
    axum::serve(listener, app).await.expect("Lỗi máy chủ");
}
