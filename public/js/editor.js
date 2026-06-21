'use strict';

const form = document.getElementById('form');
const previewFrame = document.getElementById('preview');
const formErr = document.getElementById('formErr');
const createBtn = document.getElementById('createBtn');

/* ---- gom dữ liệu form thành object ---- */
function collect() {
  const f = new FormData(form);
  const get = (k) => (f.get(k) || '').toString();
  return {
    groom: get('groom'),
    bride: get('bride'),
    weddingDate: get('weddingDate'),
    photoUrl: get('photoUrl'),
    gallery: get('gallery'),
    musicUrl: get('musicUrl'),
    invitation: get('invitation'),
    story: get('story'),
    template: get('template') || 'truyen-thong',
    groomFather: get('groomFather'),
    groomMother: get('groomMother'),
    brideFather: get('brideFather'),
    brideMother: get('brideMother'),
    groomVenueName: get('groomVenueName'),
    groomVenueAddress: get('groomVenueAddress'),
    groomMapUrl: get('groomMapUrl'),
    groomTime: get('groomTime'),
    groomCeremony: get('groomCeremony'),
    brideVenueName: get('brideVenueName'),
    brideVenueAddress: get('brideVenueAddress'),
    brideMapUrl: get('brideMapUrl'),
    brideTime: get('brideTime'),
    brideCeremony: get('brideCeremony'),
    giftEnabled: document.getElementById('giftEnabled').checked ? 'yes' : '',
    giftNote: get('giftNote'),
    giftGroomBank: get('giftGroomBank'),
    giftGroomAccount: get('giftGroomAccount'),
    giftGroomName: get('giftGroomName'),
    giftBrideBank: get('giftBrideBank'),
    giftBrideAccount: get('giftBrideAccount'),
    giftBrideName: get('giftBrideName'),
  };
}

/* chuyển payload phẳng -> cấu trúc thiệp cho renderer */
function toInvite(p) {
  return {
    template: p.template,
    data: {
      groom: p.groom || 'Chú rể',
      bride: p.bride || 'Cô dâu',
      weddingDate: p.weddingDate,
      photoUrl: p.photoUrl,
      gallery: (p.gallery || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 12),
      musicUrl: p.musicUrl,
      invitation: p.invitation,
      story: p.story,
      parents: { groomFather: p.groomFather, groomMother: p.groomMother, brideFather: p.brideFather, brideMother: p.brideMother },
      groomVenue: { name: p.groomVenueName, address: p.groomVenueAddress, mapUrl: p.groomMapUrl, time: p.groomTime, ceremony: p.groomCeremony },
      brideVenue: { name: p.brideVenueName, address: p.brideVenueAddress, mapUrl: p.brideMapUrl, time: p.brideTime, ceremony: p.brideCeremony },
      gift: {
        enabled: p.giftEnabled === 'yes',
        note: p.giftNote,
        groom: { bank: p.giftGroomBank, account: p.giftGroomAccount, name: p.giftGroomName },
        bride: { bank: p.giftBrideBank, account: p.giftBrideAccount, name: p.giftBrideName },
      },
    },
  };
}

/* ---- nạp danh sách ngân hàng + công tắc hộp mừng cưới ---- */
(function setupGift() {
  const banks = (window.VietQR && window.VietQR.BANKS) || [];
  const fill = (sel) => {
    banks.forEach((b) => {
      const o = document.createElement('option');
      o.value = b.shortName;
      o.textContent = `${b.shortName} — ${b.fullName}`;
      sel.appendChild(o);
    });
  };
  fill(document.getElementById('giftGroomBank'));
  fill(document.getElementById('giftBrideBank'));

  const toggle = document.getElementById('giftEnabled');
  const fields = document.getElementById('giftFields');
  toggle.addEventListener('change', () => {
    fields.hidden = !toggle.checked;
    pushPreview();
  });
})();

/* ---- gửi preview vào iframe ---- */
let frameReady = false;
function pushPreview() {
  if (!frameReady) return;
  previewFrame.contentWindow.postMessage({ type: 'preview', invite: toInvite(collect()) }, '*');
}

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'preview-ready') {
    frameReady = true;
    pushPreview();
  }
});
previewFrame.addEventListener('load', () => { /* iframe sẽ tự gửi preview-ready */ });

form.addEventListener('input', pushPreview);

/* ---- chọn mẫu ---- */
document.getElementById('templates').addEventListener('click', (e) => {
  const tpl = e.target.closest('.tpl');
  if (!tpl) return;
  document.querySelectorAll('.tpl').forEach((t) => t.classList.remove('active'));
  tpl.classList.add('active');
  tpl.querySelector('input').checked = true;
  pushPreview();
});

/* mặc định ngày cưới = +30 ngày để preview có đếm ngược */
(function setDefaultDate() {
  const el = document.getElementById('weddingDate');
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(11, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  el.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
})();

/* ---- toast ---- */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---- copy helper ---- */
function copy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => showToast('Đã copy!')).catch(() => fallbackCopy(text));
  }
  fallbackCopy(text);
}
function fallbackCopy(text) {
  const t = document.createElement('textarea');
  t.value = text; document.body.appendChild(t); t.select();
  try { document.execCommand('copy'); showToast('Đã copy!'); } catch (_) {}
  document.body.removeChild(t);
}

/* ---- modal ---- */
const overlay = document.getElementById('overlay');
function showResult(slug, manageToken) {
  const origin = location.origin;
  const shareUrl = `${origin}/thiep/${slug}`;
  const manageUrl = `${origin}/quanly/${slug}?token=${manageToken}`;
  document.getElementById('shareLink').value = shareUrl;
  document.getElementById('manageLink').value = manageUrl;
  document.getElementById('openInvite').href = shareUrl;

  const qrbox = document.getElementById('qrbox');
  qrbox.innerHTML = '';
  try {
    const qr = qrcode(0, 'M');
    qr.addData(shareUrl);
    qr.make();
    qrbox.innerHTML = qr.createImgTag(5, 8);
  } catch (err) {
    qrbox.textContent = 'QR không khả dụng';
  }
  overlay.classList.add('open');
}

document.getElementById('copyShare').addEventListener('click', () => copy(document.getElementById('shareLink').value));
document.getElementById('copyManage').addEventListener('click', () => copy(document.getElementById('manageLink').value));
document.getElementById('closeModal').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

/* ---- submit ---- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formErr.textContent = '';
  const payload = collect();
  if (!payload.groom.trim() || !payload.bride.trim()) {
    formErr.textContent = 'Vui lòng nhập tên cô dâu và chú rể.';
    return;
  }
  if (!payload.weddingDate) {
    formErr.textContent = 'Vui lòng chọn ngày cưới.';
    return;
  }
  createBtn.disabled = true;
  createBtn.textContent = 'Đang tạo...';
  try {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Có lỗi xảy ra.');
    showResult(json.slug, json.manageToken);
  } catch (err) {
    formErr.textContent = err.message;
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = '✦ Tạo thiệp & lấy link chia sẻ';
  }
});
