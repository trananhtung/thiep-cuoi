'use strict';

/* Checklist chuẩn bị cưới cho cặp đôi — mốc tính ngược từ ngày cưới.
 * Mỗi mục: nhãn + số ngày trước cưới (để tính hạn) + link công cụ liên quan (nếu có).
 * Trạng thái hoàn thành lưu localStorage theo ngày cưới. */
const PHASES = [
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

const form = document.getElementById('form');
const out = document.getElementById('out');
const progressEl = document.getElementById('progress');
let weddingDate = null;
let doneSet = new Set();

function storeKey() { return 'checklist:' + (document.getElementById('weddingDate').value || ''); }
function loadDone() {
  try { doneSet = new Set(JSON.parse(localStorage.getItem(storeKey()) || '[]')); }
  catch (e) { doneSet = new Set(); }
}
function saveDone() {
  try { localStorage.setItem(storeKey(), JSON.stringify([...doneSet])); } catch (e) {}
}

function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function render() {
  const val = document.getElementById('weddingDate').value;
  weddingDate = val ? new Date(val + 'T00:00:00') : null;
  loadDone();
  let total = 0, done = 0;
  const now = new Date(); now.setHours(0, 0, 0, 0);

  out.innerHTML = PHASES.map((ph) => {
    const items = ph.items.map((it) => {
      const id = ph.key + '|' + it.t;
      const checked = doneSet.has(id);
      total++; if (checked) done++;
      let dueHtml = '';
      if (weddingDate) {
        const due = new Date(weddingDate.getTime() - it.d * 86400000);
        const overdue = !checked && due < now;
        dueHtml = `<span class="cl-due${overdue ? ' overdue' : ''}">Hạn: ${fmtDate(due)}${overdue ? ' · trễ' : ''}</span>`;
      }
      const label = it.link
        ? `<a href="${it.link}" class="cl-link">${it.t} ↗</a>`
        : it.t;
      return `<label class="cl-item${checked ? ' done' : ''}">
        <input type="checkbox" class="cl-check" data-id="${id.replace(/"/g, '&quot;')}" ${checked ? 'checked' : ''} />
        <span class="cl-text">${label}</span>
        ${dueHtml}
      </label>`;
    }).join('');
    return `<div class="cl-phase"><h3 class="cl-phase-title">${ph.title}</h3>${items}</div>`;
  }).join('');

  progressEl.textContent = `Hoàn thành ${done}/${total} việc`;

  out.querySelectorAll('.cl-check').forEach((c) => c.addEventListener('change', () => {
    const id = c.getAttribute('data-id');
    if (c.checked) doneSet.add(id); else doneSet.delete(id);
    c.closest('.cl-item').classList.toggle('done', c.checked);
    saveDone();
    render();
  }));
}

(function setDefaultDate() {
  const el = document.getElementById('weddingDate');
  const d = new Date(); d.setDate(d.getDate() + 90);
  const p = (n) => String(n).padStart(2, '0');
  el.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

form.addEventListener('submit', (e) => { e.preventDefault(); render(); });
document.getElementById('weddingDate').addEventListener('change', render);
render();
