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
    groomVenue: {
      name: cleanText(body.groomVenueName, 200),
      address: cleanText(body.groomVenueAddress, 300),
      mapUrl: cleanText(body.groomMapUrl, 500).trim(),
      time: cleanText(body.groomTime, 80),
    },
    brideVenue: {
      name: cleanText(body.brideVenueName, 200),
      address: cleanText(body.brideVenueAddress, 300),
      mapUrl: cleanText(body.brideMapUrl, 500).trim(),
      time: cleanText(body.brideTime, 80),
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
  const inv = db.prepare('SELECT manage_token FROM invitations WHERE slug = ?').get(req.params.slug);
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
