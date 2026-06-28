# ── Stage 1: build Astro frontend ──────────────────────────────────────────────
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --prefer-offline

COPY frontend/ ./
RUN npm run build

# ── Stage 2: build Rust backend ────────────────────────────────────────────────
FROM rust:1.87-slim-bookworm AS rust-builder

# sqlx sqlite feature compiles bundled libsqlite3 — needs C toolchain
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependency compilation separately from source changes
COPY Cargo.toml Cargo.lock ./
COPY backend/Cargo.toml backend/
# Dummy lib + bin so cargo can compile deps without real source
RUN mkdir -p backend/src && \
    echo "pub fn main() {}" > backend/src/lib.rs && \
    echo "fn main() {}" > backend/src/main.rs && \
    cargo build --release --manifest-path backend/Cargo.toml && \
    rm -rf backend/src

# Now compile real source
COPY backend/src backend/src
# Touch main.rs so cargo detects the change
RUN touch backend/src/main.rs && \
    cargo build --release --manifest-path backend/Cargo.toml

# ── Stage 3: minimal runtime image ─────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Binary
COPY --from=rust-builder /app/target/release/thiep-backend ./thiep-backend

# Built frontend assets (served by Rust as static files)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Persistent data lives on a mounted volume at /app/data
RUN mkdir -p data/uploads

# Environment defaults — override at runtime
ENV PORT=3000 \
    DB_PATH=/app/data/thiep.db \
    UPLOADS_DIR=/app/data/uploads \
    PUBLIC_DIR=/app/frontend/dist \
    SESSION_SECRET=change-me-in-production

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["./thiep-backend"]
