'use strict';

const root = document.getElementById('root');
const params = new URLSearchParams(location.search);
const isPreview = params.get('preview') === '1';

const TEMPLATES = {
  'truyen-thong': { name: 'Truyền thống' },
  'hien-dai': { name: 'Hiện đại' },
  'pastel': { name: 'Pastel' },
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSlug() {
  const m = location.pathname.match(/\/thiep\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/* ---- Định dạng ngày tiếng Việt ---- */
const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDate(d) {
  if (!d) return '';
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${WD[d.getDay()]}, ${time} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/* ---- Render thiệp ---- */
let countdownTimer = null;

/* ---- Thêm vào lịch (.ics + Google Calendar) ---- */
function pad2(n) { return String(n).padStart(2, '0'); }
function fmtCal(d) {
  // định dạng thời gian địa phương dạng YYYYMMDDTHHMMSS (không kèm Z)
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
}
function buildCalendar(plainGroom, plainBride, start, location) {
  const end = new Date(start.getTime() + 3 * 3600000); // mặc định 3 tiếng
  const title = `Đám cưới ${plainGroom} & ${plainBride}`;
  const s = fmtCal(start), e = fmtCal(end);
  const gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(title)
    + '&dates=' + s + '/' + e
    + (location ? '&location=' + encodeURIComponent(location) : '')
    + '&details=' + encodeURIComponent('Trân trọng kính mời bạn đến chung vui!');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ThiepCuoi//VN//',
    'BEGIN:VEVENT',
    'UID:' + s + '-thiepcuoi@local',
    'DTSTART:' + s, 'DTEND:' + e,
    'SUMMARY:' + title.replace(/([,;\\])/g, '\\$1'),
    location ? 'LOCATION:' + location.replace(/([,;\\])/g, '\\$1') : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  const icsHref = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  return { gcal, icsHref };
}

function render(invite) {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

  const tpl = TEMPLATES[invite.template] ? invite.template : 'truyen-thong';
  const d = invite.data || {};
  const wd = parseDate(d.weddingDate);

  const groom = esc(d.groom || 'Chú rể');
  const bride = esc(d.bride || 'Cô dâu');

  const photo = (d.photoUrl || '').trim();
  const photoHtml = photo
    ? `<img class="cover-photo" src="${esc(photo)}" alt="Ảnh cưới ${groom} & ${bride}" onerror="this.style.display='none'" />`
    : '';

  // Cha mẹ hai bên (cấu trúc 2 gia đình VN)
  const par = d.parents || {};
  const groomParents = [par.groomFather, par.groomMother].filter(Boolean);
  const brideParents = [par.brideFather, par.brideMother].filter(Boolean);
  const parentSide = (label, names) => names.length ? `
    <div class="parent-side">
      <h4>${esc(label)}</h4>
      ${names.map((n) => `<div class="parent-name">${esc(n)}</div>`).join('')}
    </div>` : '';
  const parentsHtml = (groomParents.length || brideParents.length) ? `
    <section class="blk blk--tight parents">
      <div class="eyebrow">Hai gia đình chúng tôi</div>
      <div class="divider"></div>
      <div class="parents-grid">
        ${parentSide('Nhà trai', groomParents)}
        ${parentSide('Nhà gái', brideParents)}
      </div>
    </section>` : '';

  const story = (d.story || '').trim();
  const storyHtml = story ? `
    <section class="blk blk--tight">
      <div class="eyebrow">Câu chuyện của chúng tôi</div>
      <div class="divider"></div>
      <p class="section-text">${esc(story)}</p>
    </section>` : '';

  const invitationText = (d.invitation || '').trim()
    || 'Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.';

  // Album ảnh cưới
  const gallery = Array.isArray(d.gallery) ? d.gallery.filter(Boolean) : [];
  const galleryHtml = gallery.length ? `
    <section class="blk gallery-section">
      <div class="eyebrow">Khoảnh khắc</div>
      <h3 class="section-title">Album của chúng tôi</h3>
      <div class="gallery">
        ${gallery.map((url, i) => `
          <button type="button" class="gallery-item" data-idx="${i}" aria-label="Ảnh ${i + 1}">
            <img src="${esc(url)}" alt="Ảnh cưới ${i + 1}" loading="lazy" onerror="this.closest('.gallery-item').style.display='none'" />
          </button>`).join('')}
      </div>
    </section>` : '';

  // Nhạc nền
  const music = (d.musicUrl || '').trim();
  const musicHtml = music ? `
    <button type="button" id="musicToggle" class="music-btn" aria-label="Bật/tắt nhạc nền" title="Nhạc nền">
      <span class="music-icon">♪</span>
    </button>
    <audio id="bgMusic" src="${esc(music)}" loop preload="none"></audio>` : '';

  // dữ liệu lịch
  const calLocation = [
    (d.groomVenue && (d.groomVenue.name || d.groomVenue.address)) || '',
    (d.brideVenue && (d.brideVenue.name || d.brideVenue.address)) || '',
  ].filter(Boolean).join(' · ');
  const cal = wd ? buildCalendar(d.groom || 'Chú rể', d.bride || 'Cô dâu', wd, calLocation) : null;
  const calHtml = cal ? `
    <div class="cal-actions">
      <a class="cal-btn" id="addIcs" href="${esc(cal.icsHref)}" download="dam-cuoi.ics">📅 Thêm vào lịch</a>
      <a class="cal-btn cal-btn--ghost" id="addGcal" href="${esc(cal.gcal)}" target="_blank" rel="noopener">Lịch Google ↗</a>
    </div>` : '';

  // Hộp mừng cưới (opt-in, tế nhị) — chỉ hiện khi bật & có ít nhất 1 tài khoản hợp lệ
  const gift = d.gift || {};
  const giftSides = [];
  if (gift.enabled) {
    [['Nhà trai', gift.groom], ['Nhà gái', gift.bride]].forEach(function (pair) {
      const g = pair[1];
      if (g && g.bank && g.account) giftSides.push({ label: pair[0], g: g });
    });
  }
  const bankLabel = (sn) => (typeof VietQR !== 'undefined' ? VietQR.bankName(sn) : sn);
  const giftHtml = giftSides.length ? `
    <section class="blk" id="gift-section">
      <div class="eyebrow">Hộp mừng cưới</div>
      <h3 class="section-title">Gửi lời chúc phúc</h3>
      <p class="section-text" style="margin-bottom:10px">${esc(gift.note || 'Sự hiện diện của bạn đã là món quà quý giá nhất với chúng tôi. Nếu muốn gửi thêm lời chúc, bạn có thể quét mã QR bên dưới — hoàn toàn tuỳ tâm.')}</p>
      <div class="gift-grid">
        ${giftSides.map((s, i) => `
          <div class="gift-card">
            <h4>${esc(s.label)}</h4>
            <div class="gift-qr" id="giftqr-${i}"></div>
            <div class="gift-bank">${esc(bankLabel(s.g.bank))}</div>
            <div class="gift-acc">${esc(s.g.account)}</div>
            ${s.g.name ? `<div class="gift-holder">${esc(s.g.name)}</div>` : ''}
            <button type="button" class="gift-copy" data-acc="${esc(s.g.account)}">Sao chép STK</button>
          </div>`).join('')}
      </div>
    </section>` : '';

  const venueHtml = (label, v) => {
    v = v || {};
    if (!v.name && !v.address && !v.time && !v.mapUrl) return '';
    const map = (v.mapUrl || '').trim();
    const mapBtn = map
      ? `<a class="map-btn" href="${esc(map)}" target="_blank" rel="noopener">📍 Xem chỉ đường</a>`
      : (v.address ? `<a class="map-btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}" target="_blank" rel="noopener">📍 Xem chỉ đường</a>` : '');
    return `
      <div class="venue">
        <h4>${esc(label)}</h4>
        ${v.ceremony ? `<div class="vceremony">${esc(v.ceremony)}</div>` : ''}
        ${v.name ? `<div class="vname">${esc(v.name)}</div>` : ''}
        ${v.time ? `<div class="vtime">${esc(v.time)}</div>` : ''}
        ${v.address ? `<div class="vaddr">${esc(v.address)}</div>` : ''}
        ${mapBtn}
      </div>`;
  };
  const venues = venueHtml('Nhà trai', d.groomVenue) + venueHtml('Nhà gái', d.brideVenue);
  const venuesSection = venues ? `
    <section class="blk">
      <div class="eyebrow">Địa điểm tổ chức</div>
      <h3 class="section-title">Sự hiện diện của bạn là niềm vinh hạnh</h3>
      <div class="venues">${venues}</div>
    </section>` : '';

  root.className = 'invite theme-' + tpl;
  root.innerHTML = `
    <div class="sheet">
      <section class="blk cover">
        <div class="double-happy">囍</div>
        <div class="save">Save the date</div>
        <div class="names">
          <span class="n1">${groom}</span>
          <span class="amp">&amp;</span>
          <span class="n2">${bride}</span>
        </div>
        ${wd ? `<div class="wdate">${esc(fmtDate(wd))}</div>` : ''}
        ${wd && typeof Lunar !== 'undefined' ? `<div class="wlunar">${esc(Lunar.lunarLabel(wd))} (Âm lịch)</div>` : ''}
        <div class="wsub">Trân trọng kính mời</div>
      </section>

      ${parentsHtml}

      ${photoHtml}

      <section class="blk blk--tight">
        <p class="section-text">${esc(invitationText)}</p>
      </section>

      ${storyHtml}

      ${galleryHtml}

      ${wd ? `
      <section class="blk blk--tight">
        <div class="eyebrow">Còn lại</div>
        <div class="divider"></div>
        <div class="countdown" id="countdown"></div>
        ${calHtml}
      </section>` : ''}

      ${venuesSection}

      <section class="blk" id="rsvp-section">
        <div class="eyebrow">Xác nhận tham dự</div>
        <h3 class="section-title">Bạn sẽ đến chứ?</h3>
        <p class="section-text" style="margin-bottom:20px">Vui lòng phản hồi để chúng tôi chuẩn bị chu đáo.</p>
        <div id="rsvp-area"></div>
      </section>

      ${giftHtml}

      <section class="blk blk--tight" id="wishes-section" style="display:none">
        <div class="eyebrow">Sổ lưu bút</div>
        <h3 class="section-title">Lời chúc từ mọi người</h3>
        <div class="divider"></div>
        <div class="wishes" id="wishes"></div>
      </section>

      <div class="foot">Made with ❤ · Thiệp Cưới Online</div>
    </div>
    ${musicHtml}
    <div class="lightbox" id="lightbox" hidden>
      <button type="button" class="lightbox-close" id="lightboxClose" aria-label="Đóng">×</button>
      <img id="lightboxImg" src="" alt="Ảnh cưới phóng to" />
    </div>
  `;

  if (wd) startCountdown(wd);
  mountRsvp(invite);
  mountGift(giftSides);
  mountGallery(gallery);
  mountMusic();
  loadWishes();
}

/* ---- Album ảnh: lightbox ---- */
function mountGallery(gallery) {
  if (!gallery || !gallery.length) return;
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  if (!lb || !lbImg) return;
  const open = (url) => { lbImg.src = url; lb.hidden = false; };
  const close = () => { lb.hidden = true; lbImg.src = ''; };
  document.querySelectorAll('.gallery-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      if (img) open(img.src);
    });
  });
  document.getElementById('lightboxClose').addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
}

/* ---- Nhạc nền: nút bật/tắt ---- */
function mountMusic() {
  const btn = document.getElementById('musicToggle');
  const audio = document.getElementById('bgMusic');
  if (!btn || !audio) return;
  btn.addEventListener('click', () => {
    if (btn.classList.contains('playing')) {
      audio.pause();
      btn.classList.remove('playing');
    } else {
      btn.classList.add('playing');
      const p = audio.play();
      if (p && p.catch) p.catch(() => { /* trình duyệt chặn — vẫn giữ trạng thái nút */ });
    }
  });
}

/* ---- Hộp mừng cưới: sinh QR VietQR + nút copy ---- */
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () {});
  }
}
function mountGift(sides) {
  if (!sides || !sides.length) return;
  if (typeof VietQR === 'undefined' || typeof qrcode === 'undefined') return;
  sides.forEach(function (s, i) {
    const box = document.getElementById('giftqr-' + i);
    if (!box) return;
    try {
      const payload = VietQR.buildPayload({ bank: s.g.bank, account: s.g.account });
      const qr = qrcode(0, 'M');
      qr.addData(payload);
      qr.make();
      box.innerHTML = qr.createImgTag(5, 0);
    } catch (e) {
      box.textContent = 'Không tạo được QR';
    }
  });
  document.querySelectorAll('.gift-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-acc'));
      const old = btn.textContent;
      btn.textContent = '✓ Đã sao chép';
      setTimeout(function () { btn.textContent = old; }, 1500);
    });
  });
}

/* ---- Sổ lưu bút ---- */
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  const last = parts[parts.length - 1] || '?';
  return last.charAt(0).toUpperCase();
}

function renderWishes(wishes) {
  const section = document.getElementById('wishes-section');
  const box = document.getElementById('wishes');
  if (!section || !box) return;
  if (!wishes || !wishes.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  box.innerHTML = wishes.map((w) => `
    <div class="wish-card">
      <div class="wish-head">
        <span class="wish-ava">${esc(initials(w.name))}</span>
        <span class="wish-name">${esc(w.name)}${w.attending ? ' <span class="wish-tag">sẽ đến</span>' : ''}</span>
      </div>
      <p class="wish-msg">“${esc(w.message)}”</p>
    </div>`).join('');
}

function loadWishes() {
  if (isPreview) {
    renderWishes([
      { name: 'Gia đình bác Tâm', attending: 1, message: 'Chúc hai cháu trăm năm hạnh phúc, sớm sinh quý tử!' },
      { name: 'Minh Anh', attending: 1, message: 'Mừng đám cưới hai bạn, yêu nhau thật nhiều nhé ❤' },
    ]);
    return;
  }
  const slug = getSlug();
  if (!slug) return;
  fetch(`/api/invitations/${encodeURIComponent(slug)}/wishes`)
    .then((r) => (r.ok ? r.json() : { wishes: [] }))
    .then((d) => renderWishes(d.wishes))
    .catch(() => {});
}

/* ---- Đếm ngược ---- */
function startCountdown(target) {
  const box = document.getElementById('countdown');
  if (!box) return;
  function tick() {
    const now = Date.now();
    let diff = target.getTime() - now;
    if (diff <= 0) {
      box.innerHTML = `<div class="cd-done">🎉 Hôm nay là ngày trọng đại! 🎉</div>`;
      if (countdownTimer) clearInterval(countdownTimer);
      return;
    }
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000); diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    const unit = (n, l) => `<div class="cd-unit"><div class="cd-num">${n}</div><div class="cd-lbl">${l}</div></div>`;
    box.innerHTML = unit(days, 'Ngày') + unit(hours, 'Giờ') + unit(mins, 'Phút') + unit(secs, 'Giây');
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ---- RSVP ---- */
function mountRsvp(invite) {
  const area = document.getElementById('rsvp-area');
  if (!area) return;

  if (isPreview) {
    area.innerHTML = `<p class="section-text" style="opacity:.7">— Khu vực xác nhận tham dự sẽ hoạt động trên thiệp thật —</p>`;
    return;
  }

  const slug = getSlug();
  area.innerHTML = `
    <form class="rsvp" id="rsvpForm">
      <div class="field">
        <label for="rsvpName">Họ tên *</label>
        <input id="rsvpName" name="name" required placeholder="Tên của bạn" />
      </div>
      <div class="field">
        <label>Bạn có tham dự không?</label>
        <div class="attend-toggle" id="attendToggle">
          <label class="has-checked"><input type="radio" name="attending" value="yes" checked /><span>✓ Có, tôi sẽ đến</span></label>
          <label><input type="radio" name="attending" value="no" /><span>Tiếc là không</span></label>
        </div>
      </div>
      <div class="field" id="guestsField">
        <label for="rsvpGuests">Số người tham dự</label>
        <select id="rsvpGuests" name="guests">
          <option value="1">1 người</option>
          <option value="2">2 người</option>
          <option value="3">3 người</option>
          <option value="4">4 người</option>
          <option value="5">5 người trở lên</option>
        </select>
      </div>
      <div class="field">
        <label for="rsvpMsg">Lời chúc tới cô dâu chú rể</label>
        <textarea id="rsvpMsg" name="message" placeholder="Chúc hai bạn trăm năm hạnh phúc..."></textarea>
      </div>
      <div class="err-inline" id="rsvpErr"></div>
      <button type="submit" class="rsvp-btn" id="rsvpBtn">Gửi xác nhận</button>
    </form>`;

  const form = document.getElementById('rsvpForm');
  const toggle = document.getElementById('attendToggle');
  const guestsField = document.getElementById('guestsField');

  toggle.addEventListener('change', () => {
    toggle.querySelectorAll('label').forEach((l) => l.classList.toggle('has-checked', l.querySelector('input').checked));
    const attending = toggle.querySelector('input:checked').value === 'yes';
    guestsField.style.display = attending ? '' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('rsvpErr');
    const btn = document.getElementById('rsvpBtn');
    err.textContent = '';
    const name = document.getElementById('rsvpName').value.trim();
    if (!name) { err.textContent = 'Vui lòng nhập tên của bạn.'; return; }
    const attending = toggle.querySelector('input:checked').value === 'yes';
    const payload = {
      name,
      attending: attending ? 'yes' : 'no',
      guests: document.getElementById('rsvpGuests').value,
      message: document.getElementById('rsvpMsg').value,
    };
    btn.disabled = true; btn.textContent = 'Đang gửi...';
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gửi không thành công.');
      document.getElementById('rsvp-area').innerHTML = `
        <div class="rsvp-thanks">
          <div class="big">Cảm ơn bạn!</div>
          <p class="section-text">${attending
            ? 'Hẹn gặp bạn trong ngày vui của chúng tôi. ❤'
            : 'Rất tiếc vì bạn không thể đến. Cảm ơn lời chúc của bạn! ❤'}</p>
        </div>`;
      loadWishes();
    } catch (e2) {
      err.textContent = e2.message;
      btn.disabled = false; btn.textContent = 'Gửi xác nhận';
    }
  });
}

/* ---- Khởi động ---- */
function showState(emoji, msg) {
  root.className = 'invite';
  root.innerHTML = `<div class="state-msg"><span class="em">${emoji}</span>${esc(msg)}</div>`;
}

if (isPreview) {
  // Chế độ xem trước: nhận dữ liệu qua postMessage từ trang soạn thiệp
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'preview' && e.data.invite) render(e.data.invite);
  });
  // báo cho cha biết iframe đã sẵn sàng
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'preview-ready' }, '*');
  }
} else {
  const slug = getSlug();
  if (!slug) {
    showState('💌', 'Không tìm thấy thiệp.');
  } else {
    fetch(`/api/invitations/${encodeURIComponent(slug)}`)
      .then((r) => { if (!r.ok) throw new Error('404'); return r.json(); })
      .then((inv) => {
        document.title = `Thiệp cưới ${inv.data.groom} & ${inv.data.bride}`;
        render(inv);
        countView(slug);
      })
      .catch(() => showState('💌', 'Không tìm thấy thiệp này. Có thể link đã sai.'));
  }
}

/* ---- Đếm lượt xem (1 lần / phiên trình duyệt) ---- */
function countView(slug) {
  try {
    const key = 'viewed:' + slug;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch (e) { /* sessionStorage có thể bị chặn — vẫn đếm */ }
  fetch(`/api/invitations/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => {});
}
