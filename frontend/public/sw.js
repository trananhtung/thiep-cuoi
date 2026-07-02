/* Service worker — cho phép xem thiệp OFFLINE (wifi yếu tại nhà hàng tiệc cưới).
 * Chiến lược:
 *  - Tài nguyên tĩnh (css/js/icon): cache-first + cập nhật nền (stale-while-revalidate).
 *  - Điều hướng trang & API GET dữ liệu thiệp: network-first, fallback cache (để mở được offline).
 * Chỉ xử lý GET cùng origin; bỏ qua cross-origin (Google Fonts) và non-GET (POST RSVP...).
 */
'use strict';

const VERSION = 'thiep-v2'; // bump khi đổi JS/CSS lõi để client bỏ cache cũ
const CORE = [
  '/css/base.css',
  '/css/invite.css',
  '/js/qrcode.js',
  '/js/vietqr.js',
  '/js/donate.js',
  '/js/lunar.js',
  '/js/invite.js',
  '/icon.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStatic(url) {
  return /\.(css|js|svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname) || url.pathname === '/manifest.webmanifest';
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // bỏ qua cross-origin (fonts...)

  // Tĩnh: cache-first + cập nhật nền
  if (isStatic(url)) {
    e.respondWith(
      caches.open(VERSION).then((cache) => cache.match(req).then((hit) => {
        const fetchP = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || fetchP;
      }))
    );
    return;
  }

  // Điều hướng trang thiệp + API GET: network-first, fallback cache
  const isInvitePage = req.mode === 'navigate' && url.pathname.startsWith('/thiep/');
  const isInviteApi = url.pathname.startsWith('/api/invitations/') && !url.pathname.includes('/rsvps');
  if (isInvitePage || isInviteApi) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.open(VERSION).then((c) => c.match(req)).then((hit) => hit || Response.error()))
    );
  }
});
