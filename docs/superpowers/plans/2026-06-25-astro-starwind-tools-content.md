# Astro + Starwind Redesign — Tool & Content Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign and port the 7 self-contained tool/content pages (`xem-ngay`, `ngan-sach`, `mam-qua`, `checklist`, `nghi-le`, `mau-thiep`, `quyen-rieng-tu`) from `public/` into Astro pages in `frontend/`, on the wedding design system (Tailwind v4 tokens + Starwind), with their JavaScript logic ported to typed vanilla-TS modules — preserving behavior, data, and localStorage keys exactly.

**Architecture:** Each page becomes `frontend/src/pages/<name>.astro` using the shared `Layout.astro` (so the copy-pasted header/nav/footer collapse to one source). Static structure is redesigned with Tailwind utilities mapped to the wedding `@theme` tokens plus a few shared presentational components (`PageHero.astro`, `Card.astro`). Interactivity is a per-page **vanilla TS module** under `frontend/src/scripts/`, loaded via an Astro `<script>` tag (Astro bundles + type-checks it); these modules bind to **the same element ids the original page used** so the ported logic is a faithful port. Hardcoded data tables move into typed modules under `frontend/src/data/`. `xem-ngay` reuses the already-ported `frontend/src/lib/lunar.ts`.

**Tech Stack:** Astro 7 (Node ≥22.12), Tailwind CSS v4 (`@tailwindcss/vite`), Starwind UI (Button installed), TypeScript, Vitest (existing lib tests), Playwright (headless smoke), Rust/Axum backend (unchanged).

## Global Constraints

- **Node 22 + Astro 7.** Prefix every npm/astro/node command with `export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"` (shell state does not persist between commands). Verify `node --version` → `v22.18.0`.
- **Do NOT modify `backend/` or `public/`.** `public/` is the live site and the behavioral source-of-truth; read from it, never edit it. Nothing goes live in this chunk (cutover is a later phase) — `public/` stays the served dir.
- **Flat filenames** (`build.format:'file'` is already configured): each page builds to `dist/<name>.html` matching what Rust's `read_public()` reads (`xem-ngay.html`, `ngan-sach.html`, `mam-qua.html`, `checklist.html`, `nghi-le.html`, `mau-thiep.html`, `quyen-rieng-tu.html`).
- **Preserve behavior & data verbatim.** Port each page's JS logic faithfully; copy hardcoded Vietnamese data (gift lists, checklist tasks, ceremony steps, template list, budget categories) **verbatim from the source `.js`** — do NOT paraphrase or invent content.
- **Preserve localStorage keys exactly:** `ngan-sach` → `"thiep-ngan-sach"`; `checklist` → `"checklist:" + weddingDate` (ISO `YYYY-MM-DD`). `xem-ngay`, `mam-qua`, `nghi-le`, `mau-thiep`, `quyen-rieng-tu` have no persistence.
- **Design system (Tailwind v4 tokens, from Task 2 of the foundation):** colors `ink #2b2320`, `brand-muted #8a7d75` (utility `text-brand-muted` — NOT `text-muted`, which is Starwind's neutral), `line #e7ddd3`, `paper #fbf7f1`, `paper-2 #ffffff`, `gold #c2a14d`, `gold-deep #9a7c2f`, `primary #b5232a`. Fonts: `font-display` (Playfair Display), `font-script` (Great Vibes), body (Be Vietnam Pro, default). Use the shared `Layout.astro` + `PageHero.astro` + `Card.astro` for consistency; use the Starwind `Button` (`@/components/starwind/button`) for primary CTAs.
- **Keep the wedding soul:** ornamental, warm; use the 囍/eyebrow/Playfair-heading idiom established by `Header.astro`/`404.astro`. Do not produce a generic dashboard look.
- **Tests stay green:** `cd frontend && npm test` (lunar, vietqr) and `npx astro check` (0 errors).
- Branch: `feature/astro-starwind-redesign` (continue on it).

---

## File Structure

```
frontend/src/
  components/
    PageHero.astro      # NEW shared: eyebrow + Playfair h1 + lead paragraph
    Card.astro          # NEW shared: wedding card container (bg-paper-2, border-line, rounded, shadow)
  data/                 # NEW: typed constants extracted verbatim from public/js/*
    budget.ts           # DEFAULTS (12 budget categories)
    mamqua.ts           # MAMQUA (Bắc/Nam × counts × gift items)
    checklist.ts        # PHASES (6 phases × tasks, days-before, links)
    ceremonies.ts       # CEREMONIES (4 ceremonies × steps × roles)
    templates.ts        # TEMPLATES (12 invitation templates)
  scripts/              # NEW: per-page vanilla-TS islands (DOM wiring; ported logic)
    xem-ngay.ts ngan-sach.ts mam-qua.ts checklist.ts nghi-le.ts mau-thiep.ts
  pages/                # NEW: one .astro per page
    xem-ngay.astro ngan-sach.astro mam-qua.astro checklist.astro
    nghi-le.astro mau-thiep.astro quyen-rieng-tu.astro
  lib/lunar.ts          # EXISTING — reused by xem-ngay (reconcile API in Task 8)
```

**Port contract (applies to every interactive page):** the `.astro` file renders the redesigned static markup containing container elements with the **same ids the original page used**; the matching `frontend/src/scripts/<name>.ts` is imported by a single `<script>` tag in the `.astro` file and binds to those ids. This makes each port a behavior-preserving move, verifiable by a headless functional check.

---

## Task 1: Shared presentational components (`PageHero`, `Card`)

**Files:**
- Create: `frontend/src/components/PageHero.astro`
- Create: `frontend/src/components/Card.astro`

**Interfaces:**
- Produces:
  - `PageHero.astro` — props `{ eyebrow?: string; title: string; lead?: string }`; renders a centered hero (eyebrow in gold uppercase, `font-display` h1, brand-muted lead).
  - `Card.astro` — a slotted container with optional `{ id?: string; class?: string }`; renders the wedding card surface and forwards `id`/extra classes.

- [ ] **Step 1: Create `frontend/src/components/PageHero.astro`**

```astro
---
interface Props { eyebrow?: string; title: string; lead?: string }
const { eyebrow, title, lead } = Astro.props;
---
<section class="py-10 text-center">
  {eyebrow && <div class="text-[12.5px] font-semibold uppercase tracking-[4px] text-gold-deep">{eyebrow}</div>}
  <h1 class="mx-auto mt-2 max-w-3xl font-display text-[clamp(28px,4.5vw,44px)] font-extrabold leading-tight text-ink">{title}</h1>
  {lead && <p class="mx-auto mt-3 max-w-[620px] text-brand-muted">{lead}</p>}
</section>
```

- [ ] **Step 2: Create `frontend/src/components/Card.astro`**

```astro
---
interface Props { id?: string; class?: string }
const { id, class: extra = '' } = Astro.props;
---
<div id={id} class:list={["rounded-[var(--radius-card)] border border-line bg-paper-2 p-5 shadow-[0_18px_50px_-20px_rgba(70,50,30,.35)]", extra]}>
  <slot />
</div>
```

- [ ] **Step 3: Verify the components compile (no page uses them yet — type-check only)**

Run: `cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" && npx astro check 2>&1 | tail -3`
Expected: `0 errors` (warnings/hints about unused are acceptable).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PageHero.astro frontend/src/components/Card.astro
git commit -m "P3: shared PageHero + Card components for tool/content pages"
```

---

## Task 2: `quyen-rieng-tu.astro` (static content — proves the content-page pattern)

**Files:**
- Create: `frontend/src/pages/quyen-rieng-tu.astro`
- Read (source of truth for the text): `public/quyen-rieng-tu.html`

**Interfaces:**
- Consumes: `Layout.astro`, `PageHero.astro`, `Card.astro`.
- Produces: `dist/quyen-rieng-tu.html` (static, no JS).

- [ ] **Step 1: Read the source content**

Run: `cat public/quyen-rieng-tu.html`
Note the intro paragraph + the 5 sections (each an `h2` + paragraph + `ul`). You will copy this Vietnamese text **verbatim** into the redesigned page.

- [ ] **Step 2: Create `frontend/src/pages/quyen-rieng-tu.astro`** (redesigned shell; paste the 5 sections' real text from Step 1 into the marked slots)

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHero from '../components/PageHero.astro';
import Card from '../components/Card.astro';
---
<Layout title="Chính sách quyền riêng tư — Thiệp Cưới Online" description="Chính sách quyền riêng tư của Thiệp Cưới Online.">
  <PageHero eyebrow="Cam kết bảo mật" title="Chính sách quyền riêng tư" />
  <Card class="mx-auto mb-16 max-w-[760px] [&_h2]:mt-7 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink [&_p]:mt-2 [&_p]:text-ink/90 [&_p]:leading-7 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:leading-7 [&_li]:text-ink/90">
    <!-- Paste the intro paragraph + 5 sections (h2 + p + ul) VERBATIM from public/quyen-rieng-tu.html here -->
  </Card>
</Layout>
```

- [ ] **Step 3: Build and verify**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
npm run build && ls dist/quyen-rieng-tu.html
grep -c 'quyền riêng tư' dist/quyen-rieng-tu.html   # >= 1
npx astro check 2>&1 | tail -2                        # 0 errors
```
Expected: file exists, grep ≥ 1, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/quyen-rieng-tu.astro
git commit -m "P4: quyen-rieng-tu.astro (static content on design system)"
```

---

## Task 3: `nghi-le.astro` + `data/ceremonies.ts` + `scripts/nghi-le.ts` (tabbed guide)

**Files:**
- Create: `frontend/src/data/ceremonies.ts`, `frontend/src/scripts/nghi-le.ts`, `frontend/src/pages/nghi-le.astro`
- Read (source): `public/nghi-le.html`, `public/js/nghi-le.js`

**Interfaces:**
- Produces: `ceremonies.ts` exports `export interface Ceremony { key: string; name: string; intro: string; steps: string[]; roles: string[] }` and `export const CEREMONIES: Ceremony[]` (the 4 ceremonies). `scripts/nghi-le.ts` self-initializes on import: renders tabs into `#tabs` and the active ceremony into `#panel`, wiring tab clicks.
- Port contract (ids the markup must expose): `#tabs` (tab button row), `#panel` (detail container).

- [ ] **Step 1: Extract data — create `frontend/src/data/ceremonies.ts`**

Open `public/js/nghi-le.js`, find the `CEREMONIES` array, and copy all 4 ceremony objects **verbatim** (every `name`, `intro`, and every string in `steps`/`roles`) into:

```ts
export interface Ceremony { key: string; name: string; intro: string; steps: string[]; roles: string[] }
export const CEREMONIES: Ceremony[] = [
  // paste the 4 objects from public/js/nghi-le.js verbatim, typed to Ceremony
];
```

- [ ] **Step 2: Port the logic — create `frontend/src/scripts/nghi-le.ts`**

Re-implement `public/js/nghi-le.js` as a typed module that imports `CEREMONIES`. Keep the exact behavior: maintain an `active` key (default the first ceremony), `renderTabs()` rebuilds the buttons in `#tabs` (active button gets a distinct style via a `data-active` attribute or class), `renderPanel()` fills `#panel` with the ceremony name (`font-display`), intro, an ordered list of `steps`, and a bulleted list of `roles`. Attach a click handler on `#tabs` (event delegation) to switch `active` and re-render. Initialize on load. Use `textContent`/DOM creation (not raw innerHTML with untrusted data — the data is static, but build nodes cleanly).

```ts
import { CEREMONIES } from '../data/ceremonies';
// re-implement nghi-le.js behavior here, binding to #tabs and #panel
```

- [ ] **Step 3: Create `frontend/src/pages/nghi-le.astro`** (redesigned shell exposing the contract ids)

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHero from '../components/PageHero.astro';
import Card from '../components/Card.astro';
---
<Layout title="Nghi lễ cưới hỏi truyền thống — Thiệp Cưới Online" description="Hướng dẫn các nghi lễ cưới hỏi truyền thống Việt Nam.">
  <PageHero eyebrow="Phong tục cưới hỏi" title="Nghi lễ cưới hỏi truyền thống" lead="Các bước trong từng lễ và vai trò của hai bên gia đình." />
  <div class="mx-auto mb-4 max-w-[760px]">
    <div id="tabs" class="flex flex-wrap gap-2"></div>
  </div>
  <Card id="panel" class="mx-auto mb-12 max-w-[760px]" />
  <p class="mx-auto mb-16 max-w-[760px] text-center text-sm italic text-brand-muted">Phong tục có thể khác nhau theo vùng miền; nội dung mang tính tham khảo.</p>
  <script>import '../scripts/nghi-le';</script>
</Layout>
```

> Style the tab buttons (built in the script) with Tailwind classes applied in the script: inactive `rounded-full border border-line px-3.5 py-1.5 text-sm`, active (when `data-active`) `bg-gold text-white border-gold`. You may add a small scoped `<style>` to `nghi-le.astro` using `[data-active]` if that reads cleaner.

- [ ] **Step 4: Build + headless functional check**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
npm run build && ls dist/nghi-le.html && npx astro check 2>&1 | tail -2
```
Then verify rendering with the shared smoke harness (see Task 9 helper) OR a quick check: serve `dist/` and confirm `#tabs` has 4 buttons and clicking the 2nd swaps `#panel`. Minimum gate here: build succeeds, 0 check errors, `dist/nghi-le.html` contains `id="tabs"` and `id="panel"`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/ceremonies.ts frontend/src/scripts/nghi-le.ts frontend/src/pages/nghi-le.astro
git commit -m "P3: nghi-le tabbed ceremony guide (data + island + page)"
```

---

## Task 4: `mam-qua.astro` + `data/mamqua.ts` + `scripts/mam-qua.ts` (region tabs + count + checklist)

**Files:**
- Create: `frontend/src/data/mamqua.ts`, `frontend/src/scripts/mam-qua.ts`, `frontend/src/pages/mam-qua.astro`
- Read (source): `public/mam-qua.html`, `public/js/mam-qua.js`

**Interfaces:**
- Produces: `mamqua.ts` exports `export interface RegionData { name: string; rule: string; counts: Record<string, string[]> }` and `export const MAMQUA: { bac: RegionData; nam: RegionData }` (verbatim from source). `scripts/mam-qua.ts` self-initializes: region buttons switch region, populates `#countSel`, sets `#rule`, renders the item checklist into `#checklist`, updates `#progress`.
- Port contract ids: region buttons `.region-btn[data-region="bac"|"nam"]`, `#countSel` (select), `#rule`, `#checklist`, `#progress`.

- [ ] **Step 1: Extract data — create `frontend/src/data/mamqua.ts`**

Copy the `MAMQUA` object from `public/js/mam-qua.js` **verbatim** (both regions, all count keys, every gift-item string) typed to:

```ts
export interface RegionData { name: string; rule: string; counts: Record<string, string[]> }
export const MAMQUA: { bac: RegionData; nam: RegionData } = {
  // paste verbatim from public/js/mam-qua.js
};
```

- [ ] **Step 2: Port the logic — create `frontend/src/scripts/mam-qua.ts`**

Re-implement `public/js/mam-qua.js`: import `MAMQUA`; keep `region` state (default `'bac'`); `populateCounts()` fills `#countSel` with `Object.keys(MAMQUA[region].counts)`; clicking a `.region-btn` sets region + active style + repopulates + sets `#rule` + renders; changing `#countSel` re-renders; `renderList()` builds `.mq-item` labels (checkbox + name) into `#checklist`; `updateProgress()` counts checked vs total into `#progress` ("Đã chuẩn bị X/Y lễ vật") and toggles a done style on checked items. No persistence (matches source). Build DOM nodes; the item names from the data may contain HTML entities — render as text.

```ts
import { MAMQUA } from '../data/mamqua';
// re-implement mam-qua.js behavior, binding to .region-btn / #countSel / #rule / #checklist / #progress
```

- [ ] **Step 3: Create `frontend/src/pages/mam-qua.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHero from '../components/PageHero.astro';
import Card from '../components/Card.astro';
---
<Layout title="Mâm quả & tráp ăn hỏi — Thiệp Cưới Online" description="Danh sách mâm quả, tráp ăn hỏi theo vùng miền.">
  <PageHero eyebrow="Lễ ăn hỏi" title="Mâm quả & tráp ăn hỏi" lead="Chọn miền và số tráp để xem danh sách lễ vật chuẩn." />
  <Card class="mx-auto mb-16 max-w-[720px]">
    <div class="flex gap-2">
      <button class="region-btn rounded-full border border-line px-3.5 py-1.5 text-sm" data-region="bac">Miền Bắc</button>
      <button class="region-btn rounded-full border border-line px-3.5 py-1.5 text-sm" data-region="nam">Miền Nam</button>
    </div>
    <label class="mt-4 block">
      <span class="text-sm text-brand-muted">Số tráp</span>
      <select id="countSel" class="mt-1 w-full rounded-lg border border-line bg-paper-2 px-3 py-2"></select>
    </label>
    <p id="rule" class="mt-3 text-sm text-gold-deep"></p>
    <p id="progress" class="mt-2 text-center font-semibold text-gold-deep"></p>
    <div id="checklist" class="mt-3 grid gap-2"></div>
    <p class="mt-4 text-center text-sm italic text-brand-muted">Danh sách mang tính tham khảo; tùy điều kiện gia đình.</p>
  </Card>
  <script>import '../scripts/mam-qua';</script>
</Layout>
```

> Active region button + checked `.mq-item` states: apply via the script (toggle classes / `data-*`). A small scoped `<style>` in `mam-qua.astro` for `.region-btn[data-active]{background:var(--color-gold);color:#fff;border-color:var(--color-gold)}` and `.mq-item[data-done]{...}` is acceptable.

- [ ] **Step 4: Build + verify**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
npm run build && ls dist/mam-qua.html && npx astro check 2>&1 | tail -2
grep -c 'id="countSel"' dist/mam-qua.html   # 1
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/mamqua.ts frontend/src/scripts/mam-qua.ts frontend/src/pages/mam-qua.astro
git commit -m "P3: mam-qua region/count gift checklist (data + island + page)"
```

---

## Task 5: `checklist.astro` + `data/checklist.ts` + `scripts/checklist.ts` (date-based, localStorage)

**Files:**
- Create: `frontend/src/data/checklist.ts`, `frontend/src/scripts/checklist.ts`, `frontend/src/pages/checklist.astro`
- Read (source): `public/checklist.html`, `public/js/checklist.js`

**Interfaces:**
- Produces: `checklist.ts` exports `export interface ChecklistTask { t: string; d: number; link?: string }` and `export interface Phase { title: string; key: string; items: ChecklistTask[] }` and `export const PHASES: Phase[]` (verbatim). `scripts/checklist.ts` self-initializes: default date = today + 90 days, renders phases into `#out`, persists checked ids under `"checklist:" + weddingDate`, marks overdue items, updates `#progress`.
- Port contract ids: `#weddingDate` (date input), `#progress`, `#out`.
- **localStorage key (preserve exactly):** `"checklist:" + weddingDate` → JSON array of checked ids in the original `"<phaseKey>|<task text>"` format.

- [ ] **Step 1: Extract data — create `frontend/src/data/checklist.ts`**

Copy the `PHASES` structure from `public/js/checklist.js` **verbatim** (every phase title/key, every task `{ t, d, link? }`), typed to the interfaces above. Match the original id format the source uses for a checked item (read the source to confirm whether the id is `phaseKey + "|" + t` — preserve that exactly so existing saved data still matches).

- [ ] **Step 2: Port the logic — create `frontend/src/scripts/checklist.ts`**

Re-implement `public/js/checklist.js`: import `PHASES`; on load set `#weddingDate` to today+90d if empty; `loadDone(date)` reads `localStorage["checklist:"+date]` (JSON array) into a `Set`; `render()` loops phases→items, computes each item's deadline = weddingDate − `d` days, flags overdue (`deadline < today && !checked`), builds `.cl-item` labels (checkbox + text + optional `link` + due date), toggles done/overdue styles, and updates `#progress` ("Hoàn thành X/Y việc"); checkbox change adds/removes the id and saves; date change reloads done-set for the new key and re-renders. Preserve the id string format exactly.

```ts
import { PHASES } from '../data/checklist';
// re-implement checklist.js; key = "checklist:" + weddingDate
```

- [ ] **Step 3: Create `frontend/src/pages/checklist.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHero from '../components/PageHero.astro';
import Card from '../components/Card.astro';
---
<Layout title="Checklist chuẩn bị đám cưới — Thiệp Cưới Online" description="Checklist chuẩn bị đám cưới theo mốc thời gian.">
  <PageHero eyebrow="Lên kế hoạch" title="Checklist chuẩn bị đám cưới" lead="Nhập ngày cưới để xem các việc cần làm theo từng mốc thời gian." />
  <Card class="mx-auto mb-4 max-w-[760px]">
    <label class="block">
      <span class="text-sm text-brand-muted">Ngày cưới</span>
      <input id="weddingDate" type="date" class="mt-1 w-full rounded-lg border border-line bg-paper-2 px-3 py-2" />
    </label>
    <p id="progress" class="mt-3 text-center font-semibold text-gold-deep"></p>
  </Card>
  <div id="out" class="mx-auto mb-16 max-w-[760px]"></div>
  <script>import '../scripts/checklist';</script>
</Layout>
```

> Stateful item styles (`done`, `overdue`) via toggled classes / `data-*` from the script; a small scoped `<style>` for `[data-done]`/`[data-overdue]` using tokens is acceptable.

- [ ] **Step 4: Build + verify**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
npm run build && ls dist/checklist.html && npx astro check 2>&1 | tail -2
grep -c 'id="weddingDate"' dist/checklist.html   # 1
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/checklist.ts frontend/src/scripts/checklist.ts frontend/src/pages/checklist.astro
git commit -m "P3: checklist timeline (data + island + page, localStorage preserved)"
```

---

## Task 6: `ngan-sach.astro` + `data/budget.ts` + `scripts/ngan-sach.ts` (dynamic table, localStorage)

**Files:**
- Create: `frontend/src/data/budget.ts`, `frontend/src/scripts/ngan-sach.ts`, `frontend/src/pages/ngan-sach.astro`
- Read (source): `public/ngan-sach.html`, `public/js/ngan-sach.js`

**Interfaces:**
- Produces: `budget.ts` exports `export interface BudgetRow { name: string; est: number; act: number; paid: boolean }` and `export const DEFAULTS: BudgetRow[]` (12 categories verbatim). `scripts/ngan-sach.ts` self-initializes: loads `"thiep-ngan-sach"` or DEFAULTS, renders editable rows into `#rows`, recalculates summary `#summary` + progress bar + tfoot totals, supports add/delete/reset, persists on change.
- Port contract ids: `#budget` (number), `#summary`, `#rows` (tbody), `#totalEst`, `#totalAct`, `#paidCount`, the progress bar element, add-row + reset buttons (give them ids e.g. `#addRow`, `#resetRows`).
- **localStorage key (preserve exactly):** `"thiep-ngan-sach"` → `{ budget:number, rows: BudgetRow[] }`.

- [ ] **Step 1: Extract data — create `frontend/src/data/budget.ts`**

Copy the `DEFAULTS` array (12 category names; the source initializes est/act/paid — match its initial values) from `public/js/ngan-sach.js` **verbatim**, typed to `BudgetRow`.

- [ ] **Step 2: Port the logic — create `frontend/src/scripts/ngan-sach.ts`**

Re-implement `public/js/ngan-sach.js` faithfully: state `{ budget, rows }` from `localStorage["thiep-ngan-sach"]` or `DEFAULTS`; `render()` builds a `<tr>` per row with name/est/act inputs + paid checkbox + delete button (set values via `.value`, not innerHTML); `recalc()` sums est/act/paid, computes remaining = budget − act, sets progress bar width % (over → red), renders the 4 summary stat cards with `₫` formatting and ok/over styling, updates tfoot totals (`#totalEst`, `#totalAct`, `#paidCount` as "X/Y"); input/checkbox/delete sync state + save + recalc/render; `#budget` input updates budget; add-row pushes an empty row + focus; reset confirms then restores DEFAULTS. Preserve the currency formatting helper and the `.over` threshold behavior.

```ts
import { DEFAULTS, type BudgetRow } from '../data/budget';
// re-implement ngan-sach.js; key = "thiep-ngan-sach"
```

- [ ] **Step 3: Create `frontend/src/pages/ngan-sach.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHero from '../components/PageHero.astro';
import Card from '../components/Card.astro';
import { Button } from '@/components/starwind/button';
---
<Layout title="Ngân sách đám cưới — Thiệp Cưới Online" description="Lập và theo dõi ngân sách đám cưới.">
  <PageHero eyebrow="Quản lý chi phí" title="Ngân sách đám cưới" lead="Nhập tổng ngân sách, thêm các khoản chi và theo dõi tiến độ." />
  <div class="mx-auto mb-16 max-w-[860px]">
    <Card>
      <label class="block">
        <span class="text-sm text-brand-muted">Tổng ngân sách (₫)</span>
        <input id="budget" type="number" step="100000" class="mt-1 w-full rounded-lg border border-line bg-paper-2 px-3 py-2" />
      </label>
      <div id="summary" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"></div>
      <div class="mt-4 h-3 w-full overflow-hidden rounded-full bg-line"><div id="bar" class="h-full w-0 bg-gold"></div></div>
      <p id="barNote" class="mt-1 text-sm text-brand-muted"></p>
    </Card>
    <Card class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[640px] text-sm">
        <thead><tr class="text-left text-brand-muted">
          <th class="py-2">Khoản mục</th><th>Dự kiến</th><th>Thực chi</th><th>Đã trả</th><th></th>
        </tr></thead>
        <tbody id="rows"></tbody>
        <tfoot class="font-semibold"><tr>
          <td class="py-2">Tổng</td><td id="totalEst"></td><td id="totalAct"></td><td id="paidCount"></td><td></td>
        </tr></tfoot>
      </table>
      <div class="mt-3 flex gap-2">
        <Button id="addRow" size="sm">+ Thêm khoản</Button>
        <Button id="resetRows" variant="outline" size="sm">Khôi phục mặc định</Button>
      </div>
    </Card>
    <p class="mt-3 text-center text-sm italic text-brand-muted">Dữ liệu lưu trên trình duyệt của bạn.</p>
  </div>
  <script>import '../scripts/ngan-sach';</script>
</Layout>
```

> If the Starwind `Button` renders a `<button>` and you need plain ids, confirm `id` passes through (the Starwind Button forwards rest props). If not, fall back to a Tailwind-styled `<button id="addRow">`.

- [ ] **Step 4: Build + verify**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
npm run build && ls dist/ngan-sach.html && npx astro check 2>&1 | tail -2
grep -c 'id="rows"' dist/ngan-sach.html   # 1
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/budget.ts frontend/src/scripts/ngan-sach.ts frontend/src/pages/ngan-sach.astro
git commit -m "P3: ngan-sach budget tracker (data + island + page, localStorage preserved)"
```

---

## Task 7: `xem-ngay.astro` + `scripts/xem-ngay.ts` (reuses `lib/lunar.ts`)

**Files:**
- Create: `frontend/src/scripts/xem-ngay.ts`, `frontend/src/pages/xem-ngay.astro`
- Read (source): `public/xem-ngay.html`, `public/js/xem-ngay.js`, `public/js/lunar.js`, and existing `frontend/src/lib/lunar.ts`

**Interfaces:**
- Consumes: `frontend/src/lib/lunar.ts`.
- Produces: `scripts/xem-ngay.ts` self-initializes: Kim Lâu form (`#form`) renders verdict into `#result`; lucky-hours form (`#ghdForm`/`#ghdDate`) renders into `#ghdResult`.
- Port contract ids: `#form`, `#brideYear`, `#groomYear`, `#weddingYear`, `#result`, `#ghdForm`, `#ghdDate`, `#ghdResult`.

- [ ] **Step 1: Reconcile the lunar API**

The original `public/js/xem-ngay.js` calls `Lunar.kimLau(birthYear, weddingYear)`, `Lunar.canChiDay(date)`, `Lunar.hoangDaoHours(date)`, `Lunar.lunarLabel(date)`. Open `frontend/src/lib/lunar.ts` and check which of these exist and their signatures.

Run: `grep -nE 'export|kimLau|canChiDay|hoangDao|lunarLabel|canChi' frontend/src/lib/lunar.ts`

- If all four exist with compatible signatures → import and use them.
- If any are missing → port the missing function(s) **verbatim** from `public/js/lunar.js` into `frontend/src/lib/lunar.ts` as typed exports (do not change existing exports the builder relies on; add alongside). Note in your report which functions you added.

- [ ] **Step 2: Port the logic — create `frontend/src/scripts/xem-ngay.ts`**

Re-implement `public/js/xem-ngay.js`: on `#form` submit, read the 3 years, validate (present; bride/groom year < wedding year — show inline error otherwise), call the lunar Kim Lâu function per person, compute the summary verdict (good/warn) exactly as the source does, render the result card into `#result`, scroll into view. On `#ghdForm` change/submit, parse `#ghdDate`, compute Can Chi day + lucky hours + lunar label, render the 6-cell grid into `#ghdResult`. Use safe DOM text for any user-derived values.

```ts
import { /* kimLau, canChiDay, hoangDaoHours, lunarLabel */ } from '../lib/lunar';
// re-implement xem-ngay.js, binding to #form/#result and #ghdForm/#ghdResult
```

- [ ] **Step 3: Create `frontend/src/pages/xem-ngay.astro`** (two cards: Kim Lâu + Giờ hoàng đạo)

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHero from '../components/PageHero.astro';
import Card from '../components/Card.astro';
import { Button } from '@/components/starwind/button';
---
<Layout title="Xem tuổi Kim Lâu & giờ hoàng đạo — Thiệp Cưới Online" description="Kiểm tra Kim Lâu theo năm sinh và xem giờ hoàng đạo.">
  <PageHero eyebrow="Xem ngày cưới" title="Xem tuổi Kim Lâu & năm cưới đẹp" lead="Tham khảo tuổi Kim Lâu và giờ hoàng đạo theo lịch âm." />
  <div class="mx-auto mb-12 max-w-[720px]">
    <Card>
      <form id="form" class="grid gap-3 sm:grid-cols-3">
        <label class="block"><span class="text-sm text-brand-muted">Năm sinh cô dâu</span><input id="brideYear" type="number" min="1940" max="2010" class="mt-1 w-full rounded-lg border border-line bg-paper-2 px-3 py-2" /></label>
        <label class="block"><span class="text-sm text-brand-muted">Năm sinh chú rể</span><input id="groomYear" type="number" min="1940" max="2010" class="mt-1 w-full rounded-lg border border-line bg-paper-2 px-3 py-2" /></label>
        <label class="block"><span class="text-sm text-brand-muted">Năm cưới dự kiến</span><input id="weddingYear" type="number" min="2024" max="2100" class="mt-1 w-full rounded-lg border border-line bg-paper-2 px-3 py-2" /></label>
        <div class="sm:col-span-3"><Button type="submit">Kiểm tra Kim Lâu</Button></div>
      </form>
      <div id="result" class="mt-4"></div>
    </Card>
    <p class="mt-3 text-center text-sm italic text-brand-muted">Quan niệm dân gian, mang tính tham khảo.</p>

    <Card class="mt-8">
      <h2 class="font-display text-xl text-ink">Giờ hoàng đạo trong ngày</h2>
      <form id="ghdForm" class="mt-3"><label class="block"><span class="text-sm text-brand-muted">Chọn ngày</span><input id="ghdDate" type="date" class="mt-1 w-full rounded-lg border border-line bg-paper-2 px-3 py-2" /></label></form>
      <div id="ghdResult" class="mt-4"></div>
    </Card>
  </div>
  <script>import '../scripts/xem-ngay';</script>
</Layout>
```

- [ ] **Step 4: Build + verify (incl. unit tests, since lunar.ts may have changed)**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
npm run build && ls dist/xem-ngay.html && npx astro check 2>&1 | tail -2
npm test 2>&1 | tail -4   # lunar tests must stay green if lunar.ts was touched
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/scripts/xem-ngay.ts frontend/src/pages/xem-ngay.astro frontend/src/lib/lunar.ts
git commit -m "P3: xem-ngay Kim Lâu + giờ hoàng đạo (reuses lib/lunar.ts)"
```

---

## Task 8: `mau-thiep.astro` + `data/templates.ts` + `scripts/mau-thiep.ts` (gallery + filter)

**Files:**
- Create: `frontend/src/data/templates.ts`, `frontend/src/scripts/mau-thiep.ts`, `frontend/src/pages/mau-thiep.astro`
- Read (source): `public/mau-thiep.html` (template list + filter logic are inline there)

**Interfaces:**
- Produces: `templates.ts` exports `export interface Template { id: string; name: string; cat: 'truyen-thong'|'sang-trong'|'lang-man'|'toi-gian'; tag: string }` and `export const TEMPLATES: Template[]` (the 12, verbatim) and `export const CAT_LABEL: Record<string,string>`. `scripts/mau-thiep.ts` self-initializes the category filter on the server-rendered grid.
- Port contract: category buttons `.cat[data-cat="all"|...]`, grid `#grid` with cards carrying `data-cat`. **Preview images** at `/previews/<id>.jpg` (already vendored in `frontend/public/previews/`). Card links: `href="/?template=<id>#soan"` (the builder; not migrated yet — link target is correct for after cutover).

- [ ] **Step 1: Extract data — create `frontend/src/data/templates.ts`**

Copy the 12-item `TEMPLATES` array and the `CAT_LABEL` map from `public/mau-thiep.html`'s inline script **verbatim** (every `id`, `name`, `cat`, `tag`), typed to the interface above.

- [ ] **Step 2: Render the grid in Astro (SSG), filter in TS — create `frontend/src/pages/mau-thiep.astro`**

Render the 12 cards at build time from `TEMPLATES` (better LCP than client innerHTML), each card a link to `/?template=<id>#soan` with `data-cat`, the preview `<img src={\`/previews/${t.id}.jpg\`} loading="lazy" />`, name, category label, and a "Dùng mẫu →" affordance. Render the category buttons. Load the filter script.

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHero from '../components/PageHero.astro';
import { TEMPLATES, CAT_LABEL } from '../data/templates';
const cats = [['all','Tất cả'], ['truyen-thong','Truyền thống'], ['sang-trong','Sang trọng'], ['lang-man','Lãng mạn'], ['toi-gian','Tối giản']];
---
<Layout title="12 mẫu thiệp cưới đẹp — Thiệp Cưới Online" description="Bộ sưu tập 12 mẫu thiệp cưới online, chọn mẫu và tạo thiệp miễn phí.">
  <PageHero eyebrow="Bộ sưu tập" title="12 mẫu thiệp cưới thủ công" lead="Chọn mẫu ưng ý rồi tạo thiệp trong vài phút — miễn phí." />
  <div class="mb-5 flex flex-wrap justify-center gap-2">
    {cats.map(([c, label], i) => (
      <button class="cat rounded-full border border-line px-3.5 py-1.5 text-sm" data-cat={c} data-active={i === 0 ? '' : undefined}>{label}</button>
    ))}
  </div>
  <div id="grid" class="mx-auto mb-12 grid max-w-[1100px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {TEMPLATES.map((t) => (
      <a href={`/?template=${t.id}#soan`} data-cat={t.cat} class="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-2 shadow-[0_18px_50px_-20px_rgba(70,50,30,.35)] transition hover:-translate-y-0.5 hover:border-gold">
        <span class="block aspect-[5/6] overflow-hidden"><img src={`/previews/${t.id}.jpg`} alt={t.name} loading="lazy" class="h-full w-full object-cover transition group-hover:scale-105" /></span>
        <span class="flex items-center justify-between p-4">
          <span><b class="font-display text-ink">{t.name}</b><small class="block text-brand-muted">{CAT_LABEL[t.cat]} · {t.tag}</small></span>
          <span class="rounded-full border border-gold px-3 py-1 text-sm text-gold-deep">Dùng mẫu →</span>
        </span>
      </a>
    ))}
  </div>
  <script>import '../scripts/mau-thiep';</script>
</Layout>
```

- [ ] **Step 3: Port the filter — create `frontend/src/scripts/mau-thiep.ts`**

Re-implement only the category filter from `public/mau-thiep.html`'s inline script: clicking a `.cat` button sets it active (toggle `data-active`), reads `data-cat`, and shows/hides `#grid > a[data-cat]` (toggle a `hidden` class) — `all` shows everything. No innerHTML rendering needed (grid is server-rendered).

```ts
// bind to .cat buttons + #grid anchors; toggle hidden by data-cat
```

- [ ] **Step 4: Build + verify (preview images resolve)**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
npm run build && ls dist/mau-thiep.html && npx astro check 2>&1 | tail -2
grep -c 'previews/' dist/mau-thiep.html        # 12
ls frontend/public/previews | head             # confirm preview jpgs exist
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/templates.ts frontend/src/scripts/mau-thiep.ts frontend/src/pages/mau-thiep.astro
git commit -m "P4: mau-thiep 12-template gallery + category filter (SSG grid)"
```

---

## Task 9: Regression gate + headless smoke for all 7 pages

**Files:**
- Create: `test/pages-smoke.mjs` (a Playwright smoke that loads each new page from `dist/` via a static server and asserts it renders + the interactive bits work)

**Interfaces:**
- Consumes: the built `frontend/dist/`.
- Produces: a repeatable smoke that proves the 7 pages render with no console/page errors and key interactions function.

- [ ] **Step 1: Create `test/pages-smoke.mjs`**

```js
// Serves frontend/dist on a static server and checks each tool/content page renders cleanly.
// Run: node test/pages-smoke.mjs   (Playwright is in the repo root node_modules)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../frontend/dist/', import.meta.url).pathname;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png', '.webmanifest':'application/manifest+json', '.json':'application/json' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(ROOT, normalize(p));
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(8131, r));
const base = 'http://localhost:8131';

const EXEC = '/home/tungtran/.cache/ms-playwright/chromium-1148/chrome-linux/chrome';
const fs = await import('node:fs');
const browser = await chromium.launch({ executablePath: fs.existsSync(EXEC) ? EXEC : undefined, args: ['--no-sandbox'] });
let fails = 0;
const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ FAIL ') + m); if (!c) fails++; };

async function page(path, fn) {
  const pg = await browser.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto(base + path, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(400);
  await fn(pg);
  check(errs.length === 0, `${path} no console/page errors` + (errs.length ? ' -> ' + errs.slice(0,3).join(' | ') : ''));
  await pg.close();
}

console.log('• tool/content pages smoke');
await page('/quyen-rieng-tu.html', async (p) => check((await p.locator('h1').innerText()).includes('quyền riêng tư'), 'privacy heading'));
await page('/nghi-le.html', async (p) => { check(await p.locator('#tabs button').count() === 4, 'nghi-le 4 tabs'); await p.locator('#tabs button').nth(1).click(); await p.waitForTimeout(150); check((await p.locator('#panel').innerText()).length > 20, 'nghi-le panel renders on tab switch'); });
await page('/mam-qua.html', async (p) => { check(await p.locator('#countSel option').count() > 0, 'mam-qua counts populated'); check((await p.locator('#checklist').innerText()).length > 0, 'mam-qua items render'); });
await page('/checklist.html', async (p) => { check(await p.locator('#weddingDate').inputValue() !== '', 'checklist default date set'); check((await p.locator('#out').innerText()).length > 20, 'checklist phases render'); });
await page('/ngan-sach.html', async (p) => { check(await p.locator('#rows tr').count() >= 1, 'ngan-sach rows render'); check((await p.locator('#summary').innerText()).length > 0, 'ngan-sach summary renders'); });
await page('/xem-ngay.html', async (p) => { await p.fill('#brideYear','1996'); await p.fill('#groomYear','1994'); await p.fill('#weddingYear','2026'); await p.locator('#form button[type="submit"]').click(); await p.waitForTimeout(200); check((await p.locator('#result').innerText()).length > 10, 'xem-ngay Kim Lâu result renders'); });
await page('/mau-thiep.html', async (p) => { check(await p.locator('#grid a').count() === 12, 'mau-thiep 12 cards'); await p.locator('.cat[data-cat="toi-gian"]').click(); await p.waitForTimeout(150); const vis = await p.locator('#grid a:visible').count(); check(vis > 0 && vis < 12, `mau-thiep filter narrows (${vis} visible)`); });

await browser.close();
server.close();
console.log(fails ? `\nFAILED: ${fails}` : '\nALL SMOKE CHECKS PASSED');
process.exit(fails ? 1 : 0);
```

- [ ] **Step 2: Build everything, run unit tests + the smoke**

```bash
cd frontend && export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" && npm run build && npm test 2>&1 | tail -4 && cd ..
node test/pages-smoke.mjs
```
Expected: unit 15/15; smoke prints `ALL SMOKE CHECKS PASSED` (exit 0). If a check fails, fix the offending page/script (it's a real defect — do not weaken the assertion) and rebuild.

- [ ] **Step 3: Commit**

```bash
git add test/pages-smoke.mjs
git commit -m "P3/P4: headless smoke for 7 tool/content pages (all green)"
```

---

## Self-Review

**Spec coverage:** all 7 pages from the user-chosen "Tool + Content" chunk have a task (quyen-rieng-tu T2, nghi-le T3, mam-qua T4, checklist T5, ngan-sach T6, xem-ngay T7, mau-thiep T8), plus shared components (T1) and a regression gate (T9). The design spec's P3 (tools) + P4 (content, incl. 12-template showcase) are covered. Builder/manage (P5), invite islands (P2), and cutover (P6) are explicitly OUT of this chunk.

**Placeholder scan:** The data-extraction and logic-port steps intentionally say "copy verbatim from `public/js/<file>.js`" instead of re-transcribing the Vietnamese content/algorithms — this is a faithful PORT of existing, working, tested-in-production code, and re-typing it into the plan would risk corrupting the content. Each such step names the exact source file, the typed shape to produce, the element-id contract the markup must expose, and the localStorage key to preserve — so it is fully specified, not a "TODO". All `.astro` shells are complete, real markup. The only deliberately deferred runtime check is per-page rendering, which Task 9's smoke covers comprehensively.

**Type/name consistency:** data modules export `Ceremony`/`CEREMONIES`, `RegionData`/`MAMQUA`, `ChecklistTask`+`Phase`/`PHASES`, `BudgetRow`/`DEFAULTS`, `Template`/`TEMPLATES`+`CAT_LABEL`; each script imports exactly those. Element-id contracts in each `.astro` match the ids referenced by its script (e.g. `#rows`/`#summary`/`#budget` for ngan-sach; `#tabs`/`#panel` for nghi-le; `#form`/`#result`/`#ghdForm`/`#ghdResult` for xem-ngay; `#grid`/`.cat` for mau-thiep). The smoke (T9) asserts against these same ids.

**Open risk flagged for execution:** Task 7 Step 1 — `lib/lunar.ts` may not expose `kimLau`/`canChiDay`/`hoangDaoHours`/`lunarLabel`; the task handles this by porting any missing function from `public/js/lunar.js` without breaking existing exports, and re-runs `npm test`.
