'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Giới hạn 3mb để chứa ảnh khách mời (đã thu nhỏ phía client) dưới dạng data URL.
app.use(express.json({ limit: '3mb' }));
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  },
}));

/* ---------- helpers ---------- */

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
function randomId(len) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const VALID_TEMPLATES = ['truyen-thong', 'hien-dai', 'pastel', 'hoang-gia', 'xanh-la', 'do-ruou', 'anh-dao', 'long-phung', 'mai-trang', 'lam-ngoc'];

function cleanText(v, max = 500) {
  if (v == null) return '';
  return String(v).slice(0, max);
}

// Nhận album ảnh: mảng URL, hoặc chuỗi mỗi dòng 1 URL. Tối đa 12 ảnh.
// Chỉ tách theo dòng (KHÔNG theo dấu phẩy) vì URL/data-URI có thể chứa dấu phẩy.
function parseGallery(v) {
  let list = [];
  if (Array.isArray(v)) list = v;
  else if (typeof v === 'string') list = v.split(/\r?\n/);
  return list
    .map((s) => cleanText(s, 1000).trim())
    .filter((s) => s.length > 0)
    .slice(0, 12);
}

// Các sự kiện cưới: mỗi dòng "tên | thời gian | địa điểm | link maps". Tối đa 10.
function parseEvents(v) {
  const mk = (name, time, place, mapUrl) => ({
    name: cleanText(name, 100).trim(),
    time: cleanText(time, 100).trim(),
    place: cleanText(place, 250).trim(),
    mapUrl: /^https?:\/\//i.test(String(mapUrl || '').trim()) ? cleanText(mapUrl, 500).trim() : '',
  });
  if (Array.isArray(v)) {
    return v.map((it) => mk(it && it.name, it && it.time, it && it.place, it && it.mapUrl))
      .filter((it) => it.name || it.place).slice(0, 10);
  }
  const lines = typeof v === 'string' ? v.split(/\r?\n/) : [];
  return lines.map((line) => {
    const p = String(line).split('|');
    return mk(p[0], p[1], p[2], p[3]);
  }).filter((it) => it.name || it.place).slice(0, 10);
}

// Hành trình tình yêu: mỗi dòng "thời gian | tiêu đề | mô tả | link ảnh". Tối đa 12 mốc.
function parseLoveStory(v) {
  const mk = (time, title, desc, photo) => ({
    time: cleanText(time, 60).trim(),
    title: cleanText(title, 120).trim(),
    desc: cleanText(desc, 400).trim(),
    photo: /^https?:\/\/|^data:image\//i.test(String(photo || '').trim()) ? cleanText(photo, 600).trim() : '',
  });
  if (Array.isArray(v)) {
    return v.map((it) => mk(it && it.time, it && it.title, it && it.desc, it && it.photo))
      .filter((it) => it.title || it.desc).slice(0, 12);
  }
  const lines = typeof v === 'string' ? v.split(/\r?\n/) : [];
  return lines.map((line) => {
    const p = String(line).split('|');
    return mk(p[0], p[1], p[2], p[3]);
  }).filter((it) => it.title || it.desc).slice(0, 12);
}

// Lịch trình: mảng {time,title} hoặc chuỗi mỗi dòng "thời gian | sự kiện". Tối đa 15 mục.
function parseTimeline(v) {
  let lines = [];
  if (Array.isArray(v)) {
    return v.map((it) => ({
      time: cleanText(it && it.time, 40).trim(),
      title: cleanText(it && it.title, 120).trim(),
    })).filter((it) => it.time || it.title).slice(0, 15);
  }
  if (typeof v === 'string') lines = v.split(/\r?\n/);
  return lines.map((line) => {
    const parts = String(line).split('|');
    const time = cleanText(parts[0], 40).trim();
    const title = cleanText(parts.slice(1).join('|'), 120).trim();
    return parts.length > 1 ? { time, title } : { time: '', title: cleanText(line, 120).trim() };
  }).filter((it) => it.time || it.title).slice(0, 15);
}

// Nơi lưu trú: mảng {name,note,url} hoặc chuỗi mỗi dòng "tên | ghi chú | link". Tối đa 12.
function parseStays(v) {
  const mk = (name, note, url) => ({
    name: cleanText(name, 150).trim(),
    note: cleanText(note, 250).trim(),
    url: /^https?:\/\//i.test(String(url || '').trim()) ? cleanText(url, 500).trim() : '',
  });
  if (Array.isArray(v)) {
    return v.map((it) => mk(it && it.name, it && it.note, it && it.url)).filter((it) => it.name).slice(0, 12);
  }
  const lines = typeof v === 'string' ? v.split(/\r?\n/) : [];
  return lines.map((line) => {
    const p = String(line).split('|');
    return mk(p[0], p[1], p[2]);
  }).filter((it) => it.name).slice(0, 12);
}

// Hỏi-Đáp: mảng {q,a} hoặc chuỗi mỗi dòng "câu hỏi | trả lời". Tối đa 20 mục.
function parseFaq(v) {
  if (Array.isArray(v)) {
    return v.map((it) => ({
      q: cleanText(it && it.q, 200).trim(),
      a: cleanText(it && it.a, 600).trim(),
    })).filter((it) => it.q && it.a).slice(0, 20);
  }
  const lines = typeof v === 'string' ? v.split(/\r?\n/) : [];
  return lines.map((line) => {
    const parts = String(line).split('|');
    return { q: cleanText(parts[0], 200).trim(), a: cleanText(parts.slice(1).join('|'), 600).trim() };
  }).filter((it) => it.q && it.a).slice(0, 20);
}

// Màu dress code: chuỗi/mảng hex, tối đa 6 màu.
function parseColors(v) {
  let list = Array.isArray(v) ? v : String(v || '').split(/[,\s]+/);
  return list
    .map((s) => String(s).trim())
    .filter((s) => /^#?[0-9a-fA-F]{6}$/.test(s))
    .map((s) => (s[0] === '#' ? s : '#' + s).toLowerCase())
    .slice(0, 6);
}

/* ---------- API ---------- */

// Tạo thiệp mới
app.post('/api/invitations', (req, res) => {
  const body = req.body || {};
  const groom = cleanText(body.groom, 80).trim();
  const bride = cleanText(body.bride, 80).trim();
  const weddingDate = cleanText(body.weddingDate, 40).trim();

  if (!groom || !bride) {
    return res.status(400).json({ error: 'Vui lòng nhập tên cô dâu và chú rể.' });
  }
  if (!weddingDate) {
    return res.status(400).json({ error: 'Vui lòng chọn ngày cưới.' });
  }

  const template = VALID_TEMPLATES.includes(body.template) ? body.template : 'truyen-thong';

  const data = {
    groom,
    bride,
    weddingDate,                                  // ISO datetime-local string
    invitation: cleanText(body.invitation, 600),
    story: cleanText(body.story, 1000),
    loveStory: parseLoveStory(body.loveStory),
    photoUrl: cleanText(body.photoUrl, 500).trim(),
    gallery: parseGallery(body.gallery),
    musicUrl: cleanText(body.musicUrl, 500).trim(),
    livestreamUrl: /^https?:\/\//i.test(String(body.livestreamUrl || '').trim()) ? cleanText(body.livestreamUrl, 500).trim() : '',
    intro: body.intro !== 'off' && body.intro !== false, // hiệu ứng mở thiệp, mặc định bật
    saveTheDate: body.saveTheDate === true || body.saveTheDate === 'on' || body.saveTheDate === 'yes',
    thankYou: {
      enabled: body.thankYouEnabled === true || body.thankYouEnabled === 'on' || body.thankYouEnabled === 'yes',
      message: cleanText(body.thankYouMsg, 600),
    },
    faq: parseFaq(body.faq),
    events: parseEvents(body.events),
    stays: parseStays(body.stays),
    timeline: parseTimeline(body.timeline),
    dressCode: {
      text: cleanText(body.dressText, 200).trim(),
      colors: parseColors(body.dressColors),
    },
    // Cha mẹ hai bên (cấu trúc 2 gia đình)
    parents: {
      groomFather: cleanText(body.groomFather, 120),
      groomMother: cleanText(body.groomMother, 120),
      brideFather: cleanText(body.brideFather, 120),
      brideMother: cleanText(body.brideMother, 120),
    },
    groomVenue: {
      name: cleanText(body.groomVenueName, 200),
      address: cleanText(body.groomVenueAddress, 300),
      mapUrl: cleanText(body.groomMapUrl, 500).trim(),
      time: cleanText(body.groomTime, 80),
      ceremony: cleanText(body.groomCeremony, 40),    // Lễ Tân Hôn (nhà trai)
    },
    brideVenue: {
      name: cleanText(body.brideVenueName, 200),
      address: cleanText(body.brideVenueAddress, 300),
      mapUrl: cleanText(body.brideMapUrl, 500).trim(),
      time: cleanText(body.brideTime, 80),
      ceremony: cleanText(body.brideCeremony, 40),    // Lễ Vu Quy (nhà gái)
    },
    // Hộp mừng cưới (opt-in) — mặc định tắt, trình bày tế nhị
    gift: {
      enabled: body.giftEnabled === true || body.giftEnabled === 'on' || body.giftEnabled === 'yes',
      note: cleanText(body.giftNote, 300),
      groom: {
        bank: cleanText(body.giftGroomBank, 40).trim(),
        account: cleanText(body.giftGroomAccount, 40).replace(/[^0-9A-Za-z]/g, ''),
        name: cleanText(body.giftGroomName, 120).trim(),
      },
      bride: {
        bank: cleanText(body.giftBrideBank, 40).trim(),
        account: cleanText(body.giftBrideAccount, 40).replace(/[^0-9A-Za-z]/g, ''),
        name: cleanText(body.giftBrideName, 120).trim(),
      },
    },
  };

  let slug;
  const base = slugify(`${groom}-${bride}`) || 'thiep-cuoi';
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = `${base}-${randomId(5)}`;
    const exists = db.prepare('SELECT 1 FROM invitations WHERE slug = ?').get(candidate);
    if (!exists) { slug = candidate; break; }
  }
  if (!slug) return res.status(500).json({ error: 'Không tạo được mã thiệp, thử lại.' });

  const manageToken = randomId(16);
  db.prepare(
    `INSERT INTO invitations (slug, manage_token, template, data, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(slug, manageToken, template, JSON.stringify(data), new Date().toISOString());

  res.status(201).json({ slug, manageToken });
});

// Lấy dữ liệu thiệp công khai
app.get('/api/invitations/:slug', (req, res) => {
  const row = db.prepare('SELECT slug, template, data, seating, created_at FROM invitations WHERE slug = ?')
    .get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  let hasSeating = false;
  try {
    const s = JSON.parse(row.seating || '{}');
    hasSeating = Array.isArray(s.tables) && s.tables.some((tb) => tb && Array.isArray(tb.guests) && tb.guests.length);
  } catch (e) {}
  res.json({
    slug: row.slug,
    template: row.template,
    data: JSON.parse(row.data),
    hasSeating,
    createdAt: row.created_at,
  });
});

// Tra cứu bàn của khách (công khai) — chỉ trả tên bàn của đúng người hỏi
app.get('/api/invitations/:slug/find-table', (req, res) => {
  const row = db.prepare('SELECT seating FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  const q = cleanText(req.query.name, 80).trim().toLowerCase();
  if (!q) return res.status(400).json({ error: 'Vui lòng nhập tên.' });
  let seating = { tables: [] };
  try { seating = JSON.parse(row.seating || '{}'); } catch (e) {}
  let table = '';
  (seating.tables || []).forEach((tb) => {
    if (tb && Array.isArray(tb.guests) && tb.guests.some((g) => String(g).trim().toLowerCase() === q)) {
      table = tb.name || 'Bàn';
    }
  });
  res.json({ found: !!table, table });
});

// Đếm lượt xem thiệp (gọi từ trang thiệp công khai, không tính chế độ xem trước)
app.post('/api/invitations/:slug/view', (req, res) => {
  const info = db.prepare('UPDATE invitations SET views = views + 1 WHERE slug = ?').run(req.params.slug);
  if (!info.changes) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  const row = db.prepare('SELECT views FROM invitations WHERE slug = ?').get(req.params.slug);
  res.json({ views: row.views });
});

// Gửi RSVP
app.post('/api/invitations/:slug/rsvp', (req, res) => {
  const inv = db.prepare('SELECT slug FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });

  const body = req.body || {};
  const name = cleanText(body.name, 120).trim();
  if (!name) return res.status(400).json({ error: 'Vui lòng nhập tên của bạn.' });
  // PDPL/NĐ 356/2025: bắt buộc có sự đồng ý xử lý dữ liệu cá nhân
  if (body.consent !== true && body.consent !== 'yes' && body.consent !== 'on') {
    return res.status(400).json({ error: 'Vui lòng đồng ý cho phép lưu thông tin để tiếp tục.' });
  }

  const attending = body.attending === false || body.attending === 'no' ? 0 : 1;
  let guests = parseInt(body.guests, 10);
  if (!Number.isFinite(guests) || guests < 1) guests = 1;
  if (guests > 20) guests = 20;
  const message = cleanText(body.message, 500);
  const diet = body.diet === 'chay' ? 'chay' : 'man';

  db.prepare(
    `INSERT INTO rsvps (slug, name, attending, guests, message, diet, consent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(req.params.slug, name, attending, attending ? guests : 0, message, diet, new Date().toISOString());

  res.status(201).json({ ok: true });
});

// Danh sách RSVP (cần token quản lý)
app.get('/api/invitations/:slug/rsvps', (req, res) => {
  const inv = db.prepare('SELECT manage_token, views, seating FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  if (!req.query.token || req.query.token !== inv.manage_token) {
    return res.status(403).json({ error: 'Mã quản lý không đúng.' });
  }
  const rows = db.prepare(
    'SELECT id, name, attending, guests, message, diet, created_at FROM rsvps WHERE slug = ? ORDER BY id DESC'
  ).all(req.params.slug);

  const attendingRows = rows.filter(r => r.attending);
  const totalGuests = attendingRows.reduce((s, r) => s + r.guests, 0);
  const vegGuests = attendingRows.filter(r => r.diet === 'chay').reduce((s, r) => s + r.guests, 0);

  let seating = { tables: [], pool: [] };
  try { seating = JSON.parse(inv.seating || '{}'); } catch (e) {}

  res.json({
    rsvps: rows,
    seating,
    stats: {
      total: rows.length,
      attending: attendingRows.length,
      declined: rows.length - attendingRows.length,
      totalGuests,
      vegGuests,
      views: inv.views || 0,
    },
  });
});

// Xoá một RSVP (quyền xoá dữ liệu cá nhân — cần token quản lý)
app.delete('/api/invitations/:slug/rsvps/:id', (req, res) => {
  const inv = db.prepare('SELECT manage_token FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  if (!req.query.token || req.query.token !== inv.manage_token) {
    return res.status(403).json({ error: 'Mã quản lý không đúng.' });
  }
  const info = db.prepare('DELETE FROM rsvps WHERE id = ? AND slug = ?').run(req.params.id, req.params.slug);
  res.json({ ok: true, deleted: info.changes });
});

// Lưu sơ đồ bàn tiệc (cần token quản lý)
app.post('/api/invitations/:slug/seating', (req, res) => {
  const inv = db.prepare('SELECT manage_token FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  if (!req.query.token || req.query.token !== inv.manage_token) {
    return res.status(403).json({ error: 'Mã quản lý không đúng.' });
  }
  const body = req.body || {};
  const cleanNames = (arr) => (Array.isArray(arr) ? arr : [])
    .map((n) => cleanText(n, 80).trim()).filter(Boolean).slice(0, 500);
  const tables = (Array.isArray(body.tables) ? body.tables : []).slice(0, 100).map((tb) => ({
    name: cleanText(tb && tb.name, 60).trim() || 'Bàn',
    guests: cleanNames(tb && tb.guests),
  }));
  const seating = { tables, pool: cleanNames(body.pool) };
  db.prepare('UPDATE invitations SET seating = ? WHERE slug = ?')
    .run(JSON.stringify(seating), req.params.slug);
  res.json({ ok: true, seating });
});

// Sổ lưu bút công khai: danh sách lời chúc (chỉ tên + lời chúc, không cần token)
app.get('/api/invitations/:slug/wishes', (req, res) => {
  const inv = db.prepare('SELECT slug FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  const rows = db.prepare(
    `SELECT name, attending, message, created_at FROM rsvps
     WHERE slug = ? AND message IS NOT NULL AND TRIM(message) <> ''
     ORDER BY id DESC LIMIT 100`
  ).all(req.params.slug);
  res.json({ wishes: rows, total: rows.length });
});

// Album ảnh khách đóng góp: upload (data URL ảnh đã thu nhỏ phía client)
const IMG_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_PHOTOS = 200;
const MAX_BYTES_PER_SLUG = 60 * 1024 * 1024; // hạn mức dung lượng mỗi thiệp (chống cạn đĩa)

// Kiểm tra magic-byte khớp MIME khai báo (chặn giả mạo / nội dung không phải ảnh)
function imageMagicOk(buf, mime) {
  if (mime === 'image/jpeg') return buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  if (mime === 'image/png') return buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 && buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
  if (mime === 'image/webp') return buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

app.post('/api/invitations/:slug/photos', (req, res) => {
  const inv = db.prepare('SELECT slug FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });

  const body = req.body || {};
  if (body.consent !== true && body.consent !== 'yes' && body.consent !== 'on') {
    return res.status(400).json({ error: 'Vui lòng đồng ý cho phép lưu ảnh để tiếp tục.' });
  }
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
  if (!m) return res.status(400).json({ error: 'Ảnh không hợp lệ.' });
  const ext = IMG_EXT[m[1]];
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length === 0) return res.status(400).json({ error: 'Ảnh rỗng.' });
  if (buf.length > 2 * 1024 * 1024) return res.status(413).json({ error: 'Ảnh quá lớn (tối đa 2MB).' });
  if (!imageMagicOk(buf, m[1])) return res.status(400).json({ error: 'Tệp không phải ảnh hợp lệ.' });

  const agg = db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(bytes),0) AS total FROM photos WHERE slug = ?')
    .get(req.params.slug);
  if (agg.n >= MAX_PHOTOS) return res.status(429).json({ error: 'Album đã đầy (tối đa 200 ảnh).' });
  if (agg.total + buf.length > MAX_BYTES_PER_SLUG) return res.status(429).json({ error: 'Album đã đạt giới hạn dung lượng.' });

  const dir = path.join(UPLOADS_DIR, req.params.slug);
  const id = randomId(12);
  const file = id + '.' + ext;
  const filePath = path.join(dir, file);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buf);
  } catch (e) {
    return res.status(500).json({ error: 'Không lưu được ảnh, thử lại.' });
  }

  const uploader = cleanText(body.uploader, 80).trim();
  try {
    db.prepare('INSERT INTO photos (id, slug, file, uploader, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.params.slug, file, uploader, buf.length, new Date().toISOString());
  } catch (e) {
    try { fs.unlinkSync(filePath); } catch (_) {} // dọn file mồ côi nếu ghi DB lỗi
    return res.status(500).json({ error: 'Không lưu được ảnh, thử lại.' });
  }

  res.status(201).json({ id, url: `/uploads/${req.params.slug}/${file}`, uploader });
});

app.get('/api/invitations/:slug/photos', (req, res) => {
  const inv = db.prepare('SELECT slug FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  const rows = db.prepare(
    'SELECT id, file, uploader, created_at FROM photos WHERE slug = ? ORDER BY created_at DESC, id DESC LIMIT 200'
  ).all(req.params.slug);
  res.json({
    photos: rows.map((r) => ({
      id: r.id, url: `/uploads/${req.params.slug}/${r.file}`, uploader: r.uploader, createdAt: r.created_at,
    })),
    total: rows.length,
  });
});

/* ---------- Pages ---------- */

// Escape cho giá trị thuộc tính HTML (meta tag)
function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

// Trang thiệp công khai — chèn thẻ Open Graph server-side để link share đẹp (Zalo/FB/Messenger).
app.get('/thiep/:slug', (req, res) => {
  let html = fs.readFileSync(path.join(PUBLIC_DIR, 'invite.html'), 'utf8');
  const row = db.prepare('SELECT data FROM invitations WHERE slug = ?').get(req.params.slug);
  if (row) {
    let d = {};
    try { d = JSON.parse(row.data); } catch (e) {}
    const title = `Thiệp cưới ${d.groom || ''} & ${d.bride || ''}`.trim();
    const desc = ((d.invitation || '').trim() || 'Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi!').slice(0, 200);
    const url = `${req.protocol}://${req.get('host')}/thiep/${encodeURIComponent(req.params.slug)}`;
    let img = (d.photoUrl || '').trim();
    if (!/^https?:\/\//i.test(img) && Array.isArray(d.gallery)) {
      img = (d.gallery.find((g) => /^https?:\/\//i.test(g)) || '').trim();
    }
    if (!/^https?:\/\//i.test(img)) img = '';

    const tags = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Thiệp Cưới Online" />`,
      `<meta property="og:title" content="${escAttr(title)}" />`,
      `<meta property="og:description" content="${escAttr(desc)}" />`,
      `<meta property="og:url" content="${escAttr(url)}" />`,
      img ? `<meta property="og:image" content="${escAttr(img)}" />` : '',
      `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
      `<meta name="twitter:title" content="${escAttr(title)}" />`,
      `<meta name="twitter:description" content="${escAttr(desc)}" />`,
      img ? `<meta name="twitter:image" content="${escAttr(img)}" />` : '',
    ].filter(Boolean).join('\n  ');

    html = html.replace('</head>', '  ' + tags + '\n</head>');
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escAttr(title)}</title>`);
  }
  res.set('Content-Type', 'text/html; charset=utf-8').send(html);
});

app.get('/quanly/:slug', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'manage.html'));
});

app.get('/mau-thiep', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'mau-thiep.html'));
});

app.get('/xem-ngay', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'xem-ngay.html'));
});

app.get('/mam-qua', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'mam-qua.html'));
});

app.get('/checklist', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'checklist.html'));
});

app.get('/nghi-le', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'nghi-le.html'));
});

app.get('/ngan-sach', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'ngan-sach.html'));
});

app.get('/quyen-rieng-tu', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'quyen-rieng-tu.html'));
});

app.use(express.static(PUBLIC_DIR));

app.use((_req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Thiệp cưới chạy tại http://localhost:${PORT}`);
  });
}

module.exports = app;
