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
    livestreamUrl: get('livestreamUrl'),
    timeline: get('timeline'),
    dressText: get('dressText'),
    dressColors: get('dressColors'),
    faq: get('faq'),
    stays: get('stays'),
    intro: document.getElementById('introEnabled').checked ? 'on' : 'off',
    saveTheDate: document.getElementById('saveTheDate').checked ? 'yes' : '',
    thankYouEnabled: document.getElementById('thankYouEnabled').checked ? 'yes' : '',
    thankYouMsg: get('thankYouMsg'),
    invitation: get('invitation'),
    story: get('story'),
    loveStory: get('loveStory'),
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
    events: get('events'),
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
      livestreamUrl: /^https?:\/\//i.test((p.livestreamUrl || '').trim()) ? p.livestreamUrl.trim() : '',
      timeline: (p.timeline || '').split(/\r?\n/).map((line) => {
        const parts = line.split('|');
        return parts.length > 1
          ? { time: parts[0].trim(), title: parts.slice(1).join('|').trim() }
          : { time: '', title: line.trim() };
      }).filter((it) => it.time || it.title).slice(0, 15),
      dressCode: {
        text: p.dressText,
        colors: (p.dressColors || '').split(/[,\s]+/).map((s) => s.trim())
          .filter((s) => /^#?[0-9a-fA-F]{6}$/.test(s)).map((s) => (s[0] === '#' ? s : '#' + s)).slice(0, 6),
      },
      intro: p.intro !== 'off',
      saveTheDate: p.saveTheDate === 'yes',
      thankYou: { enabled: p.thankYouEnabled === 'yes', message: p.thankYouMsg },
      faq: (p.faq || '').split(/\r?\n/).map((line) => {
        const parts = line.split('|');
        return { q: (parts[0] || '').trim(), a: parts.slice(1).join('|').trim() };
      }).filter((it) => it.q && it.a).slice(0, 20),
      stays: (p.stays || '').split(/\r?\n/).map((line) => {
        const pr = line.split('|');
        const url = (pr[2] || '').trim();
        return { name: (pr[0] || '').trim(), note: (pr[1] || '').trim(), url: /^https?:\/\//i.test(url) ? url : '' };
      }).filter((it) => it.name).slice(0, 12),
      invitation: p.invitation,
      story: p.story,
      loveStory: (p.loveStory || '').split(/\r?\n/).map((line) => {
        const pr = line.split('|');
        const photo = (pr[3] || '').trim();
        return {
          time: (pr[0] || '').trim(), title: (pr[1] || '').trim(), desc: (pr[2] || '').trim(),
          photo: /^https?:\/\/|^data:image\//i.test(photo) ? photo : '',
        };
      }).filter((it) => it.title || it.desc).slice(0, 12),
      parents: { groomFather: p.groomFather, groomMother: p.groomMother, brideFather: p.brideFather, brideMother: p.brideMother },
      groomVenue: { name: p.groomVenueName, address: p.groomVenueAddress, mapUrl: p.groomMapUrl, time: p.groomTime, ceremony: p.groomCeremony },
      brideVenue: { name: p.brideVenueName, address: p.brideVenueAddress, mapUrl: p.brideMapUrl, time: p.brideTime, ceremony: p.brideCeremony },
      events: (p.events || '').split(/\r?\n/).map((line) => {
        const pr = line.split('|');
        const mapUrl = (pr[3] || '').trim();
        return { name: (pr[0] || '').trim(), time: (pr[1] || '').trim(), place: (pr[2] || '').trim(), mapUrl: /^https?:\/\//i.test(mapUrl) ? mapUrl : '' };
      }).filter((it) => it.name || it.place).slice(0, 10),
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

  const tyToggle = document.getElementById('thankYouEnabled');
  const tyFields = document.getElementById('thankYouFields');
  tyToggle.addEventListener('change', () => {
    tyFields.hidden = !tyToggle.checked;
    pushPreview();
  });
})();

/* ---- gửi preview vào iframe ---- */
let frameReady = false;
let previewSideSel = ''; // '', 'trai', 'gai'
function pushPreview() {
  if (!frameReady) return;
  previewFrame.contentWindow.postMessage(
    { type: 'preview', side: previewSideSel, invite: toInvite(collect()) }, '*');
}

/* ---- tab chọn phiên bản xem trước (Chung / Nhà trai / Nhà gái) ---- */
document.getElementById('previewTabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.ptab');
  if (!tab) return;
  document.querySelectorAll('#previewTabs .ptab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  previewSideSel = tab.getAttribute('data-side') || '';
  pushPreview();
});

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

/* ---- chọn sẵn mẫu theo ?template= (từ trang Bộ sưu tập) ---- */
(function preselectTemplate() {
  const wanted = new URLSearchParams(location.search).get('template');
  if (!wanted) return;
  const tpl = document.querySelector(`.tpl[data-tpl="${CSS.escape(wanted)}"]`);
  if (!tpl) return;
  document.querySelectorAll('.tpl').forEach((t) => t.classList.remove('active'));
  tpl.classList.add('active');
  tpl.querySelector('input').checked = true;
})();

/* mặc định ngày cưới = +30 ngày để preview có đếm ngược */
(function setDefaultDate() {
  const el = document.getElementById('weddingDate');
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(11, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  el.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
})();

/* ---- Tải ảnh lên từ máy: thu nhỏ phía client -> data-URI ---- */
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
/* ---- Quản lý ảnh album: hiện thumbnail + nút xoá từng ảnh ---- */
function galleryEscAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
let gDragFrom = -1;
function galleryList() {
  return document.getElementById('gallery').value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
function renderGalleryThumbs() {
  const ta = document.getElementById('gallery');
  const wrap = document.getElementById('galleryThumbs');
  if (!ta || !wrap) return;
  const list = galleryList();
  wrap.innerHTML = list.map((url, i) =>
    `<div class="gthumb" draggable="true" data-i="${i}" title="Kéo để đổi thứ tự"><img src="${galleryEscAttr(url)}" alt="Ảnh ${i + 1}" loading="lazy" onerror="this.closest('.gthumb').classList.add('broken')" /><button type="button" class="gthumb-x" data-i="${i}" aria-label="Xoá ảnh ${i + 1}">×</button></div>`,
  ).join('');
  wrap.querySelectorAll('.gthumb-x').forEach((btn) => {
    btn.addEventListener('click', () => {
      const arr = galleryList();
      arr.splice(+btn.getAttribute('data-i'), 1);
      ta.value = arr.join('\n');
      renderGalleryThumbs();
      pushPreview();
    });
  });
  // kéo-thả đổi thứ tự (ảnh đầu hiển thị trước)
  wrap.querySelectorAll('.gthumb').forEach((el) => {
    el.addEventListener('dragstart', () => { gDragFrom = +el.getAttribute('data-i'); el.classList.add('dragging'); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const to = +el.getAttribute('data-i');
      if (gDragFrom < 0 || gDragFrom === to) return;
      const arr = galleryList();
      const moved = arr.splice(gDragFrom, 1)[0];
      arr.splice(to, 0, moved);
      gDragFrom = -1;
      ta.value = arr.join('\n');
      renderGalleryThumbs();
      pushPreview();
    });
  });
}

(function setupImageUpload() {
  const photoBtn = document.getElementById('photoUpload');
  const photoFile = document.getElementById('photoFile');
  if (photoBtn && photoFile) {
    photoBtn.addEventListener('click', () => photoFile.click());
    photoFile.addEventListener('change', async () => {
      const file = photoFile.files && photoFile.files[0];
      if (!file) return;
      const old = photoBtn.textContent; photoBtn.disabled = true; photoBtn.textContent = 'Đang xử lý...';
      try {
        document.getElementById('photoUrl').value = await downscaleImage(file, 1280, 0.82);
        pushPreview();
      } catch (e) { /* bỏ qua ảnh lỗi */ } finally { photoBtn.disabled = false; photoBtn.textContent = old; photoFile.value = ''; }
    });
  }
  const galBtn = document.getElementById('galleryUpload');
  const galFile = document.getElementById('galleryFile');
  if (galBtn && galFile) {
    galBtn.addEventListener('click', () => galFile.click());
    galFile.addEventListener('change', async () => {
      const files = Array.prototype.slice.call(galFile.files || []);
      if (!files.length) return;
      const ta = document.getElementById('gallery');
      const old = galBtn.textContent; galBtn.disabled = true; galBtn.textContent = 'Đang xử lý...';
      try {
        const list = ta.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        for (const f of files) {
          if (list.length >= 12) break;
          try { list.push(await downscaleImage(f, 1000, 0.8)); } catch (e) {}
        }
        ta.value = list.slice(0, 12).join('\n');
        renderGalleryThumbs();
        pushPreview();
      } finally { galBtn.disabled = false; galBtn.textContent = old; galFile.value = ''; }
    });
  }
  const galTa = document.getElementById('gallery');
  if (galTa) galTa.addEventListener('input', renderGalleryThumbs);
  renderGalleryThumbs();
})();

/* ---- Điền thử dữ liệu mẫu: cho khách thấy ngay thiệp hoàn chỉnh ---- */
(function setupDemoFill() {
  const btn = document.getElementById('demoFill');
  if (!btn) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el != null && el.value !== undefined) el.value = val; };
  btn.addEventListener('click', () => {
    set('groom', 'Nguyễn Minh Đức');
    set('bride', 'Trần Thuỳ Dương');
    set('invitation', 'Trân trọng kính mời quý vị đến chung vui cùng gia đình chúng tôi trong ngày trọng đại. Sự hiện diện của quý vị là niềm vinh hạnh lớn lao cho hai gia đình.');
    set('story', 'Chúng tôi gặp nhau mùa thu 2021, và quyết định về chung một nhà sau những năm tháng yêu thương.');
    set('loveStory', '2021 | Lần đầu gặp nhau | Tình cờ quen tại một quán cà phê nhỏ.\n2023 | Chính thức yêu | Buổi hẹn đầu tiên dưới cơn mưa.\n2026 | Lời cầu hôn | Anh quỳ gối bên bờ biển.');
    set('photoUrl', 'https://picsum.photos/seed/thiepcuoi/1000/640');
    set('gallery', ['https://picsum.photos/seed/tc1/700/700', 'https://picsum.photos/seed/tc2/700/700', 'https://picsum.photos/seed/tc3/700/700'].join('\n'));
    set('timeline', '16:00 | Đón khách\n17:00 | Lễ thành hôn\n18:00 | Khai tiệc');
    set('dressText', 'Trang phục lịch sự, tông pastel');
    set('dressColors', '#d98aa6, #e4f0ea, #c2a14d');
    set('faq', 'Có chỗ gửi xe không? | Có bãi gửi xe miễn phí ngay cạnh nhà hàng.\nMang theo trẻ em được không? | Rất hoan nghênh các bé đến chung vui.');
    set('stays', 'Khách sạn Mường Thanh | Cách nhà hàng 500m, ~600k/đêm | https://booking.com/\nHomestay Hoa Sen | Yên tĩnh, gần trung tâm |');
    set('groomFather', 'Ông Nguyễn Văn An'); set('groomMother', 'Bà Lê Thị Bình');
    set('brideFather', 'Ông Trần Văn Cường'); set('brideMother', 'Bà Phạm Thị Dung');
    set('groomVenueName', 'Tư gia nhà trai'); set('groomTime', '11:00, Chủ Nhật 20/12'); set('groomVenueAddress', '123 Lê Lợi, Quận 1, TP.HCM');
    set('brideVenueName', 'Trung tâm tiệc cưới Hoa Sen'); set('brideTime', '17:30, Thứ Bảy 19/12'); set('brideVenueAddress', '45 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội');
    const gift = document.getElementById('giftEnabled');
    if (gift && !gift.checked) { gift.checked = true; gift.dispatchEvent(new Event('change')); }
    set('giftGroomBank', 'VCB'); set('giftGroomAccount', '0011223344556'); set('giftGroomName', 'NGUYEN MINH DUC');
    set('giftBrideBank', 'TCB'); set('giftBrideAccount', '19001234567'); set('giftBrideName', 'TRAN THUY DUONG');
    btn.textContent = '✓ Đã điền dữ liệu mẫu — chỉnh lại theo ý bạn';
    renderGalleryThumbs();
    pushPreview();
  });
})();

/* ---- Gợi ý nội dung mẫu (không cần AI/API) ---- */
const SUGGESTIONS = {
  invitation: [
    'Trân trọng kính mời quý vị đến chung vui trong ngày trọng đại của chúng tôi. Sự hiện diện của quý vị là niềm vinh hạnh lớn lao cho hai gia đình.',
    'Chúng tôi sắp về chung một nhà! Rất mong được đón tiếp bạn trong ngày hạnh phúc nhất của chúng tôi.',
    'Yêu nhau là cùng nhau nhìn về một hướng. Hôm nay, hướng đi ấy có thêm bạn — người thân thương. Kính mời bạn đến chung vui!',
    'Hai chúng tôi xin trân trọng báo tin vui và kính mời bạn tới dự buổi tiệc chung vui cùng gia đình.',
    'Tình yêu của chúng tôi đã đến ngày đơm hoa kết trái. Sự góp mặt của bạn sẽ làm ngày vui thêm trọn vẹn.',
  ],
  story: [
    'Chúng tôi gặp nhau như một cái duyên, rồi cùng nhau đi qua bao buồn vui. Hôm nay, chúng tôi chọn nắm tay nhau đến hết cuộc đời.',
    'Từ hai người xa lạ, chúng tôi trở thành tri kỷ, rồi thành người thương. Hành trình ấy giờ bước sang một chương mới mang tên "gia đình".',
    'Cảm ơn vì đã gặp được nhau giữa hàng triệu người, đã chọn nhau mỗi ngày. Và hôm nay, chúng tôi chọn nhau mãi mãi.',
    'Yêu nhau từ những điều giản dị nhất, chúng tôi quyết định viết tiếp câu chuyện đời mình cùng nhau.',
  ],
};
document.querySelectorAll('.suggest-btn[data-target]').forEach((btn) => {
  const target = btn.getAttribute('data-target');
  const list = document.querySelector(`.suggest-list[data-for="${target}"]`);
  const items = SUGGESTIONS[target] || [];
  items.forEach((text) => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'suggest-item';
    opt.textContent = text;
    opt.addEventListener('click', () => {
      const field = document.getElementById(target);
      field.value = text;
      list.hidden = true;
      btn.textContent = '✨ Gợi ý mẫu';
      pushPreview();
    });
    list.appendChild(opt);
  });
  btn.addEventListener('click', () => {
    list.hidden = !list.hidden;
    btn.textContent = list.hidden ? '✨ Gợi ý mẫu' : '✕ Đóng gợi ý';
  });
});

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
let shareTitle = 'Thiệp cưới của chúng tôi';
let shareUrlGlobal = '';
function showResult(slug, manageToken) {
  const origin = location.origin;
  const shareUrl = `${origin}/thiep/${slug}`;
  const manageUrl = `${origin}/quanly/${slug}?token=${manageToken}`;
  document.getElementById('shareLink').value = shareUrl;
  document.getElementById('manageLink').value = manageUrl;
  document.getElementById('openInvite').href = shareUrl;
  document.getElementById('openPrint').href = `/in.html?slug=${encodeURIComponent(slug)}`;
  document.getElementById('linkTrai').value = `${shareUrl}?ben=trai`;
  document.getElementById('linkGai').value = `${shareUrl}?ben=gai`;
  // Chia sẻ nhanh: Facebook sharer + Web Share (Zalo/Messenger trên di động)
  const groom = (document.getElementById('groom').value || '').trim();
  const bride = (document.getElementById('bride').value || '').trim();
  shareTitle = groom && bride ? `Thiệp cưới ${groom} & ${bride}` : 'Thiệp cưới của chúng tôi';
  shareUrlGlobal = shareUrl;
  document.getElementById('shareFb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

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

document.getElementById('shareNative').addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({ title: shareTitle, text: shareTitle, url: shareUrlGlobal }); }
    catch (err) { /* người dùng huỷ */ }
  } else {
    copy(shareUrlGlobal);
    showToast('Đã sao chép link — dán vào Zalo/Messenger để gửi');
  }
});
document.getElementById('copyShare').addEventListener('click', () => copy(document.getElementById('shareLink').value));
document.getElementById('copyManage').addEventListener('click', () => copy(document.getElementById('manageLink').value));
document.getElementById('copyTrai').addEventListener('click', () => copy(document.getElementById('linkTrai').value));
document.getElementById('copyGai').addEventListener('click', () => copy(document.getElementById('linkGai').value));
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
    try { localStorage.removeItem('thiep-draft'); } catch (e) {} // đã tạo xong -> bỏ nháp
    showResult(json.slug, json.manageToken);
  } catch (err) {
    formErr.textContent = err.message;
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = '✦ Tạo thiệp & lấy link chia sẻ';
  }
});

/* ---- Tự lưu bản nháp vào localStorage (tránh mất dữ liệu khi lỡ tải lại) ---- */
const DRAFT_KEY = 'thiep-draft';
function saveDraft() {
  const data = {};
  form.querySelectorAll('input, textarea, select').forEach((el) => {
    if (!el.id || el.type === 'file') return;
    data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); }
  catch (e) {
    delete data.photoUrl; delete data.gallery; // ảnh data-URI nặng -> bỏ khi vượt quota
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (e2) {}
  }
}
function restoreDraft() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { return; }
  if (!data || typeof data !== 'object') return;
  Object.keys(data).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      if (el.checked !== data[id]) { el.checked = data[id]; el.dispatchEvent(new Event('change')); }
    } else { el.value = data[id]; }
  });
  if (typeof renderGalleryThumbs === 'function') renderGalleryThumbs();
  pushPreview();
  showToast('♻️ Đã khôi phục bản nháp lần trước');
}
let draftTimer;
form.addEventListener('input', () => { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 700); });
form.addEventListener('change', saveDraft);
restoreDraft();
