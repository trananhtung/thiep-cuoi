# Design: Convert `public/` → Astro islands (Rust giữ nguyên)

- **Ngày:** 2026-06-24
- **Trạng thái:** Design (chờ duyệt) → tiếp theo là implementation plan
- **Phạm vi:** Toàn bộ 12 trang trong `public/`, làm dần theo lộ trình (invite-first)

## 1. Bối cảnh & hiện trạng

Frontend hiện tại là **vanilla multi-page app** trong `public/`:

- 12 trang HTML, nạp JS bằng thẻ `<script src>` thuần (không bundler, không ES module).
- 13 file JS, một số rất lớn: `invite.js` 55KB, `qrcode.js` 56KB (vendored), `editor.js` 24KB, `manage.js` 16KB.
- 4 file CSS (`base` 11KB, `invite` 34KB, `ornaments` 25KB, `print-card` 11KB).
- PWA: `sw.js` + `manifest.webmanifest`.

Backend **Rust/Axum** (đã chạy production) phục vụ frontend này:

- Serve trang tĩnh qua `ServeDir(public_dir)` + các route đọc file bằng `read_public()` (xem `backend/src/routes/pages.rs`).
- **`/thiep/:slug` inject Open Graph động**: `thiep_page()` đọc `invite.html`, query DB theo slug, rồi `html.replacen("</head>", …)` chèn thẻ OG/Twitter + thay `<title>`. Comment trong code ghi rõ điều này *"critical for Zalo/Facebook link previews"*.
- REST API (`invitations`, `rsvps`, `photos`, `seating`) + SQLite (sqlx). Có 12 `template` hợp lệ.

Có một **React + Vite + TS stub bị bỏ dở** trong `frontend/`: chỉ port được 2 util thuần (`src/lib/lunar.ts`, `src/lib/vietqr.ts`) kèm test; chưa có component nào. Comment trong `pages.rs` cho thấy kế hoạch ban đầu là *"Phases 3+ swap these for the Vite SSR pipeline"* (định dùng React SSR).

Có sẵn hạ tầng test giá trị cho migration:

- `test/e2e.js` — Playwright: tạo thiệp → mở → RSVP → quản lý, và **chụp screenshot từng template** vào `shots/`.
- `test/snapshots/` — snapshot API (JSON) + `thiep-og.html` (output HTML sau khi Rust inject OG).

## 2. Mục tiêu & ràng buộc

**Mục tiêu (theo thứ tự ưu tiên user chốt):**

1. **Trang khách xem (`/thiep/:slug`) load nhanh, ship tối thiểu JS** — đây là ưu tiên số 1.
2. **Dễ bảo trì hơn** — xóa trùng lặp header/nav/footer đang copy-paste khắp 7 trang; tách logic thành component/island dùng lại được.
3. **Giữ đúng UI** — giao diện sau khi convert phải giống hệt hiện tại (pixel-level).

**Ràng buộc cứng:**

- **Rust không đổi một dòng.** Pipeline mới chỉ thay đổi *cách sinh ra* HTML/CSS/JS; Rust vẫn serve + vẫn inject OG như cũ.
- **`invite.html` sau build phải tương thích string-injection của Rust**: còn `</head>` literal và một thẻ `<title>…</title>` để `replacen`/`replace_title` tìm thấy.
- **Giữ PWA** (`/sw.js`, `/manifest.webmanifest`) và các path asset người dùng đang phụ thuộc.
- **Không rewrite CSS** — để bảo toàn UI.

## 3. Hướng giải pháp (đã chốt): Astro + islands, vanilla TS

Dùng **Astro** với mô hình islands; island viết bằng **vanilla TS, không UI framework** (0 KB runtime framework — nhẹ nhất). Astro xây trong `frontend/` (thay React stub), build ra HTML tĩnh để **Rust tiếp tục serve**.

Lý do chọn: Astro mặc định ship 0 KB JS (đúng ưu tiên #1), cho component DX để xóa trùng lặp (mục tiêu #2), là Vite-based nên đúng với "Vite pipeline" đã ghi trong kế hoạch cũ và dùng lại được `lunar.ts`/`vietqr.ts`, đồng thời **không buộc đổi backend**.

### 3.1. Kiến trúc & ranh giới với Rust

```
frontend/src/pages/*.astro ──astro build──▶ frontend/dist/*.html + dist/_astro/[hash].{js,css}
                                                   │
                  cfg.public_dir đổi trỏ ──────────┘  (public/ → frontend/dist/)
                                                   │
   Rust serve y như cũ:
     - ServeDir(dist) cho asset tĩnh
     - thiep_page() đọc dist/invite.html → inject OG (KHÔNG đổi)
```

- `astro.config.mjs`: `build.format: 'file'` → xuất phẳng `dist/invite.html`, `dist/manage.html`, `dist/xem-ngay.html`… **đúng tên file Rust đang đọc** bằng `read_public()`.
- Asset không qua build (giữ nguyên path): `sw.js`, `manifest.webmanifest`, `previews/`, ảnh, và (giai đoạn đầu) các file CSS → để trong `frontend/public/`, Astro copy nguyên xi ra `dist/` root.
- Triển khai: thêm bước `npm run build` (trong `frontend/`) trước khi deploy; production Rust trỏ `public_dir` vào `frontend/dist/`.

### 3.2. Phân rã trang & island

| Nhóm | Trang | Nguồn JS | Kết quả |
|---|---|---|---|
| **Published invite** ⭐ | `/thiep/:slug` (`invite.html`) | `invite.js` 55KB | Nội dung = HTML tĩnh (LCP nhanh) + ~7 island lazy |
| **App-like** | `/` (builder, `index.html`), `manage.html` | `editor.js`, `manage.js` | 1 island lớn/trang, bê logic sang TS module |
| **Tool** | `xem-ngay`, `ngan-sach`, `mam-qua`, `checklist`, `nghi-le` | JS tương ứng | 1 calculator island/trang; `xem-ngay` dùng lại `lunar.ts` |
| **Content** | `mau-thiep`, `quyen-rieng-tu`, `404` | — | HTML tĩnh thuần, 0 JS |

> Lưu ý: `index.html` hiện nạp `editor.js` + `qrcode.js` + `vietqr.js` → **trang `/` chính là trình tạo thiệp** (builder, có live-preview iframe), không phải landing tĩnh.

**Island của trang invite** (tách từ `invite.js`), mỗi island là TS module hydrate độc lập:

| Island | Chức năng | Directive hydrate |
|---|---|---|
| `RsvpForm` | Form xác nhận tham dự → POST API | `client:visible` |
| `Gallery` + `Lightbox` | Album ảnh + xem full màn hình | `client:visible` |
| `Countdown` | Đếm ngược tới ngày cưới | `client:idle` |
| `MusicToggle` | Bật/tắt nhạc nền | `client:idle` |
| `VenueMap` | Bản đồ địa điểm (nặng → lazy) | `client:visible` |
| `AddToCalendar` | Thêm lịch (.ics / Google) | `client:idle` |
| `QrBlock` | QR mừng cưới (dùng `qrcode` + `vietqr.ts`) | `client:visible` |

Phần nội dung invite (ảnh bìa, tên cô dâu/chú rể, timeline, thông tin sự kiện, dress code, FAQ, lưu trú) render **HTML tĩnh** → quyết định phần lớn LCP.

**Component dùng chung:** `Layout.astro` + `Header.astro` + `Footer.astro`, trích từ markup hiện có → **xóa header/nav/footer copy-paste ở 7 trang content/tool**.

### 3.3. Giữ "đúng UI" (ràng buộc cứng)

- **CSS giữ nguyên byte-for-byte:** import `base/invite/ornaments/print-card.css` as global stylesheet, **không** viết lại, **không** scope hóa ở giai đoạn này.
- **Verify từng bước bằng Playwright screenshot diff:** chụp baseline 12 trang + 12 template *trước* khi đổi; sau mỗi trang convert, diff screenshot — khác pixel là fail, không merge.
- **OG injection verify:** so output `/thiep/:slug` với snapshot `test/snapshots/thiep-og.html` để chắc chắn Rust inject vẫn ra HTML y hệt.

### 3.4. Tương thích `invite.html` injection (điểm dễ vỡ nhất)

`invite.astro` sau build phải:

- Giữ `</head>` **literal** (không bị minify/đổi) cho `html.replacen("</head>", …)`.
- Có sẵn một `<title>…</title>` mặc định cho `replace_title()` thay.
- `<head>` không bị Astro chèn cấu trúc lạ làm hỏng vị trí inject.
- **Kiểm chứng** bằng snapshot `thiep-og.html` trong test sau khi build.

Cấu hình Astro liên quan cần xác nhận khi làm: `build.inlineStylesheets` (tránh inline ngoài ý muốn), `compressHTML` (đảm bảo vẫn còn `</head>` literal).

### 3.5. Dev/build workflow

- **Dev:** `astro dev` (port 4321) proxy `/api`, `/thiep`, `/quan-ly` → Rust (port 3000); FE hot-reload, BE chạy song song.
- **Prod:** `astro build` → `frontend/dist/`; Rust `public_dir` → `frontend/dist/`.
- `qrcode.js` (56KB vendored) → import as module; `lunar.ts`/`vietqr.ts` → dùng lại từ `frontend/src/lib/`.

## 4. Lộ trình triển khai (invite-first, site luôn live)

Mỗi phase là một PR riêng; screenshot-diff xanh + e2e xanh mới merge.

**Phase 0 — Setup & baseline**
- Thay React stub trong `frontend/` bằng Astro; giữ `src/lib/lunar.ts`, `vietqr.ts` + test.
- `astro.config.mjs` (`build.format:'file'`), `Layout/Header/Footer.astro`, chuyển asset tĩnh vào `frontend/public/`, wire dev proxy + script build.
- Chụp **baseline** Playwright 12 trang + 12 template; lưu snapshot `invite.html` + `thiep-og.html` hiện tại.

**Phase 1 — Invite shell (pipeline proof — bước de-risk bên trong "invite-first")**
- `invite.astro` = chỉ **nội dung tĩnh** + CSS import nguyên, **0 island**.
- Giữ `<title>` mặc định + `</head>` literal.
- Đổi Rust `public_dir` → `dist/`. Verify: `/thiep/:slug` serve bản build, OG injection vẫn khớp `thiep-og.html`; screenshot khớp baseline.
- → Chứng minh Astro+Rust+OG chạy đúng đầu-cuối trên trang quan trọng nhất, với ít biến số nhất.

**Phase 2 — Invite islands**
- Port lần lượt 7 island từ `invite.js` sang vanilla TS, gắn `client:*` phù hợp.
- Sau mỗi island: screenshot diff + e2e flow (RSVP/lightbox trong `e2e.js`) xanh.

**Phase 3 — Tool pages** (`xem-ngay`, `ngan-sach`, `mam-qua`, `checklist`, `nghi-le`): 1 island/trang.

**Phase 4 — Content/showcase** (`mau-thiep`, `quyen-rieng-tu`, `404`): HTML tĩnh.

**Phase 5 — App pages** (`/` builder qua `editor.js`, `manage` qua `manage.js`): 1 island lớn/trang.

**Phase 6 — Cleanup**: xóa `public/`, cập nhật deploy docs + README, gỡ tham chiếu React chết, dọn `frontend/` build scripts.

## 5. Rủi ro & giảm thiểu

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Astro đổi cấu trúc `invite.html` → hỏng string-injection của Rust | Snapshot test `thiep-og.html`; giữ `</head>`/`<title>` literal; kiểm `compressHTML`/`inlineStylesheets` |
| R2 | Lệch UI/CSS | CSS byte-for-byte + screenshot-diff gate mỗi trang |
| R3 | Tách island làm hỏng state chia sẻ trong `invite.js` | Port từng island, giữ e2e RSVP/lightbox xanh; mỗi island cô lập |
| R4 | Path asset đổi (hashed `_astro/`) làm hỏng SW cache / tham chiếu | Giữ path asset người dùng ổn định qua `frontend/public/`; rà lại precache list trong `sw.js` |
| R5 | Thêm bước build vào deploy | Tài liệu hóa `npm run build` trước `cargo`; build reproducible |

## 6. Ngoài phạm vi (YAGNI)

- Viết lại CSS thành scoped styles / đổi design.
- Thêm UI framework (React/Preact/Svelte) cho island.
- Đổi REST API hay schema DB của Rust.
- SSR bằng Node / bỏ Rust khỏi vai trò server.
- Thêm template thiệp mới.

## 7. Tiêu chí hoàn thành

- 12 trang chạy từ `frontend/dist/` qua Rust, screenshot khớp baseline.
- Trang `/thiep/:slug` ship JS tối thiểu (chỉ island được dùng, lazy-hydrate); OG injection khớp snapshot.
- Header/Footer/Layout dùng chung một nguồn.
- `public/` cũ đã xóa; e2e + unit test xanh; deploy docs cập nhật.
