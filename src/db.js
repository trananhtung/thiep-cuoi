'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'thiep.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS invitations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT UNIQUE NOT NULL,
    manage_token TEXT NOT NULL,
    template     TEXT NOT NULL,
    data         TEXT NOT NULL,
    created_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rsvps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slug       TEXT NOT NULL,
    name       TEXT NOT NULL,
    attending  INTEGER NOT NULL,
    guests     INTEGER NOT NULL DEFAULT 1,
    message    TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_rsvps_slug ON rsvps(slug);
`);

// Migration: thêm cột đếm lượt xem nếu chưa có (tương thích DB cũ)
const cols = db.prepare(`PRAGMA table_info(invitations)`).all();
if (!cols.some((c) => c.name === 'views')) {
  db.exec(`ALTER TABLE invitations ADD COLUMN views INTEGER NOT NULL DEFAULT 0`);
}

// Migration: thêm cột khẩu phần ăn (diet) cho RSVP nâng cao
const rsvpCols = db.prepare(`PRAGMA table_info(rsvps)`).all();
if (!rsvpCols.some((c) => c.name === 'diet')) {
  db.exec(`ALTER TABLE rsvps ADD COLUMN diet TEXT NOT NULL DEFAULT 'man'`);
}

module.exports = db;
