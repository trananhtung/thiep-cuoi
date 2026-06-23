//! SQLite pool + idempotent schema init.
//!
//! Mirrors the original `src/db.js`: base `CREATE TABLE IF NOT EXISTS` followed by
//! `PRAGMA table_info`-guarded `ALTER TABLE ... ADD COLUMN`. This is safe on both a
//! fresh database and the live one (every step is a no-op when already applied), so
//! no migration baselining is needed.

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::{Row, SqlitePool};
use std::str::FromStr;
use std::time::Duration;

pub async fn connect(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    let opts = SqliteConnectOptions::from_str(&format!("sqlite://{db_path}"))?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true)
        .busy_timeout(Duration::from_secs(5));

    let pool = SqlitePoolOptions::new().max_connections(5).connect_with(opts).await?;
    init_schema(&pool).await?;
    Ok(pool)
}

async fn columns(pool: &SqlitePool, table: &str) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query(&format!("PRAGMA table_info({table})")).fetch_all(pool).await?;
    Ok(rows.into_iter().map(|r| r.get::<String, _>("name")).collect())
}

async fn init_schema(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // --- base tables (column sets match db.js base CREATE, pre-migration) ---
    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS invitations (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            slug         TEXT UNIQUE NOT NULL,
            manage_token TEXT NOT NULL,
            template     TEXT NOT NULL,
            data         TEXT NOT NULL,
            created_at   TEXT NOT NULL
        )"#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS rsvps (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            slug       TEXT NOT NULL,
            name       TEXT NOT NULL,
            attending  INTEGER NOT NULL,
            guests     INTEGER NOT NULL DEFAULT 1,
            message    TEXT,
            created_at TEXT NOT NULL
        )"#,
    )
    .execute(pool)
    .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_rsvps_slug ON rsvps(slug)").execute(pool).await?;

    sqlx::query(
        r#"CREATE TABLE IF NOT EXISTS photos (
            id         TEXT PRIMARY KEY,
            slug       TEXT NOT NULL,
            file       TEXT NOT NULL,
            uploader   TEXT,
            bytes      INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )"#,
    )
    .execute(pool)
    .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_photos_slug ON photos(slug)").execute(pool).await?;

    // --- migrations (same order as db.js) ---
    let inv_cols = columns(pool, "invitations").await?;
    let rsvp_cols = columns(pool, "rsvps").await?;
    let photo_cols = columns(pool, "photos").await?;

    if !inv_cols.iter().any(|c| c == "views") {
        sqlx::query("ALTER TABLE invitations ADD COLUMN views INTEGER NOT NULL DEFAULT 0")
            .execute(pool)
            .await?;
    }
    if !rsvp_cols.iter().any(|c| c == "diet") {
        sqlx::query("ALTER TABLE rsvps ADD COLUMN diet TEXT NOT NULL DEFAULT 'man'")
            .execute(pool)
            .await?;
    }
    if !photo_cols.is_empty() && !photo_cols.iter().any(|c| c == "bytes") {
        sqlx::query("ALTER TABLE photos ADD COLUMN bytes INTEGER NOT NULL DEFAULT 0")
            .execute(pool)
            .await?;
    }
    if !inv_cols.iter().any(|c| c == "seating") {
        sqlx::query(
            r#"ALTER TABLE invitations ADD COLUMN seating TEXT NOT NULL DEFAULT '{"tables":[],"pool":[]}'"#,
        )
        .execute(pool)
        .await?;
    }
    if !rsvp_cols.iter().any(|c| c == "consent") {
        sqlx::query("ALTER TABLE rsvps ADD COLUMN consent INTEGER NOT NULL DEFAULT 0")
            .execute(pool)
            .await?;
    }

    Ok(())
}
