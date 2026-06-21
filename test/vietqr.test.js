'use strict';
/* Unit test cho bộ sinh VietQR — kiểm chứng theo test vector thực tế đã xác minh. */
const VietQR = require('../public/js/vietqr.js');

let fails = 0;
function eq(actual, expected, msg) {
  if (actual === expected) { console.log('  ✓', msg); }
  else { console.log('  ✗ FAIL:', msg, '\n     mong đợi:', expected, '\n     nhận về :', actual); fails++; }
}

// 1) CRC-16/CCITT-FALSE check value chuẩn của biến thể này
eq(VietQR.crc16('123456789'), '29B1', 'CRC("123456789") = 29B1 (đúng CRC-16/CCITT-FALSE)');

// 2) Test vector 1: VietinBank (ICB 970415), tài khoản 9999999999, QR tĩnh
eq(
  VietQR.buildPayload({ bin: '970415', account: '9999999999' }),
  '00020101021138540010A00000072701240006970415011099999999990208QRIBFTTA53037045802VN630494C6',
  'Vector ICB 970415/9999999999 khớp chuỗi chuẩn (CRC 94C6)'
);

// 3) Test vector 2: ACB (970416), tài khoản 257678859, QR tĩnh (nguồn subiz/vietqr)
eq(
  VietQR.buildPayload({ bin: '970416', account: '257678859' }),
  '00020101021138530010A0000007270123000697041601092576788590208QRIBFTTA53037045802VN6304AE9F',
  'Vector ACB 970416/257678859 khớp chuỗi chuẩn (CRC AE9F)'
);

// 4) Giải mã được qua shortName
eq(
  VietQR.buildPayload({ bank: 'ACB', account: '257678859' }),
  '00020101021138530010A0000007270123000697041601092576788590208QRIBFTTA53037045802VN6304AE9F',
  'buildPayload theo shortName "ACB" cho cùng kết quả'
);

// 5) BIN tra cứu đúng
eq(VietQR.binOf('VCB'), '970436', 'binOf("VCB") = 970436');
eq(VietQR.binOf('MB'), '970422', 'binOf("MB") = 970422');

// 6) Validate: BIN sai -> ném lỗi
try { VietQR.buildPayload({ bin: '123', account: '1' }); eq('no-throw', 'throw', 'BIN sai phải ném lỗi'); }
catch (e) { eq('throw', 'throw', 'BIN sai ném lỗi đúng'); }

// 7) Thiếu tài khoản -> ném lỗi
try { VietQR.buildPayload({ bank: 'VCB', account: '' }); eq('no-throw', 'throw', 'Thiếu STK phải ném lỗi'); }
catch (e) { eq('throw', 'throw', 'Thiếu STK ném lỗi đúng'); }

// 8) Có số tiền -> point of initiation = 12 (động) + có trường 54
const withAmount = VietQR.buildPayload({ bank: 'VCB', account: '0011223344', amount: '500000' });
eq(withAmount.slice(0, 8), '00020101', 'Payload có số tiền: payload format đúng');
eq(/^0002010102/.test(withAmount) && withAmount.indexOf('010212') === 6, true, 'Có số tiền -> field 01 = 12 (động)');
eq(withAmount.indexOf('5406500000') > -1, true, 'Có trường 54 = 500000');

console.log('\n' + (fails === 0 ? '✅ VietQR: TẤT CẢ PASS' : `❌ VietQR: ${fails} test THẤT BẠI`));
process.exit(fails === 0 ? 0 : 1);
