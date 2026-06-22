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

- [ ] **P6 — Nhân bản thiệp nhà trai / nhà gái**
  - Lý do: "Mua 1 được 3 thiệp" — mỗi bên có thiệp riêng thông tin riêng, khỏi tạo lại.
  - Nguồn: vesey.vn ('Nhân bản thiệp cho nhà trai & nhà gái').

## Đã có sẵn (không làm lại)
3 mẫu thiệp, preview trực tiếp, link chia sẻ + QR, đếm ngược, bản đồ chỉ đường, RSVP,
trang quản lý + thống kê, sổ lưu bút, thêm vào lịch (.ics + Google Calendar).
