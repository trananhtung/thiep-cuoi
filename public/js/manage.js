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
      <div class="stat"><div class="num">${s.declined}</div><div class="lbl">Không tham dự</div></div>
    </div>`;

  if (!currentRsvps.length) {
    content.innerHTML = statsHtml + `<p class="empty"><span class="em">💌</span>Chưa có ai xác nhận. Hãy chia sẻ link thiệp cho khách mời nhé!</p>`;
    return;
  }

  const rows = currentRsvps.map((r) => `
    <tr>
      <td><strong>${esc(r.name)}</strong></td>
      <td>${r.attending ? '<span class="badge yes">Tham dự</span>' : '<span class="badge no">Vắng</span>'}</td>
      <td>${r.attending ? esc(r.guests) : '—'}</td>
      <td>${esc(r.message) || '<span style="color:#b9a89d">—</span>'}</td>
      <td style="white-space:nowrap;color:#8a7d75">${esc(fmt(r.created_at))}</td>
    </tr>`).join('');

  content.innerHTML = statsHtml + `
    <div class="table-bar">
      <h3 class="table-title">Danh sách khách (${currentRsvps.length})</h3>
      <button class="btn btn-primary" id="exportCsv" type="button">⬇ Tải danh sách (CSV)</button>
    </div>
    <table>
      <thead><tr><th>Họ tên</th><th>Trạng thái</th><th>Số người</th><th>Lời chúc</th><th>Lúc</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  document.getElementById('exportCsv').addEventListener('click', exportCsv);
}

/* ---- Xuất CSV (mở được bằng Excel, có BOM UTF-8) ---- */
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return '"' + s.replace(/"/g, '""') + '"';
}
function exportCsv() {
  const header = ['Họ tên', 'Tham dự', 'Số người', 'Lời chúc', 'Thời gian'];
  const lines = [header.map(csvCell).join(',')];
  currentRsvps.forEach((r) => {
    lines.push([
      csvCell(r.name),
      csvCell(r.attending ? 'Có' : 'Không'),
      csvCell(r.attending ? r.guests : 0),
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
