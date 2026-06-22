# Thiệp Cưới Online 💌

Trang web giúp người Việt **tự tạo thiệp cưới online** trong vài phút: chọn mẫu đẹp,
điền thông tin, nhận ngay **link chia sẻ + mã QR** để gửi khách mời. Có **đếm ngược ngày cưới**,
**bản đồ chỉ đường**, và **RSVP (xác nhận tham dự)** với trang quản lý riêng.

## Tính năng
- ✅ **6 mẫu thiệp**: Truyền thống · Hiện đại · Pastel hoa lá · **Hoàng gia** (navy+vàng kim) · **Xanh lá** (greenery) · **Đỏ rượu** (burgundy)
- ✅ **Chế độ Save the Date** (thiệp báo trước: nhấn tên+ngày, ẩn RSVP/hộp mừng)
- ✅ **Hiệu ứng mở thiệp** (màn "phong bì" cinematic, bật/tắt được)
- ✅ Xem trước trực tiếp (WYSIWYG) khi soạn
- ✅ **Gợi ý nội dung mẫu**: thư viện câu lời mời/chuyện tình mẫu, bấm để điền (không cần AI/mạng)
- ✅ **Đa ngôn ngữ Việt–Anh** (nút chuyển VI ⇄ EN ngay trên thiệp) — đồng bộ `<html lang>` cho screen reader
- ✅ **Truy cập (a11y)**: aria-label nút biểu tượng, landmark `role=main`, focus-visible bàn phím, prefers-reduced-motion
- ✅ Link chia sẻ đẹp + mã QR (tạo offline) — **preview Open Graph** khi gửi Zalo/FB/Messenger
- ✅ **PWA — cài đặt được + xem thiệp OFFLINE** (service worker, hữu ích khi wifi nhà hàng yếu)
- ✅ Đếm ngược tới ngày cưới
- ✅ **Lịch âm + Can Chi**: hiển thị ngày âm lịch (vd "năm Bính Ngọ") song song ngày dương
- ✅ **Xem ngày cưới đẹp / tuổi Kim Lâu** (`/xem-ngay`): kiểm tra phạm Kim Lâu theo phong tục VN
- ✅ **Mâm quả / tráp ăn hỏi** (`/mam-qua`): checklist lễ vật theo số tráp & vùng miền
- ✅ **Checklist chuẩn bị cưới** (`/checklist`): to-do theo mốc thời gian tính từ ngày cưới
- ✅ **Nghi lễ cưới hỏi** (`/nghi-le`): trình tự + phân vai dạm ngõ/ăn hỏi/nạp tài/đón dâu
- ✅ **Thêm vào lịch**: tải file .ics hoặc mở Google Calendar
- ✅ **Hành trình tình yêu** (timeline mốc kỷ niệm: gặp nhau → hẹn hò → cầu hôn)
- ✅ **Album ảnh cưới** (lưới + lightbox) **+ nhạc nền** (nút bật/tắt nổi)
- ✅ **Lịch trình sự kiện** (timeline) **+ dress code** (text + màu chủ đạo)
- ✅ **Hỏi & Đáp (FAQ)** cho khách (accordion)
- ✅ **Nơi lưu trú**: gợi ý khách sạn/homestay cho khách ở xa (+ link đặt phòng)
- ✅ **Góc ảnh khách mời**: khách tự tải ảnh lên album chung (tự thu nhỏ phía client)
- ✅ **Chế độ cảm ơn sau cưới**: bật banner "Lời cảm ơn" + mời khách xem/góp ảnh kỷ niệm
- ✅ **Sơ đồ bàn tiệc**: xếp khách vào bàn (kéo-thả / click-gán), lưu lại
- ✅ **Tra cứu bàn tiệc**: khách nhập tên trên thiệp → biết mình ngồi bàn nào
- ✅ **Cha mẹ 2 bên + lễ Vu Quy / Tân Hôn** (cấu trúc 2 gia đình đặc thù VN)
- ✅ **Nhiều sự kiện/nhiều ngày** (ăn hỏi + tiệc nhà gái + tiệc cưới...), mỗi sự kiện có giờ/địa điểm/bản đồ riêng
- ✅ **Nhân bản thiệp nhà trai / nhà gái** ("Mua 1 được 3 thiệp": link chung + `?ben=trai` + `?ben=gai`)
- ✅ **Thiệp cá nhân hoá theo từng khách** (link `?khach=` điền sẵn tên + công cụ sinh link hàng loạt)
- ✅ Địa điểm nhà trai / nhà gái + nút chỉ đường Google Maps
- ✅ RSVP: khách xác nhận tham dự, số người, **khẩu phần (ăn chay)**, lời chúc — dashboard có **bộ lọc** + thống kê suất chay
- ✅ **Hộp mừng cưới (VietQR)**: opt-in, tế nhị — QR ngân hàng chuẩn NAPAS (sinh offline) cho nhà trai/nhà gái
- ✅ **Sổ lưu bút**: lời chúc của khách hiển thị công khai trên thiệp
- ✅ Trang quản lý khách mời (bảo vệ bằng token bí mật) — **đếm lượt xem + xuất CSV + in danh sách + xoá dữ liệu khách**
- ✅ **In/PDF**: in thiệp & danh sách khách (`@media print`, không cần lib)
- ✅ **Tuân thủ PDPL** (NĐ 356/2025): ô đồng ý không tick sẵn cho RSVP/ảnh + trang chính sách riêng tư

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
node test/e2e.js          # kiểm thử đầu-cuối qua trình duyệt
node test/vietqr.test.js  # unit test bộ sinh VietQR (theo test vector thật)
node test/lunar.test.js   # unit test đổi dương -> âm lịch (Tết & Đoan Ngọ) + tuổi Kim Lâu
```
Nếu Chromium chưa có đúng phiên bản, đặt biến `CHROME_BIN` trỏ tới file thực thi Chrome/Chromium.

## API
| Method | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/api/invitations` | Tạo thiệp → `{ slug, manageToken }` |
| GET | `/api/invitations/:slug` | Lấy dữ liệu thiệp công khai |
| POST | `/api/invitations/:slug/rsvp` | Gửi xác nhận tham dự |
| POST | `/api/invitations/:slug/view` | Tăng lượt xem thiệp |
| GET | `/api/invitations/:slug/rsvps?token=` | Danh sách RSVP + lượt xem (cần token) |

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
