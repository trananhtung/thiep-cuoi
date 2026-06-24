'use strict';

/* Bản thiệp in giấy: lấy dữ liệu thiệp -> render thẻ in khổ 5×7/A5/A6,
   QR dẫn về thiệp online, nút In/Lưu PDF. Màu in-safe, tô theo mẫu. */

var card = document.getElementById('card');
var note = document.querySelector('.stage .note');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getSlug() {
  var q = new URLSearchParams(location.search).get('slug');
  if (q) return q.trim();
  var m = location.pathname.match(/\/thiep\/([^/?#]+)\/in/);
  return m ? decodeURIComponent(m[1]) : null;
}

/* màu ép kim/điểm nhấn theo mẫu (in-safe) */
var ACCENT = {
  'truyen-thong': '#b0392f', 'long-phung': '#a82c2c', 'hoang-gia': '#b08a3c',
  'do-ruou': '#9c4452', 'anh-dao': '#c2557a', 'pastel': '#bd6f8e',
  'xanh-la': '#5f8c54', 'lam-ngoc': '#2f7286', 'mai-trang': '#b08a3c', 'hien-dai': '#9a7c3f',
};

var WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
function fmtDate(s) {
  var d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return WD[d.getDay()] + ', ngày ' + d.getDate() + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear();
}
function lunarLine(s) {
  var d = new Date(s);
  if (isNaN(d.getTime()) || typeof Lunar === 'undefined') return '';
  try { return Lunar.lunarLabel(d) + ' (Âm lịch)'; } catch (e) { return ''; }
}
function initials(groom, bride) {
  var a = (String(groom).trim().split(/\s+/).pop() || '')[0] || '';
  var b = (String(bride).trim().split(/\s+/).pop() || '')[0] || '';
  return (a + '·' + b).toUpperCase();
}

function venueHtml(label, v) {
  v = v || {};
  if (!v.name && !v.address && !v.time) return '';
  return '<div class="pc-venue"><h4>' + esc(label) + '</h4>'
    + (v.ceremony ? '<div class="v-line">' + esc(v.ceremony) + '</div>' : '')
    + (v.name ? '<div class="v-name">' + esc(v.name) + '</div>' : '')
    + (v.time ? '<div class="v-line">' + esc(v.time) + '</div>' : '')
    + (v.address ? '<div class="v-line">' + esc(v.address) + '</div>' : '')
    + '</div>';
}

function render(inv) {
  var d = inv.data || {};
  var accent = ACCENT[inv.template] || '#b08a3c';
  var groom = d.groom || 'Chú rể';
  var bride = d.bride || 'Cô dâu';
  var par = d.parents || {};
  var groomParents = [par.groomFather, par.groomMother].filter(Boolean).join(' & ');
  var brideParents = [par.brideFather, par.brideMother].filter(Boolean).join(' & ');
  var venues = venueHtml('Nhà trai', d.groomVenue) + venueHtml('Nhà gái', d.brideVenue);

  var html =
    '<div class="paper" style="--accent:' + accent + '">'
    + '<div class="frame"></div>'
    + '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>'
    + '<div class="pc-inner">'
    + '<div class="pc-seal">' + esc(initials(groom, bride)) + '</div>'
    + '<div class="pc-eyebrow">Trân trọng kính mời</div>'
    + '<div class="pc-names"><span class="n">' + esc(groom) + '</span><span class="amp">&amp;</span><span class="n">' + esc(bride) + '</span></div>'
    + '<div class="pc-divider"></div>'
    + (d.weddingDate ? '<div class="pc-date">' + esc(fmtDate(d.weddingDate)) + '</div>' : '')
    + (lunarLine(d.weddingDate) ? '<div class="pc-lunar">' + esc(lunarLine(d.weddingDate)) + '</div>' : '')
    + ((groomParents || brideParents) ? '<div class="pc-parents">'
        + (groomParents ? 'Nhà trai: ' + esc(groomParents) : '')
        + (groomParents && brideParents ? '<br/>' : '')
        + (brideParents ? 'Nhà gái: ' + esc(brideParents) : '') + '</div>' : '')
    + (venues ? '<div class="pc-venues">' + venues + '</div>' : '')
    + '<div class="pc-invite">Sự hiện diện của quý vị là niềm vinh hạnh cho gia đình chúng tôi.</div>'
    + '<div class="pc-qr"><div id="qrbox"></div><div class="qr-cap">Quét mã xem thiệp online & xác nhận tham dự</div></div>'
    + '</div></div>';
  card.innerHTML = html;
  if (note) note.remove();

  fitNames();
  // QR -> thiệp online
  makeQr(location.origin + '/thiep/' + encodeURIComponent(inv.slug));
}

/* thu nhỏ tên cho vừa 1 dòng (tên Việt dài) */
function fitNames() {
  var names = card.querySelectorAll('.pc-names .n');
  names.forEach(function (el) {
    var max = 14, min = 7, size = max;
    el.style.fontSize = size + 'mm';
    var guard = 0;
    while (el.scrollWidth > el.clientWidth && size > min && guard < 40) {
      size -= 0.5; el.style.fontSize = size + 'mm'; guard++;
    }
  });
}

function makeQr(url) {
  var box = document.getElementById('qrbox');
  if (!box || typeof qrcode === 'undefined') return;
  try {
    var qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    box.innerHTML = qr.createImgTag(4, 0);
  } catch (e) { /* bỏ qua nếu QR lỗi */ }
}

/* khổ giấy (TRIM, mm) — gồm khổ phổ biến ở VN + chuẩn phương Tây */
var SIZES = {
  '12x17': [120, 170],   // VN dùng nhiều nhất
  '15x15': [150, 150],   // vuông
  '5x7': [127, 178],     // chuẩn phương Tây
  'a5': [148, 210],
};
var curSize = '12x17';
var bleedOn = false;
var pageStyle = document.createElement('style');
document.head.appendChild(pageStyle);

function applyPage() {
  var s = SIZES[curSize] || SIZES['12x17'];
  var bleed = bleedOn ? 3 : 0;
  var pw = s[0] + bleed * 2, ph = s[1] + bleed * 2;
  document.documentElement.style.setProperty('--pw', pw + 'mm');
  document.documentElement.style.setProperty('--ph', ph + 'mm');
  document.documentElement.style.setProperty('--bleed', bleed + 'mm');
  pageStyle.textContent = '@page { size: ' + pw + 'mm ' + ph + 'mm; margin: 0; }';
  var paper = document.querySelector('.paper');
  if (paper) paper.classList.toggle('bleed', bleedOn);
}
function setSize(key) {
  if (SIZES[key]) curSize = key;
  document.querySelectorAll('#sizeSeg button').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-size') === curSize);
  });
  applyPage();
}

document.getElementById('sizeSeg').addEventListener('click', function (e) {
  var b = e.target.closest('button');
  if (b) setSize(b.getAttribute('data-size'));
});
var bleedBtn = document.getElementById('bleedBtn');
if (bleedBtn) bleedBtn.addEventListener('click', function () {
  bleedOn = !bleedOn;
  bleedBtn.classList.toggle('active', bleedOn);
  bleedBtn.textContent = bleedOn ? '✓ Bleed nhà in 3mm' : 'Bleed nhà in 3mm';
  applyPage();
});
document.getElementById('printBtn').addEventListener('click', function () { window.print(); });

/* khởi động */
(function init() {
  setSize('12x17');
  var slug = getSlug();
  var back = document.getElementById('backLink');
  if (slug && back) back.href = '/thiep/' + encodeURIComponent(slug);
  if (!slug) { if (note) note.textContent = 'Thiếu mã thiệp (?slug=...).'; return; }
  fetch('/api/invitations/' + encodeURIComponent(slug))
    .then(function (r) { if (!r.ok) throw new Error('404'); return r.json(); })
    .then(render)
    .catch(function () { if (note) note.textContent = 'Không tìm thấy thiệp này.'; });
})();
