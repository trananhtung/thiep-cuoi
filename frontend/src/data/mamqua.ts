export interface RegionData {
  name: string;
  rule: string;
  counts: Record<string, string[]>;
}

export const MAMQUA: { bac: RegionData; nam: RegionData } = {
  bac: {
    name: 'Miền Bắc',
    rule: 'Số tráp LẺ (mang ý nghĩa sinh sôi, phát triển)',
    counts: {
      3: ['Trầu cau', 'Rượu &amp; thuốc lá', 'Mâm hoa quả (ngũ quả)'],
      5: ['Trầu cau', 'Rượu &amp; thuốc lá', 'Bánh phu thê', 'Bánh cốm', 'Mâm hoa quả (ngũ quả)'],
      7: ['Trầu cau', 'Rượu &amp; thuốc lá', 'Bánh phu thê', 'Bánh cốm', 'Mâm hoa quả (ngũ quả)', 'Chè (trà)', 'Mứt sen'],
      9: ['Trầu cau', 'Rượu &amp; thuốc lá', 'Bánh phu thê', 'Bánh cốm', 'Mâm hoa quả (ngũ quả)', 'Chè (trà)', 'Mứt sen', 'Lợn sữa quay', 'Xôi gấc'],
      11: ['Trầu cau', 'Rượu &amp; thuốc lá', 'Bánh phu thê', 'Bánh cốm', 'Mâm hoa quả (ngũ quả)', 'Chè (trà)', 'Mứt sen', 'Lợn sữa quay', 'Xôi gấc', 'Bánh đậu xanh', 'Tháp bia / nước ngọt'],
    },
  },
  nam: {
    name: 'Miền Nam',
    rule: 'Số mâm CHẴN (mang ý nghĩa có đôi có cặp)',
    counts: {
      6: ['Trầu cau', 'Trà - rượu - nến (đèn long phụng)', 'Bánh phu thê / bánh kem', 'Xôi gấc &amp; gà', 'Mâm trái cây (ngũ quả)', 'Heo quay'],
      8: ['Trầu cau', 'Trà - rượu - nến (đèn long phụng)', 'Bánh phu thê / bánh kem', 'Xôi gấc &amp; gà', 'Mâm trái cây (ngũ quả)', 'Heo quay', 'Bánh hỏi', 'Mứt - hạt sen'],
      10: ['Trầu cau', 'Trà - rượu - nến (đèn long phụng)', 'Bánh phu thê / bánh kem', 'Xôi gấc &amp; gà', 'Mâm trái cây (ngũ quả)', 'Heo quay', 'Bánh hỏi', 'Mứt - hạt sen', 'Áo dài / vải may áo', 'Trang sức (nữ trang)'],
    },
  },
};
