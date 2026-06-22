'use strict';
/* Unit test đổi Dương -> Âm lịch + Can Chi, theo test vector ngày lễ đã biết. */
const Lunar = require('../public/js/lunar.js');

let fails = 0;
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) console.log('  ✓', msg);
  else { console.log('  ✗ FAIL:', msg, '\n     mong đợi:', e, '\n     nhận về :', a); fails++; }
}
function lunarDMY(y, m, d) {
  const r = Lunar.convertSolar2Lunar(d, m, y, 7);
  return [r[0], r[1], r[2]]; // bỏ cờ nhuận
}

// Mùng 1 Tết Nguyên Đán (1/1 âm) các năm — ngày dương đã biết
eq(lunarDMY(2023, 1, 22), [1, 1, 2023], 'Tết 2023 = 22/01/2023 -> mùng 1/1 Quý Mão');
eq(lunarDMY(2024, 2, 10), [1, 1, 2024], 'Tết 2024 = 10/02/2024 -> mùng 1/1 Giáp Thìn');
eq(lunarDMY(2025, 1, 29), [1, 1, 2025], 'Tết 2025 = 29/01/2025 -> mùng 1/1 Ất Tỵ');
eq(lunarDMY(2026, 2, 17), [1, 1, 2026], 'Tết 2026 = 17/02/2026 -> mùng 1/1 Bính Ngọ');

// Tết Đoan Ngọ (5/5 âm) — đã xác minh đối nghịch bằng workflow
eq(lunarDMY(2023, 6, 22), [5, 5, 2023], 'Đoan Ngọ 2023 = 22/06/2023 -> 5/5 âm');
eq(lunarDMY(2024, 6, 10), [5, 5, 2024], 'Đoan Ngọ 2024 = 10/06/2024 -> 5/5 âm');
eq(lunarDMY(2025, 5, 31), [5, 5, 2025], 'Đoan Ngọ 2025 = 31/05/2025 -> 5/5 âm');
eq(lunarDMY(2026, 6, 19), [5, 5, 2026], 'Đoan Ngọ 2026 = 19/06/2026 -> 5/5 âm');

// Can Chi năm âm lịch
eq(Lunar.canChiYear(2023), 'Quý Mão', 'Can Chi 2023 = Quý Mão');
eq(Lunar.canChiYear(2024), 'Giáp Thìn', 'Can Chi 2024 = Giáp Thìn');
eq(Lunar.canChiYear(2025), 'Ất Tỵ', 'Can Chi 2025 = Ất Tỵ');
eq(Lunar.canChiYear(2026), 'Bính Ngọ', 'Can Chi 2026 = Bính Ngọ');

// lunarLabel ra chuỗi hợp lý
const lbl = Lunar.lunarLabel(new Date(2026, 1, 17)); // 17/02/2026
eq(lbl, 'Ngày 1 tháng Giêng năm Bính Ngọ', 'lunarLabel Tết 2026 đúng định dạng');

console.log('\n' + (fails === 0 ? '✅ Lunar: TẤT CẢ PASS' : `❌ Lunar: ${fails} test THẤT BẠI`));
process.exit(fails === 0 ? 0 : 1);
