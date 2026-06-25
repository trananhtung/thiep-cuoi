export interface BudgetRow {
  name: string;
  est: number | string;
  act: number | string;
  paid: boolean;
}

export const DEFAULTS: BudgetRow[] = [
  { name: 'Đặt tiệc nhà hàng', est: '', act: '', paid: false },
  { name: 'Chụp ảnh cưới (pre-wedding)', est: '', act: '', paid: false },
  { name: 'Quay phim / chụp phóng sự ngày cưới', est: '', act: '', paid: false },
  { name: 'Váy cưới & vest chú rể', est: '', act: '', paid: false },
  { name: 'Trang điểm cô dâu', est: '', act: '', paid: false },
  { name: 'Nhẫn cưới', est: '', act: '', paid: false },
  { name: 'Hoa cưới & trang trí', est: '', act: '', paid: false },
  { name: 'Thiệp cưới', est: '', act: '', paid: false },
  { name: 'Mâm quả / lễ vật ăn hỏi', est: '', act: '', paid: false },
  { name: 'Xe hoa / xe đưa đón', est: '', act: '', paid: false },
  { name: 'Nhạc công / MC / ca sĩ', est: '', act: '', paid: false },
  { name: 'Tuần trăng mật', est: '', act: '', paid: false },
];
