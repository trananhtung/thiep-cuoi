import { describe, it, expect } from 'vitest';
import { crc16, buildPayload, binOf } from './vietqr';

describe('vietqr — EMVCo payload (verified vectors)', () => {
  it('CRC-16/CCITT-FALSE check value', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('ICB 970415/9999999999 static QR', () => {
    expect(buildPayload({ bin: '970415', account: '9999999999' })).toBe(
      '00020101021138540010A00000072701240006970415011099999999990208QRIBFTTA53037045802VN630494C6',
    );
  });

  it('ACB 970416/257678859 static QR', () => {
    expect(buildPayload({ bin: '970416', account: '257678859' })).toBe(
      '00020101021138530010A0000007270123000697041601092576788590208QRIBFTTA53037045802VN6304AE9F',
    );
  });

  it('resolves by shortName', () => {
    expect(buildPayload({ bank: 'ACB', account: '257678859' })).toBe(
      '00020101021138530010A0000007270123000697041601092576788590208QRIBFTTA53037045802VN6304AE9F',
    );
  });

  it('binOf lookups', () => {
    expect(binOf('VCB')).toBe('970436');
    expect(binOf('MB')).toBe('970422');
  });

  it('invalid BIN throws', () => {
    expect(() => buildPayload({ bin: '123', account: '1' })).toThrow();
  });

  it('missing account throws', () => {
    expect(() => buildPayload({ bank: 'VCB', account: '' })).toThrow();
  });

  it('with amount → dynamic (field 01 = 12) + field 54', () => {
    const withAmount = buildPayload({ bank: 'VCB', account: '0011223344', amount: '500000' });
    expect(withAmount.slice(0, 8)).toBe('00020101');
    expect(/^0002010102/.test(withAmount) && withAmount.indexOf('010212') === 6).toBe(true);
    expect(withAmount.indexOf('5406500000') > -1).toBe(true);
  });
});
