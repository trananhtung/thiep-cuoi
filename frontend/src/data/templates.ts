export interface Template {
  id: string;
  name: string;
  cat: 'truyen-thong' | 'sang-trong' | 'lang-man' | 'toi-gian';
  tag: string;
}

export const TEMPLATES: Template[] = [
  { id: 'long-phung',   name: 'Long Phụng',    cat: 'truyen-thong', tag: 'Đại lễ · rồng phượng' },
  { id: 'truyen-thong', name: 'Truyền Thống',  cat: 'truyen-thong', tag: 'Đỏ vàng cổ truyền' },
  { id: 'hoang-gia',    name: 'Hoàng Gia',     cat: 'sang-trong',   tag: 'Navy ánh kim' },
  { id: 'luc-bao',      name: 'Lục Bảo',       cat: 'sang-trong',   tag: 'Emerald châu báu' },
  { id: 'lam-ngoc',     name: 'Lam Ngọc',      cat: 'sang-trong',   tag: 'Lam ngọc mát lành' },
  { id: 'anh-dao',      name: 'Anh Đào',       cat: 'lang-man',     tag: 'Cánh anh đào bay' },
  { id: 'hong-kim',     name: 'Hồng Kim',      cat: 'lang-man',     tag: 'Blush rose gold' },
  { id: 'do-ruou',      name: 'Đỏ Rượu',       cat: 'lang-man',     tag: 'Burgundy ấm áp' },
  { id: 'pastel',       name: 'Pastel Hoa Lá', cat: 'lang-man',     tag: 'Hồng xanh dịu nhẹ' },
  { id: 'mai-trang',    name: 'Mai Trắng',     cat: 'toi-gian',     tag: 'Ngà kem hoa mai' },
  { id: 'hien-dai',     name: 'Hiện Đại',      cat: 'toi-gian',     tag: 'Tối giản thanh lịch' },
  { id: 'xanh-la',      name: 'Xanh Lá',       cat: 'toi-gian',     tag: 'Greenery thiên nhiên' },
];

export const CAT_LABEL: Record<string, string> = {
  'truyen-thong': 'Truyền thống',
  'sang-trong':   'Sang trọng',
  'lang-man':     'Lãng mạn',
  'toi-gian':     'Tối giản',
};

// Filter buttons derived from CAT_LABEL ("all" prepended) so adding a category
// can't silently break the filter. Order follows CAT_LABEL's key declaration order.
export const CATS: [string, string][] = [['all', 'Tất cả'], ...Object.entries(CAT_LABEL)];
