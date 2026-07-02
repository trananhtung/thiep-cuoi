/* Hộp donate "Góp Vía Cho Đôi Sau" — Offer B của my-offer.md.
 *
 * Nguyên tắc (bám $100M Offers, mô hình free + donate):
 *  - Chỉ hiện ở các "thời điểm vàng": vừa tạo xong thiệp (created), chế độ cảm ơn
 *    sau cưới (thankyou), và trang quản lý khi cặp đôi thấy rõ app đã giúp gì (manage).
 *  - Tự nguyện 100%, không paywall: box chỉ mời, không chặn gì.
 *  - Neo giá trị ("bạn nhận trọn bộ ~6.4tr — trả 0đ") + mức gợi ý có tên + minh bạch tiền dùng làm gì.
 *
 * Phụ thuộc: qrcode.js + vietqr.js (đã có sẵn trên các trang nhúng). Nếu thiếu, chỉ ẩn QR.
 */
(function (root) {
  'use strict';

  // ⚠️ THAY BẰNG TÀI KHOẢN THẬT của nền tảng trước khi deploy (bank = shortName trong vietqr.js).
  var CONFIG = {
    enabled: true,
    bank: 'VCB',
    account: '9999999999',
    holder: 'THIEP CUOI ONLINE',
    transferNote: 'GOP VIA THIEP CUOI',
    tiers: [
      { amount: 25000, vi: 'Ly cà phê ☕', en: 'A coffee ☕' },
      { amount: 50000, vi: 'Nuôi server 1 tuần', en: 'A week of server' },
      { amount: 100000, vi: 'Góp vía cho đôi sau 💛', en: 'Pay it forward 💛' },
      { amount: 200000, vi: 'Nhà hảo tâm ✨', en: 'Patron ✨' },
    ],
    defaultTier: 0, // mức "cà phê" — dễ bấm nhất
  };

  var I18N = {
    vi: {
      title: 'Góp Vía Cho Đôi Sau ☕',
      created: 'Bạn vừa nhận trọn bộ công cụ cưới (trị giá ~6.4 triệu nếu thuê làm) — hoàn toàn 0đ, không watermark. Nếu thấy hữu ích, mời tụi mình ly cà phê để giữ thiệp miễn phí cho những đôi sau nhé.',
      thankyou: 'Nếu tấm thiệp này đã góp một phần nhỏ cho ngày vui của hai bạn, hãy "góp vía" — một ly cà phê từ bạn giúp thiệp cưới tiếp tục miễn phí cho những đôi tiếp theo. 💛',
      manage: 'App đã cùng bạn lo đám cưới — nếu thấy hữu ích, mời tụi mình ly cà phê để nuôi server nhé.',
      manageStats: 'Thiệp của bạn đã có {views} lượt xem và {rsvps} phản hồi qua hệ thống — hoàn toàn miễn phí.',
      copy: 'Sao chép STK',
      copied: '✓ Đã sao chép',
      scanHint: 'Quét bằng app ngân hàng / Momo — 10 giây, không cần tài khoản',
      transparency: '100% tiền ủng hộ dùng để trả server & tên miền, giữ thiệp miễn phí trọn đời — không donate vẫn dùng đủ mọi tính năng.',
      qrFail: 'Không tạo được QR — bạn có thể chuyển khoản thủ công theo STK bên dưới.',
    },
    en: {
      title: 'Pay It Forward ☕',
      created: 'You just got the full wedding toolkit (worth ~6.4M VND if outsourced) — completely free, no watermark. If it helped, buy us a coffee to keep it free for the next couples.',
      thankyou: 'If this invitation played a small part in your big day, pay it forward — one coffee from you keeps the service free for the next couples. 💛',
      manage: 'This app has been planning the wedding with you — if it helped, buy us a coffee to keep the server running.',
      manageStats: 'Your invitation got {views} views and {rsvps} RSVPs through this system — completely free.',
      copy: 'Copy account',
      copied: '✓ Copied',
      scanHint: 'Scan with your banking app — 10 seconds, no sign-up',
      transparency: '100% of donations pay for the server & domain, keeping this free forever — everything works without donating.',
      qrFail: 'QR unavailable — you can transfer manually using the account below.',
    },
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtVnd(n) {
    return (n / 1000) + 'k';
  }

  var CSS = [
    '.donate-box{border:1.5px dashed #d9b96a;border-radius:16px;padding:20px 18px;margin:18px auto 0;max-width:520px;background:linear-gradient(180deg,#fffdf7,#fdf6ea);text-align:center;font-size:14px;line-height:1.55;color:#4d4238}',
    '.donate-box h4{margin:0 0 8px;font-size:17px;color:#9c7a1f;font-weight:700}',
    '.donate-lead{margin:0 0 12px}',
    '.donate-tiers{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:0 0 14px}',
    '.donate-tier{cursor:pointer;font:inherit;font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:999px;border:1.5px solid #e4d3ac;background:#fff;color:#7a6a4f;transition:all .15s}',
    '.donate-tier b{display:block;font-size:13.5px;color:#9c7a1f}',
    '.donate-tier.active{border-color:#c2a14d;background:#c2a14d;color:#fff}',
    '.donate-tier.active b{color:#fff}',
    '.donate-qr{min-height:60px;display:flex;justify-content:center;margin-bottom:8px}',
    '.donate-qr img{border:6px solid #fff;border-radius:10px;box-shadow:0 6px 18px -8px rgba(120,90,20,.35)}',
    '.donate-acc{font-size:13px;color:#7a6a4f;margin-bottom:10px}',
    '.donate-acc b{color:#4d4238;letter-spacing:.5px}',
    '.donate-copy{cursor:pointer;font:inherit;font-size:12.5px;font-weight:600;padding:7px 14px;border-radius:9px;border:1px solid #e4d3ac;background:#fff;color:#9c7a1f}',
    '.donate-copy:hover{background:#fbf2dc}',
    '.donate-hint{font-size:12px;opacity:.75;margin:8px 0 0}',
    '.donate-trans{font-size:11.5px;opacity:.65;margin:10px 0 0;font-style:italic}',
  ].join('\n');

  function injectCss() {
    if (document.getElementById('donate-css')) return;
    var st = document.createElement('style');
    st.id = 'donate-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function makeQr(el, amount) {
    if (typeof root.VietQR === 'undefined' || typeof root.qrcode === 'undefined') { el.innerHTML = ''; return; }
    try {
      var payload = root.VietQR.buildPayload({
        bank: CONFIG.bank, account: CONFIG.account, amount: amount, message: CONFIG.transferNote,
      });
      var qr = root.qrcode(0, 'M');
      qr.addData(payload);
      qr.make();
      el.innerHTML = qr.createImgTag(4, 0);
      var img = el.querySelector('img');
      if (img) img.alt = 'VietQR donate ' + fmtVnd(amount);
    } catch (e) {
      el.textContent = '';
    }
  }

  /* Donate.render(container, { context: 'created'|'thankyou'|'manage', lang?: 'vi'|'en', stats?: {views,rsvps} }) */
  function render(container, opts) {
    if (!container || !CONFIG.enabled) return;
    opts = opts || {};
    var lang = opts.lang === 'en' ? 'en' : 'vi';
    var T = I18N[lang];
    var context = opts.context || 'created';
    var lead = T[context] || T.created;
    if (context === 'manage' && opts.stats && (opts.stats.views || opts.stats.rsvps)) {
      lead = T.manageStats
        .replace('{views}', String(opts.stats.views || 0))
        .replace('{rsvps}', String(opts.stats.rsvps || 0))
        + ' ' + T.manage;
    }
    injectCss();

    var bankLabel = typeof root.VietQR !== 'undefined' ? root.VietQR.bankName(CONFIG.bank) : CONFIG.bank;
    container.innerHTML =
      '<div class="donate-box" data-donate>'
      + '<h4>' + esc(T.title) + '</h4>'
      + '<p class="donate-lead">' + esc(lead) + '</p>'
      + '<div class="donate-tiers" role="group">'
      + CONFIG.tiers.map(function (tier, i) {
          return '<button type="button" class="donate-tier' + (i === CONFIG.defaultTier ? ' active' : '') + '" data-amount="' + tier.amount + '">'
            + '<b>' + esc(fmtVnd(tier.amount)) + '</b>' + esc(tier[lang] || tier.vi) + '</button>';
        }).join('')
      + '</div>'
      + '<div class="donate-qr" data-donate-qr></div>'
      + '<div class="donate-acc">' + esc(bankLabel) + ' · <b>' + esc(CONFIG.account) + '</b> · ' + esc(CONFIG.holder) + '</div>'
      + '<button type="button" class="donate-copy" data-donate-copy>' + esc(T.copy) + '</button>'
      + '<p class="donate-hint">' + esc(T.scanHint) + '</p>'
      + '<p class="donate-trans">' + esc(T.transparency) + '</p>'
      + '</div>';

    var qrEl = container.querySelector('[data-donate-qr]');
    makeQr(qrEl, CONFIG.tiers[CONFIG.defaultTier].amount);

    container.querySelectorAll('.donate-tier').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.donate-tier').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        makeQr(qrEl, parseInt(btn.getAttribute('data-amount'), 10));
      });
    });
    var copyBtn = container.querySelector('[data-donate-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        try { if (navigator.clipboard) navigator.clipboard.writeText(CONFIG.account); } catch (e) {}
        var old = copyBtn.textContent;
        copyBtn.textContent = T.copied;
        setTimeout(function () { copyBtn.textContent = old; }, 1500);
      });
    }
  }

  root.Donate = { render: render, CONFIG: CONFIG };
})(typeof self !== 'undefined' ? self : this);
