'use strict';
/* Kiểm thử đầu-cuối bằng Playwright: tạo thiệp -> mở thiệp -> RSVP -> quản lý.
   Chụp ảnh từng mẫu để đánh giá thẩm mỹ. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const SHOTS = path.join(__dirname, '..', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const log = (...a) => console.log('•', ...a);
let failures = 0;
function check(cond, msg) {
  if (cond) { console.log('  ✓', msg); }
  else { console.log('  ✗ FAIL:', msg); failures++; }
}

async function fill(page, id, val) {
  await page.fill('#' + id, val);
}

const EXEC = process.env.CHROME_BIN ||
  '/home/tungtran/.cache/ms-playwright/chromium-1148/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({
    executablePath: fs.existsSync(EXEC) ? EXEC : undefined,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

  // 1) Trang soạn thiệp
  log('Mở trang soạn thiệp');
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  check(await page.title() !== '', 'Trang có tiêu đề');
  await page.screenshot({ path: path.join(SHOTS, '01-editor.png'), fullPage: true });

  // điền form
  await fill(page, 'groom', 'Nguyễn Minh Đức');
  await fill(page, 'bride', 'Trần Thuỳ Dương');
  await fill(page, 'weddingDate', '2026-12-20T11:00');
  await fill(page, 'invitation', 'Trân trọng kính mời quý vị đến chung vui cùng gia đình chúng tôi trong ngày trọng đại.');
  await fill(page, 'story', 'Chúng tôi gặp nhau mùa thu 2021, và quyết định về chung một nhà sau 4 năm yêu thương.');
  const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await fill(page, 'gallery', [px, px, px].join('\n'));
  await fill(page, 'musicUrl', 'data:audio/mpeg;base64,SUQzAwAAAAAAAA==');
  await fill(page, 'groomFather', 'Ông Nguyễn Văn An');
  await fill(page, 'groomMother', 'Bà Lê Thị Bình');
  await fill(page, 'brideFather', 'Ông Trần Văn Cường');
  await fill(page, 'brideMother', 'Bà Phạm Thị Dung');
  await fill(page, 'groomVenueName', 'Tư gia nhà trai');
  await fill(page, 'groomTime', '11:00, Chủ Nhật 20/12');
  await fill(page, 'groomVenueAddress', '123 Lê Lợi, Quận 1, TP.HCM');
  await fill(page, 'groomMapUrl', 'https://maps.google.com/?q=10.7769,106.7009');
  await fill(page, 'brideVenueName', 'Trung tâm tiệc cưới Hoa Sen');
  await fill(page, 'brideTime', '17:30, Thứ Bảy 19/12');
  await fill(page, 'brideVenueAddress', '45 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội');

  // chờ preview render trong iframe
  const frame = page.frameLocator('#preview');
  await frame.locator('.names .n1').waitFor({ timeout: 5000 });
  check((await frame.locator('.names .n1').innerText()).includes('Đức'), 'Preview hiển thị tên chú rể');
  check(await frame.locator('#countdown .cd-unit').count() >= 4, 'Preview có đếm ngược 4 đơn vị');

  // Hộp mừng cưới: mặc định TẮT, các trường ẩn
  check(await page.locator('#giftFields').isHidden(), 'Hộp mừng cưới mặc định ẩn (opt-in)');
  await page.click('.switch-row');
  check(await page.locator('#giftEnabled').isChecked(), 'Click công tắc -> bật hộp mừng cưới');
  check(await page.locator('#giftFields').isVisible(), 'Bật công tắc -> hiện trường nhập');
  await page.selectOption('#giftGroomBank', 'VCB');
  await fill(page, 'giftGroomAccount', '0011223344556');
  await fill(page, 'giftGroomName', 'NGUYEN MINH DUC');
  await page.selectOption('#giftBrideBank', 'TCB');
  await fill(page, 'giftBrideAccount', '19001234567');
  await fill(page, 'giftBrideName', 'TRAN THUY DUONG');
  // preview hiện QR mừng cưới
  await frame.locator('#gift-section .gift-qr img').first().waitFor({ timeout: 5000 });
  check(await frame.locator('#gift-section .gift-card').count() === 2, 'Preview hộp mừng cưới có 2 thẻ QR');

  // Tab xem trước phiên bản nhà gái -> preview hiện badge bên
  await page.click('#previewTabs .ptab[data-side="gai"]');
  await frame.locator('.side-badge').waitFor({ timeout: 5000 });
  check((await frame.locator('.side-badge').textContent()).includes('Nhà Gái'), 'Tab xem trước "Nhà gái" hiển thị badge trong preview');
  await page.click('#previewTabs .ptab[data-side=""]'); // reset về Chung
  await page.waitForTimeout(200);
  check(await frame.locator('.side-badge').count() === 0, 'Tab "Chung" không có badge bên');

  // chụp preview từng mẫu
  const templates = ['truyen-thong', 'hien-dai', 'pastel'];
  for (const t of templates) {
    await page.click(`.tpl[data-tpl="${t}"]`);
    await page.waitForTimeout(400);
    await frame.locator('.sheet').waitFor();
    const el = await page.$('#preview');
    await el.screenshot({ path: path.join(SHOTS, `preview-${t}.png`) });
    log('Đã chụp mẫu', t);
  }

  // chọn lại mẫu truyền thống rồi tạo thiệp
  await page.click('.tpl[data-tpl="truyen-thong"]');
  await page.click('#createBtn');
  await page.waitForSelector('#overlay.open', { timeout: 5000 });
  const shareLink = await page.inputValue('#shareLink');
  const manageLink = await page.inputValue('#manageLink');
  check(/\/thiep\//.test(shareLink), 'Có link chia sẻ: ' + shareLink);
  check(/\/quanly\/.*token=/.test(manageLink), 'Có link quản lý kèm token');
  check(await page.locator('#qrbox img').count() === 1, 'Có mã QR');
  // Nhân bản thiệp: 3 link (chung / nhà trai / nhà gái)
  const linkTrai = await page.inputValue('#linkTrai');
  const linkGai = await page.inputValue('#linkGai');
  check(/\/thiep\/.*\?ben=trai$/.test(linkTrai), 'Có link nhà trai (?ben=trai)');
  check(/\/thiep\/.*\?ben=gai$/.test(linkGai), 'Có link nhà gái (?ben=gai)');
  await page.screenshot({ path: path.join(SHOTS, '02-result-modal.png') });

  // 2) Mở thiệp công khai
  log('Mở thiệp công khai', shareLink);
  const invitePage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const inviteErrors = [];
  invitePage.on('pageerror', (e) => inviteErrors.push(e.message));
  await invitePage.goto(shareLink, { waitUntil: 'networkidle' });
  await invitePage.locator('.names').waitFor({ timeout: 5000 });
  check((await invitePage.locator('.names').innerText()).includes('Đức'), 'Thiệp hiển thị tên');
  check(await invitePage.locator('#countdown .cd-num').count() >= 4, 'Thiệp có đếm ngược');

  // Lịch âm: ngày cưới 20/12/2026 -> âm lịch năm Bính Ngọ
  check(await invitePage.locator('.wlunar').count() === 1, 'Thiệp hiển thị ngày âm lịch');
  const lunarTxt = await invitePage.locator('.wlunar').innerText();
  check(/Âm lịch/.test(lunarTxt) && /Bính Ngọ/.test(lunarTxt), 'Ngày âm lịch đúng (năm Bính Ngọ): ' + lunarTxt);
  check(await invitePage.locator('.map-btn').count() >= 2, 'Có 2 nút chỉ đường');

  // Cha mẹ hai bên + loại lễ
  check(await invitePage.locator('.parents .parent-side').count() === 2, 'Có khối cha mẹ 2 bên (nhà trai + nhà gái)');
  check((await invitePage.locator('.parents').innerText()).includes('Nguyễn Văn An'), 'Hiện tên cha nhà trai');
  check((await invitePage.locator('.parents').innerText()).includes('Phạm Thị Dung'), 'Hiện tên mẹ nhà gái');
  const ceremonies = await invitePage.locator('.vceremony').allInnerTexts();
  check(ceremonies.join('|').includes('Lễ Tân Hôn') && ceremonies.join('|').includes('Lễ Vu Quy'),
    'Địa điểm hiện loại lễ (Tân Hôn nhà trai, Vu Quy nhà gái)');

  // Thêm vào lịch
  check(await invitePage.locator('#addIcs').count() === 1, 'Có nút "Thêm vào lịch" (.ics)');
  const icsHref = await invitePage.getAttribute('#addIcs', 'href');
  check(icsHref && icsHref.startsWith('data:text/calendar'), 'Nút .ics dùng data URI lịch');
  check(decodeURIComponent(icsHref || '').includes('BEGIN:VEVENT'), 'File .ics có VEVENT hợp lệ');
  const gcalHref = await invitePage.getAttribute('#addGcal', 'href');
  check(/calendar\.google\.com/.test(gcalHref || '') && /dates=\d{8}T\d{6}\/\d{8}T\d{6}/.test(gcalHref || ''),
    'Link Google Calendar đúng định dạng ngày');

  // Hộp mừng cưới
  await invitePage.locator('#gift-section').waitFor({ state: 'visible', timeout: 5000 });
  check(await invitePage.locator('#gift-section .gift-card').count() === 2, 'Thiệp có 2 thẻ hộp mừng cưới');
  await invitePage.locator('#gift-section .gift-qr img').first().waitFor({ timeout: 5000 });
  check(await invitePage.locator('#gift-section .gift-qr img').count() === 2, 'Có 2 mã QR VietQR');
  check((await invitePage.locator('#gift-section').innerText()).includes('0011223344556'), 'Hiện số tài khoản nhà trai');
  check((await invitePage.locator('#gift-section').innerText()).includes('Vietcombank'), 'Hiện tên ngân hàng (Vietcombank)');

  // Album ảnh + lightbox
  check(await invitePage.locator('.gallery-item').count() === 3, 'Thiệp có album 3 ảnh');
  await invitePage.locator('.gallery-item').first().click();
  check(await invitePage.locator('#lightbox').isVisible(), 'Click ảnh -> mở lightbox');
  await invitePage.locator('#lightboxClose').click();
  check(await invitePage.locator('#lightbox').isHidden(), 'Đóng lightbox');

  // Nhạc nền
  check(await invitePage.locator('#musicToggle').count() === 1, 'Có nút nhạc nền');
  await invitePage.click('#musicToggle');
  check(await invitePage.locator('#musicToggle.playing').count() === 1, 'Bấm nút -> trạng thái đang phát');

  await invitePage.screenshot({ path: path.join(SHOTS, '03-invite-full.png'), fullPage: true });

  // 3) Gửi RSVP
  log('Gửi RSVP');
  await invitePage.fill('#rsvpName', 'Phạm Văn Tuấn');
  await invitePage.selectOption('#rsvpGuests', '2');
  await invitePage.fill('#rsvpMsg', 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui!');
  await invitePage.click('#rsvpBtn');
  await invitePage.locator('.rsvp-thanks').waitFor({ timeout: 5000 });
  check(await invitePage.locator('.rsvp-thanks').count() === 1, 'Hiện lời cảm ơn sau khi RSVP');

  // Sổ lưu bút phải hiện lời chúc vừa gửi
  await invitePage.locator('#wishes-section').waitFor({ state: 'visible', timeout: 5000 });
  await invitePage.locator('.wish-card').first().waitFor({ timeout: 5000 });
  check((await invitePage.locator('.wishes').innerText()).includes('trăm năm hạnh phúc'),
    'Sổ lưu bút hiển thị lời chúc vừa gửi');

  // RSVP người thứ 2 (vắng)
  await invitePage.reload({ waitUntil: 'networkidle' });
  await invitePage.locator('#rsvpForm').waitFor();
  await invitePage.fill('#rsvpName', 'Lê Thị Hoa');
  await invitePage.click('.attend-toggle label:nth-child(2)');
  await invitePage.fill('#rsvpMsg', 'Tiếc quá mình bận, chúc mừng nhé!');
  await invitePage.click('#rsvpBtn');
  await invitePage.locator('.rsvp-thanks').waitFor({ timeout: 5000 });
  check(true, 'RSVP người thứ 2 (vắng mặt) thành công');

  // 4) Trang quản lý
  log('Mở trang quản lý');
  const managePage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await managePage.goto(manageLink, { waitUntil: 'networkidle' });
  await managePage.locator('table tbody tr').first().waitFor({ timeout: 5000 });
  const rowCount = await managePage.locator('table tbody tr').count();
  check(rowCount === 2, `Quản lý hiển thị ${rowCount} phản hồi (mong đợi 2)`);
  const statNums = await managePage.locator('.stat .num').allInnerTexts();
  log('Thống kê:', statNums.join(' / '));
  // Thứ tự: [Lượt xem, Lượt phản hồi, Sẽ tham dự, Tổng số khách, Không tham dự]
  check(parseInt(statNums[0], 10) >= 1, `Đếm lượt xem thiệp >= 1 (thực: ${statNums[0]})`);
  check(statNums[1] === '2', 'Tổng phản hồi = 2');
  check(statNums[3] === '2', 'Tổng số khách = 2');

  // Xuất CSV
  check(await managePage.locator('#exportCsv').count() === 1, 'Có nút tải danh sách CSV');
  const [download] = await Promise.all([
    managePage.waitForEvent('download', { timeout: 5000 }),
    managePage.click('#exportCsv'),
  ]);
  check(/\.csv$/.test(download.suggestedFilename()), 'File tải về có đuôi .csv: ' + download.suggestedFilename());
  const csvPath = path.join(SHOTS, 'export.csv');
  await download.saveAs(csvPath);
  const csvText = fs.readFileSync(csvPath, 'utf8');
  check(csvText.includes('Phạm Văn Tuấn') && csvText.includes('Lê Thị Hoa'), 'CSV chứa tên khách mời');
  check(csvText.charCodeAt(0) === 0xFEFF, 'CSV có BOM UTF-8 (Excel đọc đúng tiếng Việt)');

  await managePage.screenshot({ path: path.join(SHOTS, '04-manage.png'), fullPage: true });

  // 5) Token sai -> bị chặn
  const badPage = await browser.newPage();
  await badPage.goto(shareLink.replace('/thiep/', '/quanly/') + '?token=sai', { waitUntil: 'networkidle' });
  await badPage.locator('.empty').waitFor({ timeout: 5000 });
  check((await badPage.locator('.empty').innerText()).length > 0, 'Token sai bị từ chối');

  // 6) Thiệp không tồn tại
  const nf = await browser.newPage();
  await nf.goto(BASE + '/thiep/khong-ton-tai-xxx', { waitUntil: 'networkidle' });
  await nf.locator('.state-msg').waitFor({ timeout: 5000 });
  check(true, 'Thiệp không tồn tại hiển thị thông báo thân thiện');

  // 7) Nhân bản thiệp: phiên bản nhà trai / nhà gái
  log('Mở phiên bản nhà trai');
  const traiPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await traiPage.goto(linkTrai, { waitUntil: 'networkidle' });
  await traiPage.locator('.side-badge').waitFor({ timeout: 5000 });
  // dùng textContent (không bị CSS text-transform:uppercase ảnh hưởng)
  check((await traiPage.locator('.side-badge').textContent()).includes('Nhà Trai'), 'Phiên bản nhà trai có badge');
  check((await traiPage.locator('.wsub').textContent()).includes('Nhà trai trân trọng'), 'Lời mời theo nhà trai');
  const traiVenues = await traiPage.locator('.venue h4').allTextContents();
  check(traiVenues[0] === 'Nhà trai', 'Phiên bản nhà trai: địa điểm nhà trai hiển thị trước');

  const gaiPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await gaiPage.goto(linkGai, { waitUntil: 'networkidle' });
  await gaiPage.locator('.side-badge').waitFor({ timeout: 5000 });
  check((await gaiPage.locator('.side-badge').textContent()).includes('Nhà Gái'), 'Phiên bản nhà gái có badge');
  check((await gaiPage.locator('.wsub').textContent()).includes('Nhà gái trân trọng'), 'Lời mời theo nhà gái');
  const gaiVenues = await gaiPage.locator('.venue h4').allTextContents();
  check(gaiVenues[0] === 'Nhà gái', 'Phiên bản nhà gái: địa điểm nhà gái hiển thị trước');

  check(consoleErrors.length === 0, 'Không có lỗi console ở trang soạn thiệp' + (consoleErrors.length ? ': ' + consoleErrors.join('; ') : ''));
  check(inviteErrors.length === 0, 'Không có lỗi JS ở trang thiệp' + (inviteErrors.length ? ': ' + inviteErrors.join('; ') : ''));

  await browser.close();
  console.log('\n' + (failures === 0 ? '✅ TẤT CẢ PASS' : `❌ ${failures} kiểm thử THẤT BẠI`));
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('LỖI CHẠY TEST:', e); process.exit(2); });
