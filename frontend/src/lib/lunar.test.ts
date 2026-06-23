import { describe, it, expect } from 'vitest';
import {
  convertSolar2Lunar,
  canChiYear,
  canChiDay,
  hoangDaoHours,
  kimLau,
  lunarLabel,
} from './lunar';

const lunarDMY = (y: number, m: number, d: number) => {
  const r = convertSolar2Lunar(d, m, y, 7);
  return [r[0], r[1], r[2]];
};
const hd = (date: Date) => hoangDaoHours(date).map((h) => h.chi);

describe('lunar — Dương→Âm + Can Chi (verified vectors)', () => {
  it('Tết Nguyên Đán (mùng 1/1 âm)', () => {
    expect(lunarDMY(2023, 1, 22)).toEqual([1, 1, 2023]);
    expect(lunarDMY(2024, 2, 10)).toEqual([1, 1, 2024]);
    expect(lunarDMY(2025, 1, 29)).toEqual([1, 1, 2025]);
    expect(lunarDMY(2026, 2, 17)).toEqual([1, 1, 2026]);
  });

  it('Tết Đoan Ngọ (5/5 âm)', () => {
    expect(lunarDMY(2023, 6, 22)).toEqual([5, 5, 2023]);
    expect(lunarDMY(2024, 6, 10)).toEqual([5, 5, 2024]);
    expect(lunarDMY(2025, 5, 31)).toEqual([5, 5, 2025]);
    expect(lunarDMY(2026, 6, 19)).toEqual([5, 5, 2026]);
  });

  it('Can Chi năm', () => {
    expect(canChiYear(2023)).toBe('Quý Mão');
    expect(canChiYear(2024)).toBe('Giáp Thìn');
    expect(canChiYear(2025)).toBe('Ất Tỵ');
    expect(canChiYear(2026)).toBe('Bính Ngọ');
  });

  it('Kim Lâu (tuổi mụ chia 9)', () => {
    expect(kimLau(2003, 2026)?.age).toBe(24);
    expect(kimLau(2003, 2026)?.pham).toBe(true);
    expect(kimLau(2003, 2026)?.remainder).toBe(6);
    expect(kimLau(2002, 2026)?.pham).toBe(false);
    expect(kimLau(2008, 2026)?.remainder).toBe(1);
    expect(kimLau(2008, 2026)?.pham).toBe(true);
    expect(kimLau(2030, 2026)).toBeNull();
  });

  it('Can Chi NGÀY', () => {
    expect(canChiDay(new Date(2026, 5, 22))).toBe('Đinh Mão');
    expect(canChiDay(new Date(2026, 11, 20))).toBe('Mậu Thìn');
    expect(canChiDay(new Date(2026, 6, 1))).toBe('Bính Tý');
  });

  it('Giờ hoàng đạo — cả 6 cặp Chi', () => {
    expect(hd(new Date(2026, 5, 22))).toEqual(['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu']);
    expect(hd(new Date(2026, 11, 20))).toEqual(['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi']);
    expect(hd(new Date(2026, 6, 2))).toEqual(['Dần', 'Mão', 'Tỵ', 'Thân', 'Tuất', 'Hợi']);
    expect(hd(new Date(2026, 6, 3))).toEqual(['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất']);
    expect(hd(new Date(2026, 6, 1))).toEqual(['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu']);
    expect(hd(new Date(2026, 6, 6))).toEqual(['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi']);
    expect(hoangDaoHours(new Date(2026, 5, 22))[0]).toEqual({ chi: 'Tý', range: '23–01' });
  });

  it('lunarLabel', () => {
    expect(lunarLabel(new Date(2026, 1, 17))).toBe('Ngày 1 tháng Giêng năm Bính Ngọ');
  });
});
