/* Chuyển đổi Dương lịch -> Âm lịch (Việt Nam) + Can Chi.
 * Thuật toán Hồ Ngọc Đức (amlich.js) — public domain, dùng rộng rãi.
 * timeZone Việt Nam = 7. Test vector xác minh trong test/lunar.test.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Lunar = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PI = Math.PI;
  function INT(d) { return Math.floor(d); }

  function jdFromDate(dd, mm, yy) {
    const a = INT((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) {
      jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    }
    return jd;
  }

  function NewMoon(k) {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    let deltat;
    if (T < -11) {
      deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
    } else {
      deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    }
    return Jd1 + C1 - deltat;
  }

  function SunLongitude(jdn) {
    const T = (jdn - 2451545.0) / 36525;
    const T2 = T * T;
    const dr = PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    let L = L0 + DL;
    L = L * dr;
    L = L - PI * 2 * (INT(L / (PI * 2)));
    return L;
  }

  function getSunLongitude(dayNumber, timeZone) {
    return INT(SunLongitude(dayNumber - 0.5 - timeZone / 24) / PI * 6);
  }
  function getNewMoonDay(k, timeZone) {
    return INT(NewMoon(k) + 0.5 + timeZone / 24);
  }
  function getLunarMonth11(yy, timeZone) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    const sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
    return nm;
  }
  function getLeapMonthOffset(a11, timeZone) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  // -> [lunarDay, lunarMonth, lunarYear, isLeap(0/1)]
  function convertSolar2Lunar(dd, mm, yy, timeZone) {
    if (timeZone == null) timeZone = 7;
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
    let a11 = getLunarMonth11(yy, timeZone);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, timeZone);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = INT((monthStart - a11) / 29);
    let lunarLeap = 0;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) lunarLeap = 1;
      }
    }
    if (lunarMonth > 12) lunarMonth = lunarMonth - 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return [lunarDay, lunarMonth, lunarYear, lunarLeap];
  }

  const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  function canChiYear(year) {
    return CAN[(year + 6) % 10] + ' ' + CHI[(year + 8) % 12];
  }

  // Xem tuổi Kim Lâu: tuổi mụ (âm) chia 9, dư 1/3/6/8 là phạm.
  // 1 = Kim Lâu Thân (hại bản thân), 3 = Thê (hại vợ/chồng), 6 = Tử (hại con), 8 = Súc (hại vật nuôi).
  const KIMLAU_TYPE = {
    1: 'Kim Lâu Thân (hại bản thân)',
    3: 'Kim Lâu Thê (hại vợ/chồng)',
    6: 'Kim Lâu Tử (hại con cái)',
    8: 'Kim Lâu Súc (hại vật nuôi/của cải)',
  };
  // refYear = năm dự định cưới (dương lịch); birthYear = năm sinh (dương lịch).
  function kimLau(birthYear, refYear) {
    const by = parseInt(birthYear, 10);
    const ry = parseInt(refYear, 10);
    if (!Number.isFinite(by) || !Number.isFinite(ry) || by < 1900 || by > ry) return null;
    const age = ry - by + 1;          // tuổi mụ (tuổi âm)
    const remainder = age % 9;
    const pham = remainder === 1 || remainder === 3 || remainder === 6 || remainder === 8;
    return {
      age: age,
      remainder: remainder,
      pham: pham,
      type: pham ? KIMLAU_TYPE[remainder] : '',
      canChi: canChiYear(by),
    };
  }

  const MONTH_NAMES = { 1: 'Giêng', 11: 'Một', 12: 'Chạp' };
  function lunarMonthName(m, leap) {
    const base = MONTH_NAMES[m] || String(m);
    return 'tháng ' + base + (leap ? ' (nhuận)' : '');
  }

  // Date JS -> chuỗi âm lịch tiếng Việt, vd "Ngày 2 tháng Một năm Bính Ngọ"
  function lunarLabel(date) {
    const [d, m, y, leap] = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear(), 7);
    return 'Ngày ' + d + ' ' + lunarMonthName(m, leap) + ' năm ' + canChiYear(y);
  }

  return {
    convertSolar2Lunar: convertSolar2Lunar,
    canChiYear: canChiYear,
    kimLau: kimLau,
    lunarMonthName: lunarMonthName,
    lunarLabel: lunarLabel,
  };
});
