'use strict';

const content = document.getElementById('content');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getSlug() {
  const m = location.pathname.match(/\/quanly\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function fmt(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const slug = getSlug();
const token = new URLSearchParams(location.search).get('token');

if (!slug || !token) {
  content.innerHTML = `<p class="empty"><span class="em">🔒</span>Thiếu mã quản lý. Vui lòng mở đúng link quản lý đã lưu khi tạo thiệp.</p>`;
} else {
  fetch(`/api/invitations/${encodeURIComponent(slug)}/rsvps?token=${encodeURIComponent(token)}`)
    .then(async (r) => {
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Không tải được dữ liệu.');
      return json;
    })
    .then(render)
    .catch((e) => {
      content.innerHTML = `<p class="empty"><span class="em">🔒</span>${esc(e.message)}</p>`;
    });
}

let currentRsvps = [];

function render(d) {
  const s = d.stats;
  currentRsvps = d.rsvps || [];
  const statsHtml = `
    <div class="stats">
      <div class="stat"><div class="num">${s.views || 0}</div><div class="lbl">Lượt xem thiệp</div></div>
      <div class="stat"><div class="num">${s.total}</div><div class="lbl">Lượt phản hồi</div></div>
      <div class="stat"><div class="num">${s.attending}</div><div class="lbl">Sẽ tham dự</div></div>
      <div class="stat"><div class="num">${s.totalGuests}</div><div class="lbl">Tổng số khách</div></div>
      <div class="stat"><div class="num">${s.vegGuests || 0}</div><div class="lbl">Suất ăn chay 🌿</div></div>
      <div class="stat"><div class="num">${s.declined}</div><div class="lbl">Không tham dự</div></div>
    </div>`;

  if (!currentRsvps.length) {
    content.innerHTML = statsHtml + `<p class="empty"><span class="em">💌</span>Chưa có ai xác nhận. Hãy chia sẻ link thiệp cho khách mời nhé!</p>`;
    return;
  }

  content.innerHTML = statsHtml + `
    <div class="table-bar">
      <h3 class="table-title">Danh sách khách (<span id="rowCount">${currentRsvps.length}</span>)</h3>
      <div class="filters" id="filters">
        <button class="fbtn active" data-f="all" type="button">Tất cả</button>
        <button class="fbtn" data-f="yes" type="button">Tham dự</button>
        <button class="fbtn" data-f="no" type="button">Vắng</button>
        <button class="fbtn" data-f="chay" type="button">Ăn chay</button>
      </div>
      <button class="btn btn-primary" id="exportCsv" type="button">⬇ Tải danh sách (CSV)</button>
    </div>
    <table>
      <thead><tr><th>Họ tên</th><th>Trạng thái</th><th>Số người</th><th>Khẩu phần</th><th>Lời chúc</th><th>Lúc</th></tr></thead>
      <tbody id="rsvpBody"></tbody>
    </table>`;

  applyFilter('all');
  document.getElementById('filters').addEventListener('click', (e) => {
    const b = e.target.closest('.fbtn');
    if (!b) return;
    document.querySelectorAll('#filters .fbtn').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    applyFilter(b.getAttribute('data-f'));
  });
  document.getElementById('exportCsv').addEventListener('click', exportCsv);
}

function rowHtml(r) {
  return `
    <tr>
      <td><strong>${esc(r.name)}</strong></td>
      <td>${r.attending ? '<span class="badge yes">Tham dự</span>' : '<span class="badge no">Vắng</span>'}</td>
      <td>${r.attending ? esc(r.guests) : '—'}</td>
      <td>${r.attending ? (r.diet === 'chay' ? '🌿 Chay' : 'Bình thường') : '—'}</td>
      <td>${esc(r.message) || '<span style="color:#b9a89d">—</span>'}</td>
      <td style="white-space:nowrap;color:#8a7d75">${esc(fmt(r.created_at))}</td>
    </tr>`;
}

function applyFilter(f) {
  const list = currentRsvps.filter((r) => {
    if (f === 'yes') return !!r.attending;
    if (f === 'no') return !r.attending;
    if (f === 'chay') return r.attending && r.diet === 'chay';
    return true;
  });
  const body = document.getElementById('rsvpBody');
  const cnt = document.getElementById('rowCount');
  if (cnt) cnt.textContent = list.length;
  body.innerHTML = list.length
    ? list.map(rowHtml).join('')
    : '<tr><td colspan="6" style="text-align:center;color:#8a7d75;padding:24px">Không có khách nào khớp bộ lọc.</td></tr>';
}

/* ---- Xuất CSV (mở được bằng Excel, có BOM UTF-8) ---- */
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return '"' + s.replace(/"/g, '""') + '"';
}
function exportCsv() {
  const header = ['Họ tên', 'Tham dự', 'Số người', 'Khẩu phần', 'Lời chúc', 'Thời gian'];
  const lines = [header.map(csvCell).join(',')];
  currentRsvps.forEach((r) => {
    lines.push([
      csvCell(r.name),
      csvCell(r.attending ? 'Có' : 'Không'),
      csvCell(r.attending ? r.guests : 0),
      csvCell(r.attending ? (r.diet === 'chay' ? 'Ăn chay' : 'Bình thường') : ''),
      csvCell(r.message || ''),
      csvCell(fmt(r.created_at)),
    ].join(','));
  });
  const csv = '﻿' + lines.join('\r\n'); // BOM để Excel đọc đúng tiếng Việt
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'danh-sach-khach-moi.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---- Tạo thiệp mời riêng cho từng khách (per-guest) ---- */
(function setupGuestGen() {
  if (!slug) return;
  const namesEl = document.getElementById('ggNames');
  const resultEl = document.getElementById('ggResult');
  const csvBtn = document.getElementById('ggCsv');
  const toast = document.getElementById('ggToast');
  let rows = []; // {name, link}

  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Đã copy!')).catch(() => {});
    }
  }
  function guestLink(name) {
    return `${location.origin}/thiep/${encodeURIComponent(slug)}?khach=${encodeURIComponent(name)}`;
  }

  document.getElementById('ggCreate').addEventListener('click', () => {
    const names = namesEl.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 500);
    if (!names.length) { resultEl.innerHTML = '<p class="gg-hint">Hãy nhập ít nhất một tên khách.</p>'; csvBtn.hidden = true; return; }
    rows = names.map((name) => ({ name: name, link: guestLink(name) }));
    resultEl.innerHTML = `
      <table class="gg-table"><tbody>
      ${rows.map((r, i) => `
        <tr>
          <td><strong>${esc(r.name)}</strong></td>
          <td class="gg-link">${esc(r.link)}</td>
          <td><button class="gg-copybtn" data-i="${i}" type="button">Copy</button></td>
        </tr>`).join('')}
      </tbody></table>`;
    csvBtn.hidden = false;
    resultEl.querySelectorAll('.gg-copybtn').forEach((btn) => {
      btn.addEventListener('click', () => copy(rows[+btn.getAttribute('data-i')].link));
    });
  });

  csvBtn.addEventListener('click', () => {
    if (!rows.length) return;
    const cell = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = '﻿' + ['Tên khách,Link mời riêng']
      .concat(rows.map((r) => cell(r.name) + ',' + cell(r.link))).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'thiep-moi-rieng.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
