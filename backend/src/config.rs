use std::path::PathBuf;

/// Runtime configuration, sourced from env with sensible dev defaults.
#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    pub db_path: String,
    pub uploads_dir: PathBuf,
    /// Directory served as the static site — the built Astro output (`frontend/dist`).
    pub public_dir: PathBuf,
    /// Secret for signing session cookies. Change this in production.
    pub session_secret: String,
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
        let session_secret = std::env::var("SESSION_SECRET")
            .unwrap_or_else(|_| "dev-secret-change-in-production".to_string());
        Config { port, db_path, uploads_dir, public_dir, session_secret }
    }
}
