# Thiết kế: "Tạo thiệp trước, đăng ký sau" (build-first, register-later)

Ngày: 2026-06-30
Trạng thái: Chờ user review

## 1. Vấn đề

Hiện tại `POST /api/invitations` (`backend/src/routes/invitations.rs:21`) bắt buộc
`user: AuthUser`. Nghĩa là **user phải đăng ký email + mật khẩu TRƯỚC khi được tạo
thiệp**. Đây là rào cản lớn nhất ở đầu phễu: người dùng phải cam kết tạo tài khoản
trước khi thấy được giá trị sản phẩm.

Mục tiêu: làm cho việc tạo và quản lý thiệp **dễ nhất có thể** — không bắt đăng nhập
ở đầu vào, tài khoản trở thành lựa chọn "nâng cấp an toàn" thay vì cổng chặn.

## 2. Mục tiêu / Phi mục tiêu

**Mục tiêu**
- User tạo & xem thử thiệp ngay, không cần tài khoản.
- Sau khi tạo, user không mất thiệp trên cùng trình duyệt (localStorage + link quản lý).
- Đăng ký/đăng nhập là tùy chọn; khi đăng ký thì tự "nhận" (claim) các thiệp đã tạo ẩn danh.
- Chỉnh sửa & quản lý thiệp ẩn danh được phép qua `manage_token` (không cần đăng nhập).

**Phi mục tiêu (YAGNI lần này)**
- Đăng nhập không mật khẩu / OAuth / magic link (để vòng lặp sau).
- Khôi phục mật khẩu (để vòng lặp sau).
- Đồng chủ sở hữu / chia sẻ quyền sửa.

## 3. Hạ tầng đã có sẵn (tái sử dụng)

- Cột `invitations.owner_id` **đã nullable** (`ON DELETE SET NULL`) — không cần migration.
- Cột `invitations.manage_token` đã được sinh sẵn mỗi lần tạo (`invitations.rs:135`).
- Endpoint claim đã hoạt động: `POST /api/invitations/:slug/claim` nhận `{ manageToken }`,
  chặn nếu thiệp đã có chủ, verify token, gán `owner_id` (`users.rs:161`).
- UI claim thủ công đã tồn tại ở `/tai-khoan` (mục "Nhận thiệp cũ").

Vậy phần lớn backend đã sẵn sàng; chủ yếu là **mở khóa create + cho phép sửa qua token**
và **làm mượt luồng frontend**.

## 4. Thay đổi Backend

### 4.1 `create` — cho phép ẩn danh
`invitations.rs:21` đổi `user: AuthUser` → `user: Option<AuthUser>`.
- Nếu `Some(u)` → `owner_id = u.user_id` (giữ nguyên hành vi cũ).
- Nếu `None` → `owner_id = NULL`.
- Response: trả thêm `manageToken` **chỉ khi tạo ẩn danh** (khi đã đăng nhập thì
  không cần lộ token). Cụ thể:
  - đăng nhập: `{ "slug": ... }` (như cũ — không vỡ client hiện tại).
  - ẩn danh: `{ "slug": ..., "manageToken": ... }`.

`Option<AuthUser>`: hiện `AuthUser` là extractor bắt buộc. Cần impl
`FromRequestParts for Option<AuthUser>` (hoặc dùng sẵn nếu `AuthUser` đã trả
`Rejection` để Axum tự bọc Option). Kiểm tra `auth.rs` khi implement; nếu chưa có,
thêm một extractor `MaybeAuth(Option<i64>)` đọc cookie `__sid` → trả `None` khi
thiếu/không hợp lệ thay vì lỗi.

### 4.2 Mọi route quản lý — dual-auth (chủ HOẶC `manage_token`)

Phát hiện khi triển khai: commit `ea578d1` (#72, "user accounts — Option B session-based")
đã đổi **toàn bộ** route quản lý (`create`, `update`, `list_rsvps`, `delete_rsvp`,
`save_seating`) sang yêu cầu `AuthUser` (session-only), làm **7/8 integration test
hỏng** — vì bộ test mã hoá thiết kế gốc *token-first* (`?token=`). Đây chính là thiết
kế "tạo trước, đăng ký sau": `manage_token` là credential quản lý, tài khoản là lớp tuỳ chọn.

Giải pháp: một helper thuần `auth::can_manage(owner_id, stored_token, user, provided_token)`
trả `true` nếu **một trong hai**:
1. Đã đăng nhập VÀ là chủ (`owner_id == user.user_id`), HOẶC
2. Gửi kèm `manageToken` đúng (qua `?token=`).

Áp dụng cho: `update`, `list_rsvps`, `delete_rsvp`, `save_seating`. Mỗi handler đổi
extractor sang `MaybeAuth` + `Query<ManageQuery>` (`?token=`), `SELECT` thêm
`manage_token`, thay owner-check bằng `can_manage`.

**Quyết định thiết kế** (lệch với bản nháp ban đầu): token vẫn hợp lệ **kể cả sau khi
thiệp đã được claim** (mô hình capability), thay vì chỉ khi `owner_id IS NULL`. Lý do:
(a) khớp hợp đồng test sẵn có; (b) UX dễ hơn — link quản lý đã bookmark vẫn dùng được
nếu phiên đăng nhập hết hạn; (c) `manage_token` là bí mật 16 ký tự do người tạo kiểm
soát. Đánh đổi: nếu người tạo lỡ chia sẻ link quản lý thì claim không thu hồi được —
chấp nhận được cho phạm vi này.

`photos` (upload/list) vốn đã public (khách tải ảnh) — không đổi.

### 4.3 Không đổi
- `claim_invitation` giữ nguyên.
- `list_invitations`, `me`, `login`, `register`, `logout` giữ nguyên.

## 5. Thay đổi Frontend (Astro)

### 5.1 Builder `/` (`index.astro`)
- Bỏ yêu cầu đăng nhập để mở trang & submit (hiện submit POST tới `/api/invitations`).
- Sau khi tạo (ẩn danh) thành công, nhận `{ slug, manageToken }`:
  - Lưu vào `localStorage` key `tc:cards` (mảng `{ slug, manageToken, groom, bride, createdAt }`).
  - Chuyển sang **màn hình thành công** (mục 5.2).
- Khi sửa (`?edit=SLUG`): nếu user đã đăng nhập → PUT như cũ; nếu chưa, đính kèm
  `manageToken` lấy từ `localStorage` cho slug đó vào body PUT.

### 5.2 Màn hình thành công (mới)
Sau khi tạo ẩn danh, hiển thị:
- Link xem thiệp `/thiep/:slug` (sao chép nhanh).
- Link **quản lý** `/quanly/:slug` (mở được nhờ token lưu ở localStorage — xem 5.4).
- Cảnh báo nhẹ + CTA: "Tạo tài khoản để không mất thiệp & quản lý từ mọi thiết bị"
  → form đăng ký nhẹ (chỉ email + mật khẩu, hoặc tái dùng `/dang-ky`).
- Nút phụ "Gửi link quản lý vào email" — *để vòng lặp sau nếu chưa có hạ tầng email;
  lần này chỉ cần nút "Sao chép link quản lý".*

### 5.3 Tự động claim khi đăng ký / đăng nhập
- Sau khi `register`/`login` thành công (ở `dang-ky.astro`, `dang-nhap.astro`, và CTA ở 5.2):
  đọc `localStorage tc:cards`, với mỗi thẻ còn token, gọi
  `POST /api/invitations/:slug/claim { manageToken }`.
  - 200 → xóa token khỏi localStorage (đã thuộc tài khoản), giữ lại slug để hiển thị.
  - "đã có chủ" → bỏ qua, xóa token.
- Kết quả: thiệp tạo ẩn danh tự xuất hiện trong `/tai-khoan` sau khi có tài khoản.

### 5.4 Truy cập quản lý ẩn danh `/quanly/:slug`
- Trang manage hiện yêu cầu owner. Cho phép truy cập bằng token: nếu chưa đăng nhập,
  đọc `manageToken` của slug từ localStorage và đính kèm vào các call cần quyền
  (list RSVP, seating...). Backend cho các route đó: chấp nhận token-path khi
  `owner_id IS NULL` (cùng quy tắc 4.2).
  - *Phạm vi lần này: tối thiểu cho phép xem RSVP của thiệp ẩn danh. Nếu phần này
    phình to, tách thành sub-task riêng và chỉ giữ create+edit+claim trong vòng đầu.*

## 6. Luồng dữ liệu (end-to-end)

```
Ẩn danh:
  / (builder) --POST /api/invitations--> { slug, manageToken }
     -> localStorage tc:cards += {slug, manageToken,...}
     -> /  màn hình thành công (xem / quản lý / tạo tài khoản)

Sửa khi chưa đăng nhập:
  /?edit=SLUG --PUT /api/invitations/:slug { ...data, manageToken }--> ok

Nâng cấp tài khoản:
  đăng ký/đăng nhập -> với mỗi tc:cards: POST /:slug/claim { manageToken }
     -> owner_id set -> /tai-khoan hiển thị thiệp
```

## 7. Edge case & xử lý lỗi

- **Mất localStorage trước khi tạo tài khoản** → mất quyền quản lý thiệp ẩn danh.
  Giảm thiểu: màn hình thành công nhấn mạnh "lưu link / tạo tài khoản ngay".
- **Token sai / thiệp đã có chủ** khi PUT ẩn danh → 403, hiện thông báo
  "Thiệp này đã thuộc một tài khoản, hãy đăng nhập để sửa."
- **Tạo trùng** (user bấm Lưu nhiều lần) → mỗi lần tạo một slug mới; chấp nhận như hiện tại.
- **Đăng nhập rồi vẫn còn token cũ trong localStorage của thiệp đã thuộc người khác**
  → claim trả "đã có chủ", client bỏ qua + dọn token.
- **Tương thích ngược**: client đã đăng nhập vẫn nhận `{ slug }` không có manageToken →
  không vỡ.

## 8. Kiểm thử

Backend (Rust, theo style test sẵn có):
- `create` ẩn danh → 201, `owner_id` NULL, response có `manageToken`.
- `create` đã đăng nhập → 201, `owner_id` đúng, response KHÔNG có manageToken.
- `update` ẩn danh với token đúng (owner NULL) → ok.
- `update` ẩn danh với token sai → 403.
- `update` token-path khi thiệp đã có chủ → 403.
- `claim` sau create ẩn danh → owner_id set; `list_invitations` thấy thiệp.

Frontend (thủ công + nếu có e2e):
- Tạo thiệp không đăng nhập → thấy màn hình thành công, thiệp lưu localStorage.
- Đăng ký từ CTA → thiệp tự xuất hiện ở `/tai-khoan`.
- Sửa thiệp ẩn danh ngay sau khi tạo → lưu được.

## 9. Thứ tự triển khai (đề xuất)

1. Backend: `Option<AuthUser>` cho `create` + trả `manageToken` (TDD).
2. Backend: nới quyền `update` qua token (TDD).
3. Frontend: bỏ gate đăng nhập ở builder + lưu localStorage + màn hình thành công.
4. Frontend: auto-claim khi register/login.
5. (Tùy chọn) Quản lý RSVP ẩn danh qua token — tách nếu phình to.
