'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json({ limit: '256kb' }));

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

const VALID_TEMPLATES = ['truyen-thong', 'hien-dai', 'pastel'];

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
    photoUrl: cleanText(body.photoUrl, 500).trim(),
    gallery: parseGallery(body.gallery),
    musicUrl: cleanText(body.musicUrl, 500).trim(),
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
  const row = db.prepare('SELECT slug, template, data, created_at FROM invitations WHERE slug = ?')
    .get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  res.json({
    slug: row.slug,
    template: row.template,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
  });
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

  const attending = body.attending === false || body.attending === 'no' ? 0 : 1;
  let guests = parseInt(body.guests, 10);
  if (!Number.isFinite(guests) || guests < 1) guests = 1;
  if (guests > 20) guests = 20;
  const message = cleanText(body.message, 500);

  db.prepare(
    `INSERT INTO rsvps (slug, name, attending, guests, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.params.slug, name, attending, attending ? guests : 0, message, new Date().toISOString());

  res.status(201).json({ ok: true });
});

// Danh sách RSVP (cần token quản lý)
app.get('/api/invitations/:slug/rsvps', (req, res) => {
  const inv = db.prepare('SELECT manage_token, views FROM invitations WHERE slug = ?').get(req.params.slug);
  if (!inv) return res.status(404).json({ error: 'Không tìm thấy thiệp.' });
  if (!req.query.token || req.query.token !== inv.manage_token) {
    return res.status(403).json({ error: 'Mã quản lý không đúng.' });
  }
  const rows = db.prepare(
    'SELECT name, attending, guests, message, created_at FROM rsvps WHERE slug = ? ORDER BY id DESC'
  ).all(req.params.slug);

  const attendingRows = rows.filter(r => r.attending);
  const totalGuests = attendingRows.reduce((s, r) => s + r.guests, 0);

  res.json({
    rsvps: rows,
    stats: {
      total: rows.length,
      attending: attendingRows.length,
      declined: rows.length - attendingRows.length,
      totalGuests,
      views: inv.views || 0,
    },
  });
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

/* ---------- Pages ---------- */

app.get('/thiep/:slug', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'invite.html'));
});

app.get('/quanly/:slug', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'manage.html'));
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
