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
  'hoang-gia': { name: 'Hoàng gia' },
  'xanh-la': { name: 'Xanh lá' },
  'do-ruou': { name: 'Đỏ rượu' },
  'anh-dao': { name: 'Anh đào' },
  'long-phung': { name: 'Long Phụng' },
  'mai-trang': { name: 'Mai Trắng' },
  'lam-ngoc': { name: 'Lam Ngọc' },
  'hong-kim': { name: 'Hồng Kim' },
  'luc-bao': { name: 'Lục Bảo' },
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
    thankYouEyebrow: 'Lời cảm ơn', thankYouTitle: 'Cảm ơn quý vị 💛',
    thankYouDefault: 'Cảm ơn quý vị đã đến chung vui và dành cho chúng tôi những lời chúc tốt đẹp nhất!',
    loveEyebrow: 'Hành trình tình yêu', loveTitle: 'Chuyện của chúng mình',
    cdEyebrow: 'Còn lại', cdDays: 'Ngày', cdHours: 'Giờ', cdMins: 'Phút', cdSecs: 'Giây',
    cdDone: '🎉 Hôm nay là ngày trọng đại! 🎉',
    venuesEyebrow: 'Địa điểm tổ chức', venuesTitle: 'Sự hiện diện của bạn là niềm vinh hạnh',
    eventsEyebrow: 'Sự kiện cưới', eventsTitle: 'Các sự kiện', eventMap: '📍 Xem chỉ đường',
    liveEyebrow: 'Phát trực tiếp', liveTitle: 'Theo dõi trực tuyến', liveBtn: 'Xem trực tiếp ↗',
    seatFindEyebrow: 'Sơ đồ chỗ ngồi', seatFindTitle: 'Tìm bàn của bạn', seatFindBtn: 'Tìm bàn',
    seatFindPh: 'Nhập tên của bạn', seatFound: 'Bạn ngồi tại', seatNotFound: 'Chưa tìm thấy tên bạn trong sơ đồ — vui lòng hỏi cô dâu chú rể nhé.',
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
    consentRsvp: 'Tôi đồng ý cho cặp đôi lưu thông tin này để chuẩn bị đám cưới.',
    consentPhoto: 'Tôi đồng ý chia sẻ ảnh này lên album chung.',
    consentLink: 'Chính sách quyền riêng tư', consentErr: 'Vui lòng tích đồng ý để tiếp tục.',
    lunarSuffix: '(Âm lịch)', introOpen: 'Mở thiệp ✦',
    stdBadge: 'Save the Date', stdNote: 'Thiệp mời chi tiết sẽ được gửi tới quý vị sau 💌',
    shareAria: 'Chia sẻ thiệp', shareCopied: 'Đã sao chép link thiệp — dán vào Zalo/Messenger để gửi',
  },
  en: {
    saveDate: 'Save the date', invite: 'Cordially invite you',
    inviteTrai: "The groom's family cordially invites you", inviteGai: "The bride's family cordially invites you",
    badgeTrai: "Groom's Family", badgeGai: "Bride's Family", greet: 'Dear',
    defaultInvitation: 'We cordially invite you to celebrate our special day with us.',
    storyEyebrow: 'Our Story',
    thankYouEyebrow: 'Thank You', thankYouTitle: 'Thank You 💛',
    thankYouDefault: 'Thank you for celebrating with us and for all your warm wishes!',
    loveEyebrow: 'Our Love Story', loveTitle: 'Our Journey',
    cdEyebrow: 'Counting down', cdDays: 'Days', cdHours: 'Hours', cdMins: 'Minutes', cdSecs: 'Seconds',
    cdDone: '🎉 Today is the big day! 🎉',
    venuesEyebrow: 'Venues', venuesTitle: 'Your presence is our greatest honor',
    eventsEyebrow: 'Wedding Events', eventsTitle: 'Our Events', eventMap: '📍 Directions',
    liveEyebrow: 'Live Stream', liveTitle: 'Watch Online', liveBtn: 'Watch live ↗',
    seatFindEyebrow: 'Seating', seatFindTitle: 'Find your table', seatFindBtn: 'Find',
    seatFindPh: 'Enter your name', seatFound: 'Your table:', seatNotFound: 'Your name is not in the seating chart yet — please ask the couple.',
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
    consentRsvp: 'I agree to let the couple store this info for wedding planning.',
    consentPhoto: 'I agree to share this photo to the shared album.',
    consentLink: 'Privacy policy', consentErr: 'Please tick to agree before continuing.',
    lunarSuffix: '(Lunar calendar)', introOpen: 'Open invitation ✦',
    stdBadge: 'Save the Date', stdNote: 'A formal invitation will follow soon 💌',
    shareAria: 'Share invitation', shareCopied: 'Invitation link copied — paste into Zalo/Messenger to share',
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

// Lấy YouTube video ID từ nhiều dạng URL
function youtubeId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

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
  // a11y: đồng bộ ngôn ngữ trang cho screen reader (tiếng Việt có thanh điệu)
  try { document.documentElement.lang = (lang === 'en' ? 'en' : 'vi'); } catch (e) {}

  const tpl = TEMPLATES[invite.template] ? invite.template : 'truyen-thong';
  const d = invite.data || {};
  const wd = parseDate(d.weddingDate);
  const side = activeSide();
  const guest = activeGuest();
  const std = !!d.saveTheDate; // chế độ Save the Date: ẩn RSVP/hộp mừng

  // Phiên bản theo bên (nhà trai / nhà gái) — "Mua 1 được 3 thiệp"
  const sideBadge = side === 'trai' ? t('badgeTrai') : side === 'gai' ? t('badgeGai') : '';
  const sideInvite = side === 'trai' ? t('inviteTrai') : side === 'gai' ? t('inviteGai') : t('invite');

  const groom = esc(d.groom || 'Chú rể');
  const bride = esc(d.bride || 'Cô dâu');

  const photo = (d.photoUrl || '').trim();
  const photoHtml = photo
    ? `<img class="cover-photo" src="${esc(photo)}" alt="Ảnh cưới ${groom} & ${bride}" fetchpriority="high" decoding="async" onerror="this.style.display='none'" />`
    : '';

  // Chế độ cảm ơn sau cưới
  const ty = d.thankYou || {};
  const thankYouHtml = ty.enabled ? `
    <section class="blk thankyou-banner">
      <div class="eyebrow">${esc(t('thankYouEyebrow'))}</div>
      <h3 class="section-title">${esc(t('thankYouTitle'))}</h3>
      <p class="section-text">${esc((ty.message || '').trim() || t('thankYouDefault'))}</p>
    </section>` : '';

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

  // Hành trình tình yêu (timeline mốc kỷ niệm)
  const love = Array.isArray(d.loveStory) ? d.loveStory.filter((it) => it && (it.title || it.desc)) : [];
  const loveHtml = love.length ? `
    <section class="blk love-section">
      <div class="eyebrow">${esc(t('loveEyebrow'))}</div>
      <h3 class="section-title">${esc(t('loveTitle'))}</h3>
      <div class="love-timeline">
        ${love.map((it) => `
          <div class="love-item">
            <div class="love-dot"></div>
            ${it.photo ? `<img class="love-photo" src="${esc(it.photo)}" alt="${esc(it.title)}" loading="lazy" onerror="this.style.display='none'" />` : ''}
            ${it.time ? `<div class="love-time">${esc(it.time)}</div>` : ''}
            ${it.title ? `<div class="love-title">${esc(it.title)}</div>` : ''}
            ${it.desc ? `<p class="love-desc">${esc(it.desc)}</p>` : ''}
          </div>`).join('')}
      </div>
    </section>` : '';

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
        <label class="consent-row" style="justify-content:center">
          <input type="checkbox" id="gaConsent" />
          <span>${esc(t('consentPhoto'))} <a href="/quyen-rieng-tu" target="_blank" rel="noopener">${esc(t('consentLink'))}</a></span>
        </label>
        <button type="button" class="cal-btn" id="gaUploadBtn">${esc(t('gAlbumUpload'))}</button>
        <input type="file" id="gaFile" accept="image/*" hidden />
        <div class="err-inline" id="gaErr" role="alert"></div>
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

  // Phát trực tiếp (livestream) — ẩn ở chế độ Save the Date
  const liveUrl = (d.livestreamUrl || '').trim();
  const ytId = youtubeId(liveUrl);
  const liveHtml = (liveUrl && !std) ? `
    <section class="blk live-section" id="live-section">
      <div class="eyebrow">${esc(t('liveEyebrow'))}</div>
      <h3 class="section-title">${esc(t('liveTitle'))}</h3>
      ${ytId
        ? `<div class="live-embed"><iframe src="https://www.youtube-nocookie.com/embed/${esc(ytId)}" title="Livestream" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        : `<a class="map-btn" href="${esc(liveUrl)}" target="_blank" rel="noopener">${esc(t('liveBtn'))}</a>`}
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
  const giftHtml = (!std && giftSides.length) ? `
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

  // Tra cứu bàn tiệc cho khách (hiện khi thiệp có sơ đồ bàn & không phải preview)
  const seatFindHtml = (invite.hasSeating && !isPreview && !std) ? `
    <section class="blk blk--tight seatfind-section" id="seatfind-section">
      <div class="eyebrow">${esc(t('seatFindEyebrow'))}</div>
      <h3 class="section-title">${esc(t('seatFindTitle'))}</h3>
      <div class="divider"></div>
      <div class="seatfind">
        <input id="seatFindName" placeholder="${esc(t('seatFindPh'))}" value="${esc(activeGuest())}" />
        <button type="button" id="seatFindBtn" class="map-btn">${esc(t('seatFindBtn'))}</button>
      </div>
      <div class="seatfind-result" id="seatFindResult"></div>
    </section>` : '';

  // Các sự kiện cưới khác (ăn hỏi, tiệc nhà gái...) — nhiều sự kiện/nhiều ngày
  const events = Array.isArray(d.events) ? d.events.filter((it) => it && (it.name || it.place)) : [];
  const eventsSection = events.length ? `
    <section class="blk events-section">
      <div class="eyebrow">${esc(t('eventsEyebrow'))}</div>
      <h3 class="section-title">${esc(t('eventsTitle'))}</h3>
      <div class="venues">
        ${events.map((ev) => {
          const map = ev.mapUrl ? ev.mapUrl
            : (ev.place ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.place) : '');
          return `<div class="venue">
            ${ev.name ? `<div class="vceremony">${esc(ev.name)}</div>` : ''}
            ${ev.time ? `<div class="vtime">${esc(ev.time)}</div>` : ''}
            ${ev.place ? `<div class="vaddr">${esc(ev.place)}</div>` : ''}
            ${map ? `<a class="map-btn" href="${esc(map)}" target="_blank" rel="noopener">${esc(t('eventMap'))}</a>` : ''}
          </div>`;
        }).join('')}
      </div>
    </section>` : '';

  root.className = 'invite theme-' + tpl;
  root.innerHTML = `
    <div class="sheet" role="main">
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
        <div class="wsub">${std ? esc(t('stdBadge')) : esc(sideInvite)}</div>
        ${std ? `<div class="std-note">${esc(t('stdNote'))}</div>` : ''}
      </section>

      ${thankYouHtml}

      ${parentsHtml}

      ${photoHtml}

      <section class="blk blk--tight">
        <p class="section-text">${esc(invitationText)}</p>
      </section>

      ${storyHtml}

      ${loveHtml}

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

      ${eventsSection}

      ${liveHtml}

      ${seatFindHtml}

      ${staysHtml}

      ${timelineHtml}

      ${dressHtml}

      ${faqHtml}

      ${std ? '' : `
      <section class="blk" id="rsvp-section">
        <div class="eyebrow">${esc(t('rsvpEyebrow'))}</div>
        <h3 class="section-title">${esc(t('rsvpTitle'))}</h3>
        <p class="section-text" style="margin-bottom:20px">${esc(t('rsvpSub'))}</p>
        <div id="rsvp-area"></div>
      </section>`}

      ${giftHtml}

      ${std ? '' : `
      <section class="blk blk--tight" id="wishes-section" style="display:none">
        <div class="eyebrow">${esc(t('wishesEyebrow'))}</div>
        <h3 class="section-title">${esc(t('wishesTitle'))}</h3>
        <div class="divider"></div>
        <div class="wishes" id="wishes"></div>
      </section>`}

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
    <div class="lang-switch" id="langSwitch" role="group" aria-label="Chọn ngôn ngữ / Language">
      <button type="button" class="lang-opt ${lang === 'vi' ? 'active' : ''}" data-lang="vi" aria-label="Tiếng Việt" ${lang === 'vi' ? 'aria-pressed="true"' : ''}>VI</button>
      <button type="button" class="lang-opt ${lang === 'en' ? 'active' : ''}" data-lang="en" aria-label="English" ${lang === 'en' ? 'aria-pressed="true"' : ''}>EN</button>
    </div>
    ${isPreview ? '' : '<button type="button" class="print-btn" id="printBtn" title="In thiệp" aria-label="In thiệp">🖨️</button>'}
    ${isPreview ? '' : `<button type="button" class="share-fab" id="inviteShareBtn" title="${esc(t('shareAria'))}" aria-label="${esc(t('shareAria'))}">📤</button>`}
    ${isPreview ? '' : '<div class="inv-toast" id="invToast" role="status" aria-live="polite"></div>'}
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh phóng to" hidden>
      <button type="button" class="lightbox-close" id="lightboxClose" aria-label="Đóng (Esc)">×</button>
      <button type="button" class="lightbox-nav lb-prev" id="lightboxPrev" aria-label="Ảnh trước">‹</button>
      <img id="lightboxImg" src="" alt="Ảnh cưới phóng to" />
      <button type="button" class="lightbox-nav lb-next" id="lightboxNext" aria-label="Ảnh sau">›</button>
    </div>
  `;

  const langSwitch = document.getElementById('langSwitch');
  if (langSwitch) {
    langSwitch.addEventListener('click', (e) => {
      const b = e.target.closest('.lang-opt');
      if (b) setLang(b.getAttribute('data-lang'));
    });
  }
  const printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const shareBtn = document.getElementById('inviteShareBtn');
  if (shareBtn) {
    const sslug = getSlug();
    const shareUrl = sslug ? (location.origin + '/thiep/' + encodeURIComponent(sslug)) : location.href.split('?')[0];
    const shareTitle = (d.groom && d.bride) ? `Thiệp cưới ${d.groom} & ${d.bride}` : 'Thiệp cưới của chúng tôi';
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try { await navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl }); } catch (e) { /* huỷ */ }
      } else {
        try { if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl); } catch (e) {}
        showInvToast(t('shareCopied'));
      }
    });
  }

  wireLightbox();
  wireIntro();
  mountFaq();
  mountSeatFind();
  if (wd) startCountdown(wd);
  mountRsvp(invite, cal);
  mountGift(giftSides);
  mountGallery(gallery);
  mountGuestAlbum();
  mountMusic();
  mountReveal();
  loadWishes();
}

/* ---- Tra cứu bàn tiệc ---- */
function mountSeatFind() {
  const section = document.getElementById('seatfind-section');
  if (!section) return;
  const input = document.getElementById('seatFindName');
  const btn = document.getElementById('seatFindBtn');
  const result = document.getElementById('seatFindResult');
  const slug = getSlug();
  if (!btn || !slug) return;
  const lookup = () => {
    const name = (input.value || '').trim();
    if (!name) return;
    result.textContent = '...';
    fetch(`/api/invitations/${encodeURIComponent(slug)}/find-table?name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.found) {
          result.innerHTML = `<div class="seatfind-ok">${esc(t('seatFound'))} <b>${esc(d.table)}</b></div>`;
        } else {
          result.innerHTML = `<div class="seatfind-no">${esc(t('seatNotFound'))}</div>`;
        }
      })
      .catch(() => { result.textContent = ''; });
  };
  btn.addEventListener('click', lookup);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lookup(); } });
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

/* ---- Scroll-reveal: hé lộ nhẹ các section phụ khi cuộn tới ----
   Chỉ section trang trí (có .eyebrow), không áp thân chính/bìa;
   bỏ qua ở chế độ xem trước & khi người dùng tắt chuyển động. */
function mountReveal() {
  if (isPreview || !('IntersectionObserver' in window)) return;
  try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  const targets = Array.prototype.slice
    .call(document.querySelectorAll('.sheet .blk:not(.cover)'))
    // chỉ section đang hiển thị & có eyebrow (bỏ qua khối ẩn như sổ lưu bút hiện sau)
    .filter((b) => b.querySelector('.eyebrow') && b.offsetParent !== null);
  if (!targets.length) return;
  targets.forEach((b) => b.classList.add('reveal-init'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('reveal-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((b) => io.observe(b));
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

/* ---- Lightbox dùng chung (chuyển ảnh prev/next: nút, phím mũi tên, vuốt) ---- */
let lightboxTrigger = null;
let lbList = [];
let lbIndex = 0;
function lbShow(i) {
  const im = document.getElementById('lightboxImg');
  if (!im || !lbList.length) return;
  lbIndex = (i + lbList.length) % lbList.length; // chuyển vòng tròn
  im.src = lbList[lbIndex];
  const multi = lbList.length > 1;
  const prev = document.getElementById('lightboxPrev');
  const next = document.getElementById('lightboxNext');
  if (prev) prev.style.display = multi ? '' : 'none';
  if (next) next.style.display = multi ? '' : 'none';
}
function lbNav(d) { if (lbList.length > 1) lbShow(lbIndex + d); }
function openLightbox(url, trigger, list, index) {
  const lb = document.getElementById('lightbox');
  const im = document.getElementById('lightboxImg');
  if (!lb || !im) return;
  lightboxTrigger = trigger || null;
  lbList = (list && list.length) ? list : [url];
  lbShow(typeof index === 'number' ? index : 0);
  lb.hidden = false;
  const btn = document.getElementById('lightboxClose');
  if (btn) btn.focus(); // a11y: đưa focus vào modal
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const im = document.getElementById('lightboxImg');
  if (!lb || lb.hidden) return;
  lb.hidden = true;
  if (im) im.src = '';
  lbList = [];
  if (lightboxTrigger && lightboxTrigger.focus) lightboxTrigger.focus(); // a11y: trả focus về nút mở
  lightboxTrigger = null;
}
function wireLightbox() {
  const lb = document.getElementById('lightbox');
  const im = document.getElementById('lightboxImg');
  if (!lb || !im) return;
  const btn = document.getElementById('lightboxClose');
  if (btn) btn.addEventListener('click', closeLightbox);
  const prev = document.getElementById('lightboxPrev');
  const next = document.getElementById('lightboxNext');
  if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); lbNav(-1); });
  if (next) next.addEventListener('click', (e) => { e.stopPropagation(); lbNav(1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  let sx = 0;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) lbNav(dx < 0 ? 1 : -1); // vuốt trái -> ảnh sau
  }, { passive: true });
}
// Esc đóng + mũi tên chuyển ảnh (gắn 1 lần ở document, không lặp khi re-render)
if (!window.__lbKeyWired) {
  window.__lbKeyWired = true;
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lbNav(-1);
    else if (e.key === 'ArrowRight') lbNav(1);
  });
}

/* ---- Album ảnh cặp đôi: mở lightbox ---- */
function mountGallery(gallery) {
  if (!gallery || !gallery.length) return;
  const items = document.querySelectorAll('.gallery-section:not(#guest-album-section) .gallery-item');
  const list = Array.prototype.map.call(items, (b) => { const i = b.querySelector('img'); return i ? i.src : ''; }).filter(Boolean);
  items.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      if (img) openLightbox(img.src, btn, list, idx);
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
  const gitems = box.querySelectorAll('.gallery-item');
  const glist = Array.prototype.map.call(gitems, (b) => { const i = b.querySelector('img'); return i ? i.src : ''; }).filter(Boolean);
  gitems.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      if (img) openLightbox(img.src, btn, glist, idx);
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
  const consentEl = document.getElementById('gaConsent');
  btn.addEventListener('click', () => {
    err.textContent = '';
    if (consentEl && !consentEl.checked) { err.textContent = t('consentErr'); return; }
    input.click();
  });
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
        body: JSON.stringify({ image: dataUrl, uploader: activeGuest(), consent: 'yes' }),
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

/* ---- Toast nhỏ trên thiệp (chia sẻ...) ---- */
let invToastTimer;
function showInvToast(msg) {
  const el = document.getElementById('invToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(invToastTimer);
  invToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
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
function mountRsvp(invite, cal) {
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
      <label class="consent-row">
        <input type="checkbox" id="rsvpConsent" />
        <span>${esc(t('consentRsvp'))} <a href="/quyen-rieng-tu" target="_blank" rel="noopener">${esc(t('consentLink'))}</a></span>
      </label>
      <div class="err-inline" id="rsvpErr" role="alert"></div>
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
    const nameEl = document.getElementById('rsvpName');
    nameEl.setAttribute('aria-describedby', 'rsvpErr');
    nameEl.removeAttribute('aria-invalid');
    const name = nameEl.value.trim();
    if (!name) { err.textContent = t('errName'); nameEl.setAttribute('aria-invalid', 'true'); nameEl.focus(); return; }
    if (!document.getElementById('rsvpConsent').checked) { err.textContent = t('consentErr'); return; }
    const attending = toggle.querySelector('input:checked').value === 'yes';
    const payload = {
      name,
      attending: attending ? 'yes' : 'no',
      guests: document.getElementById('rsvpGuests').value,
      diet: document.getElementById('rsvpDiet').value,
      message: document.getElementById('rsvpMsg').value,
      consent: 'yes',
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
          ${(attending && cal) ? `<a class="cal-btn" href="${esc(cal.gcal)}" target="_blank" rel="noopener" style="margin-top:16px">${esc(t('calAdd'))}</a>` : ''}
        </div>`;
      loadWishes();
    } catch (e2) {
      err.textContent = e2.message;
      btn.disabled = false; btn.textContent = t('rsvpBtn');
    }
  });
}

/* ---- Khởi động ---- */
function showState(emoji, msg, cta) {
  root.className = 'invite';
  root.innerHTML = `<div class="state-msg"><span class="em">${emoji}</span>${esc(msg)}`
    + (cta ? `<a class="state-cta" href="${esc(cta.href)}">${esc(cta.label)}</a>` : '')
    + `</div>`;
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
    showState('💌', 'Không tìm thấy thiệp.', { href: '/', label: 'Tạo thiệp cưới của bạn ✦' });
  } else {
    fetch(`/api/invitations/${encodeURIComponent(slug)}`)
      .then((r) => { if (!r.ok) throw new Error('404'); return r.json(); })
      .then((inv) => {
        document.title = `Thiệp cưới ${inv.data.groom} & ${inv.data.bride}`;
        render(inv);
        countView(slug);
      })
      .catch(() => showState('💌', 'Không tìm thấy thiệp này. Có thể link đã sai hoặc thiệp đã gỡ.', { href: '/', label: 'Tạo thiệp cưới của bạn ✦' }));
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
