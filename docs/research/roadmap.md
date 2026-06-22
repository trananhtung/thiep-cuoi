# Roadmap tính năng — dựa trên nghiên cứu nhu cầu người dùng VN

Nguồn: báo cáo /deep-research ngày 2026-06-22 (104 agent, 22 nguồn, 23 claim đã xác minh đối nghịch).
Báo cáo đầy đủ tóm tắt trong file này; chi tiết trích dẫn ở mỗi mục.

## Kết luận cốt lõi
Cặp đôi Việt cần sản phẩm thiệp cưới online làm tốt 3 việc: (1) thay việc đi phát thiệp giấy
tốn cả tháng; (2) số hoá tục **tiền mừng / mừng cưới** qua QR ngân hàng; (3) thể hiện đúng
**phong tục cưới VN** (nhà trai/nhà gái, cha mẹ 2 bên, lễ vu quy/tân hôn, câu chuyện tình yêu,
đếm ngược, bản đồ). Tính năng phổ biến nhất ở MỌI nền tảng (meWedding, Vesey, Cinelove,
iWedding/Biihappy, Nắm Tay, The Simple) là **QR mừng cưới + RSVP/quản lý khách (đếm lượt xem,
xác nhận, xuất Excel)**.

**Pain point lớn nhất là VĂN HOÁ, không phải kỹ thuật:** gắn QR tiền mừng trực tiếp lên thiệp
bị nhiều người xem là "đòi nợ" / ép khách chuyển tiền, trái với sự tế nhị. ⇒ Giải pháp khuyến nghị:
**tách riêng tính năng tiền mừng** thành "hộp mừng cưới" **opt-in**, để cặp đôi tự chọn bật/tắt
và trình bày nhẹ nhàng (giống để QR ở bàn tiếp khách). Lưu ý: phản đối này YẾU hơn nhiều với
thiệp ĐIỆN TỬ (khách tự quét — opt-in) so với thiệp giấy in sẵn.

## Ưu tiên (cao → thấp)

- [x] **P1 — Hộp mừng cưới (gift box) opt-in, tế nhị, VietQR sinh offline** *(làm 2026-06-22)*
  - Lý do: tính năng #1 thị trường (universal, cả gói free) NHƯNG phải tách riêng + opt-in để
    tránh pain point "đòi nợ". Đây là cách dung hoà 2 finding mâu thuẫn (cần tính năng vs. tế nhị).
  - Nguồn: mewedding.vn, vesey.vn, cinelove.me, dantri (văn minh hay đòi nợ), tuoitre, vnexpress.
  - Thiết kế: cặp đôi nhập STK + ngân hàng (nhà trai/nhà gái), MẶC ĐỊNH TẮT; khi bật hiện
    "Hộp mừng cưới" cuối thiệp với lời dẫn nhẹ nhàng + QR VietQR + nút copy STK. QR sinh offline
    đúng chuẩn NAPAS EMVCo (quét được bằng app ngân hàng).

- [x] **P2 — Cha mẹ 2 bên + lễ Vu Quy / Tân Hôn** *(làm 2026-06-22)*
  - Lý do: cấu trúc 2 gia đình là yêu cầu đặc thù VN mà template Tây bỏ sót; hiển thị "Bố mẹ 2 bên".
  - Nguồn: mewedding.vn ('Bố mẹ 2 bên + Tư gia 2 nhà'), weddingbook.vn, namtay.vn (vu quy/tân hôn).
  - Đã làm: khối "Hai gia đình chúng tôi" (thân phụ/thân mẫu nhà trai & nhà gái) + chọn loại lễ
    (Lễ Tân Hôn nhà trai / Lễ Vu Quy nhà gái / Thành Hôn / Báo Hỷ) hiển thị trên thẻ địa điểm.

- [x] **P3 — Xuất danh sách khách (CSV/Excel) + đếm lượt xem thiệp** *(làm 2026-06-22)*
  - Lý do: dashboard quản lý khách với "bao nhiêu người đã xem / xác nhận" + "xuất Excel" là core.
  - Nguồn: vesey.vn ('Theo dõi... đã xem... xác nhận' + 'Xuất danh sách ra Excel'), mewedding.vn.
  - Đã làm: đếm lượt xem thiệp (cột views + endpoint /view, dedupe theo phiên) hiển thị ở dashboard;
    nút "Tải danh sách (CSV)" xuất file có BOM UTF-8 (Excel đọc đúng tiếng Việt).

- [x] **P4 — Album ảnh cưới + nhạc nền** *(làm 2026-06-22)*
  - Lý do: The Simple/iWedding/Vesey đều có media gallery + background music là tính năng cốt lõi.
  - Nguồn: thesimple.vn (6 tính năng), biihappy.com/iwedding, vesey.vn.
  - Đã làm: album ảnh (lưới + lightbox phóng to, tối đa 12 ảnh) + nút nhạc nền nổi (bật/tắt,
    xoay khi phát). Sửa kèm: parseGallery chỉ tách theo dòng để không vỡ URL có dấu phẩy.

- [x] **P5 — Hiển thị lịch âm song song lịch dương** *(làm 2026-06-22)*
  - Lý do: chọn ngày cưới theo âm lịch rất phổ biến; hiện cả 2 ngày là điểm chạm văn hoá.
  - Nguồn: galacenter.com.vn (chọn ngày âm/dương).
  - Đã làm: lunar.js (thuật toán Hồ Ngọc Đức) đổi dương→âm + Can Chi năm; hiện dòng âm lịch
    dưới ngày dương ở cover. Test vector (Tết & Đoan Ngọ 2023-2026) đã xác minh đối nghịch bằng workflow.

- [x] **P6 — Nhân bản thiệp nhà trai / nhà gái** *(làm 2026-06-22)*
  - Lý do: "Mua 1 được 3 thiệp" — mỗi bên có thiệp riêng thông tin riêng, khỏi tạo lại.
  - Nguồn: vesey.vn ('Nhân bản thiệp cho nhà trai & nhà gái').
  - Đã làm: 1 thiệp → 3 link (chung / `?ben=trai` / `?ben=gai`). Bản theo bên có badge,
    lời mời riêng ("Nhà trai/Nhà gái trân trọng kính mời") và ưu tiên địa điểm bên đó. Không cần đổi DB.

## Đã có sẵn (không làm lại)
3 mẫu thiệp, preview trực tiếp, link chia sẻ + QR, đếm ngược, bản đồ chỉ đường, RSVP,
trang quản lý + thống kê, sổ lưu bút, thêm vào lịch (.ics + Google Calendar),
hộp mừng cưới VietQR, cha mẹ 2 bên + vu quy/tân hôn, lượt xem + xuất CSV,
album ảnh + nhạc nền, lịch âm + Can Chi, nhân bản thiệp nhà trai/nhà gái.

---

# Đợt 2 — sau khi P1–P6 xong (deep-research 2026-06-22)

Nguồn: báo cáo /deep-research lần 2 (107 agent, 15 claim đã xác minh đối nghịch).
So sánh với meWedding, CineLove, Vesey, iWedding/Biihappy, ChungDoi, Hera, Joy, QuikRSVP.

- [x] **P7 — Thiệp cá nhân hoá theo từng khách (per-guest)** *(làm 2026-06-22)*
  - Lý do: mỗi khách nhận link riêng với tên điền sẵn ("Trân trọng kính mời Anh Minh"). Là tính năng
    VIP CÓ THU PHÍ ở nhiều nền tảng VN — differentiator thật mà app chưa có.
  - Nguồn: mewedding.vn/bang-gia (VIP 'Save the Date + ghi tên khách'), cinelove.me ('Tên khách mời tự động'),
    vesey.vn ('Gửi thiệp theo tên từng khách'), iWedding ({TênKháchMời}), hera.ai.vn ('mỗi khách có thiệp riêng').
  - Đã làm: link `?khach=<tên>` hiện lời chào "Thân mời <tên>" + điền sẵn ô RSVP; công cụ ở trang quản lý
    nhập danh sách tên → sinh link riêng từng khách + tải CSV (tên, link). Tab xem trước hỗ trợ qua postMessage.

- [x] **P8 — RSVP nâng cao (khẩu phần ăn chay + lọc dashboard)** *(làm 2026-06-22)*
  - Lý do: +1/headcount chính xác, trường ăn chay/dị ứng/ghi chú, lọc dashboard để đếm suất ăn.
  - Nguồn: quikrsvp.com ('+1 tracking', 'dietary/custom field', 'filter live'), thiep360.com (đi cùng mấy người).
  - Đã làm: RSVP thêm chọn khẩu phần (Bình thường / Ăn chay); dashboard thêm thống kê "Suất ăn chay",
    cột khẩu phần, bộ lọc Tất cả/Tham dự/Vắng/Ăn chay, và cột khẩu phần trong CSV. (Lời nhắc tự động
    bỏ qua vì chưa có kênh liên lạc email/SMS.)

- [x] **P9 — Đa ngôn ngữ Việt–Anh** *(làm 2026-06-22)*
  - Lý do: đám cưới có khách quốc tế/đa văn hoá; đối thủ bán đa ngôn ngữ như add-on có phí.
  - Nguồn: mewedding.vn/bang-gia (add-on ngôn ngữ), chungdoi.com/en (side-by-side, tới 13 ngôn ngữ).
  - Đã làm: nút chuyển VI ⇄ EN trên thiệp (nhớ lựa chọn qua localStorage); dịch toàn bộ UI
    (cover, đếm ngược, địa điểm, RSVP, hộp mừng, sổ lưu bút, lịch...) + định dạng thứ trong tuần theo ngôn ngữ.
    (Dùng toggle thay vì side-by-side cho gọn; side-by-side có thể là nâng cấp sau.)

- [x] **P10 — Lịch trình/timeline sự kiện + dress code** *(làm 2026-06-22)*
  - Lý do: khách biết trình tự (đón khách → lễ → tiệc) và quy định trang phục; differentiator của Joy.
  - Nguồn: claim [9] (Joy: timeline + schedule per-guest).
  - Đã làm: section "Lịch trình" (timeline dọc thời gian|sự kiện) + section "Trang phục" (text + swatch
    màu chủ đạo). Hỗ trợ đa ngôn ngữ. (Timeline per-guest có thể là nâng cấp sau.)

- [ ] **P11 — Album ảnh khách đóng góp chung (guest upload/xem/tải)**
  - Lý do: khách góp ảnh vào album chung, xem/tải, không cần tài khoản; tăng tương tác.
  - Nguồn: claim [9] (Joy shared photo album).

- [ ] **P12 — Sơ đồ bàn tiệc kéo-thả (seating chart)**
  - Lý do: gán khách vào bàn, sắp xếp xử lý quan hệ xã hội; phổ biến ở nền tảng RSVP hàng đầu.
  - Nguồn: quikrsvp.com ('drag-and-drop seating charts'), wedsites.com.

- [ ] **P13 — Thiệp video/animation (hiệu ứng mở thiệp cinematic)**
  - Lý do: xu hướng 2026; meWedding có video Chibi/animation trình chiếu tại tiệc.
  - Nguồn: mewedding.vn/kho-video-cuoi, các nguồn xu hướng 2026.

- [ ] **P14 — Hộp mừng ảo nâng cao (quà animation, theo dõi, rút tiền)** *(ưu tiên THẤP)*
  - Lý do: nâng cấp VietQR cơ bản; NHƯNG nhạy cảm pháp lý (ví điện tử/trung gian thanh toán) — cần làm rõ trước.
  - Nguồn: cinelove.me (xu + revenue-share). Caveat từ nghiên cứu: cần thẩm định pháp lý.

> Ghi chú: phong tục cưới VN chưa số hoá (xem ngày tốt, lễ dạm ngõ/ăn hỏi, mâm quả) là whitespace
> TIỀM NĂNG nhưng claim "đối thủ chưa làm" bị bác bỏ về bằng chứng — cần nghiên cứu thị trường riêng
> trước khi ưu tiên. App đã có lịch âm + Can Chi làm nền tảng cho hướng này.
