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

- [x] **P11 — Album ảnh khách đóng góp chung (guest upload/xem)** *(làm 2026-06-22)*
  - Lý do: khách góp ảnh vào album chung, xem/tải, không cần tài khoản; tăng tương tác.
  - Nguồn: claim [9] (Joy shared photo album).
  - Đã làm: section "Góc ảnh khách mời" — khách chọn ảnh, client tự thu nhỏ (canvas, ≤1280px) rồi
    upload; server lưu file ra data/uploads/<slug>/, bảng photos; lưới ảnh + lightbox; hỗ trợ đa ngôn ngữ.
  - Đã qua review đối nghịch (security/correctness/robustness) và sửa: kiểm magic-byte (chặn giả mạo MIME),
    header nosniff cho /uploads, hạn mức 200 ảnh + 60MB/thiệp (chống cạn đĩa), sắp xếp theo created_at,
    ghi file an toàn + dọn file mồ côi nếu lỗi DB. Hardening còn lại (rate-limit theo IP, upload-token
    riêng theo thiệp) ghi nhận cho sau — cần thêm dependency/hạ tầng, tính năng cố ý mở cho khách.

- [x] **P12 — Sơ đồ bàn tiệc kéo-thả (seating chart)** *(làm 2026-06-22)*
  - Lý do: gán khách vào bàn, sắp xếp xử lý quan hệ xã hội; phổ biến ở nền tảng RSVP hàng đầu.
  - Nguồn: quikrsvp.com ('drag-and-drop seating charts'), wedsites.com.
  - Đã làm: công cụ ở trang quản lý (token bảo vệ) — thêm khách / "Lấy từ RSVP" / thêm bàn, xếp chỗ
    bằng kéo-thả HOẶC click-chọn-gán (mobile-friendly), đổi tên/xoá bàn, lưu DB (cột seating JSON).

- [x] **P13 — Thiệp video/animation (hiệu ứng mở thiệp cinematic)** *(làm 2026-06-22)*
  - Lý do: xu hướng 2026; meWedding có video Chibi/animation trình chiếu tại tiệc.
  - Nguồn: mewedding.vn/kho-video-cuoi, các nguồn xu hướng 2026.
  - Đã làm: màn mở đầu kiểu "phong bì" (tên cô dâu chú rể + nút "Mở thiệp") → hé lộ nội dung với
    animation; cover các phần fade-in. Bật/tắt trong editor; tôn trọng prefers-reduced-motion; đa ngôn ngữ.

- [~] **P14 — Hộp mừng ảo nâng cao (quà animation, theo dõi, rút tiền)** *(HOÃN — rào cản pháp lý)*
  - Lý do: nâng cấp VietQR cơ bản; NHƯNG nhạy cảm pháp lý (ví điện tử/trung gian thanh toán) — cần làm rõ trước.
  - Nguồn: cinelove.me (xu + revenue-share). Caveat từ nghiên cứu: cần thẩm định pháp lý.
  - Quyết định 2026-06-22: KHÔNG triển khai phần GIỮ TIỀN (quy đổi xu/rút về ngân hàng) vì cần giấy phép
    trung gian thanh toán tại VN. Phần an toàn (chuyển khoản TRỰC TIẾP bank-to-bank qua VietQR, app không
    giữ tiền) đã có ở P1. Nếu sau này có pháp nhân/đối tác PSP hợp lệ mới mở phần ví. Tạm gác.

> Ghi chú: phong tục cưới VN chưa số hoá (xem ngày tốt, lễ dạm ngõ/ăn hỏi, mâm quả) là whitespace
> TIỀM NĂNG nhưng claim "đối thủ chưa làm" bị bác bỏ về bằng chứng — cần nghiên cứu thị trường riêng
> trước khi ưu tiên. App đã có lịch âm + Can Chi làm nền tảng cho hướng này.

---

# Đợt 3 — phong tục cưới VN chưa số hoá (deep-research 2026-06-22)

Nguồn: báo cáo /deep-research đợt 3 (108 agent, 24 claim đã xác minh đối nghịch).

- [x] **P15 — Xem ngày cưới đẹp / tuổi Kim Lâu** *(làm 2026-06-22)*
  - Đã làm: trang `/xem-ngay` — nhập năm sinh cô dâu/chú rể + năm cưới → tính tuổi mụ, dư chia 9,
    phạm Kim Lâu (loại Thân/Thê/Tử/Súc) + Can Chi năm sinh + kết luận + disclaimer. Hàm `Lunar.kimLau`
    có unit test. Link "🔮 Xem ngày cưới" ở header trang chủ.
  - Lý do: khoảng trống phong tục VN lớn nhất mà nền tảng thiệp cưới dẫn đầu CHƯA làm in-app
    (iWedding/Vesey/meWedding không có); app đã có lịch âm + Can Chi làm nền. Kim Lâu = tuổi mụ chia 9,
    dư 1/3/6/8 là phạm (1=Thân, 3=Thê, 6=Tử, 8=Súc).
  - Nguồn: biihappy.com/iwedding (không có), tuvi.vn/xem-ngay-ket-hon, lichngaytot.com, thuvienphapluat.vn.
  - LƯU Ý: mảng tử vi bão hoà — khác biệt nằm ở TÍCH HỢP trong luồng tạo thiệp; kèm disclaimer "chỉ tham khảo".

- [x] **P16 — Planner/checklist mâm quả – tráp ăn hỏi theo số tráp & vùng miền** *(làm 2026-06-22)*
  - Đã làm: trang `/mam-qua` — chọn Miền Bắc (lẻ 3/5/7/9/11) / Miền Nam (chẵn 6/8/10) → checklist lễ vật
    gợi ý, tích ô + đếm tiến độ. Link "🎁 Mâm quả" ở header. Có ghi chú "mang tính gợi ý".
  - Lý do: dữ liệu có cấu trúc, template hoá được, chưa nền tảng nào số hoá in-app. Bắc số LẺ (3,5,7,9,11),
    Nam số CHẴN (6,8,10); tráp 5 = trầu cau, rượu thuốc, bánh phu thê, bánh cốm, hoa quả...
  - Nguồn: tierra.vn (tr áp ăn hỏi gồm gì), sunglow.vn, kisswe.com (nghi thức 3 miền).

- [x] **P17 — Trang Q&A / FAQ cho khách** *(làm 2026-06-22)*
  - Đã làm: editor nhập "câu hỏi | trả lời" mỗi dòng; thiệp hiện section "Hỏi & Đáp" dạng accordion
    (bấm câu hỏi mở/đóng đáp án). Hỗ trợ đa ngôn ngữ VI/EN.
  - Lý do: soạn hỏi-đáp tổng hợp (trang phục, đi lại, gửi xe...) giảm tin nhắn lặp; chuẩn của Joy, app VN chưa có.
  - Nguồn: withjoy.com/faq, help.withjoy.com.

- [x] **P18 — Trang lưu trú/khách sạn cho khách ở xa** *(làm 2026-06-22)*
  - Đã làm: editor nhập "tên | ghi chú | link đặt phòng" mỗi dòng; thiệp hiện section "Nơi lưu trú"
    (thẻ khách sạn/homestay + nút Đặt phòng nếu có link). Đa ngôn ngữ VI/EN, style 3 mẫu.
  - Lý do: danh sách khách sạn/homestay gần venue + ghi chú + link đặt phòng; giá trị khi cưới ở quê. Joy có.
  - Nguồn: withjoy.com/help (accommodations-page), withjoy.com/hotel-room-blocks.

> Caveat: (a) claim "đối thủ chưa số hoá nghi lễ trước cưới" BỊ BÁC (1-2) — cần research thêm trước khi ưu tiên
> mục lịch nghi lễ. (b) Lì xì/registry: không có claim sống sót + có thể trùng VietQR/không hợp văn hoá phong bì
> tiền mặt VN — thẩm định riêng. (c) Lưu ý pháp lý: Nghị định 356/2025/NĐ-CP (hiệu lực 1/1/2026) về bảo vệ
> dữ liệu cá nhân — không dùng checkbox đồng ý mặc định, lưu bằng chứng đồng ý; áp dụng cho mọi bên thu thập
> dữ liệu (RSVP/sổ lưu bút/album khách). Cần rà soát consent sau.

---

# Đợt 4 — công cụ lập kế hoạch & lan toả (deep-research 2026-06-22)

Nguồn: báo cáo /deep-research đợt 4 (107 agent, 23 claim đã xác minh đối nghịch).

- [x] **P19 — Checklist/timeline chuẩn bị cưới cho CẶP ĐÔI** *(làm 2026-06-22)*
  - Lý do: công cụ hạng nhất ở mọi đối thủ lớn (The Knot/Zola/Joy) — to-do tự sắp theo ngày cưới, theo tháng.
    KHÁC với "lịch trình + dress code" (đó cho KHÁCH xem ngày cưới; đây là to-do CHUẨN BỊ cho CẶP ĐÔI).
  - Nguồn: theknot.com/wedding-checklist, withjoy.com (so sánh). Việt hoá thêm mốc: xem ngày, đặt mâm quả, ăn hỏi.
  - Đã làm: trang `/checklist` — nhập ngày cưới → 26 việc theo 6 giai đoạn (tính hạn ngược, cảnh báo "trễ"),
    tích xong + đếm tiến độ, lưu localStorage; mốc Việt hoá link tới /xem-ngay, /mam-qua, tạo thiệp. Link header.

- [x] **P20 — Số hoá nghi lễ trước cưới VN (dạm ngõ/ăn hỏi/nạp tài/đón dâu)** *(làm 2026-06-22)*
  - Đã làm: trang `/nghi-le` — tab 4 nghi lễ (Dạm ngõ, Ăn hỏi, Nạp tài, Xin dâu & Đón dâu), mỗi lễ có
    giới thiệu + trình tự đánh số + phân vai "ai làm gì". Ghi chú thay đổi theo vùng miền. Link "📜 Nghi lễ" header.
  - Lý do: khoảng trống đối thủ Tây không có; trình tự + nghi thức + phân vai (đội bê tráp, người đại diện,
    lại quả) đã tài liệu hoá rõ. Nội dung tĩnh có cấu trúc + checklist "ai làm gì".
  - Nguồn: mimosawedding.vn/trinh-tu-dam-hoi, weddingwonders.vn, vuanem.com. Caveat: số bước không canon → trình bày theo giai đoạn.

- [x] **P21 — Trang Story / Hành trình tình yêu dạng timeline (mốc kỷ niệm)** *(làm 2026-06-22)*
  - Đã làm: editor nhập "thời gian | tiêu đề | mô tả | link ảnh" mỗi dòng; thiệp hiện section "Hành trình
    tình yêu" dạng timeline dọc (chấm + đường nối, ảnh tuỳ chọn). Khác album: timeline có ngày + kể chuyện. Đa ngôn ngữ.
  - Lý do: tính năng kỳ vọng chuẩn (gặp nhau → hẹn hò → cầu hôn); dễ làm (timeline ảnh + text).
  - Nguồn: weddingwire.com (Our Story), theknot.com (photo timeline template). Khác album: Story = dòng thời gian có ngày + chú thích.

- [x] **P22 — Tối ưu chia sẻ MXH (Open Graph preview đẹp khi gửi Zalo/FB/Messenger)** *(làm 2026-06-22)*
  - Đã làm: route /thiep/:slug chèn meta OG/Twitter SERVER-SIDE (og:title tên cô dâu chú rể, og:description
    lời mời, og:image ảnh cưới/ảnh album, og:url, twitter card). Crawler không chạy JS vẫn thấy preview đẹp.
  - Lý do: pain point link thiệp share ra trông xấu/không ảnh. Thêm thẻ og:title/og:image/og:description per thiệp.
  - Nguồn: ogp.me, vercel/og. Khả thi: đặt meta OG động trên /thiep/:slug (ảnh cưới hoặc ảnh sinh sẵn).

- [x] **P23 — PDPL/Nghị định 356/2025: consent thu thập dữ liệu khách** *(làm 2026-06-22)*
  - Đã làm: ô đồng ý KHÔNG tick sẵn + BẮT BUỘC trên RSVP & upload ảnh (server enforce + lưu cờ consent +
    mốc thời gian làm bằng chứng); trang `/quyen-rieng-tu`; quyền XOÁ dữ liệu khách ở trang quản lý
    (DELETE token-protected, parameterized). Hỗ trợ rút lại đồng ý.
  - Lý do: hiệu lực 1/1/2026; checkbox đồng ý KHÔNG tick sẵn + lưu bằng chứng đồng ý cho RSVP/sổ lưu bút/album khách.
  - Nguồn: Nghị định 356/2025/NĐ-CP (EY, Tilleke, Acclime).

---

# Đợt 5 — mở rộng & xu hướng (deep-research 2026-06-22)

Nguồn: báo cáo /deep-research đợt 5 (105 agent, claim đã xác minh đối nghịch).

- [x] **P24 — Thêm mẫu thiệp / chủ đề thiết kế** *(làm 2026-06-22)*
  - Lý do: app chỉ có 3 mẫu, đối thủ VN có 40–100+ (Vesey 100+, iWedding hàng trăm, meWedding cập nhật hàng tuần).
    Đa dạng mẫu là đòn bẩy bán hàng được xác nhận toàn ngành.
  - Nguồn: vesey.vn/mau-thiep, biihappy.com/iwedding/templates, mewedding.vn.
  - Đã làm: thêm 3 mẫu → tổng 6 mẫu (Hoàng gia navy+vàng, Xanh lá greenery, Đỏ rượu burgundy);
    đầy đủ style mọi thành phần, picker + backend cập nhật.

- [x] **P25 — Hỗ trợ nhiều sự kiện/nhiều ngày (ăn hỏi + tiệc cưới + tiệc nhà gái)** *(làm 2026-06-22)*
  - Đã làm: editor nhập "tên | thời gian | địa điểm | link maps" mỗi dòng (tối đa 10); thiệp hiện section
    "Các sự kiện" — mỗi sự kiện 1 thẻ có tên/giờ/địa điểm + nút chỉ đường (tự tra địa chỉ nếu thiếu link). Đa ngôn ngữ.
  - Lý do: meWedding cho thêm/bớt sự kiện không giới hạn, mỗi sự kiện có giờ/địa điểm/đếm ngược/bản đồ riêng.
  - Nguồn: mewedding.vn/bang-gia ('thêm bớt các sự kiện không giới hạn'). Thuần client-side.

- [ ] **P26 — AI hỗ trợ soạn nội dung (lời mời/lời cảm ơn/chuyện tình yêu)**
  - Lý do: xu hướng tăng nhanh (Zola 2026: 54% cởi mở với AI; viết lời cảm ơn là use case top 3).
  - Nguồn: theknot (AI planner), zola first-look 2026, wedding.one. LƯU Ý: cần LLM API bên thứ ba +
    cross-border transfer → cần consent PDPL; cân nhắc chi phí/hạ tầng. (Ưu tiên sau.)
  - HOÃN bản AI thật (2026-06-22): cần API key LLM bên thứ ba (chi phí + làm test phụ thuộc mạng) +
    nghĩa vụ chuyển dữ liệu xuyên biên giới. Khi có credentials/ngân sách + consent xuyên biên giới sẽ làm.
  - [x] ĐÃ LÀM bản KHẢ THI KHÔNG CẦN API (2026-06-22): thư viện "Gợi ý mẫu" trong editor — nút ✨ dưới ô
    Lời mời & Chuyện tình, mở danh sách câu mẫu tiếng Việt, bấm để điền + cập nhật preview. Không mạng/không PDPL.

- [x] **P27 — Tra cứu bàn tiệc cho khách (bản khả thi của QR check-in)** *(làm 2026-06-22)*
  - Đã làm: khách nhập tên trên thiệp → API tra trong sơ đồ bàn (chỉ trả tên bàn của đúng người hỏi)
    → hiện "Bạn ngồi tại <Bàn>". Section chỉ hiện khi thiệp đã có sơ đồ; tên điền sẵn từ link per-guest
    (?khach=). Kết hợp với link per-guest sẵn có = "QR → tra bàn". (Điểm danh real-time đa thiết bị cần
    sync/backend → để sau.)
  - Lý do: khả thi & đã có ở đối thủ (QuikRSVP/RSVPify). Bản gọn: QR per-guest → trang tra cứu bàn + điểm danh.
  - Nguồn: quikrsvp.com, rsvpify.com. Caveat: dashboard real-time đa thiết bị cần sync/backend → làm bản gọn trước.

> Caveat: thống kê hành vi cho cặp đôi là rủi ro PDPL cao nhất (dữ liệu nhạy cảm + tracker bên thứ ba =
> chuyển dữ liệu xuyên biên giới) → hoãn. Không thêm tính năng giữ tiền (ví điện tử) vì rào cản pháp lý.

---

# Đợt 6 — PWA, sau cưới, in ấn, a11y (deep-research 2026-06-22)

Nguồn: báo cáo /deep-research đợt 6 (106 agent, claim đã xác minh đối nghịch).

- [x] **P28 — PWA cài đặt được + XEM OFFLINE thiệp** *(làm 2026-06-22)* — manifest + service worker (cache tĩnh + thiệp/API GET fallback) → mở thiệp khi offline; e2e xác minh offline thật.
  - Lý do: differentiator hiếm (chỉ ~3.3-3.5% site có cả manifest + service worker; WithJoy không marketing offline);
    giải quyết trực tiếp pain wifi yếu tại nhà hàng tiệc cưới VN — khách mở thiệp 1 lần rồi xem offline.
  - Nguồn: withjoy.com/app (không có offline), httparchive PWA 2025, web.dev/pwa-checklist, MDN.
  - Kỹ thuật: manifest + HTTPS để cài; service worker caching (Cache Storage) cho xem offline — thuần client-side.

- [x] **P29 — Trang/chế độ SAU CƯỚI (lời cảm ơn + album phóng sự)** *(làm 2026-06-22)* — công tắc "Chế độ cảm ơn" + ô lời cảm ơn; bật → banner "Lời cảm ơn" ở đầu thiệp (kết hợp album khách sẵn có = trang sau cưới). Đa ngôn ngữ.
  - Lý do: WithJoy/Zola coi là danh mục riêng; thu ảnh khách sau tiệc. (App đã có album khách → đây là mở rộng "cảm ơn".)
  - Nguồn: withjoy.com/app (shared album sau sự kiện).

- [x] **P30 — Chế độ 'Save the Date' (thiệp báo trước)** *(làm 2026-06-22)* — công tắc bật → cover nhấn "Save the Date" + ghi chú "thiệp mời chính thức gửi sau", ẩn RSVP/hộp mừng/sổ lưu bút/tra bàn. Đa ngôn ngữ.
  - Lý do: pattern chuẩn mọi nền tảng lớn (WithJoy/Zola/Greenvelope/The Knot tách riêng); gửi 6-8 tháng trước.
  - Nguồn: withjoy.com, zola.com/paper, greenvelope, theknot.

- [x] **P31 — Xuất/In thiệp & danh sách (PDF) cho người lớn tuổi thích bản giấy** *(làm 2026-06-22)* — nút "In" trên thiệp + "In danh sách" ở quản lý; @media print ẩn nút điều khiển, nền trắng tiết kiệm mực, break-inside; in → "Save as PDF" của trình duyệt. Không cần lib/API.
  - Lý do: window.print() + @media print thuần client-side; in thiệp/danh sách khách.
  - Nguồn: MDN @media print, jsPDF. CAVEAT: jsPDF cần bundle font UTF-8 cho tiếng Việt; ưu tiên window.print/@media print.

- [x] **P32 — Truy cập (a11y) & hiệu năng** *(làm 2026-06-22)* — đồng bộ `<html lang>` theo VI/EN (screen reader đọc đúng tiếng có thanh điệu); aria-label cho nút biểu tượng (ngôn ngữ/nhạc/in); landmark `role=main`; viền focus-visible cho điều hướng bàn phím; tôn trọng prefers-reduced-motion (đã có). Fonts dùng display=swap; ảnh lazy-load (đã có).
  - Lý do: nền tảng chi phí thấp; contrast >=4.5:1, lang attribute (đã có lang="vi"), LCP<=2.5s/INP<=200ms/CLS<=0.1.
  - Nguồn: webaim WCAG checklist, web.dev/vitals. (Lưu ý: lang attribute lợi SEO là phóng đại nhẹ.)

---

# Đợt 7 — engagement & VN-specific (deep-research 2026-06-22)

Nguồn: /deep-research đợt 7 (105 agent, 18 claim verify; phần synthesize bị skip do giới hạn phiên).

- [ ] **P33 — Giờ hoàng đạo / hướng xuất hành / ngày tốt cưới (mở rộng Kim Lâu)** *(VN-specific, ưu tiên cao)*
  - Lý do: báo lớn đăng hằng ngày "giờ hoàng đạo + hướng xuất hành"; cặp đôi chọn ngày Bất tương/Hoàng đạo, tránh hắc đạo.
  - Nguồn: baolamdong.vn (lịch âm dương hằng ngày), crystalpalacevn.com (chọn ngày cưới).
  - LƯU Ý: bảng giờ hoàng đạo theo Chi của NGÀY cần XÁC MINH đối nghịch trước khi code (giống VietQR/lịch âm). Hoãn tới khi verify được.

- [x] **P34 — Nhúng livestream (YouTube/Facebook Live) cho khách ở xa** *(làm 2026-06-22)*
  - Đã làm: ô nhập link; YouTube → nhúng iframe youtube-nocookie (riêng tư); link khác → nút "Xem trực tiếp ↗". Ẩn ở Save the Date; đa ngôn ngữ.
  - Lý do: đối thủ (WedSites) làm bằng paste URL/iframe — không cần hạ tầng streaming.
  - Nguồn: help.wedsites.com (embed Zoom/YouTube/FB Live), infotrust (youtube-nocookie privacy mode).

- [x] **P35 — Chia sẻ nhanh (Zalo/Facebook + Web Share)** *(làm 2026-06-22)*
  - Đã làm: modal kết quả có nút "📤 Chia sẻ" (Web Share API → Zalo/Messenger/… trên di động, fallback copy)
    + nút Facebook (sharer.php). OG đã có nên link hiện đẹp khi dán vào Zalo.
  - Lý do: iWedding có "Gửi thiệp qua Zalo, Facebook & QR"; Zalo là kênh số 1 ở VN.
  - Nguồn: biihappy.com/iwedding, developers.zalo.me/docs/social/share (chỉ cần OG + link, đã có OG).

- [x] **P36 — Công cụ ngân sách cưới cho cặp đôi** *(làm 2026-06-22)*
  - Đã làm: trang /ngan-sach — nhập tổng ngân sách + bảng hạng mục (gợi ý theo đám cưới VN): dự kiến/thực chi/đã trả;
    tổng dự kiến, đã chi, còn lại, % tiến độ (cảnh báo vượt); thêm/xoá/sửa; tự lưu localStorage. Link ở nav trang chủ.
  - Lý do: iWedding có 'Trợ lý lập kế hoạch & quản lý ngân sách cưới'. Khả thi client-side (localStorage).
  - Nguồn: biihappy.com/iwedding.

> Hoãn: P37 Live wall (lời chúc/ảnh real-time tại tiệc) cần realtime/backend (Supabase...) — vượt ràng buộc
> "không backend nặng"; cần thẩm định hạ tầng/chi phí trước.
