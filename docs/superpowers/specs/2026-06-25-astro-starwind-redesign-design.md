# Design: Redesign `public/` → Astro + Starwind UI (Tailwind v4), Rust giữ nguyên

- **Ngày:** 2026-06-25
- **Trạng thái:** Design (đã duyệt hướng) → tiếp theo là implementation plan
- **Phạm vi:** Toàn bộ 12 trang trong `public/`, **redesign toàn bộ** trên design system mới, build hết rồi cắt 1 lần.
- **Thay thế:** `docs/superpowers/specs/2026-06-24-astro-islands-migration-design.md`. Bản cũ là *migration giữ UI pixel-identical, vanilla TS, không UI framework*. Bản này đổi hướng theo quyết định mới của user: **redesign toàn bộ bằng Starwind UI**, vẫn giữ hồn cưới Việt. Các phần kỹ thuật về biên giới với Rust/OG injection được kế thừa nguyên vẹn.

## 1. Bối cảnh & hiện trạng

Frontend hiện tại là **vanilla multi-page app** trong `public/`:

- 12 trang HTML, nạp JS bằng thẻ `<script src>` thuần (không bundler, không ES module).
- 13 file JS, một số lớn: `invite.js` 55KB, `qrcode.js` 56KB (vendored), `editor.js` 24KB, `manage.js` 16KB, `print-card.js` 14KB.
- 4 file CSS hand-written (`base` 11KB, `invite` 34KB, `ornaments` 25KB, `print-card` 11KB) — bản sắc thiệp cưới Việt: bảng màu đỏ/vàng (`#b5232a`), font Playfair Display / Great Vibes / Be Vietnam Pro, hoa văn, sigil `囍`, hệ class `.btn-primary`/`.btn-ghost`/`.hero`/`.site-header`.
- PWA: `sw.js` + `manifest.webmanifest`.

Backend **Rust/Axum** (đã chạy production) phục vụ frontend này:

- Serve trang tĩnh qua `ServeDir(public_dir)` + các route đọc file bằng `read_public()` (xem `backend/src/routes/pages.rs`).
- **`/thiep/:slug` inject Open Graph động**: `thiep_page()` đọc `invite.html`, query DB theo slug, rồi `html.replacen("</head>", …)` chèn thẻ OG/Twitter + thay `<title>`. Comment trong code ghi rõ điều này *"critical for Zalo/Facebook link previews"*.
- REST API (`invitations`, `rsvps`, `photos`, `seating`) + SQLite (sqlx). Có 12 `template` hợp lệ.

Có một **React + Vite + TS stub bị bỏ dở** trong `frontend/`: chỉ port được 2 util thuần (`src/lib/lunar.ts`, `src/lib/vietqr.ts`) kèm test; chưa có component nào → sẽ thay bằng Astro.

Hạ tầng test giá trị cho việc chuyển đổi:

- `test/e2e.js` — Playwright: tạo thiệp → mở → RSVP → quản lý, và chụp screenshot từng template vào `shots/`.
- `test/snapshots/` — snapshot API (JSON) + `thiep-og.html` (output HTML sau khi Rust inject OG).

## 2. Mục tiêu & ràng buộc

**Quyết định gốc (user đã chốt trong brainstorming):**

1. **Redesign toàn bộ** UI bằng **Astro + Starwind UI (Tailwind v4)** — không còn ràng buộc pixel-identical với bản cũ.
2. **Giữ hồn cưới Việt**: xây design system mới giữ bảng màu đỏ/vàng, font Playfair/Great Vibes/Be Vietnam Pro, hoa văn, `囍`; Starwind là *nền component*, không phải để biến site thành dashboard generic.
3. **Bảo vệ "template-beauty"** — trang khách xem `/thiep/:slug` và 12 mẫu thiệp là vũ khí cạnh tranh (vs chungdoi.com); mỗi template phải giữ nét riêng, đẹp.
4. **Rust giữ nguyên, Astro build tĩnh**: Astro build ra HTML/CSS/JS tĩnh; Rust vẫn serve + vẫn inject OG.
5. **Go-live big-bang**: làm xong toàn bộ 12 trang trong `frontend/` rồi mới trỏ `public_dir` → `dist/` một lần. `public/` cũ giữ live tới khi xong.

**Ràng buộc cứng (kế thừa từ bản cũ, vẫn áp dụng):**

- **Rust không đổi một dòng.** Pipeline mới chỉ thay đổi *cách sinh ra* HTML/CSS/JS.
- **`dist/invite.html` sau build phải tương thích string-injection của Rust**: còn `</head>` **literal** và một thẻ `<title>…</title>` để `replacen`/`replace_title` tìm thấy; `<head>` không bị Astro chèn cấu trúc lạ làm hỏng vị trí inject.
- **Giữ PWA** (`/sw.js`, `/manifest.webmanifest`) và các path asset người dùng đang phụ thuộc.
- **Giữ đúng filename trang** Rust đang đọc bằng `read_public()` (`invite.html`, `manage.html`, `xem-ngay.html`…).

**Ưu tiên kỹ thuật (theo thứ tự):**

1. Trang khách xem `/thiep/:slug` load nhanh, ship JS tối thiểu (LCP là nội dung tĩnh).
2. Dễ bảo trì: xoá header/nav/footer copy-paste ở 7 trang; tách logic thành component/island dùng lại.
3. Giao diện mới đẹp & đồng nhất, giữ bản sắc cưới.

## 3. Hướng giải pháp (đã chốt)

**Astro (bản stable mới nhất — hiện tại 5.x; user gọi "Astro 7", ta dùng latest stable) + Starwind UI (Tailwind v4).** Mô hình islands. Island nhẹ viết **vanilla TS**; chỉ 2 trang app phức tạp (builder + manage) dùng **Preact (~3KB)**. Astro xây trong `frontend/` (thay React stub), build ra HTML tĩnh để **Rust tiếp tục serve**.

Lý do: Astro ship 0 KB JS mặc định (đúng ưu tiên #1), Vite-based (dùng lại `lunar.ts`/`vietqr.ts`), không buộc đổi backend; Starwind cho bộ component có sẵn (Button/Dialog/Tabs/Accordion/Input…) build trên Tailwind v4, theme-được qua CSS variables nên nhận được bản sắc cưới.

### 3.1. Kiến trúc & ranh giới với Rust

```
frontend/  (Astro project, thay React stub)
  src/
    layouts/    Layout.astro, InviteLayout.astro
    components/ Header, Footer + Starwind components (Button, Card, Dialog, Tabs, Accordion, Input, Select, Tooltip, Badge)
                + brand: Ornament.astro, SectionDivider.astro
    styles/     global.css (Tailwind v4 @theme: wedding tokens), fonts
    pages/      12 trang .astro (file-based, build.format:'file')
    islands/    TS tương tác (RsvpForm, Gallery, Lightbox, Countdown, MusicToggle,
                VenueMap, AddToCalendar, QrBlock, Builder[Preact], Manage[Preact])
    lib/        lunar.ts, vietqr.ts (dùng lại), api.ts
  public/       sw.js, manifest.webmanifest, previews/, ảnh (copy nguyên xi ra dist/ root)
        │ astro build
        ▼
  frontend/dist/*.html + dist/_astro/[hash].{js,css}
        │  cfg.public_dir: public/ → frontend/dist/
        ▼
  Rust serve y như cũ: ServeDir(dist) + thiep_page() đọc dist/invite.html → inject OG (KHÔNG đổi)
```

- `astro.config.mjs`: `build.format: 'file'` → xuất phẳng `dist/invite.html`, `dist/manage.html`, `dist/xem-ngay.html`… đúng tên Rust đang đọc.
- Asset không qua build (giữ path): `sw.js`, `manifest.webmanifest`, `previews/`, ảnh → để trong `frontend/public/`.
- Triển khai: thêm bước `npm run build` (trong `frontend/`) trước khi deploy; production Rust trỏ `public_dir` vào `frontend/dist/`.

### 3.2. Design system (Tailwind v4 `@theme` + Starwind)

Mục tiêu: Starwind component *kế thừa bản sắc cưới* thay vì trông generic.

- **`global.css`** khai báo Tailwind v4 `@theme` tokens:
  - màu: `--color-primary` (đỏ `#b5232a`), gold accent, neutrals;
  - font: `--font-display: "Playfair Display"`, `--font-script: "Great Vibes"`, `--font-body: "Be Vietnam Pro"`;
  - radii/shadow tinh chỉnh cho card thiệp.
- **Cài Starwind components qua CLI** (`Button`, `Card`, `Dialog`, `Tabs`, `Accordion`, `Input`, `Select`, `Tooltip`, `Badge`) rồi re-skin qua tokens trên → Button đọc như `.btn-primary` cũ; Dialog dùng cho lightbox/modal.
- **Lớp ornaments là lớp brand**: sigil `囍`, hoa-văn divider, eyebrow label port thành component Astro nhỏ (`Ornament.astro`, `SectionDivider.astro`) — đây là phần giữ "template-beauty" trên nền Starwind.
- **12 template thiệp = themeable variants**: mỗi template override token riêng (màu/hoa văn) để giữ nét riêng → bảo vệ lợi thế cạnh tranh.

> Lưu ý: CSS cũ (`base/invite/ornaments/print-card.css`) **không** import nguyên byte-for-byte (đây là redesign). Dùng làm tham chiếu giá trị/spacing/màu khi dựng tokens, rồi thay bằng Tailwind v4 + Starwind. `print-card.css`/`print-card.js` (in thiệp giấy) port riêng, giữ đúng spec in.

### 3.3. Phân rã trang & island

| Nhóm | Trang | Tương tác |
|---|---|---|
| **Published invite** ⭐ | `/thiep/:slug` (`invite.html`) | Nội dung = HTML tĩnh (LCP nhanh) + island lazy **vanilla TS** |
| **App-like** | `/` builder (`index.html`/`editor.js`), `manage.html` (`manage.js`) | 1 island **Preact** mỗi trang |
| **Tool** | `xem-ngay`, `ngan-sach`, `mam-qua`, `checklist`, `nghi-le` | 1 calculator island **vanilla TS**/trang; `xem-ngay` dùng lại `lunar.ts` |
| **Content** | `mau-thiep` (showcase 12 template), `quyen-rieng-tu`, `404` | HTML tĩnh, ~0 JS |

**Island trang invite** (tách từ `invite.js`), mỗi island vanilla TS hydrate độc lập:

| Island | Chức năng | Directive |
|---|---|---|
| `RsvpForm` | Form xác nhận tham dự → POST API | `client:visible` |
| `Gallery` + `Lightbox` | Album ảnh + xem full (Starwind `Dialog`) | `client:visible` |
| `Countdown` | Đếm ngược tới ngày cưới | `client:idle` |
| `MusicToggle` | Bật/tắt nhạc nền | `client:idle` |
| `VenueMap` | Bản đồ địa điểm (nặng → lazy) | `client:visible` |
| `AddToCalendar` | Thêm lịch (.ics / Google) | `client:idle` |
| `QrBlock` | QR mừng cưới (`qrcode.js` + `vietqr.ts`) | `client:visible` |

Phần nội dung invite (ảnh bìa, tên cô dâu/chú rể, timeline, thông tin sự kiện, dress code, FAQ, lưu trú) render **HTML tĩnh** → quyết định phần lớn LCP.

**Builder & Manage** dùng **Preact** trong 1 island/trang (`client:only="preact"` hoặc `client:load` tuỳ nhu cầu SEO — builder/manage không cần SEO nên `client:only` được): bê state phức tạp của `editor.js`/`manage.js` (live-preview, seating chart, bảng khách) sang component Preact, redesign UI bằng Starwind. Starwind component vẫn là Astro-native ở khung trang; Preact chỉ nằm trong 2 island này.

**Component dùng chung:** `Layout.astro` + `Header.astro` + `Footer.astro` → xoá header/nav/footer copy-paste ở 7 trang.

`qrcode.js` (56KB vendored) → import as module; `lunar.ts`/`vietqr.ts` → dùng lại từ `frontend/src/lib/`.

### 3.4. Tương thích `invite.html` injection (điểm dễ vỡ nhất)

`invite.astro` sau build phải:

- Giữ `</head>` **literal** (không bị minify/đổi) cho `html.replacen("</head>", …)`.
- Có sẵn một `<title>…</title>` mặc định cho `replace_title()` thay.
- `<head>` không bị Astro chèn cấu trúc lạ làm hỏng vị trí inject.
- **Kiểm chứng** bằng snapshot `test/snapshots/thiep-og.html` sau khi build.

Cấu hình Astro cần xác nhận khi làm: `build.inlineStylesheets` (tránh inline ngoài ý muốn vào `<head>`), `compressHTML` (đảm bảo vẫn còn `</head>` literal).

### 3.5. Dev/build workflow

- **Dev:** `astro dev` (port 4321) proxy `/api`, `/thiep`, `/quan-ly` → Rust (port 3000); FE hot-reload, BE chạy song song.
- **Prod:** `astro build` → `frontend/dist/`; Rust `public_dir` → `frontend/dist/`.
- Asset ổn định path đặt trong `frontend/public/`; rà lại precache list trong `sw.js`.

## 4. Lộ trình triển khai (build hết → cắt 1 lần)

Phasing dưới đây là **thứ tự build** (không phải go-live từng phần). `public/` cũ giữ live suốt; chỉ cắt sang `dist/` ở P6. Mỗi phase là một PR; e2e + unit test + OG snapshot xanh mới merge.

**Phase 0 — Setup & design system**
- Thay React stub trong `frontend/` bằng Astro; giữ `src/lib/lunar.ts`, `vietqr.ts` + test.
- `astro.config.mjs` (`build.format:'file'`); cài Starwind + Tailwind v4; dựng `global.css` `@theme` wedding tokens; `Layout/Header/Footer.astro`; `Ornament/SectionDivider.astro`; cài bộ Starwind components nền và re-skin.
- Wire dev proxy + script build; chuyển asset tĩnh vào `frontend/public/`.

**Phase 1 — Invite shell (pipeline proof + de-risk)**
- `invite.astro` = nội dung tĩnh redesign + design system, **0 island**.
- Giữ `<title>` mặc định + `</head>` literal.
- Build `dist/`, kiểm OG injection khớp `thiep-og.html` (chạy Rust trỏ tạm vào `dist/` ở môi trường test, **không** đổi prod).
- → Chứng minh Astro+Starwind+Rust+OG chạy đúng đầu-cuối với ít biến số nhất.

**Phase 2 — Invite islands**
- Port lần lượt 7 island từ `invite.js` sang vanilla TS, gắn `client:*` phù hợp.
- Sau mỗi island: e2e flow (RSVP/lightbox trong `e2e.js`) xanh.

**Phase 3 — Tool pages** (`xem-ngay`, `ngan-sach`, `mam-qua`, `checklist`, `nghi-le`): 1 island vanilla TS/trang.

**Phase 4 — Content/showcase** (`mau-thiep` với 12 template themeable, `quyen-rieng-tu`, `404`): HTML tĩnh.

**Phase 5 — App pages (Preact)** (`/` builder qua `editor.js`, `manage` qua `manage.js`): 1 island Preact/trang; redesign + bê state logic; `print-card` port giữ spec in.

**Phase 6 — Cutover & cleanup**
- Đổi Rust `public_dir` → `frontend/dist/` (1 PR).
- Xoá `public/`; cập nhật deploy docs + README; gỡ tham chiếu React chết; dọn build scripts.

## 5. Verify & chất lượng

- **Không** dùng pixel-diff gate (redesign cố ý đổi pixel). Thay bằng **design review thủ công** mỗi trang.
- **Giữ e2e xanh**: flow create → open → RSVP → manage trong `test/e2e.js`.
- **Giữ unit test xanh**: `lunar.test.js`, `vietqr.test.js`.
- **OG snapshot = hard gate**: `dist/invite.html` sau inject phải khớp `test/snapshots/thiep-og.html`.
- **Asset/PWA**: path ổn định; precache `sw.js` rà lại.

## 6. Rủi ro & giảm thiểu

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Astro đổi cấu trúc `invite.html` → hỏng string-injection của Rust | Snapshot test `thiep-og.html`; giữ `</head>`/`<title>` literal; kiểm `compressHTML`/`inlineStylesheets` |
| R2 | Redesign làm mất bản sắc cưới / template trông generic | Design system giữ token cưới; ornaments là lớp brand; 12 template = variant riêng; design review mỗi trang |
| R3 | Tách island làm hỏng state chia sẻ trong `invite.js` | Port từng island, giữ e2e RSVP/lightbox xanh; mỗi island cô lập |
| R4 | Builder/manage (Preact) port sai logic phức tạp (live-preview, seating, in thiệp) | Port từng phần, đối chiếu hành vi `editor.js`/`manage.js`/`print-card.js`; e2e manage xanh |
| R5 | Path asset đổi (hashed `_astro/`) làm hỏng SW cache / tham chiếu | Giữ path asset ổn định qua `frontend/public/`; rà precache list `sw.js` |
| R6 | Thêm bước build vào deploy | Tài liệu hoá `npm run build` trước `cargo`; build reproducible |
| R7 | "Astro 7" không tồn tại (latest 5.x) / Starwind yêu cầu Tailwind v4 | Dùng Astro stable mới nhất + Tailwind v4; xác nhận version Starwind tương thích ở P0 |

## 7. Ngoài phạm vi (YAGNI)

- Đổi REST API hay schema DB của Rust.
- SSR bằng Node / bỏ Rust khỏi vai trò server.
- Thêm template thiệp **mới** (chỉ port + theme 12 cái hiện có).
- Thêm UI framework cho các trang ngoài builder/manage.

## 8. Tiêu chí hoàn thành

- 12 trang redesign chạy từ `frontend/dist/` qua Rust.
- Trang `/thiep/:slug` ship JS tối thiểu (chỉ island được dùng, lazy-hydrate); OG injection khớp snapshot.
- Design system cưới áp dụng đồng nhất; 12 template giữ nét riêng.
- Header/Footer/Layout dùng chung một nguồn.
- `public/` cũ đã xoá; e2e + unit test + OG snapshot xanh; deploy docs cập nhật.
