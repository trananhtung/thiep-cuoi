'use strict';

/* Dữ liệu tráp ăn hỏi / mâm quả theo vùng miền & số lượng.
 * Miền Bắc: số tráp LẺ (3,5,7,9,11). Miền Nam: số mâm CHẴN (6,8,10).
 * Nguồn tham khảo: tierra.vn, sunglow.vn, kisswe.com (nghi thức 3 miền). Có thể tuỳ chỉnh theo gia đình. */
const MAMQUA = {
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

const regionBtns = document.querySelectorAll('.region-btn');
const countSel = document.getElementById('countSel');
const ruleEl = document.getElementById('rule');
const listEl = document.getElementById('checklist');
const progressEl = document.getElementById('progress');
let region = 'bac';

function populateCounts() {
  const counts = Object.keys(MAMQUA[region].counts);
  countSel.innerHTML = counts.map((c) => `<option value="${c}">${c} ${region === 'bac' ? 'tráp' : 'mâm'}</option>`).join('');
  ruleEl.textContent = MAMQUA[region].rule;
}

function renderList() {
  const count = countSel.value;
  const items = (MAMQUA[region].counts[count]) || [];
  listEl.innerHTML = items.map((it, i) => `
    <label class="mq-item">
      <input type="checkbox" class="mq-check" data-i="${i}" />
      <span class="mq-name">${it}</span>
    </label>`).join('');
  updateProgress();
  listEl.querySelectorAll('.mq-check').forEach((c) => c.addEventListener('change', () => {
    c.closest('.mq-item').classList.toggle('done', c.checked);
    updateProgress();
  }));
}

function updateProgress() {
  const all = listEl.querySelectorAll('.mq-check');
  const done = listEl.querySelectorAll('.mq-check:checked');
  progressEl.textContent = `Đã chuẩn bị ${done.length}/${all.length}`;
}

regionBtns.forEach((b) => b.addEventListener('click', () => {
  region = b.getAttribute('data-region');
  regionBtns.forEach((x) => x.classList.toggle('active', x === b));
  populateCounts();
  renderList();
}));
countSel.addEventListener('change', renderList);

populateCounts();
renderList();
