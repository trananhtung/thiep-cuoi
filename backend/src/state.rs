use crate::config::Config;
use sqlx::SqlitePool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub cfg: Arc<Config>,
    pub http: reqwest::Client,
}

impl AppState {
    pub fn new(pool: SqlitePool, cfg: Config) -> Self {
        AppState { pool, cfg: Arc::new(cfg), http: reqwest::Client::new() }
    }
}
