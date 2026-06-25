export interface ChecklistTask { t: string; d: number; link?: string }
export interface Phase { title: string; key: string; items: ChecklistTask[] }

export const PHASES: Phase[] = [
  { key: '6-12m', title: 'Trước 6–12 tháng', items: [
    { t: 'Chốt ngân sách cưới', d: 300 },
    { t: 'Xem ngày tốt / tránh tuổi Kim Lâu', d: 300, link: '/xem-ngay' },
    { t: 'Đặt địa điểm / nhà hàng tiệc cưới', d: 270 },
    { t: 'Lên danh sách khách mời sơ bộ', d: 240 },
    { t: 'Đặt thợ ảnh / quay phim', d: 230 },
  ] },
  { key: '3-6m', title: 'Trước 3–6 tháng', items: [
    { t: 'Chụp ảnh cưới (pre-wedding)', d: 150 },
    { t: 'Chọn & may áo dài / vest / soiree', d: 140 },
    { t: 'Chuẩn bị mâm quả / tráp ăn hỏi', d: 120, link: '/mam-qua' },
    { t: 'Mua nhẫn cưới', d: 110 },
    { t: 'Chốt danh sách khách & chia nhóm', d: 100 },
  ] },
  { key: '1-3m', title: 'Trước 1–3 tháng', items: [
    { t: 'Thiết kế & gửi thiệp mời online', d: 75, link: '/' },
    { t: 'Tổ chức lễ ăn hỏi / đám hỏi', d: 60 },
    { t: 'Đặt xe hoa', d: 50 },
    { t: 'Chốt thực đơn tiệc', d: 45 },
    { t: 'Đặt trang điểm cô dâu', d: 40 },
  ] },
  { key: '2-4w', title: 'Trước 2–4 tuần', items: [
    { t: 'Thử đồ cưới lần cuối', d: 21 },
    { t: 'Theo dõi & nhắc khách xác nhận (RSVP)', d: 18 },
    { t: 'Sắp xếp sơ đồ bàn tiệc', d: 14 },
    { t: 'Chuẩn bị phong bì / quà cảm ơn', d: 12 },
  ] },
  { key: '1w', title: 'Tuần cuối', items: [
    { t: 'Xác nhận lại với tất cả nhà cung cấp', d: 7 },
    { t: 'Chuẩn bị kịch bản / MC chương trình', d: 6 },
    { t: 'Nghỉ ngơi, dưỡng da, ngủ đủ', d: 4 },
    { t: 'Chuẩn bị tư trang ngày cưới', d: 2 },
  ] },
  { key: 'after', title: 'Sau cưới', items: [
    { t: 'Gửi lời cảm ơn tới khách mời', d: -7 },
    { t: 'Trả đồ thuê (váy, vest, xe...)', d: -3 },
    { t: 'Đăng ký kết hôn (nếu chưa)', d: -14 },
  ] },
];
