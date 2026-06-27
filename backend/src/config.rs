use std::path::PathBuf;

/// Runtime configuration, sourced from env with sensible dev defaults.
#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    pub db_path: String,
    pub uploads_dir: PathBuf,
    pub public_dir: PathBuf,
    /// Built Vite client assets (served in prod). Optional in dev.
    pub client_dir: PathBuf,
    /// URL of the Node SSR renderer (Phase 3+). Empty disables SSR proxying.
    pub ssr_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        let port = std::env::var("PORT").ok().and_then(|v| v.parse().ok()).unwrap_or(3000);
        let db_path = std::env::var("DB_PATH").unwrap_or_else(|_| "data/thiep.db".to_string());
        let uploads_dir =
            PathBuf::from(std::env::var("UPLOADS_DIR").unwrap_or_else(|_| "data/uploads".to_string()));
        let public_dir = PathBuf::from(
            std::env::var("PUBLIC_DIR").unwrap_or_else(|_| "frontend/dist".to_string()),
        );
        let client_dir = PathBuf::from(
            std::env::var("CLIENT_DIR").unwrap_or_else(|_| "frontend/dist/client".to_string()),
        );
        let ssr_url = std::env::var("SSR_URL").unwrap_or_default();
        Config { port, db_path, uploads_dir, public_dir, client_dir, ssr_url }
    }
}
