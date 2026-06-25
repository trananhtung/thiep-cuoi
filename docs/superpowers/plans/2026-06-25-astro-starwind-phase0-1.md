# Astro + Starwind Redesign — Phase 0 & 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Astro + Starwind (Tailwind v4) frontend in `frontend/` with a wedding design system, and prove the build → Rust-serve → OG-injection pipeline end-to-end on the invite page — without changing Rust and without going live (`public/` stays the served dir until a later cutover phase).

**Architecture:** Astro builds flat static HTML into `frontend/dist/` (`build.format:'file'`). Rust serves it unchanged via `PUBLIC_DIR=frontend/dist`, and `thiep_page()` keeps string-injecting Open Graph tags into `dist/invite.html`. Phase 0 builds the foundation (Astro project, Tailwind v4 + Starwind, design tokens, shared layout, a tiny static page to prove it). Phase 1 builds an invite shell that reproduces today's `invite.html` byte-compatibly so the OG snapshot still matches — de-risking the pipeline with the fewest variables before any visual redesign.

**Tech Stack:** Astro 7 (requires Node ≥22.12), Tailwind CSS v4 (`@tailwindcss/vite`), Starwind UI, TypeScript, Vitest (existing lib tests), Playwright (existing e2e), Rust/Axum backend (unchanged).

## Global Constraints

- **Rust is not modified.** No file under `backend/` changes in Phase 0–1. Pipeline only changes how HTML/CSS/JS is produced.
- **`dist/invite.html` must keep a literal `</head>`** (Rust does `html.replacen("</head>", …, 1)`) and **exactly one `<title>…</title>`** (Rust's `replace_title` replaces the first one). `<head>` must not be restructured in a way that moves the injection point.
- **Page filenames must match what Rust reads** via `read_public()`: `invite.html`, `index.html`, `manage.html`, `mau-thiep.html`, `xem-ngay.html`, `mam-qua.html`, `checklist.html`, `nghi-le.html`, `ngan-sach.html`, `quyen-rieng-tu.html`, `404.html`.
- **Stable asset paths preserved**: `/sw.js`, `/manifest.webmanifest`, `/previews/*`, `/css/*`, `/js/*` resolve from `dist/` root (place originals in `frontend/public/`).
- **Wedding design tokens (verbatim from `public/css/base.css :root`):** ink `#2b2320`, muted `#8a7d75`, line `#e7ddd3`, paper `#fbf7f1`, paper-2 `#ffffff`, gold `#c2a14d`, gold-deep `#9a7c2f`, red/primary `#b5232a`, radius `18px`. Fonts: body `"Be Vietnam Pro"`, display `"Playfair Display"`, script `"Great Vibes"`.
- **Backend run for tests:** `PUBLIC_DIR=frontend/dist cargo run --manifest-path backend/Cargo.toml` (default `PORT=3000`).
- **Existing tests must stay green:** `npm run test:unit` (lunar, vietqr) and `node test/e2e.js`.
- **Node 22 + Astro 7 (user decision):** use Node `22.18.0` for ALL frontend npm/astro commands. Shell state does not persist between commands, so prefix each with `export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"` (or `source ~/.nvm/nvm.sh && nvm use`). `frontend/.nvmrc` pins `22.18.0`; `frontend/package.json` declares `"engines": { "node": ">=22.12.0" }` and `"astro": "^7"`.
- Branch already created: `feature/astro-starwind-redesign`. Commit frequently.

---

## File Structure

```
frontend/
  package.json            # replace React stub deps with Astro + Tailwind + Starwind
  astro.config.mjs        # build.format:'file', compressHTML:false, inlineStylesheets:'never', dev proxy
  tsconfig.json           # Astro strict tsconfig (keep lib tests compiling)
  src/
    styles/global.css     # @import tailwindcss + @theme wedding tokens + Starwind layer
    layouts/Layout.astro  # shared <html> shell: head, fonts, Header, <slot/>, Footer
    components/
      Header.astro        # site nav (replaces 7× copy-pasted header)
      Footer.astro        # site footer
      Ornament.astro      # 囍 sigil / hoa-văn brand mark
    pages/
      404.astro           # tiny static page proving the design system + build
      invite.astro        # Phase 1: byte-compatible invite shell (→ dist/invite.html)
    lib/                  # UNCHANGED: lunar.ts, vietqr.ts + *.test.ts (kept compiling/green)
  public/                 # copied as-is to dist/ root
    css/  js/  previews/  sw.js  manifest.webmanifest  icon.svg
test/
  og-parity.mjs           # NEW: asserts Rust OG injection on dist/invite.html
```

---

## Phase 0 — Foundation

### Task 1: Replace the React stub with an Astro project (lib + vitest preserved)

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/astro.config.mjs`
- Modify: `frontend/tsconfig.json`
- Keep untouched: `frontend/src/lib/lunar.ts`, `frontend/src/lib/vietqr.ts`, `frontend/src/lib/*.test.ts`

**Interfaces:**
- Produces: a working `frontend/` Astro workspace where `npm run dev`/`build` use Astro and `npm test` still runs the existing Vitest lib tests.

- [ ] **Step 1: Replace `frontend/package.json`**

```json
{
  "name": "thiep-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "astro check"
  },
  "engines": { "node": ">=22.12.0" },
  "dependencies": {
    "astro": "^7",
    "qrcode-generator": "^1.4.4"
  },
  "devDependencies": {
    "@astrojs/check": "latest",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

Also create `frontend/.nvmrc` containing exactly `22.18.0`, and run all commands below with Node 22 on PATH: `export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"`.

- [ ] **Step 2: Install**

Run: `cd frontend && rm -rf node_modules package-lock.json && npm install`
Expected: installs Astro; no peer-dep errors that abort install.

- [ ] **Step 3: Create `frontend/astro.config.mjs`** (proxy + injection-safe build; Tailwind added in Task 3)

```js
import { defineConfig } from 'astro/config';

// Build flat files (dist/invite.html, dist/404.html …) so Rust's read_public() finds them,
// and keep </head> + <title> literal so Rust's OG string-injection still works.
export default defineConfig({
  build: { format: 'file', inlineStylesheets: 'never' },
  compressHTML: false,
  server: { port: 4321 },
  vite: {
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
        '/thiep': 'http://localhost:3000',
        '/quanly': 'http://localhost:3000',
        '/uploads': 'http://localhost:3000',
      },
    },
  },
});
```

- [ ] **Step 4: Replace `frontend/tsconfig.json`** (Astro strict base; keep DOM libs for lib tests)

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "types": ["vitest/globals"],
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src", ".astro/types.d.ts"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Verify lib tests still pass**

Run: `cd frontend && npm test`
Expected: PASS — lunar and vietqr suites green (proves the lib migration is intact).

- [ ] **Step 6: Verify Astro builds (empty site is fine here)**

Run: `cd frontend && npm run build`
Expected: build completes (may warn "no pages"); `frontend/dist/` is created.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/astro.config.mjs frontend/tsconfig.json
git commit -m "P0: replace React stub with Astro workspace (lib tests preserved)"
```

---

### Task 2: Add Tailwind v4 and the wedding design-token theme

**Files:**
- Modify: `frontend/astro.config.mjs` (add `@tailwindcss/vite` plugin)
- Create: `frontend/src/styles/global.css`

**Interfaces:**
- Produces: `src/styles/global.css` exporting wedding tokens as Tailwind theme vars (`--color-primary`, `--color-gold`, `--font-display`, …) usable by every component and by Starwind.

- [ ] **Step 1: Install Tailwind v4**

Run: `cd frontend && npm install -D tailwindcss @tailwindcss/vite`
Expected: installs Tailwind v4 + Vite plugin.

- [ ] **Step 2: Wire the Vite plugin in `frontend/astro.config.mjs`**

Add the import and plugin (merge into the existing `vite` block):

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: { format: 'file', inlineStylesheets: 'never' },
  compressHTML: false,
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
        '/thiep': 'http://localhost:3000',
        '/quanly': 'http://localhost:3000',
        '/uploads': 'http://localhost:3000',
      },
    },
  },
});
```

- [ ] **Step 3: Create `frontend/src/styles/global.css`** (tokens copied verbatim from `base.css :root`)

```css
@import "tailwindcss";

@theme {
  --color-ink: #2b2320;
  --color-muted: #8a7d75;
  --color-line: #e7ddd3;
  --color-paper: #fbf7f1;
  --color-paper-2: #ffffff;
  --color-gold: #c2a14d;
  --color-gold-deep: #9a7c2f;
  --color-primary: #b5232a;

  --font-body: "Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: "Playfair Display", Georgia, "Times New Roman", serif;
  --font-script: "Great Vibes", "Brush Script MT", cursive;

  --radius-card: 18px;
}

/* Page background mirrors base.css body gradient so the new system feels like the brand. */
body {
  font-family: var(--font-body);
  color: var(--color-ink);
  background:
    radial-gradient(1200px 600px at 100% -10%, #fbeede 0, transparent 60%),
    radial-gradient(900px 500px at -10% 110%, #f6e7e0 0, transparent 55%),
    var(--color-paper);
  line-height: 1.6;
}
```

- [ ] **Step 4: Verify Tailwind compiles** (temporary smoke)

Run: `cd frontend && npx astro build` after Task 3's page exists is not yet possible — instead verify config loads:
Run: `cd frontend && node -e "import('./astro.config.mjs').then(()=>console.log('config-ok'))"`
Expected: prints `config-ok` with no import error.

- [ ] **Step 5: Commit**

```bash
git add frontend/astro.config.mjs frontend/src/styles/global.css
git commit -m "P0: add Tailwind v4 + wedding design tokens (@theme)"
```

---

### Task 3: Initialize Starwind UI and add base components

**Files:**
- Modify: `frontend/src/styles/global.css` (Starwind injects its layer/vars)
- Create: `frontend/src/components/starwind/*` (CLI-generated; e.g. `button`)
- Modify: `frontend/package.json` (Starwind/clsx deps added by CLI)

**Interfaces:**
- Produces: at least a Starwind `Button` component importable from the path the CLI reports (commonly `@/components/starwind/button`), themed by the Task 2 tokens.

- [ ] **Step 1: Run Starwind init**

Run: `cd frontend && npx starwind@latest init`
When prompted, point it at `src/styles/global.css` and accept its component directory default.
Expected: it appends Starwind's `@layer`/CSS-variable setup into `global.css` and adds deps.

- [ ] **Step 2: Map Starwind's primary color to the wedding red**

In `frontend/src/styles/global.css`, find the Starwind-generated `--primary` (and `--primary-foreground`) variables and set:

```css
/* inside the Starwind :root / theme block the CLI created */
--primary: #b5232a;
--primary-foreground: #ffe9b8;
```

(Leave the rest of Starwind's tokens; only override primary so buttons read as the old `.btn-primary`.)

- [ ] **Step 3: Add the Button component**

Run: `cd frontend && npx starwind@latest add button`
Expected: creates the Button component file under the Starwind components dir.

- [ ] **Step 4: Note the import path**

Run: `cd frontend && ls -R src/components/starwind 2>/dev/null || find src -path '*starwind*' -name '*.astro'`
Expected: prints the Button file path. Record the import specifier (e.g. `@/components/starwind/button`) — Task 4 and later phases use it.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components frontend/src/styles/global.css frontend/package.json frontend/package-lock.json
git commit -m "P0: init Starwind UI; map primary to wedding red; add Button"
```

---

### Task 4: Shared Layout + Header + Footer + Ornament, proven by `404.astro`

**Files:**
- Create: `frontend/src/components/Ornament.astro`
- Create: `frontend/src/components/Header.astro`
- Create: `frontend/src/components/Footer.astro`
- Create: `frontend/src/layouts/Layout.astro`
- Create: `frontend/src/pages/404.astro`

**Interfaces:**
- Consumes: `src/styles/global.css` (tokens), Starwind Button (optional in header CTA).
- Produces:
  - `Layout.astro` — props `{ title: string; description?: string }`; renders `<html lang="vi">` with head (charset, viewport, icon, manifest, theme-color, `<title>`, fonts), `<Header/>`, `<slot/>`, `<Footer/>`.
  - `Header.astro`, `Footer.astro`, `Ornament.astro` — no props (Ornament optional `{ size?: number }`).

- [ ] **Step 1: Create `frontend/src/components/Ornament.astro`**

```astro
---
interface Props { size?: number }
const { size = 44 } = Astro.props;
---
<span
  class="inline-grid place-items-center rounded-full text-[#ffe9b8] font-[var(--font-display)]"
  style={`width:${size}px;height:${size}px;font-size:${Math.round(size/2)}px;background:linear-gradient(145deg,var(--color-primary),#8c171d);box-shadow:0 18px 50px -20px rgba(70,50,30,.35)`}
  aria-hidden="true"
>囍</span>
```

- [ ] **Step 2: Create `frontend/src/components/Header.astro`**

```astro
---
import Ornament from './Ornament.astro';
const links = [
  { href: '/mau-thiep', label: '🎨 Mẫu thiệp' },
  { href: '/checklist', label: '📋 Checklist' },
  { href: '/nghi-le', label: '📜 Nghi lễ' },
  { href: '/xem-ngay', label: '🔮 Xem ngày cưới' },
  { href: '/mam-qua', label: '🎁 Mâm quả' },
  { href: '/ngan-sach', label: '💰 Ngân sách' },
];
---
<header class="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-[22px] py-5">
  <a href="/" class="flex items-center gap-3 text-ink no-underline">
    <Ornament />
    <span>
      <b class="block font-[var(--font-display)] text-[22px] tracking-wide">Thiệp Cưới</b>
      <small class="block text-[12px] uppercase tracking-[2px] text-muted">Made in Vietnam</small>
    </span>
  </a>
  <nav class="flex flex-wrap items-center gap-2.5">
    {links.map((l) => (
      <a href={l.href} class="rounded-full border border-line px-3 py-1.5 text-sm text-ink no-underline hover:border-gold">{l.label}</a>
    ))}
  </nav>
</header>
```

- [ ] **Step 3: Create `frontend/src/components/Footer.astro`**

```astro
---
const year = 2026;
---
<footer class="mx-auto max-w-[1180px] px-[22px] py-10 text-center text-sm text-muted">
  <p>© {year} Thiệp Cưới Online — Made in Vietnam 💌</p>
  <nav class="mt-2 flex flex-wrap justify-center gap-4">
    <a href="/quyen-rieng-tu" class="text-gold-deep no-underline hover:underline">Quyền riêng tư</a>
    <a href="/mau-thiep" class="text-gold-deep no-underline hover:underline">Mẫu thiệp</a>
  </nav>
</footer>
```

- [ ] **Step 4: Create `frontend/src/layouts/Layout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
interface Props { title: string; description?: string }
const { title, description = 'Tạo thiệp cưới online miễn phí cho người Việt.' } = Astro.props;
---
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E💌%3C/text%3E%3C/svg%3E" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#b5232a" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet" />
</head>
<body>
  <Header />
  <main class="mx-auto max-w-[1180px] px-[22px]"><slot /></main>
  <Footer />
</body>
</html>
```

- [ ] **Step 5: Create `frontend/src/pages/404.astro`** (proves layout + build + filename)

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Không tìm thấy trang — Thiệp Cưới Online">
  <section class="py-20 text-center">
    <h1 class="font-[var(--font-display)] text-5xl font-extrabold text-primary">404</h1>
    <p class="mt-3 text-muted">Trang bạn tìm không tồn tại.</p>
    <a href="/" class="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-[#ffe9b8] no-underline">Về trang chủ</a>
  </section>
</Layout>
```

- [ ] **Step 6: Build and verify the flat filename + tokens applied**

Run: `cd frontend && npm run build && ls dist/404.html && grep -c "var(--font-display)\|#b5232a\|bg-primary\|text-primary" dist/404.html`
Expected: `dist/404.html` exists; grep count ≥ 1 (Tailwind utilities / token CSS emitted).

- [ ] **Step 7: Visual smoke (manual)**

Run: `cd frontend && npm run preview` then open the printed URL at `/404.html`.
Expected: branded 404 — Playfair heading, wedding-red accent, header with 囍 + nav, footer. Stop preview after checking.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components frontend/src/layouts frontend/src/pages/404.astro
git commit -m "P0: shared Layout/Header/Footer/Ornament on design system; 404 page proves it"
```

---

### Task 5: Move stable assets into `frontend/public/`

**Files:**
- Create (copy): `frontend/public/sw.js`, `frontend/public/manifest.webmanifest`, `frontend/public/icon.svg`
- Create (copy): `frontend/public/previews/*`
- Create (copy, for Phase-1 functional invite): `frontend/public/css/*`, `frontend/public/js/*`

**Interfaces:**
- Produces: these assets land at `dist/` root after build, so `/sw.js`, `/manifest.webmanifest`, `/css/invite.css`, `/js/invite.js`, etc. resolve exactly as today.

- [ ] **Step 1: Copy assets**

```bash
mkdir -p frontend/public
cp public/sw.js public/manifest.webmanifest public/icon.svg frontend/public/
cp -r public/previews frontend/public/previews
cp -r public/css frontend/public/css
cp -r public/js frontend/public/js
```

- [ ] **Step 2: Build and verify assets reach `dist/` root**

Run: `cd frontend && npm run build && ls dist/sw.js dist/manifest.webmanifest dist/css/invite.css dist/js/invite.js`
Expected: all four paths exist.

- [ ] **Step 3: Commit**

```bash
git add frontend/public
git commit -m "P0: vendor stable assets (sw, manifest, css, js, previews) into frontend/public"
```

---

## Phase 1 — Invite shell (pipeline proof)

### Task 6: `invite.astro` reproducing today's `invite.html` byte-compatibly

The invite page is a client-rendered SPA: the body is a `#root` mount that `invite.js` fills after fetching invitation data by slug. Phase 1 reproduces this exactly (same head order, same skeleton, same scripts) so OG injection and the snapshot are unaffected. Visual redesign of the rendered content is a later phase.

**Files:**
- Create: `frontend/src/pages/invite.astro`

**Interfaces:**
- Consumes: assets from Task 5 (`/css/invite.css`, `/js/*.js`).
- Produces: `dist/invite.html` containing a literal `</head>`, a single default `<title>…</title>`, a `<div id="root" class="invite">` mount, and the four script tags + SW registration — head tag order identical to `public/invite.html`.

- [ ] **Step 1: Create `frontend/src/pages/invite.astro`** (head order matches `public/invite.html` so the OG snapshot still matches)

```astro
---
// Phase-1 invite shell: byte-compatible with public/invite.html.
// Rust injects OG before </head> and replaces <title> at request time.
---
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E💌%3C/text%3E%3C/svg%3E" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#b5232a" />
  <title>Thiệp Cưới Online</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/invite.css" />
</head>
<body>
  <div id="root" class="invite">
    <div class="state-msg"><span class="em">✦</span>Đang tải thiệp...</div>
  </div>
  <script src="/js/qrcode.js" is:inline></script>
  <script src="/js/vietqr.js" is:inline></script>
  <script src="/js/lunar.js" is:inline></script>
  <script src="/js/invite.js" is:inline></script>
  <script is:inline>if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }</script>
</body>
</html>
```

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build && ls dist/invite.html`
Expected: `dist/invite.html` exists.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/invite.astro
git commit -m "P1: invite.astro shell reproduces invite.html (pipeline proof)"
```

---

### Task 7: Verify the injection anchors survive the build

**Files:**
- Test: ad-hoc shell assertions on `frontend/dist/invite.html`

**Interfaces:**
- Consumes: `dist/invite.html` from Task 6.
- Produces: confidence that Rust's `replacen("</head>")` and `replace_title` will work.

- [ ] **Step 1: Assert exactly one literal `</head>`**

Run: `grep -c "</head>" frontend/dist/invite.html`
Expected: `1`.

- [ ] **Step 2: Assert exactly one `<title>…</title>`**

Run: `grep -o "<title>[^<]*</title>" frontend/dist/invite.html | wc -l`
Expected: `1`.

- [ ] **Step 3: Assert `#root` mount and scripts present, and no inlined `<style>` in `<head>`**

Run:
```bash
grep -q 'id="root"' frontend/dist/invite.html && echo root-ok
grep -q '/js/invite.js' frontend/dist/invite.html && echo invitejs-ok
awk '/<head>/{f=1} /<\/head>/{f=0} f && /<style/{print "INLINE-STYLE-FOUND"}' frontend/dist/invite.html
```
Expected: prints `root-ok` and `invitejs-ok`; prints nothing for inline style (confirms `inlineStylesheets:'never'` kept head clean).

- [ ] **Step 4: Commit** (record the verification as a note; no source change — skip if nothing to stage)

No file change in this task. Proceed to Task 8.

---

### Task 8: OG-injection parity against the live Rust server

**Files:**
- Create: `test/og-parity.mjs`

**Interfaces:**
- Consumes: a running Rust server with `PUBLIC_DIR=frontend/dist`; the `/api/invitations` create endpoint (`groom`,`bride` required) and `/thiep/:slug`.
- Produces: a pass/fail check that the built shell still yields correct OG/Twitter tags and a replaced `<title>`.

- [ ] **Step 1: Create `test/og-parity.mjs`**

```js
// Verifies Rust OG string-injection still works on the Astro-built dist/invite.html.
// Prereq: Rust running with PUBLIC_DIR=frontend/dist on :3000.
const BASE = process.env.BASE || 'http://localhost:3000';

const groom = 'Nguyễn Minh Đức';
const bride = 'Trần Thuỳ Dương';

const create = await fetch(`${BASE}/api/invitations`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    groom, bride,
    invitation: 'Trân trọng kính mời quý vị đến chung vui cùng gia đình chúng tôi trong ngày trọng đại.',
  }),
});
if (!create.ok) { console.error('create failed', create.status); process.exit(1); }
const { slug } = await create.json();
if (!slug) { console.error('no slug in create response'); process.exit(1); }

const html = await (await fetch(`${BASE}/thiep/${slug}`)).text();
const want = [
  `<title>Thiệp cưới ${groom} & ${bride}</title>`,
  `<meta property="og:title" content="Thiệp cưới ${groom.replace(/&/g,'&amp;')} &amp; ${bride}" />`,
  `<meta property="og:site_name" content="Thiệp Cưới Online" />`,
  `<meta name="twitter:card" content="summary" />`,
];
let ok = true;
for (const s of want) {
  if (html.includes(s)) { console.log('  ✓', s); }
  else { console.log('  ✗ MISSING:', s); ok = false; }
}
if (!html.includes('</head>')) { console.log('  ✗ </head> literal gone'); ok = false; }
process.exit(ok ? 0 : 1);
```

- [ ] **Step 2: Build, start Rust against dist, run the check**

```bash
cd frontend && npm run build && cd ..
PUBLIC_DIR=frontend/dist cargo run --manifest-path backend/Cargo.toml &
sleep 5
node test/og-parity.mjs
kill %1
```
Expected: all `✓` lines, exit 0. (If port 3000 is busy, set `PORT` and `BASE` accordingly.)

- [ ] **Step 3: Commit**

```bash
git add test/og-parity.mjs
git commit -m "P1: OG-injection parity test for Astro-built invite shell"
```

---

### Task 9: Full regression + Phase-1 gate

**Files:** none (verification only)

**Interfaces:**
- Consumes: everything above.
- Produces: green unit + e2e against the built `dist/`, confirming Phase 1 is safe to stop at.

- [ ] **Step 1: Unit tests (lib intact)**

Run: `cd frontend && npm test`
Expected: PASS (lunar, vietqr).

- [ ] **Step 2: e2e against the built frontend**

```bash
cd frontend && npm run build && cd ..
PUBLIC_DIR=frontend/dist cargo run --manifest-path backend/Cargo.toml &
sleep 5
BASE=http://localhost:3000 node test/e2e.js
kill %1
```
Expected: e2e creates → opens → RSVP → manages with no failures (`✗`), confirming the SPA still works served from `dist/`.

> Note: `/` (builder), `/manage`, and the tool pages are still served from the **old** `public/` here because Phase 1 only added `invite.astro` and `404.astro` to `dist/`. Until later phases add those pages to `frontend/`, run the full e2e against `public/` (default `PUBLIC_DIR`) and run `og-parity.mjs` against `dist/`. If e2e requires pages not yet in `dist/`, that is expected — gate Phase 1 on `og-parity.mjs` + unit tests + the Task 7 anchor checks, and record which e2e steps are deferred.

- [ ] **Step 3: Commit any notes / final state**

```bash
git commit --allow-empty -m "P1: pipeline proven — invite shell builds, OG injection + anchors verified"
```

---

## Self-Review

**Spec coverage (Phase 0–1 scope):**
- Astro replaces React stub → Task 1. ✓
- Build flat files for Rust filenames (`build.format:'file'`) → Task 1/Task 4 (verified `dist/404.html`, `dist/invite.html`). ✓
- `</head>`/`<title>` literal + injection-safe head (`compressHTML:false`, `inlineStylesheets:'never'`) → Task 1 config, Task 6 shell, Task 7 anchors. ✓
- Tailwind v4 + wedding `@theme` tokens (verbatim from base.css) → Task 2. ✓
- Starwind UI init + primary mapped to wedding red → Task 3. ✓
- Shared Layout/Header/Footer/Ornament removing copy-paste → Task 4. ✓
- Stable assets via `frontend/public/` (sw, manifest, css, js, previews) → Task 5. ✓
- OG injection still works (hard gate) → Task 8 parity test. ✓
- Existing unit + e2e stay green → Task 9. ✓
- Rust untouched → no `backend/` edits in any task. ✓
- *Deferred to later plans (out of Phase 0–1 scope):* invite islands (Phase 2), tool pages (3), content/templates redesign (4), builder/manage Preact (5), cutover + delete `public/` (6).

**Placeholder scan:** No TBD/TODO; every step has concrete file content or a runnable command with expected output. The only intentionally CLI-resolved item is the Starwind component import path (Task 3 Step 4 records it) because the path is environment-reported.

**Type/name consistency:** `Layout.astro` props `{title, description}` used consistently by `404.astro`. `Ornament` `{size}` optional. `og-parity.mjs` reads `slug` from create response and asserts the exact tag strings Rust emits in `pages.rs` (`og:site_name`, `twitter:card="summary"` when no image, title `Thiệp cưới {groom} & {bride}`).

**Verified:** `/api/invitations` create returns `{ "slug": …, "manageToken": … }` (`backend/src/routes/invitations.rs:146`), so `og-parity.mjs`'s `const { slug }` read is correct.
