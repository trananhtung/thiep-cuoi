# ── Stage 1: build Astro frontend ──────────────────────────────────────────────
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --prefer-offline

COPY frontend/ ./
RUN npm run build

# ── Stage 2: cargo-chef planner ────────────────────────────────────────────────
FROM rust:1.87-slim-bookworm AS chef

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && cargo install cargo-chef --locked

WORKDIR /app

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY backend/ backend/
RUN cargo chef prepare --recipe-path recipe.json

# ── Stage 3: build Rust backend ────────────────────────────────────────────────
FROM chef AS rust-builder

# Cook deps (this layer is cached as long as Cargo.lock doesn't change)
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Build real source (LTO + strip applied via workspace Cargo.toml profile)
COPY Cargo.toml Cargo.lock ./
COPY backend/ backend/
RUN cargo build --release --bin thiep-backend

# ── Stage 4: minimal runtime image ─────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=rust-builder /app/target/release/thiep-backend ./thiep-backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p data/uploads

ENV PORT=3000 \
    DB_PATH=/app/data/thiep.db \
    UPLOADS_DIR=/app/data/uploads \
    PUBLIC_DIR=/app/frontend/dist \
    SESSION_SECRET=change-me-in-production

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["./thiep-backend"]
