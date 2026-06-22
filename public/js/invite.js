'use strict';

const root = document.getElementById('root');
const params = new URLSearchParams(location.search);
const isPreview = params.get('preview') === '1';
// Phiên bản theo bên: 'trai' (nhà trai) | 'gai' (nhà gái) | '' (chung)
const SIDE = (function () {
  let s = (params.get('ben') || '').toLowerCase();
  // chế độ xem trước có thể truyền bên qua postMessage (đặt sau)
  return s === 'trai' || s === 'gai' ? s : '';
})();
let previewSide = '';
let introDismissed = false; // chỉ hiện hiệu ứng mở thiệp lần đầu, không lặp khi re-render (đổi ngôn ngữ...)
function activeSide() { return isPreview ? previewSide : SIDE; }
// Tên khách mời (cá nhân hoá thiệp theo từng khách)
const GUEST = (params.get('khach') || '').trim().slice(0, 80);
let previewGuest = '';
function activeGuest() { return isPreview ? previewGuest : GUEST; }

const TEMPLATES = {
  'truyen-thong': { name: 'Truyền thống' },
  'hien-dai': { name: 'Hiện đại' },
  'pastel': { name: 'Pastel' },
};

/* ---- Đa ngôn ngữ (Việt / English) ---- */
let lang = (function () {
  try { return localStorage.getItem('thiep-lang') === 'en' ? 'en' : 'vi'; } catch (e) { return 'vi'; }
})();
let lastInvite = null;
const I18N = {
  vi: {
    saveDate: 'Save the date', invite: 'Trân trọng kính mời',
    inviteTrai: 'Nhà trai trân trọng kính mời', inviteGai: 'Nhà gái trân trọng kính mời',
    badgeTrai: 'Thiệp Nhà Trai', badgeGai: 'Thiệp Nhà Gái', greet: 'Thân mời',
    defaultInvitation: 'Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.',
    storyEyebrow: 'Câu chuyện của chúng tôi',
    cdEyebrow: 'Còn lại', cdDays: 'Ngày', cdHours: 'Giờ', cdMins: 'Phút', cdSecs: 'Giây',
    cdDone: '🎉 Hôm nay là ngày trọng đại! 🎉',
    venuesEyebrow: 'Địa điểm tổ chức', venuesTitle: 'Sự hiện diện của bạn là niềm vinh hạnh',
    nhaTrai: 'Nhà trai', nhaGai: 'Nhà gái', mapBtn: '📍 Xem chỉ đường',
    parentsEyebrow: 'Hai gia đình chúng tôi',
    calAdd: '📅 Thêm vào lịch', calGoogle: 'Lịch Google ↗',
    giftEyebrow: 'Hộp mừng cưới', giftTitle: 'Gửi lời chúc phúc',
    giftNote: 'Sự hiện diện của bạn đã là món quà quý giá nhất với chúng tôi. Nếu muốn gửi thêm lời chúc, bạn có thể quét mã QR bên dưới — hoàn toàn tuỳ tâm.',
    giftCopy: 'Sao chép STK', copied: '✓ Đã sao chép',
    galleryEyebrow: 'Khoảnh khắc', galleryTitle: 'Album của chúng tôi',
    gAlbumEyebrow: 'Góc ảnh khách mời', gAlbumTitle: 'Cùng lưu khoảnh khắc',
    gAlbumSub: 'Khách mời có thể tải ảnh lên để cùng lưu giữ kỷ niệm ngày vui.',
    gAlbumUpload: '📷 Tải ảnh lên', gAlbumUploading: 'Đang tải...', gAlbumEmpty: 'Hãy là người đầu tiên chia sẻ ảnh!',
    gAlbumPreview: '— Góc ảnh khách mời hoạt động trên thiệp thật —',
    timelineEyebrow: 'Lịch trình', timelineTitle: 'Trình tự buổi lễ',
    faqEyebrow: 'Hỏi & Đáp', faqTitle: 'Câu hỏi thường gặp',
    stayEyebrow: 'Nơi lưu trú', stayTitle: 'Gợi ý chỗ nghỉ cho khách ở xa', stayBtn: 'Đặt phòng ↗',
    dressEyebrow: 'Trang phục', dressColorLabel: 'Tông màu gợi ý',
    rsvpEyebrow: 'Xác nhận tham dự', rsvpTitle: 'Bạn sẽ đến chứ?',
    rsvpSub: 'Vui lòng phản hồi để chúng tôi chuẩn bị chu đáo.',
    rsvpName: 'Họ tên *', namePh: 'Tên của bạn', attendQ: 'Bạn có tham dự không?',
    attendYes: '✓ Có, tôi sẽ đến', attendNo: 'Tiếc là không',
    guestsLabel: 'Số người tham dự', g1: '1 người', g2: '2 người', g3: '3 người', g4: '4 người', g5: '5 người trở lên',
    dietLabel: 'Khẩu phần ăn', dietNormal: 'Bình thường', dietVeg: 'Ăn chay 🌿',
    msgLabel: 'Lời chúc tới cô dâu chú rể', msgPh: 'Chúc hai bạn trăm năm hạnh phúc...',
    rsvpBtn: 'Gửi xác nhận', rsvpSending: 'Đang gửi...',
    thanksBig: 'Cảm ơn bạn!', thanksYes: 'Hẹn gặp bạn trong ngày vui của chúng tôi. ❤',
    thanksNo: 'Rất tiếc vì bạn không thể đến. Cảm ơn lời chúc của bạn! ❤',
    errName: 'Vui lòng nhập tên của bạn.', errSend: 'Gửi không thành công.',
    previewRsvp: '— Khu vực xác nhận tham dự sẽ hoạt động trên thiệp thật —',
    wishesEyebrow: 'Sổ lưu bút', wishesTitle: 'Lời chúc từ mọi người', wishTag: 'sẽ đến',
    lunarSuffix: '(Âm lịch)', introOpen: 'Mở thiệp ✦',
  },
  en: {
    saveDate: 'Save the date', invite: 'Cordially invite you',
    inviteTrai: "The groom's family cordially invites you", inviteGai: "The bride's family cordially invites you",
    badgeTrai: "Groom's Family", badgeGai: "Bride's Family", greet: 'Dear',
    defaultInvitation: 'We cordially invite you to celebrate our special day with us.',
    storyEyebrow: 'Our Story',
    cdEyebrow: 'Counting down', cdDays: 'Days', cdHours: 'Hours', cdMins: 'Minutes', cdSecs: 'Seconds',
    cdDone: '🎉 Today is the big day! 🎉',
    venuesEyebrow: 'Venues', venuesTitle: 'Your presence is our greatest honor',
    nhaTrai: "Groom's Family", nhaGai: "Bride's Family", mapBtn: '📍 Get directions',
    parentsEyebrow: 'Our Two Families',
    calAdd: '📅 Add to calendar', calGoogle: 'Google Calendar ↗',
    giftEyebrow: 'Wedding Gift', giftTitle: 'Send Your Blessing',
    giftNote: 'Your presence is already the greatest gift to us. If you wish to send a blessing, you may scan the QR code below — entirely at your heart.',
    giftCopy: 'Copy account', copied: '✓ Copied',
    galleryEyebrow: 'Moments', galleryTitle: 'Our Album',
    gAlbumEyebrow: 'Guest Gallery', gAlbumTitle: 'Share Your Moments',
    gAlbumSub: 'Guests can upload photos to share memories of our special day.',
    gAlbumUpload: '📷 Upload photo', gAlbumUploading: 'Uploading...', gAlbumEmpty: 'Be the first to share a photo!',
    gAlbumPreview: '— Guest gallery works on the published invitation —',
    timelineEyebrow: 'Schedule', timelineTitle: 'Order of Events',
    faqEyebrow: 'Q&A', faqTitle: 'Frequently Asked Questions',
    stayEyebrow: 'Accommodations', stayTitle: 'Where to stay', stayBtn: 'Book ↗',
    dressEyebrow: 'Dress Code', dressColorLabel: 'Suggested palette',
    rsvpEyebrow: 'RSVP', rsvpTitle: 'Will you join us?',
    rsvpSub: 'Please let us know so we can prepare thoughtfully.',
    rsvpName: 'Full name *', namePh: 'Your name', attendQ: 'Will you attend?',
    attendYes: "✓ Yes, I'll be there", attendNo: "Sorry, I can't",
    guestsLabel: 'Number of guests', g1: '1 guest', g2: '2 guests', g3: '3 guests', g4: '4 guests', g5: '5 or more',
    dietLabel: 'Meal preference', dietNormal: 'Regular', dietVeg: 'Vegetarian 🌿',
    msgLabel: 'Your wishes to the couple', msgPh: 'Wishing you a lifetime of happiness...',
    rsvpBtn: 'Send RSVP', rsvpSending: 'Sending...',
    thanksBig: 'Thank you!', thanksYes: 'See you on our big day. ❤',
    thanksNo: "We're sorry you can't make it. Thank you for your wishes! ❤",
    errName: 'Please enter your name.', errSend: 'Submission failed.',
    previewRsvp: '— The RSVP area works on the published invitation —',
    wishesEyebrow: 'Guestbook', wishesTitle: 'Wishes from everyone', wishTag: 'attending',
    lunarSuffix: '(Lunar calendar)', introOpen: 'Open invitation ✦',
  },
};
function t(k) {
  const v = I18N[lang] && I18N[lang][k];
  return v != null ? v : (I18N.vi[k] != null ? I18N.vi[k] : k);
}
function setLang(l) {
  lang = l === 'en' ? 'en' : 'vi';
  try { localStorage.setItem('thiep-lang', lang); } catch (e) {}
  if (lastInvite) render(lastInvite);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSlug() {
  const m = location.pathname.match(/\/thiep\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/* ---- Định dạng ngày theo ngôn ngữ ---- */
const WD_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDate(d) {
  if (!d) return '';
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const wd = (lang === 'en' ? WD_EN : WD_VI)[d.getDay()];
  return `${wd}, ${time} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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
  lastInvite = invite;

  const tpl = TEMPLATES[invite.template] ? invite.template : 'truyen-thong';
  const d = invite.data || {};
  const wd = parseDate(d.weddingDate);
  const side = activeSide();
  const guest = activeGuest();

  // Phiên bản theo bên (nhà trai / nhà gái) — "Mua 1 được 3 thiệp"
  const sideBadge = side === 'trai' ? t('badgeTrai') : side === 'gai' ? t('badgeGai') : '';
  const sideInvite = side === 'trai' ? t('inviteTrai') : side === 'gai' ? t('inviteGai') : t('invite');

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
      <div class="eyebrow">${esc(t('parentsEyebrow'))}</div>
      <div class="divider"></div>
      <div class="parents-grid">
        ${parentSide(t('nhaTrai'), groomParents)}
        ${parentSide(t('nhaGai'), brideParents)}
      </div>
    </section>` : '';

  const story = (d.story || '').trim();
  const storyHtml = story ? `
    <section class="blk blk--tight">
      <div class="eyebrow">${esc(t('storyEyebrow'))}</div>
      <div class="divider"></div>
      <p class="section-text">${esc(story)}</p>
    </section>` : '';

  const invitationText = (d.invitation || '').trim() || t('defaultInvitation');

  // Album ảnh cưới
  const gallery = Array.isArray(d.gallery) ? d.gallery.filter(Boolean) : [];
  const galleryHtml = gallery.length ? `
    <section class="blk gallery-section">
      <div class="eyebrow">${esc(t('galleryEyebrow'))}</div>
      <h3 class="section-title">${esc(t('galleryTitle'))}</h3>
      <div class="gallery">
        ${gallery.map((url, i) => `
          <button type="button" class="gallery-item" data-idx="${i}" aria-label="Ảnh ${i + 1}">
            <img src="${esc(url)}" alt="Ảnh cưới ${i + 1}" loading="lazy" onerror="this.closest('.gallery-item').style.display='none'" />
          </button>`).join('')}
      </div>
    </section>` : '';

  // Góc ảnh khách mời (đóng góp chung)
  const guestAlbumHtml = `
    <section class="blk gallery-section" id="guest-album-section">
      <div class="eyebrow">${esc(t('gAlbumEyebrow'))}</div>
      <h3 class="section-title">${esc(t('gAlbumTitle'))}</h3>
      <p class="section-text" style="margin-bottom:14px">${esc(t('gAlbumSub'))}</p>
      <div class="ga-upload">
        <button type="button" class="cal-btn" id="gaUploadBtn">${esc(t('gAlbumUpload'))}</button>
        <input type="file" id="gaFile" accept="image/*" hidden />
        <div class="err-inline" id="gaErr"></div>
      </div>
      <div class="gallery" id="guestAlbum"></div>
    </section>`;

  // Lịch trình sự kiện
  const timeline = Array.isArray(d.timeline) ? d.timeline.filter((it) => it && (it.time || it.title)) : [];
  const timelineHtml = timeline.length ? `
    <section class="blk blk--tight timeline-section">
      <div class="eyebrow">${esc(t('timelineEyebrow'))}</div>
      <h3 class="section-title">${esc(t('timelineTitle'))}</h3>
      <div class="timeline">
        ${timeline.map((it) => `
          <div class="tl-item">
            <span class="tl-time">${esc(it.time || '')}</span>
            <span class="tl-dot"></span>
            <span class="tl-title">${esc(it.title || '')}</span>
          </div>`).join('')}
      </div>
    </section>` : '';

  // Dress code
  const dress = d.dressCode || {};
  const dressColors = Array.isArray(dress.colors) ? dress.colors : [];
  const dressHtml = (dress.text || dressColors.length) ? `
    <section class="blk blk--tight dress-section">
      <div class="eyebrow">${esc(t('dressEyebrow'))}</div>
      <div class="divider"></div>
      ${dress.text ? `<p class="section-text">${esc(dress.text)}</p>` : ''}
      ${dressColors.length ? `
        <div class="dress-swatches" aria-label="${esc(t('dressColorLabel'))}">
          ${dressColors.map((c) => `<span class="swatch-dot" style="background:${esc(c)}" title="${esc(c)}"></span>`).join('')}
        </div>` : ''}
    </section>` : '';

  // Nơi lưu trú cho khách ở xa
  const stays = Array.isArray(d.stays) ? d.stays.filter((it) => it && it.name) : [];
  const staysHtml = stays.length ? `
    <section class="blk stay-section">
      <div class="eyebrow">${esc(t('stayEyebrow'))}</div>
      <h3 class="section-title">${esc(t('stayTitle'))}</h3>
      <div class="stay-grid">
        ${stays.map((s) => `
          <div class="stay-card">
            <div class="stay-name">${esc(s.name)}</div>
            ${s.note ? `<div class="stay-note">${esc(s.note)}</div>` : ''}
            ${s.url ? `<a class="map-btn" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(t('stayBtn'))}</a>` : ''}
          </div>`).join('')}
      </div>
    </section>` : '';

  // Hỏi & Đáp (FAQ) cho khách
  const faq = Array.isArray(d.faq) ? d.faq.filter((it) => it && it.q && it.a) : [];
  const faqHtml = faq.length ? `
    <section class="blk blk--tight faq-section">
      <div class="eyebrow">${esc(t('faqEyebrow'))}</div>
      <h3 class="section-title">${esc(t('faqTitle'))}</h3>
      <div class="faq" id="faq">
        ${faq.map((it) => `
          <div class="faq-item">
            <button type="button" class="faq-q">${esc(it.q)}<span class="faq-ic">+</span></button>
            <div class="faq-a"><p>${esc(it.a)}</p></div>
          </div>`).join('')}
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
      <a class="cal-btn" id="addIcs" href="${esc(cal.icsHref)}" download="dam-cuoi.ics">${esc(t('calAdd'))}</a>
      <a class="cal-btn cal-btn--ghost" id="addGcal" href="${esc(cal.gcal)}" target="_blank" rel="noopener">${esc(t('calGoogle'))}</a>
    </div>` : '';

  // Hộp mừng cưới (opt-in, tế nhị) — chỉ hiện khi bật & có ít nhất 1 tài khoản hợp lệ
  const gift = d.gift || {};
  const giftSides = [];
  if (gift.enabled) {
    [[t('nhaTrai'), gift.groom], [t('nhaGai'), gift.bride]].forEach(function (pair) {
      const g = pair[1];
      if (g && g.bank && g.account) giftSides.push({ label: pair[0], g: g });
    });
  }
  const bankLabel = (sn) => (typeof VietQR !== 'undefined' ? VietQR.bankName(sn) : sn);
  const giftHtml = giftSides.length ? `
    <section class="blk" id="gift-section">
      <div class="eyebrow">${esc(t('giftEyebrow'))}</div>
      <h3 class="section-title">${esc(t('giftTitle'))}</h3>
      <p class="section-text" style="margin-bottom:10px">${esc(gift.note || t('giftNote'))}</p>
      <div class="gift-grid">
        ${giftSides.map((s, i) => `
          <div class="gift-card">
            <h4>${esc(s.label)}</h4>
            <div class="gift-qr" id="giftqr-${i}"></div>
            <div class="gift-bank">${esc(bankLabel(s.g.bank))}</div>
            <div class="gift-acc">${esc(s.g.account)}</div>
            ${s.g.name ? `<div class="gift-holder">${esc(s.g.name)}</div>` : ''}
            <button type="button" class="gift-copy" data-acc="${esc(s.g.account)}">${esc(t('giftCopy'))}</button>
          </div>`).join('')}
      </div>
    </section>` : '';

  const venueHtml = (label, v) => {
    v = v || {};
    if (!v.name && !v.address && !v.time && !v.mapUrl) return '';
    const map = (v.mapUrl || '').trim();
    const mapBtn = map
      ? `<a class="map-btn" href="${esc(map)}" target="_blank" rel="noopener">${esc(t('mapBtn'))}</a>`
      : (v.address ? `<a class="map-btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}" target="_blank" rel="noopener">${esc(t('mapBtn'))}</a>` : '');
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
  const groomVenueHtml = venueHtml(t('nhaTrai'), d.groomVenue);
  const brideVenueHtml = venueHtml(t('nhaGai'), d.brideVenue);
  // Phiên bản nhà gái: ưu tiên hiển thị địa điểm nhà gái trước
  const venues = side === 'gai'
    ? (brideVenueHtml + groomVenueHtml)
    : (groomVenueHtml + brideVenueHtml);
  const venuesSection = venues ? `
    <section class="blk">
      <div class="eyebrow">${esc(t('venuesEyebrow'))}</div>
      <h3 class="section-title">${esc(t('venuesTitle'))}</h3>
      <div class="venues">${venues}</div>
    </section>` : '';

  root.className = 'invite theme-' + tpl;
  root.innerHTML = `
    <div class="sheet">
      <section class="blk cover">
        ${sideBadge ? `<div class="side-badge">${esc(sideBadge)}</div>` : ''}
        ${guest ? `<div class="guest-greet">${esc(t('greet'))} <b>${esc(guest)}</b></div>` : ''}
        <div class="double-happy">囍</div>
        <div class="save">${esc(t('saveDate'))}</div>
        <div class="names">
          <span class="n1">${groom}</span>
          <span class="amp">&amp;</span>
          <span class="n2">${bride}</span>
        </div>
        ${wd ? `<div class="wdate">${esc(fmtDate(wd))}</div>` : ''}
        ${wd && typeof Lunar !== 'undefined' ? `<div class="wlunar">${esc(Lunar.lunarLabel(wd))} ${esc(t('lunarSuffix'))}</div>` : ''}
        <div class="wsub">${esc(sideInvite)}</div>
      </section>

      ${parentsHtml}

      ${photoHtml}

      <section class="blk blk--tight">
        <p class="section-text">${esc(invitationText)}</p>
      </section>

      ${storyHtml}

      ${galleryHtml}

      ${guestAlbumHtml}

      ${wd ? `
      <section class="blk blk--tight">
        <div class="eyebrow">${esc(t('cdEyebrow'))}</div>
        <div class="divider"></div>
        <div class="countdown" id="countdown"></div>
        ${calHtml}
      </section>` : ''}

      ${venuesSection}

      ${staysHtml}

      ${timelineHtml}

      ${dressHtml}

      ${faqHtml}

      <section class="blk" id="rsvp-section">
        <div class="eyebrow">${esc(t('rsvpEyebrow'))}</div>
        <h3 class="section-title">${esc(t('rsvpTitle'))}</h3>
        <p class="section-text" style="margin-bottom:20px">${esc(t('rsvpSub'))}</p>
        <div id="rsvp-area"></div>
      </section>

      ${giftHtml}

      <section class="blk blk--tight" id="wishes-section" style="display:none">
        <div class="eyebrow">${esc(t('wishesEyebrow'))}</div>
        <h3 class="section-title">${esc(t('wishesTitle'))}</h3>
        <div class="divider"></div>
        <div class="wishes" id="wishes"></div>
      </section>

      <div class="foot">Made with ❤ · Thiệp Cưới Online</div>
    </div>
    ${(!isPreview && d.intro !== false && !introDismissed) ? `
    <div class="intro" id="intro">
      <div class="intro-inner">
        <div class="intro-happy">囍</div>
        <div class="intro-names">${groom} <span class="intro-amp">&amp;</span> ${bride}</div>
        <div class="intro-sub">${esc(t('saveDate'))}${wd ? ' · ' + esc(fmtDate(wd)) : ''}</div>
        <button type="button" class="intro-btn" id="introOpen">${esc(t('introOpen'))}</button>
      </div>
    </div>` : ''}
    ${musicHtml}
    <div class="lang-switch" id="langSwitch">
      <button type="button" class="lang-opt ${lang === 'vi' ? 'active' : ''}" data-lang="vi">VI</button>
      <button type="button" class="lang-opt ${lang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
    </div>
    <div class="lightbox" id="lightbox" hidden>
      <button type="button" class="lightbox-close" id="lightboxClose" aria-label="Đóng">×</button>
      <img id="lightboxImg" src="" alt="Ảnh cưới phóng to" />
    </div>
  `;

  const langSwitch = document.getElementById('langSwitch');
  if (langSwitch) {
    langSwitch.addEventListener('click', (e) => {
      const b = e.target.closest('.lang-opt');
      if (b) setLang(b.getAttribute('data-lang'));
    });
  }

  wireLightbox();
  wireIntro();
  mountFaq();
  if (wd) startCountdown(wd);
  mountRsvp(invite);
  mountGift(giftSides);
  mountGallery(gallery);
  mountGuestAlbum();
  mountMusic();
  loadWishes();
}

/* ---- FAQ accordion ---- */
function mountFaq() {
  document.querySelectorAll('#faq .faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
}

/* ---- Hiệu ứng mở thiệp (phong bì) ---- */
function wireIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const sheet = document.querySelector('.sheet');
  const open = () => {
    introDismissed = true;
    intro.classList.add('intro-open');
    if (sheet) sheet.classList.add('revealed');
    setTimeout(() => { intro.hidden = true; }, 1100);
  };
  const btn = document.getElementById('introOpen');
  if (btn) btn.addEventListener('click', open);
}

/* ---- Lightbox dùng chung ---- */
function openLightbox(url) {
  const lb = document.getElementById('lightbox');
  const im = document.getElementById('lightboxImg');
  if (lb && im) { im.src = url; lb.hidden = false; }
}
function wireLightbox() {
  const lb = document.getElementById('lightbox');
  const im = document.getElementById('lightboxImg');
  if (!lb || !im) return;
  const close = () => { lb.hidden = true; im.src = ''; };
  const btn = document.getElementById('lightboxClose');
  if (btn) btn.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
}

/* ---- Album ảnh cặp đôi: mở lightbox ---- */
function mountGallery(gallery) {
  if (!gallery || !gallery.length) return;
  document.querySelectorAll('.gallery-section:not(#guest-album-section) .gallery-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      if (img) openLightbox(img.src);
    });
  });
}

/* ---- Góc ảnh khách mời (đóng góp chung) ---- */
function downscaleImage(file, maxSide, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        let w = img.naturalWidth || 1, h = img.naturalHeight || 1;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderGuestPhotos(photos) {
  const box = document.getElementById('guestAlbum');
  if (!box) return;
  if (!photos || !photos.length) {
    box.innerHTML = `<p class="section-text" style="opacity:.7;grid-column:1/-1">${esc(t('gAlbumEmpty'))}</p>`;
    return;
  }
  box.innerHTML = photos.map((p) => `
    <button type="button" class="gallery-item" aria-label="Ảnh khách mời">
      <img src="${esc(p.url)}" alt="${esc(p.uploader || 'Ảnh khách mời')}" loading="lazy" />
    </button>`).join('');
  box.querySelectorAll('.gallery-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      if (img) openLightbox(img.src);
    });
  });
}

function loadGuestPhotos(slug) {
  fetch(`/api/invitations/${encodeURIComponent(slug)}/photos`)
    .then((r) => (r.ok ? r.json() : { photos: [] }))
    .then((d) => renderGuestPhotos(d.photos))
    .catch(() => {});
}

function mountGuestAlbum() {
  const section = document.getElementById('guest-album-section');
  if (!section) return;
  if (isPreview) {
    const box = document.getElementById('guestAlbum');
    if (box) box.innerHTML = `<p class="section-text" style="opacity:.7;grid-column:1/-1">${esc(t('gAlbumPreview'))}</p>`;
    return;
  }
  const slug = getSlug();
  if (!slug) return;
  loadGuestPhotos(slug);

  const btn = document.getElementById('gaUploadBtn');
  const input = document.getElementById('gaFile');
  const err = document.getElementById('gaErr');
  if (!btn || !input) return;
  btn.addEventListener('click', () => { err.textContent = ''; input.click(); });
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const old = btn.textContent;
    btn.disabled = true; btn.textContent = t('gAlbumUploading');
    try {
      const dataUrl = await downscaleImage(file, 1280, 0.82);
      const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, uploader: activeGuest() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Tải ảnh thất bại.');
      loadGuestPhotos(slug);
    } catch (e) {
      err.textContent = e.message;
    } finally {
      btn.disabled = false; btn.textContent = old;
      input.value = '';
    }
  });
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
      btn.textContent = t('copied');
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
        <span class="wish-name">${esc(w.name)}${w.attending ? ` <span class="wish-tag">${esc(t('wishTag'))}</span>` : ''}</span>
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
      box.innerHTML = `<div class="cd-done">${esc(t('cdDone'))}</div>`;
      if (countdownTimer) clearInterval(countdownTimer);
      return;
    }
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000); diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    const unit = (n, l) => `<div class="cd-unit"><div class="cd-num">${n}</div><div class="cd-lbl">${l}</div></div>`;
    box.innerHTML = unit(days, t('cdDays')) + unit(hours, t('cdHours')) + unit(mins, t('cdMins')) + unit(secs, t('cdSecs'));
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ---- RSVP ---- */
function mountRsvp(invite) {
  const area = document.getElementById('rsvp-area');
  if (!area) return;

  if (isPreview) {
    area.innerHTML = `<p class="section-text" style="opacity:.7">${esc(t('previewRsvp'))}</p>`;
    return;
  }

  const slug = getSlug();
  area.innerHTML = `
    <form class="rsvp" id="rsvpForm">
      <div class="field">
        <label for="rsvpName">${esc(t('rsvpName'))}</label>
        <input id="rsvpName" name="name" required placeholder="${esc(t('namePh'))}" value="${esc(activeGuest())}" />
      </div>
      <div class="field">
        <label>${esc(t('attendQ'))}</label>
        <div class="attend-toggle" id="attendToggle">
          <label class="has-checked"><input type="radio" name="attending" value="yes" checked /><span>${esc(t('attendYes'))}</span></label>
          <label><input type="radio" name="attending" value="no" /><span>${esc(t('attendNo'))}</span></label>
        </div>
      </div>
      <div class="field" id="guestsField">
        <label for="rsvpGuests">${esc(t('guestsLabel'))}</label>
        <select id="rsvpGuests" name="guests">
          <option value="1">${esc(t('g1'))}</option>
          <option value="2">${esc(t('g2'))}</option>
          <option value="3">${esc(t('g3'))}</option>
          <option value="4">${esc(t('g4'))}</option>
          <option value="5">${esc(t('g5'))}</option>
        </select>
      </div>
      <div class="field" id="dietField">
        <label for="rsvpDiet">${esc(t('dietLabel'))}</label>
        <select id="rsvpDiet" name="diet">
          <option value="man">${esc(t('dietNormal'))}</option>
          <option value="chay">${esc(t('dietVeg'))}</option>
        </select>
      </div>
      <div class="field">
        <label for="rsvpMsg">${esc(t('msgLabel'))}</label>
        <textarea id="rsvpMsg" name="message" placeholder="${esc(t('msgPh'))}"></textarea>
      </div>
      <div class="err-inline" id="rsvpErr"></div>
      <button type="submit" class="rsvp-btn" id="rsvpBtn">${esc(t('rsvpBtn'))}</button>
    </form>`;

  const form = document.getElementById('rsvpForm');
  const toggle = document.getElementById('attendToggle');
  const guestsField = document.getElementById('guestsField');
  const dietField = document.getElementById('dietField');

  toggle.addEventListener('change', () => {
    toggle.querySelectorAll('label').forEach((l) => l.classList.toggle('has-checked', l.querySelector('input').checked));
    const attending = toggle.querySelector('input:checked').value === 'yes';
    guestsField.style.display = attending ? '' : 'none';
    dietField.style.display = attending ? '' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('rsvpErr');
    const btn = document.getElementById('rsvpBtn');
    err.textContent = '';
    const name = document.getElementById('rsvpName').value.trim();
    if (!name) { err.textContent = t('errName'); return; }
    const attending = toggle.querySelector('input:checked').value === 'yes';
    const payload = {
      name,
      attending: attending ? 'yes' : 'no',
      guests: document.getElementById('rsvpGuests').value,
      diet: document.getElementById('rsvpDiet').value,
      message: document.getElementById('rsvpMsg').value,
    };
    btn.disabled = true; btn.textContent = t('rsvpSending');
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('errSend'));
      document.getElementById('rsvp-area').innerHTML = `
        <div class="rsvp-thanks">
          <div class="big">${esc(t('thanksBig'))}</div>
          <p class="section-text">${esc(attending ? t('thanksYes') : t('thanksNo'))}</p>
        </div>`;
      loadWishes();
    } catch (e2) {
      err.textContent = e2.message;
      btn.disabled = false; btn.textContent = t('rsvpBtn');
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
    if (e.data && e.data.type === 'preview' && e.data.invite) {
      previewSide = e.data.side === 'trai' || e.data.side === 'gai' ? e.data.side : '';
      previewGuest = typeof e.data.guest === 'string' ? e.data.guest.slice(0, 80) : '';
      render(e.data.invite);
    }
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
