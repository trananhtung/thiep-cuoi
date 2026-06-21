# Thiệp Cưới Online 💌

Trang web giúp người Việt **tự tạo thiệp cưới online** trong vài phút: chọn mẫu đẹp,
điền thông tin, nhận ngay **link chia sẻ + mã QR** để gửi khách mời. Có **đếm ngược ngày cưới**,
**bản đồ chỉ đường**, và **RSVP (xác nhận tham dự)** với trang quản lý riêng.

## Tính năng
- ✅ 3 mẫu thiệp: **Truyền thống** (đỏ-vàng), **Hiện đại** (tối giản), **Pastel hoa lá**
- ✅ Xem trước trực tiếp (WYSIWYG) khi soạn
- ✅ Link chia sẻ đẹp + mã QR (tạo offline)
- ✅ Đếm ngược tới ngày cưới
- ✅ **Thêm vào lịch**: tải file .ics hoặc mở Google Calendar
- ✅ Địa điểm nhà trai / nhà gái + nút chỉ đường Google Maps
- ✅ RSVP: khách xác nhận tham dự, số người, lời chúc
- ✅ **Sổ lưu bút**: lời chúc của khách hiển thị công khai trên thiệp
- ✅ Trang quản lý khách mời (bảo vệ bằng token bí mật)

## Công nghệ
- **Backend:** Node.js + Express + SQLite (`better-sqlite3`)
- **Frontend:** HTML/CSS/JS thuần (không framework)
- **QR:** `qrcode-generator` (sinh phía trình duyệt, không gọi mạng)

## Chạy
```bash
npm install
npm start            # mặc định http://localhost:3000
PORT=8080 npm start  # đổi cổng
```

## Kiểm thử (Playwright)
Chạy toàn bộ luồng tạo thiệp → mở thiệp → RSVP → quản lý, đồng thời chụp ảnh các mẫu vào `shots/`:
```bash
npm install -D playwright
node test/e2e.js
```
Nếu Chromium chưa có đúng phiên bản, đặt biến `CHROME_BIN` trỏ tới file thực thi Chrome/Chromium.

## API
| Method | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/api/invitations` | Tạo thiệp → `{ slug, manageToken }` |
| GET | `/api/invitations/:slug` | Lấy dữ liệu thiệp công khai |
| POST | `/api/invitations/:slug/rsvp` | Gửi xác nhận tham dự |
| GET | `/api/invitations/:slug/rsvps?token=` | Danh sách RSVP (cần token) |

## Trang
- `/` — soạn thiệp
- `/thiep/:slug` — thiệp công khai
- `/quanly/:slug?token=...` — quản lý khách mời

## Cấu trúc
```
src/server.js     API + phục vụ tĩnh
src/db.js         SQLite schema
public/           index/invite/manage/404 + css + js
test/e2e.js       kiểm thử đầu-cuối
docs/superpowers/specs/  tài liệu thiết kế
```
