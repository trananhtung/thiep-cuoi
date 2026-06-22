'use strict';
/* Kiểm thử đầu-cuối bằng Playwright: tạo thiệp -> mở thiệp -> RSVP -> quản lý.
   Chụp ảnh từng mẫu để đánh giá thẩm mỹ. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const SHOTS = path.join(__dirname, '..', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

// Ảnh nguồn nhỏ để test upload album khách (PNG 1x1)
const UPLOAD_SRC = path.join(SHOTS, 'upload-src.png');
fs.writeFileSync(UPLOAD_SRC, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));

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
  // Gợi ý nội dung mẫu (P26-lite): mở gợi ý -> chọn 1 mẫu -> điền ô lời mời
  await page.click('.suggest-btn[data-target="invitation"]');
  check(await page.locator('.suggest-list[data-for="invitation"] .suggest-item').count() >= 3, 'Có nhiều gợi ý lời mời mẫu');
  await page.locator('.suggest-list[data-for="invitation"] .suggest-item').first().click();
  check((await page.inputValue('#invitation')).length > 20, 'Chọn gợi ý -> điền ô lời mời');
  await fill(page, 'invitation', 'Trân trọng kính mời quý vị đến chung vui cùng gia đình chúng tôi trong ngày trọng đại.');
  await fill(page, 'story', 'Chúng tôi gặp nhau mùa thu 2021, và quyết định về chung một nhà sau 4 năm yêu thương.');
  await fill(page, 'loveStory', '2019 | Lần đầu gặp nhau | Tình cờ quen tại quán cà phê.\n2021 | Chính thức yêu | Buổi hẹn đầu dưới mưa.\n2025 | Lời cầu hôn | Anh quỳ gối bên bờ biển.');
  const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await fill(page, 'gallery', [px, px, px].join('\n'));
  await fill(page, 'musicUrl', 'data:audio/mpeg;base64,SUQzAwAAAAAAAA==');
  await fill(page, 'timeline', '16:00 | Đón khách\n17:00 | Lễ thành hôn\n18:00 | Khai tiệc');
  await fill(page, 'dressText', 'Trang phục lịch sự, tông pastel');
  await fill(page, 'dressColors', '#d98aa6, #e4f0ea, #c2a14d');
  await fill(page, 'faq', 'Có chỗ gửi xe không? | Có bãi gửi xe miễn phí cạnh nhà hàng.\nMang theo trẻ em được không? | Rất hoan nghênh các bé đến chung vui.');
  await fill(page, 'stays', 'Khách sạn Mường Thanh | Cách 500m, ~600k/đêm | https://booking.com/muongthanh\nHomestay Hoa Sen | Yên tĩnh, gần trung tâm |');
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
  await fill(page, 'events', 'Lễ Ăn Hỏi | 9:00, 18/12 | Tư gia nhà gái | https://maps.google.com/?q=lehoi\nTiệc nhà gái | 18:00, 19/12 | Nhà hàng Hoa Sen |');

  // chờ preview render trong iframe
  const frame = page.frameLocator('#preview');
  await frame.locator('.names .n1').waitFor({ timeout: 5000 });
  check((await frame.locator('.names .n1').innerText()).includes('Đức'), 'Preview hiển thị tên chú rể');
  check(await frame.locator('#countdown .cd-unit').count() >= 4, 'Preview có đếm ngược 4 đơn vị');

  // Hộp mừng cưới: mặc định TẮT, các trường ẩn
  check(await page.locator('#giftFields').isHidden(), 'Hộp mừng cưới mặc định ẩn (opt-in)');
  await page.click('label[for="giftEnabled"]');
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

  // chụp preview từng mẫu (6 mẫu)
  const templates = ['truyen-thong', 'hien-dai', 'pastel', 'hoang-gia', 'xanh-la', 'do-ruou'];
  check(await page.locator('#templates .tpl').count() === 6, 'Có 6 mẫu thiệp để chọn');
  for (const t of templates) {
    await page.click(`.tpl[data-tpl="${t}"]`);
    await page.waitForTimeout(300);
    await frame.locator('.sheet').waitFor();
    check(await frame.locator('.invite.theme-' + t).count() === 1, 'Preview áp đúng mẫu ' + t);
    const el = await page.$('#preview');
    await el.screenshot({ path: path.join(SHOTS, `preview-${t}.png`) });
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

  // Hiệu ứng mở thiệp: hiện overlay rồi đóng để tương tác
  check(await invitePage.locator('#intro').count() === 1, 'Có hiệu ứng mở thiệp (phong bì)');
  await invitePage.click('#introOpen');
  await invitePage.locator('#intro').waitFor({ state: 'hidden', timeout: 4000 });
  check(await invitePage.locator('.sheet.revealed').count() === 1, 'Mở thiệp -> nội dung hé lộ');

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

  // Nhiều sự kiện cưới
  check(await invitePage.locator('.events-section .venue').count() === 2, 'Thiệp có 2 sự kiện cưới');
  check((await invitePage.locator('.events-section').innerText()).includes('Ăn Hỏi'), 'Hiện sự kiện Lễ Ăn Hỏi');
  check(await invitePage.locator('.events-section .map-btn').count() === 2, 'Mỗi sự kiện có nút chỉ đường (link hoặc tự tra địa chỉ)');

  // Hành trình tình yêu (timeline mốc kỷ niệm)
  check(await invitePage.locator('.love-item').count() === 3, 'Thiệp có hành trình tình yêu 3 mốc');
  check((await invitePage.locator('.love-section').innerText()).includes('cầu hôn'), 'Hành trình hiển thị mốc cầu hôn');

  // Lịch trình + dress code
  check(await invitePage.locator('.timeline .tl-item').count() === 3, 'Thiệp có lịch trình 3 mốc');
  check((await invitePage.locator('.timeline').innerText()).includes('Lễ thành hôn'), 'Lịch trình hiển thị đúng sự kiện');
  check((await invitePage.locator('.dress-section').innerText()).includes('pastel'), 'Hiện dress code');
  check(await invitePage.locator('.dress-swatches .swatch-dot').count() === 3, 'Hiện 3 màu chủ đạo');

  // Nơi lưu trú
  check(await invitePage.locator('.stay-card').count() === 2, 'Thiệp có 2 gợi ý lưu trú');
  check((await invitePage.locator('.stay-section').innerText()).includes('Mường Thanh'), 'Hiện tên khách sạn');
  check(await invitePage.locator('.stay-card .map-btn').count() === 1, 'Chỉ khách sạn có link mới có nút đặt phòng');

  // Hỏi & Đáp (FAQ accordion)
  check(await invitePage.locator('.faq-item').count() === 2, 'Thiệp có 2 mục Hỏi & Đáp');
  check((await invitePage.locator('.faq').innerText()).includes('gửi xe'), 'FAQ hiển thị câu hỏi');
  await invitePage.locator('.faq-item').first().locator('.faq-q').click();
  check(await invitePage.locator('.faq-item.open').count() === 1, 'Bấm câu hỏi -> mở đáp án');

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

  // Đa ngôn ngữ: chuyển sang English rồi về Tiếng Việt
  check(await invitePage.locator('#langSwitch').count() === 1, 'Có nút chuyển ngôn ngữ');
  await invitePage.click('.lang-opt[data-lang="en"]');
  await invitePage.locator('.lang-opt[data-lang="en"].active').waitFor({ timeout: 5000 });
  check((await invitePage.locator('#rsvp-section .section-title').textContent()).includes('Will you'), 'Chuyển EN: tiêu đề RSVP sang tiếng Anh');
  check((await invitePage.locator('#countdown .cd-lbl').first().textContent()).match(/Days|Hours/) !== null, 'Chuyển EN: nhãn đếm ngược tiếng Anh');
  await invitePage.click('.lang-opt[data-lang="vi"]');
  await invitePage.locator('.lang-opt[data-lang="vi"].active').waitFor({ timeout: 5000 });
  check((await invitePage.locator('#rsvp-section .section-title').textContent()).includes('Bạn sẽ đến'), 'Quay lại VI: tiêu đề RSVP tiếng Việt');

  // Góc ảnh khách mời: upload ảnh
  check(await invitePage.locator('#guest-album-section').count() === 1, 'Có góc ảnh khách mời');
  await invitePage.setInputFiles('#gaFile', UPLOAD_SRC);
  await invitePage.locator('#guestAlbum .gallery-item img').first().waitFor({ timeout: 8000 });
  check(await invitePage.locator('#guestAlbum .gallery-item').count() >= 1, 'Khách tải được ảnh lên album chung');
  const gaSrc = await invitePage.locator('#guestAlbum img').first().getAttribute('src');
  check(/^\/uploads\//.test(gaSrc || ''), 'Ảnh khách lưu tại /uploads/: ' + gaSrc);

  await invitePage.screenshot({ path: path.join(SHOTS, '03-invite-full.png'), fullPage: true });

  // 3) Gửi RSVP (kèm consent PDPL)
  log('Gửi RSVP');
  await invitePage.fill('#rsvpName', 'Phạm Văn Tuấn');
  await invitePage.selectOption('#rsvpGuests', '2');
  await invitePage.selectOption('#rsvpDiet', 'chay');
  await invitePage.fill('#rsvpMsg', 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui!');
  // consent KHÔNG được tích sẵn + chặn gửi khi chưa đồng ý
  check(!(await invitePage.locator('#rsvpConsent').isChecked()), 'Ô đồng ý KHÔNG tích sẵn (PDPL)');
  await invitePage.click('#rsvpBtn');
  check((await invitePage.locator('#rsvpErr').innerText()).length > 0, 'Chưa đồng ý -> chặn gửi RSVP');
  check(await invitePage.locator('.rsvp-thanks').count() === 0, 'Chưa gửi khi chưa đồng ý');
  await invitePage.check('#rsvpConsent');
  await invitePage.click('#rsvpBtn');
  await invitePage.locator('.rsvp-thanks').waitFor({ timeout: 5000 });
  check(await invitePage.locator('.rsvp-thanks').count() === 1, 'Đồng ý -> RSVP thành công');

  // Sổ lưu bút phải hiện lời chúc vừa gửi
  await invitePage.locator('#wishes-section').waitFor({ state: 'visible', timeout: 5000 });
  await invitePage.locator('.wish-card').first().waitFor({ timeout: 5000 });
  check((await invitePage.locator('.wishes').innerText()).includes('trăm năm hạnh phúc'),
    'Sổ lưu bút hiển thị lời chúc vừa gửi');

  // RSVP người thứ 2 (vắng)
  await invitePage.reload({ waitUntil: 'networkidle' });
  // đóng lại hiệu ứng mở thiệp sau reload
  if (await invitePage.locator('#introOpen').count()) {
    await invitePage.click('#introOpen');
    await invitePage.locator('#intro').waitFor({ state: 'hidden', timeout: 4000 });
  }
  await invitePage.locator('#rsvpForm').waitFor();
  await invitePage.fill('#rsvpName', 'Lê Thị Hoa');
  await invitePage.click('.attend-toggle label:nth-child(2)');
  await invitePage.fill('#rsvpMsg', 'Tiếc quá mình bận, chúc mừng nhé!');
  await invitePage.check('#rsvpConsent');
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
  // Thứ tự: [Lượt xem, Lượt phản hồi, Sẽ tham dự, Tổng số khách, Suất chay, Không tham dự]
  check(parseInt(statNums[0], 10) >= 1, `Đếm lượt xem thiệp >= 1 (thực: ${statNums[0]})`);
  check(statNums[1] === '2', 'Tổng phản hồi = 2');
  check(statNums[3] === '2', 'Tổng số khách = 2');
  check(statNums[4] === '2', 'Suất ăn chay = 2 (RSVP chay, 2 người)');

  // Bộ lọc dashboard
  await managePage.click('#filters .fbtn[data-f="chay"]');
  await managePage.waitForTimeout(150);
  check(await managePage.locator('#rsvpBody tr').count() === 1, 'Lọc "Ăn chay" còn 1 dòng');
  check((await managePage.locator('#rsvpBody').innerText()).includes('Phạm Văn Tuấn'), 'Lọc chay đúng khách ăn chay');
  await managePage.click('#filters .fbtn[data-f="no"]');
  await managePage.waitForTimeout(150);
  check((await managePage.locator('#rsvpBody').innerText()).includes('Lê Thị Hoa'), 'Lọc "Vắng" đúng khách vắng');
  await managePage.click('#filters .fbtn[data-f="all"]');
  await managePage.waitForTimeout(150);
  check(await managePage.locator('#rsvpBody tr').count() === 2, 'Lọc "Tất cả" hiện 2 dòng');

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
  check(csvText.includes('Khẩu phần') && csvText.includes('Ăn chay'), 'CSV có cột khẩu phần + suất chay');

  // Tạo thiệp mời riêng cho từng khách (per-guest)
  await managePage.fill('#ggNames', 'Anh Nguyễn Văn A\nChị Trần Thị B');
  await managePage.click('#ggCreate');
  await managePage.locator('.gg-table tr').first().waitFor({ timeout: 5000 });
  check(await managePage.locator('.gg-table tbody tr').count() === 2, 'Tạo 2 link mời riêng');
  const ggLink0 = await managePage.locator('.gg-table tbody tr').first().locator('.gg-link').textContent();
  check(/\?khach=/.test(ggLink0), 'Link mời riêng có tham số ?khach=');
  check(await managePage.locator('#ggCsv').isVisible(), 'Hiện nút tải CSV link mời riêng');

  // Sơ đồ bàn tiệc: thêm khách + bàn, click-gán, lưu, reload kiểm tra lưu
  check(await managePage.locator('#seating').isVisible(), 'Hiện công cụ sơ đồ bàn tiệc');
  await managePage.fill('#seatGuestName', 'Khách A'); await managePage.click('#seatAddGuest');
  await managePage.fill('#seatGuestName', 'Khách B'); await managePage.click('#seatAddGuest');
  check(await managePage.locator('#seatPool .chip').count() === 2, 'Thêm 2 khách vào "Chưa xếp"');
  await managePage.click('#seatAddTable');
  check(await managePage.locator('#seatTables .seat-table').count() === 1, 'Thêm 1 bàn');
  // click chọn khách đầu rồi click vào bàn để gán
  await managePage.locator('#seatPool .chip').first().click();
  await managePage.locator('#seatTables .seat-zone').first().click();
  check(await managePage.locator('#seatTables .seat-zone .chip').count() === 1, 'Gán 1 khách vào bàn (click)');
  check(await managePage.locator('#seatPool .chip').count() === 1, 'Chưa xếp còn 1 khách');
  await managePage.click('#seatSave');
  await managePage.locator('#ggToast.show').waitFor({ timeout: 5000 });
  // reload kiểm tra sơ đồ đã lưu
  await managePage.reload({ waitUntil: 'networkidle' });
  await managePage.locator('#seatTables .seat-table').first().waitFor({ timeout: 5000 });
  check(await managePage.locator('#seatTables .seat-zone .chip').count() === 1, 'Sơ đồ bàn tiệc được lưu (sau reload)');

  await managePage.screenshot({ path: path.join(SHOTS, '04-manage.png'), fullPage: true });

  // Xoá RSVP (quyền xoá dữ liệu / PDPL) — qua API rồi reload kiểm tra
  const delSlug = shareLink.split('/thiep/')[1];
  const delToken = manageLink.split('token=')[1];
  const beforeDel = await managePage.locator('#rsvpBody tr').count();
  const delResp = await managePage.evaluate(async ({ slug, token }) => {
    const list = await (await fetch(`/api/invitations/${slug}/rsvps?token=${token}`)).json();
    const id = list.rsvps[0].id;
    const r = await fetch(`/api/invitations/${slug}/rsvps/${id}?token=${token}`, { method: 'DELETE' });
    return { ok: r.ok, hasId: typeof id !== 'undefined' };
  }, { slug: delSlug, token: delToken });
  check(delResp.hasId && delResp.ok, 'Xoá RSVP qua API (token) thành công');
  await managePage.reload({ waitUntil: 'networkidle' });
  await managePage.locator('.stat').first().waitFor({ timeout: 5000 });
  const afterDel = await managePage.locator('#rsvpBody tr').count();
  check(afterDel === beforeDel - 1, `Sau xoá còn ${afterDel} dòng (trước ${beforeDel})`);
  // chặn xoá khi token sai
  const delBad = await managePage.evaluate(async ({ slug }) => {
    const r = await fetch(`/api/invitations/${slug}/rsvps/1?token=sai`, { method: 'DELETE' });
    return r.status;
  }, { slug: delSlug });
  check(delBad === 403, 'Token sai không xoá được (403)');

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

  // 8) Thiệp cá nhân hoá theo từng khách (per-guest)
  log('Mở thiệp cá nhân hoá theo khách');
  const guestName = 'Anh Minh Quân';
  const guestPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await guestPage.goto(shareLink + '?khach=' + encodeURIComponent(guestName), { waitUntil: 'networkidle' });
  await guestPage.locator('.guest-greet').waitFor({ timeout: 5000 });
  check((await guestPage.locator('.guest-greet').textContent()).includes(guestName), 'Thiệp hiện lời chào riêng đúng tên khách');
  check((await guestPage.inputValue('#rsvpName')) === guestName, 'Ô RSVP điền sẵn tên khách');

  // 8b) Tra cứu bàn tiệc cho khách (P27)
  log('Tra cứu bàn tiệc');
  const tfResp = await (await fetch(BASE + '/api/invitations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groom: 'A', bride: 'B', weddingDate: '2026-12-20T11:00' }),
  })).json();
  await fetch(BASE + `/api/invitations/${tfResp.slug}/seating?token=${tfResp.manageToken}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tables: [{ name: 'Bàn 1', guests: ['Khách A', 'Khách B'] }], pool: [] }),
  });
  const tfPage = await browser.newPage();
  await tfPage.goto(BASE + '/thiep/' + tfResp.slug, { waitUntil: 'networkidle' });
  if (await tfPage.locator('#introOpen').count()) {
    await tfPage.click('#introOpen');
    await tfPage.locator('#intro').waitFor({ state: 'hidden', timeout: 4000 });
  }
  check(await tfPage.locator('#seatfind-section').count() === 1, 'Có khu vực tìm bàn (thiệp có sơ đồ)');
  await tfPage.fill('#seatFindName', 'Khách A');
  await tfPage.click('#seatFindBtn');
  await tfPage.locator('.seatfind-ok').waitFor({ timeout: 5000 });
  check((await tfPage.locator('.seatfind-result').innerText()).includes('Bàn 1'), 'Tìm đúng bàn của khách');
  await tfPage.fill('#seatFindName', 'Không Có Ai');
  await tfPage.click('#seatFindBtn');
  await tfPage.locator('.seatfind-no').waitFor({ timeout: 5000 });
  check(true, 'Tên không có trong sơ đồ -> báo chưa tìm thấy');
  await tfPage.close();

  // 8c) PWA: manifest + service worker + XEM OFFLINE
  log('Kiểm tra PWA / offline');
  const mani = await (await fetch(BASE + '/manifest.webmanifest')).json();
  check(mani.name && mani.display === 'standalone', 'Có web app manifest (standalone)');
  const swText = await (await fetch(BASE + '/sw.js')).text();
  check(/addEventListener\(['"]fetch/.test(swText) && /caches/.test(swText), 'Có service worker (fetch + cache)');
  const inviteHtmlRaw = await (await fetch(shareLink)).text();
  check(/rel="manifest"/.test(inviteHtmlRaw) && /serviceWorker\.register/.test(inviteHtmlRaw), 'Trang thiệp khai báo manifest + đăng ký SW');
  // Xem offline thật: nạp online -> SW cache -> offline -> reload vẫn render
  const offResp = await (await fetch(BASE + '/api/invitations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groom: 'Offline', bride: 'Test', weddingDate: '2026-12-20T11:00', intro: 'off' }),
  })).json();
  const offCtx = await browser.newContext();
  const offPage = await offCtx.newPage();
  await offPage.goto(BASE + '/thiep/' + offResp.slug, { waitUntil: 'load' });
  await offPage.locator('.names').waitFor({ timeout: 5000 });
  await offPage.evaluate(() => navigator.serviceWorker.ready);
  await offPage.reload({ waitUntil: 'load' }); // tải lại để SW kiểm soát + cache API
  await offPage.locator('.names').waitFor({ timeout: 5000 });
  await offCtx.setOffline(true);
  await offPage.reload({ waitUntil: 'domcontentloaded' });
  await offPage.locator('.names').waitFor({ timeout: 8000 });
  check((await offPage.locator('.names').innerText()).includes('Offline'), 'Xem được thiệp khi OFFLINE (service worker cache)');
  await offCtx.setOffline(false);
  await offCtx.close();

  // 9) Xem ngày cưới đẹp / tuổi Kim Lâu
  log('Mở công cụ xem ngày cưới');
  const xemPage = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const xemErrors = [];
  xemPage.on('pageerror', (e) => xemErrors.push(e.message));
  await xemPage.goto(BASE + '/xem-ngay', { waitUntil: 'networkidle' });
  // sinh 2003, cưới 2026 -> tuổi mụ 24 -> phạm Kim Lâu
  await xemPage.fill('#brideYear', '2003');
  await xemPage.fill('#groomYear', '2002'); // tuổi mụ 25 -> không phạm
  await xemPage.fill('#weddingYear', '2026');
  await xemPage.click('#checkBtn');
  await xemPage.locator('.result-card').waitFor({ timeout: 5000 });
  check(await xemPage.locator('.res-person').count() === 2, 'Hiện kết quả cho cô dâu + chú rể');
  check((await xemPage.locator('.result-card').innerText()).includes('Phạm Kim Lâu'), 'Phát hiện phạm Kim Lâu (cô dâu 2003)');
  check((await xemPage.locator('#summary').innerText()).length > 0, 'Có kết luận tổng');
  // cả hai không phạm: sinh 2002 & 2002, cưới 2026 (tuổi mụ 25 -> dư 7)
  await xemPage.fill('#brideYear', '2002');
  await xemPage.click('#checkBtn');
  await xemPage.waitForTimeout(150);
  check((await xemPage.locator('.result-card').innerText()).includes('Không phạm'), 'Trường hợp không phạm hiển thị đúng');
  check(xemErrors.length === 0, 'Không có lỗi JS ở trang xem ngày' + (xemErrors.length ? ': ' + xemErrors.join('; ') : ''));

  // 10) Mâm quả / tráp ăn hỏi
  log('Mở công cụ mâm quả');
  const mqPage = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const mqErrors = [];
  mqPage.on('pageerror', (e) => mqErrors.push(e.message));
  await mqPage.goto(BASE + '/mam-qua', { waitUntil: 'networkidle' });
  await mqPage.locator('.mq-item').first().waitFor({ timeout: 5000 });
  // mặc định Miền Bắc, 3 tráp -> 3 mục
  check(await mqPage.locator('.mq-item').count() === 3, 'Mâm quả mặc định (Bắc, 3 tráp) = 3 mục');
  await mqPage.selectOption('#countSel', '7');
  await mqPage.waitForTimeout(100);
  check(await mqPage.locator('.mq-item').count() === 7, 'Bắc 7 tráp = 7 mục');
  // chuyển miền Nam -> số mâm chẵn
  await mqPage.click('.region-btn[data-region="nam"]');
  await mqPage.waitForTimeout(100);
  const namOpts = await mqPage.locator('#countSel option').allInnerTexts();
  check(namOpts.join(' ').includes('6 mâm'), 'Miền Nam có lựa chọn 6 mâm');
  await mqPage.selectOption('#countSel', '6');
  await mqPage.waitForTimeout(100);
  check(await mqPage.locator('.mq-item').count() === 6, 'Nam 6 mâm = 6 mục');
  check((await mqPage.locator('#checklist').innerText()).includes('Heo quay'), 'Mâm Nam có Heo quay');
  // tích 1 ô -> tiến độ cập nhật
  await mqPage.locator('.mq-check').first().check();
  check((await mqPage.locator('#progress').innerText()).includes('1/6'), 'Tích ô -> tiến độ 1/6');
  check(mqErrors.length === 0, 'Không có lỗi JS ở trang mâm quả' + (mqErrors.length ? ': ' + mqErrors.join('; ') : ''));

  // 11) Checklist chuẩn bị cưới
  log('Mở checklist chuẩn bị cưới');
  const clPage = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const clErrors = [];
  clPage.on('pageerror', (e) => clErrors.push(e.message));
  await clPage.goto(BASE + '/checklist', { waitUntil: 'networkidle' });
  await clPage.locator('.cl-item').first().waitFor({ timeout: 5000 });
  const clTotal = await clPage.locator('.cl-item').count();
  check(clTotal >= 20, `Checklist có nhiều mục công việc (${clTotal})`);
  check(await clPage.locator('.cl-phase').count() >= 5, 'Có các giai đoạn theo mốc thời gian');
  check((await clPage.locator('#out').innerText()).includes('Xem ngày tốt'), 'Có mốc Việt hoá (xem ngày tốt)');
  // tích 1 việc -> tiến độ + lưu sau reload
  await clPage.locator('.cl-check').first().check();
  check(/Hoàn thành 1\//.test(await clPage.locator('#progress').innerText()), 'Tích việc -> tiến độ 1/...');
  await clPage.reload({ waitUntil: 'networkidle' });
  await clPage.locator('.cl-item').first().waitFor({ timeout: 5000 });
  check(await clPage.locator('.cl-check:checked').count() >= 1, 'Trạng thái checklist được lưu (sau reload)');
  check(clErrors.length === 0, 'Không có lỗi JS ở trang checklist' + (clErrors.length ? ': ' + clErrors.join('; ') : ''));

  // 12) Nghi lễ cưới hỏi
  log('Mở hướng dẫn nghi lễ');
  const nlPage = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const nlErrors = [];
  nlPage.on('pageerror', (e) => nlErrors.push(e.message));
  await nlPage.goto(BASE + '/nghi-le', { waitUntil: 'networkidle' });
  await nlPage.locator('.nl-tab').first().waitFor({ timeout: 5000 });
  check(await nlPage.locator('.nl-tab').count() >= 4, 'Có >=4 nghi lễ (dạm ngõ, ăn hỏi, nạp tài, đón dâu)');
  check(await nlPage.locator('.nl-steps li').count() >= 3, 'Nghi lễ có trình tự các bước');
  check(await nlPage.locator('.nl-roles li').count() >= 2, 'Có phân vai "ai làm gì"');
  // chuyển sang Ăn hỏi -> có "lại quả"
  await nlPage.click('.nl-tab[data-key="an-hoi"]');
  await nlPage.waitForTimeout(120);
  check((await nlPage.locator('#panel').innerText()).includes('lại quả'), 'Lễ ăn hỏi có bước lại quả');
  // chuyển sang Đón dâu -> đổi nội dung
  await nlPage.click('.nl-tab[data-key="don-dau"]');
  await nlPage.waitForTimeout(120);
  check((await nlPage.locator('.nl-name').innerText()).includes('dâu'), 'Chuyển tab -> nội dung đón dâu');
  check(nlErrors.length === 0, 'Không có lỗi JS ở trang nghi lễ' + (nlErrors.length ? ': ' + nlErrors.join('; ') : ''));

  // 13) Open Graph: thẻ meta server-side cho link share đẹp
  log('Kiểm tra Open Graph');
  const ogPhoto = 'https://example.com/anh-cuoi.jpg';
  const ogResp = await (await fetch(BASE + '/api/invitations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groom: 'Nguyễn Minh Đức', bride: 'Trần Thuỳ Dương', weddingDate: '2026-12-20T11:00', photoUrl: ogPhoto, invitation: 'Trân trọng kính mời bạn!' }),
  })).json();
  const ogHtml = await (await fetch(BASE + '/thiep/' + ogResp.slug)).text();
  check(/<meta property="og:title" content="[^"]*Đức[^"]*Dương/.test(ogHtml), 'OG title chứa tên cô dâu chú rể');
  check(ogHtml.includes(`<meta property="og:image" content="${ogPhoto}"`), 'OG image = ảnh cưới');
  check(/<meta property="og:description"/.test(ogHtml), 'Có OG description');
  check(/<meta name="twitter:card" content="summary_large_image"/.test(ogHtml), 'Twitter card large image khi có ảnh');
  check(new RegExp('<meta property="og:url" content="[^"]*/thiep/' + ogResp.slug).test(ogHtml), 'OG url đúng slug');

  // Mẫu mới: backend chấp nhận + trang thiệp áp đúng theme
  const tplResp = await (await fetch(BASE + '/api/invitations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groom: 'A', bride: 'B', weddingDate: '2026-12-20T11:00', template: 'hoang-gia' }),
  })).json();
  const tplData = await (await fetch(BASE + '/api/invitations/' + tplResp.slug)).json();
  check(tplData.template === 'hoang-gia', 'Backend lưu đúng mẫu mới (hoang-gia)');
  const tplPage = await browser.newPage();
  await tplPage.goto(BASE + '/thiep/' + tplResp.slug, { waitUntil: 'networkidle' });
  await tplPage.locator('.invite.theme-hoang-gia').waitFor({ timeout: 5000 });
  check(await tplPage.locator('.invite.theme-hoang-gia').count() === 1, 'Thiệp render đúng theme hoang-gia');
  await tplPage.close();
  // không có ảnh -> twitter card summary
  const ogResp2 = await (await fetch(BASE + '/api/invitations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groom: 'A', bride: 'B', weddingDate: '2026-12-20T11:00' }),
  })).json();
  const ogHtml2 = await (await fetch(BASE + '/thiep/' + ogResp2.slug)).text();
  check(!/og:image/.test(ogHtml2) && /twitter:card" content="summary"/.test(ogHtml2), 'Không ảnh -> không og:image, card summary');

  check(consoleErrors.length === 0, 'Không có lỗi console ở trang soạn thiệp' + (consoleErrors.length ? ': ' + consoleErrors.join('; ') : ''));
  check(inviteErrors.length === 0, 'Không có lỗi JS ở trang thiệp' + (inviteErrors.length ? ': ' + inviteErrors.join('; ') : ''));

  await browser.close();
  console.log('\n' + (failures === 0 ? '✅ TẤT CẢ PASS' : `❌ ${failures} kiểm thử THẤT BẠI`));
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('LỖI CHẠY TEST:', e); process.exit(2); });
