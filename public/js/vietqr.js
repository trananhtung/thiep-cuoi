/* VietQR / NAPAS EMVCo payload generator (offline).
 *
 * Chuẩn đã xác minh đối nghịch (deep-research + 3 verifier):
 *  - CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflect, xorOut 0; check("123456789")=29B1.
 *  - CRC tính trên TOÀN BỘ chuỗi gồm cả "6304", rồi nối 4 hex IN HOA.
 *  - Thứ tự trường: 00,01,38,53,54?,58,62?,63. Trường 38 lồng: 00=GUID A000000727,
 *    01={00=BIN(6 số), 01=số tài khoản}, 02=QRIBFTTA (chuyển tới tài khoản). 53=704(VND), 58=VN.
 *  - Độ dài TLV tính theo BYTE UTF-8 (không phải ký tự); CRC chạy trên byte UTF-8.
 * Test vector kiểm chứng (test/vietqr.test.js): ICB 970415/9999999999 -> ...6304 94C6;
 *   ACB 970416/257678859 -> ...6304 AE9F.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VietQR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Danh sách ngân hàng (BIN = NAPAS bank id, 6 số) — đã xác minh.
  var BANKS = [
    { shortName: 'VCB', bin: '970436', fullName: 'Vietcombank' },
    { shortName: 'ICB', bin: '970415', fullName: 'VietinBank' },
    { shortName: 'BIDV', bin: '970418', fullName: 'BIDV' },
    { shortName: 'VBA', bin: '970405', fullName: 'Agribank' },
    { shortName: 'TCB', bin: '970407', fullName: 'Techcombank' },
    { shortName: 'MB', bin: '970422', fullName: 'MB Bank' },
    { shortName: 'ACB', bin: '970416', fullName: 'ACB' },
    { shortName: 'VPB', bin: '970432', fullName: 'VPBank' },
    { shortName: 'STB', bin: '970403', fullName: 'Sacombank' },
    { shortName: 'TPB', bin: '970423', fullName: 'TPBank' },
    { shortName: 'HDB', bin: '970437', fullName: 'HDBank' },
    { shortName: 'VIB', bin: '970441', fullName: 'VIB' },
    { shortName: 'SHB', bin: '970443', fullName: 'SHB' },
    { shortName: 'EIB', bin: '970431', fullName: 'Eximbank' },
    { shortName: 'MSB', bin: '970426', fullName: 'MSB' },
    { shortName: 'OCB', bin: '970448', fullName: 'OCB' },
    { shortName: 'SEAB', bin: '970440', fullName: 'SeABank' },
    { shortName: 'BAB', bin: '970409', fullName: 'BacABank' },
    { shortName: 'SCB', bin: '970429', fullName: 'SCB' },
    { shortName: 'NAB', bin: '970428', fullName: 'Nam A Bank' },
    { shortName: 'PVCB', bin: '970412', fullName: 'PVcomBank' },
    { shortName: 'LPB', bin: '970449', fullName: 'LPBank' },
    { shortName: 'VAB', bin: '970427', fullName: 'VietABank' },
    { shortName: 'ABB', bin: '970425', fullName: 'ABBANK' },
    { shortName: 'DOB', bin: '970406', fullName: 'DongA Bank' },
    { shortName: 'SGICB', bin: '970400', fullName: 'SaigonBank' },
    { shortName: 'CAKE', bin: '546034', fullName: 'CAKE by VPBank' },
    { shortName: 'TIMO', bin: '963388', fullName: 'Timo' },
    { shortName: 'BVB', bin: '970454', fullName: 'BVBank' },
    { shortName: 'KLB', bin: '970452', fullName: 'KienLongBank' },
  ];

  var BIN_BY_NAME = {};
  BANKS.forEach(function (b) { BIN_BY_NAME[b.shortName] = b.bin; });

  function binOf(shortName) { return BIN_BY_NAME[shortName] || ''; }
  function bankName(shortName) {
    for (var i = 0; i < BANKS.length; i++) if (BANKS[i].shortName === shortName) return BANKS[i].fullName;
    return shortName || '';
  }

  function utf8bytes(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    return Buffer.from(s, 'utf8'); // Node fallback
  }

  // TLV: id(2) + length(2, theo BYTE UTF-8) + value
  function tlv(id, value) {
    var v = String(value);
    var len = utf8bytes(v).length;
    if (len > 99) throw new Error('Trường ' + id + ' quá dài: ' + len + ' byte (tối đa 99)');
    return id + (len < 10 ? '0' + len : '' + len) + v;
  }

  // CRC-16/CCITT-FALSE trên byte UTF-8
  function crc16(payload) {
    var bytes = utf8bytes(payload);
    var crc = 0xFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] << 8;
      for (var j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    var hex = crc.toString(16).toUpperCase();
    return '0000'.slice(hex.length) + hex;
  }

  // Bỏ dấu tiếng Việt + lọc về ASCII (cho ghi chú/tên — bank app thường yêu cầu ASCII)
  function foldAscii(s) {
    return String(s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^\x20-\x7E]/g, '').trim();
  }

  /* buildPayload({ bank | bin, account, amount?, message? }) -> chuỗi VietQR EMV */
  function buildPayload(opts) {
    opts = opts || {};
    var bin = String(opts.bin || binOf(opts.bank) || '').trim();
    var account = String(opts.account || '').replace(/[^0-9A-Za-z]/g, '');
    if (!/^\d{6}$/.test(bin)) throw new Error('Mã ngân hàng (BIN) không hợp lệ');
    if (!account) throw new Error('Thiếu số tài khoản');

    var amount = (opts.amount != null && opts.amount !== '')
      ? String(opts.amount).replace(/[^\d.]/g, '') : '';
    var message = opts.message ? foldAscii(opts.message).slice(0, 99) : '';

    var s = tlv('00', '01');
    s += tlv('01', amount ? '12' : '11');
    var beneficiary = tlv('00', bin) + tlv('01', account);
    var merchantAccount = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
    s += tlv('38', merchantAccount);
    s += tlv('53', '704');
    if (amount) s += tlv('54', amount);
    s += tlv('58', 'VN');
    if (message) s += tlv('62', tlv('08', message));
    s += '6304';
    return s + crc16(s);
  }

  return {
    BANKS: BANKS,
    binOf: binOf,
    bankName: bankName,
    crc16: crc16,
    foldAscii: foldAscii,
    buildPayload: buildPayload,
  };
});
