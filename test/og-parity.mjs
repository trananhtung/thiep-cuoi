// Verifies Rust OG string-injection still works on the Astro-built dist/invite.html.
// Prereq: Rust running with PUBLIC_DIR=frontend/dist on :3000.
const BASE = process.env.BASE || 'http://localhost:3000';

const groom = 'Nguyễn Minh Đức';
const bride = 'Trần Thuỳ Dương';

const create = await fetch(`${BASE}/api/invitations`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    groom, bride,
    weddingDate: '2026-12-12',
    invitation: 'Trân trọng kính mời quý vị đến chung vui cùng gia đình chúng tôi trong ngày trọng đại.',
  }),
});
if (!create.ok) { console.error('create failed', create.status); process.exit(1); }
const { slug } = await create.json();
if (!slug) { console.error('no slug in create response'); process.exit(1); }

const html = await (await fetch(`${BASE}/thiep/${slug}`)).text();
// NOTE: Rust escapes the replaced <title> via esc_attr (pages.rs), so the
// literal " & " separator renders as " &amp; " — assert the escaped form.
const want = [
  `<title>Thiệp cưới ${groom} &amp; ${bride}</title>`,
  `<meta property="og:title" content="Thiệp cưới ${groom.replace(/&/g,'&amp;')} &amp; ${bride}" />`,
  `<meta property="og:site_name" content="Thiệp Cưới Online" />`,
  `<meta name="twitter:card" content="summary" />`,
];
let ok = true;
for (const s of want) {
  if (html.includes(s)) { console.log('  ✓', s); }
  else { console.log('  ✗ MISSING:', s); ok = false; }
}
if (!html.includes('</head>')) { console.log('  ✗ </head> literal gone'); ok = false; }
process.exit(ok ? 0 : 1);
