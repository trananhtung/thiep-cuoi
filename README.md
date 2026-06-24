# Thiệp Cưới Online 💌

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

Trang web giúp người Việt **tự tạo thiệp cưới online** trong vài phút: chọn mẫu đẹp,
điền thông tin, nhận ngay **link chia sẻ + mã QR** để gửi khách mời. Có **đếm ngược ngày cưới**,
**bản đồ chỉ đường**, và **RSVP (xác nhận tham dự)** với trang quản lý riêng.

## Tính năng
- ✅ **12 mẫu thiệp** + **Bộ sưu tập `/mau-thiep`** để khách duyệt & chọn mẫu: Truyền thống · Hiện đại · Pastel · Hoàng gia · Xanh lá · Đỏ rượu · **Anh đào** · **Long Phụng** · **Mai Trắng** · **Lam Ngọc** · **Hồng Kim** (rose gold) · **Lục Bảo** (emerald)
- ✅ **Hoa văn trang trí thủ công** (`ornaments.css`): khung viền đôi + hoa văn 4 góc, triện Song Hỷ, đường phân cách hoa mỹ, nền vân giấy, cánh hoa/lá bay (thuần CSS, tôn trọng `prefers-reduced-motion`)
- ✅ **Chế độ Save the Date** (thiệp báo trước: nhấn tên+ngày, ẩn RSVP/hộp mừng)
- ✅ **Hiệu ứng mở thiệp** (màn "phong bì" cinematic, bật/tắt được)
- ✅ Xem trước trực tiếp (WYSIWYG) khi soạn
- ✅ **Gợi ý nội dung mẫu**: thư viện câu lời mời/chuyện tình mẫu, bấm để điền (không cần AI/mạng)
- ✅ **Đa ngôn ngữ Việt–Anh** (nút chuyển VI ⇄ EN ngay trên thiệp) — đồng bộ `<html lang>` cho screen reader
- ✅ **Truy cập (a11y)**: aria-label nút biểu tượng, landmark `role=main`, focus-visible bàn phím, prefers-reduced-motion
- ✅ Link chia sẻ đẹp + mã QR (tạo offline) — **preview Open Graph** khi gửi Zalo/FB/Messenger
- ✅ **Chia sẻ nhanh**: nút Web Share (→ Zalo/Messenger trên di động) + chia sẻ Facebook một chạm
- ✅ **PWA — cài đặt được + xem thiệp OFFLINE** (service worker, hữu ích khi wifi nhà hàng yếu)
- ✅ Đếm ngược tới ngày cưới
- ✅ **Lịch âm + Can Chi**: hiển thị ngày âm lịch (vd "năm Bính Ngọ") song song ngày dương
- ✅ **Xem ngày cưới đẹp / tuổi Kim Lâu** (`/xem-ngay`): kiểm tra phạm Kim Lâu + **giờ hoàng đạo theo ngày** (Can Chi ngày + 6 khung giờ tốt, đã đối chiếu lịch vạn niên)
- ✅ **Mâm quả / tráp ăn hỏi** (`/mam-qua`): checklist lễ vật theo số tráp & vùng miền
- ✅ **Checklist chuẩn bị cưới** (`/checklist`): to-do theo mốc thời gian tính từ ngày cưới
- ✅ **Ngân sách cưới** (`/ngan-sach`): hạng mục dự kiến vs thực chi, đã thanh toán, còn lại + % tiến độ (tự lưu)
- ✅ **Nghi lễ cưới hỏi** (`/nghi-le`): trình tự + phân vai dạm ngõ/ăn hỏi/nạp tài/đón dâu
- ✅ **Thêm vào lịch**: tải file .ics hoặc mở Google Calendar
- ✅ **Hành trình tình yêu** (timeline mốc kỷ niệm: gặp nhau → hẹn hò → cầu hôn)
- ✅ **Album ảnh cưới** (lưới + lightbox) **+ nhạc nền** (nút bật/tắt nổi)
- ✅ **Phát trực tiếp (livestream)**: nhúng YouTube (youtube-nocookie) / link Facebook Live cho khách ở xa
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
- **Backend (`backend/`):** Rust + [axum](https://github.com/tokio-rs/axum) + [sqlx](https://github.com/launchbadge/sqlx) (SQLite). Phục vụ API, render Open Graph phía máy chủ, và serve frontend tĩnh.
- **Frontend (`public/`):** HTML/CSS/JS thuần (không framework), phục vụ bởi backend Rust.
- **Frontend mới (`frontend/`):** React + Vite + TypeScript — *đang trong quá trình migrate* (hiện đã port các thư viện lõi: lịch âm, VietQR).
- **QR:** `qrcode-generator` (sinh phía trình duyệt, không gọi mạng).

> Server Node/Express cũ (`src/`) đã được **migrate hoàn toàn sang Rust** và gỡ bỏ — xem [docs/MIGRATION.md](docs/MIGRATION.md).

## Chạy
```bash
# Backend Rust (phục vụ luôn frontend tĩnh trong public/)
cargo run --manifest-path backend/Cargo.toml   # mặc định http://localhost:3000
PORT=8080 cargo run --manifest-path backend/Cargo.toml
# hoặc: npm run dev   (alias của lệnh trên)
```

## Kiểm thử
```bash
# Backend (Rust): unit + integration
cargo test --manifest-path backend/Cargo.toml

# Đầu-cuối qua trình duyệt (Playwright) — chạy backend trước, rồi:
node test/e2e.js          # luồng tạo → mở thiệp → RSVP → quản lý, chụp ảnh mẫu vào shots/
node test/vietqr.test.js  # unit test bộ sinh VietQR (theo test vector thật)
node test/lunar.test.js   # unit test đổi dương -> âm lịch + tuổi Kim Lâu
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
- `/mau-thiep` — bộ sưu tập 12 mẫu (duyệt & chọn)
- `/thiep/:slug` — thiệp công khai
- `/quanly/:slug?token=...` — quản lý khách mời
- `/xem-ngay`, `/mam-qua`, `/checklist`, `/nghi-le`, `/ngan-sach`, `/quyen-rieng-tu`

## Cấu trúc
```
backend/          Backend Rust (axum + sqlx/SQLite) — API + OG + serve tĩnh
  src/routes/     invitations · rsvps · seating · photos · pages
  tests/api.rs    integration test
public/           Frontend tĩnh: index/invite/manage/mau-thiep + css/js + previews
frontend/         Frontend React/Vite (đang migrate; hiện có lib lịch âm + VietQR)
test/             e2e.js (Playwright) + unit test (lunar, vietqr)
docs/             tài liệu thiết kế + MIGRATION.md
```

## Contributors ✨

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome — code, docs, bug reports, ideas, reviews! See the [emoji key](https://allcontributors.org/docs/en/emoji-key) for how each contribution is recognized, and open a PR or issue to get involved.

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/trananhtung"><img src="https://avatars.githubusercontent.com/u/30992229?v=4?s=100" width="100px;" alt="Tung Tran"/><br /><sub><b>Tung Tran</b></sub></a><br /><a href="https://github.com/trananhtung/thiep-cuoi/commits?author=trananhtung" title="Code">💻</a> <a href="#maintenance-trananhtung" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

