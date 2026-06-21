# Thiệp Cưới Online — Thiết kế

Ngày: 2026-06-21

## Mục tiêu
Trang web giúp người Việt tạo **thiệp cưới online** (1 trang, có link chia sẻ + QR), kèm RSVP, đếm ngược, bản đồ chỉ đường. Lưu trữ thật bằng backend + database.

## Phạm vi (đã chốt với người dùng)
- Thiệp cưới web 1 trang, link chia sẻ.
- Tính năng: nhiều mẫu + chọn mẫu; đếm ngược ngày cưới; bản đồ & chỉ đường; RSVP xác nhận tham dự.
- Kỹ thuật: backend (Node + Express) + database (SQLite).

## Kiến trúc
- **Backend:** Node.js + Express. Database SQLite qua `better-sqlite3` (đồng bộ, file `data/thiep.db`). Fallback JSON file-store nếu native build lỗi.
- **Frontend:** Vanilla HTML/CSS/JS, không framework. Phục vụ tĩnh từ `public/`.
- **QR:** sinh client-side bằng thư viện nhỏ nhúng (`qrcode` mini) hoặc API ảnh QR công khai; chọn lib JS nhúng để không phụ thuộc mạng.

## Thành phần
1. **Trang soạn thiệp `/` (`public/index.html` + `js/editor.js`)**
   - Form: tên chú rể, tên cô dâu, ngày & giờ cưới, lời mời, địa điểm nhà trai, địa điểm nhà gái, link Google Maps trai/gái, ảnh cưới (URL).
   - Chọn mẫu (3 theme) với preview thu nhỏ.
   - Preview trực tiếp khung thiệp khi gõ.
   - Nút "Tạo thiệp" → POST tạo → hiện link chia sẻ + QR + link quản lý.
2. **Trang thiệp công khai `/thiep/:slug` (`public/invite.html` + `js/invite.js`)**
   - Render theo theme: hero tên cô dâu/chú rể, ngày cưới, đếm ngược, lời mời, 2 địa điểm + nút chỉ đường, form RSVP.
3. **Trang quản lý `/quanly/:slug` (`public/manage.html` + `js/manage.js`)**
   - Yêu cầu `?token=`; hiển thị danh sách RSVP, tổng số người tham dự.

## API
- `POST /api/invitations` → body = dữ liệu thiệp + template. Trả `{ slug, manageToken }`.
- `GET /api/invitations/:slug` → dữ liệu thiệp công khai (không lộ token).
- `POST /api/invitations/:slug/rsvp` → body `{ name, attending, guests, message }`.
- `GET /api/invitations/:slug/rsvps?token=` → danh sách RSVP (cần token).

## Database
```
invitations(
  id INTEGER PK, slug TEXT UNIQUE, manage_token TEXT,
  template TEXT, data TEXT (JSON), created_at TEXT
)
rsvps(
  id INTEGER PK, slug TEXT, name TEXT, attending INTEGER,
  guests INTEGER, message TEXT, created_at TEXT
)
```

## Mẫu thiệp (theme)
1. **Truyền thống** — đỏ + vàng kim, hoa văn, song hỷ.
2. **Hiện đại tối giản** — trắng/be, serif thanh, nhiều khoảng trắng.
3. **Pastel hoa lá** — hồng/xanh pastel, hoa lá nhẹ nhàng.

## Xử lý lỗi
- Slug không tồn tại → trang 404 thân thiện.
- Token sai ở trang quản lý → thông báo từ chối.
- Validate input phía server (tên & ngày bắt buộc); trả lỗi 400 JSON.

## Test (Playwright MCP)
1. Mở `/`, điền form, chọn mẫu, tạo thiệp → bắt được slug.
2. Mở `/thiep/:slug` → kiểm tra tên, đếm ngược hiển thị, nút chỉ đường.
3. Submit RSVP → thấy thông báo cảm ơn.
4. Mở `/quanly/:slug?token=` → thấy RSVP vừa gửi.
5. Chụp ảnh từng mẫu để đánh giá thẩm mỹ.

## Ngoài phạm vi (YAGNI)
- Đăng nhập tài khoản, thanh toán, trình kéo-thả thiết kế, xuất PDF in, đa ngôn ngữ.
