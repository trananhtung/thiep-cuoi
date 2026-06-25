// Serves frontend/dist on a static server and checks each tool/content page renders cleanly.
// Run: node test/pages-smoke.mjs   (Playwright is in the repo root node_modules)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../frontend/dist/', import.meta.url).pathname;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png', '.webmanifest':'application/manifest+json', '.json':'application/json' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(ROOT, normalize(p));
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(8131, r));
const base = 'http://localhost:8131';

const EXEC = '/home/tungtran/.cache/ms-playwright/chromium-1148/chrome-linux/chrome';
const fs = await import('node:fs');
const browser = await chromium.launch({ executablePath: fs.existsSync(EXEC) ? EXEC : undefined, args: ['--no-sandbox'] });
let fails = 0;
const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ FAIL ') + m); if (!c) fails++; };

async function page(path, fn) {
  const pg = await browser.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto(base + path, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(400);
  await fn(pg);
  check(errs.length === 0, `${path} no console/page errors` + (errs.length ? ' -> ' + errs.slice(0,3).join(' | ') : ''));
  await pg.close();
}

console.log('• tool/content pages smoke');
await page('/quyen-rieng-tu.html', async (p) => check((await p.locator('h1').innerText()).includes('quyền riêng tư'), 'privacy heading'));
await page('/nghi-le.html', async (p) => { check(await p.locator('#tabs button').count() === 4, 'nghi-le 4 tabs'); await p.locator('#tabs button').nth(1).click(); await p.waitForTimeout(150); check((await p.locator('#panel').innerText()).length > 20, 'nghi-le panel renders on tab switch'); });
await page('/mam-qua.html', async (p) => { check(await p.locator('#countSel option').count() > 0, 'mam-qua counts populated'); check((await p.locator('#checklist').innerText()).length > 0, 'mam-qua items render'); });
await page('/checklist.html', async (p) => { check(await p.locator('#weddingDate').inputValue() !== '', 'checklist default date set'); check((await p.locator('#out').innerText()).length > 20, 'checklist phases render'); });
await page('/ngan-sach.html', async (p) => { check(await p.locator('#rows tr').count() >= 1, 'ngan-sach rows render'); check((await p.locator('#summary').innerText()).length > 0, 'ngan-sach summary renders'); });
await page('/xem-ngay.html', async (p) => { await p.fill('#brideYear','1996'); await p.fill('#groomYear','1994'); await p.fill('#weddingYear','2026'); await p.locator('#form button[type="submit"]').click(); await p.waitForTimeout(200); check((await p.locator('#result').innerText()).length > 10, 'xem-ngay Kim Lâu result renders'); });
await page('/mau-thiep.html', async (p) => { check(await p.locator('#grid a').count() === 12, 'mau-thiep 12 cards'); await p.locator('.cat[data-cat="toi-gian"]').click(); await p.waitForTimeout(150); const vis = await p.locator('#grid a:visible').count(); check(vis > 0 && vis < 12, `mau-thiep filter narrows (${vis} visible)`); });

await browser.close();
server.close();
console.log(fails ? `\nFAILED: ${fails}` : '\nALL SMOKE CHECKS PASSED');
process.exit(fails ? 1 : 0);
