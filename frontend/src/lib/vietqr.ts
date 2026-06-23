/* VietQR / NAPAS EMVCo payload generator (offline).
 * Ported verbatim from public/js/vietqr.js.
 *  - CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflect, xorOut 0; check("123456789")=29B1.
 *  - TLV length is UTF-8 BYTE count; CRC runs over UTF-8 bytes.
 *  - Verified vectors: ICB 970415/9999999999 -> ...6304 94C6; ACB 970416/257678859 -> ...6304 AE9F.
 */

export interface Bank {
  shortName: string;
  bin: string;
  fullName: string;
}

export const BANKS: Bank[] = [
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

const BIN_BY_NAME: Record<string, string> = {};
BANKS.forEach((b) => {
  BIN_BY_NAME[b.shortName] = b.bin;
});

export function binOf(shortName: string): string {
  return BIN_BY_NAME[shortName] || '';
}

export function bankName(shortName: string): string {
  for (const b of BANKS) if (b.shortName === shortName) return b.fullName;
  return shortName || '';
}

function utf8bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** TLV: id(2) + length(2, UTF-8 byte count) + value */
function tlv(id: string, value: string): string {
  const v = String(value);
  const len = utf8bytes(v).length;
  if (len > 99) throw new Error('Trường ' + id + ' quá dài: ' + len + ' byte (tối đa 99)');
  return id + (len < 10 ? '0' + len : '' + len) + v;
}

/** CRC-16/CCITT-FALSE over UTF-8 bytes */
export function crc16(payload: string): string {
  const bytes = utf8bytes(payload);
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  const hex = crc.toString(16).toUpperCase();
  return '0000'.slice(hex.length) + hex;
}

/** Bỏ dấu tiếng Việt + lọc về ASCII */
export function foldAscii(s: string): string {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

export interface PayloadOpts {
  bank?: string;
  bin?: string;
  account?: string;
  amount?: string | number;
  message?: string;
}

export function buildPayload(opts: PayloadOpts = {}): string {
  const bin = String(opts.bin || binOf(opts.bank || '') || '').trim();
  const account = String(opts.account || '').replace(/[^0-9A-Za-z]/g, '');
  if (!/^\d{6}$/.test(bin)) throw new Error('Mã ngân hàng (BIN) không hợp lệ');
  if (!account) throw new Error('Thiếu số tài khoản');

  const amount =
    opts.amount != null && opts.amount !== '' ? String(opts.amount).replace(/[^\d.]/g, '') : '';
  const message = opts.message ? foldAscii(opts.message).slice(0, 99) : '';

  let s = tlv('00', '01');
  s += tlv('01', amount ? '12' : '11');
  const beneficiary = tlv('00', bin) + tlv('01', account);
  const merchantAccount = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  s += tlv('38', merchantAccount);
  s += tlv('53', '704');
  if (amount) s += tlv('54', amount);
  s += tlv('58', 'VN');
  if (message) s += tlv('62', tlv('08', message));
  s += '6304';
  return s + crc16(s);
}
