# Migration: Node/Express → Rust (axum)

The original server (`src/server.js` + `src/db.js`, Node/Express + `better-sqlite3`) has been
**fully migrated to the Rust backend in `backend/`** (axum + sqlx/SQLite) and removed.

The Rust backend is a drop-in replacement: same routes, same JSON shapes, same SQLite schema,
same server-side Open Graph injection, and it serves the built static frontend from `frontend/dist`.

## Verification

- ✅ `backend/tests/api.rs` — integration tests pass (`cargo test`).
- ✅ `test/e2e.js` — the **full Playwright end-to-end suite passes against the Rust backend**
  (create → invite → RSVP/consent → manage/CSV → seating → photo upload → OG/Twitter tags →
  PWA offline service-worker → all 10 templates → all tool pages).
- ✅ A route-by-route static parity audit (Node source vs Rust source) was run; findings below.

## Known intentional differences (benign)

The parity audit surfaced only edge-case divergences. None are reachable from the real UI
(which sends well-formed form data), and several are cases where Rust is **more correct**:

| Area | Node | Rust | Note |
|---|---|---|---|
| Text length caps | slices by UTF-16 code units (can split an emoji into U+FFFD) | slices by Unicode scalar value | Rust never produces a broken surrogate. Only differs for emoji exactly at a field's char limit. |
| Huge raw JSON numbers in text fields | coerced via IEEE-754 `String(Number)` | exact `Number::to_string()` | Only if a client POSTs a raw number `> 2^53`; the UI sends strings. Rust keeps the exact value. |
| Array/object inside string fields | `String(v)` → `"[object Object]"` / comma-join | dropped (empty) | Only with malformed (non-string) array elements. |
| Corrupt `data` DB row on GET | unhandled `JSON.parse` → HTTP 500 | returns `{}` gracefully | Rust is more robust. |
| OG / Twitter `url` scheme | always `http` (trust-proxy never enabled) | honours `X-Forwarded-Proto` | Rust yields correct `https` behind a TLS proxy (better link previews). |

## Fixed during migration

- `/uploads` now sends `Cache-Control: public, max-age=604800` to match the Express `maxAge:'7d'` config.

## Frontend status

The frontend has been **migrated from the legacy vanilla `public/` site to Astro + Starwind
(Tailwind v4) in `frontend/`**. All 12 pages were ported and the old `public/` directory has been
removed. The Rust backend now serves the Astro build output (`frontend/dist`) via `PUBLIC_DIR`
(default `frontend/dist`); the same server-side OG injection on `/thiep/:slug` works unchanged
because the built `invite.html` keeps the `</head>` / `<title>` anchors the injector targets.

Build before serving: `cd frontend && npm run build` (Node ≥ 22.12). `frontend/dist` is gitignored,
so a fresh clone or deploy must run the build step before `cargo run`.
