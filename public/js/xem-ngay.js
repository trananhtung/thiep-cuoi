'use strict';

const form = document.getElementById('form');
const err = document.getElementById('err');
const resultEl = document.getElementById('result');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function personRow(who, year, k) {
  const ok = !k.pham;
  return `
    <div class="res-person">
      <div>
        <div class="who">${esc(who)} <span class="sub">(sinh ${esc(year)} · ${esc(k.canChi)})</span></div>
        <div class="sub">Tuổi mụ năm cưới: <b>${k.age}</b> · chia 9 dư <b>${k.remainder}</b>${k.pham ? ' · ' + esc(k.type) : ''}</div>
      </div>
      <span class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✓ Không phạm' : '✗ Phạm Kim Lâu'}</span>
    </div>`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  err.textContent = '';
  resultEl.innerHTML = '';

  const brideYear = parseInt(document.getElementById('brideYear').value, 10);
  const groomYear = parseInt(document.getElementById('groomYear').value, 10);
  const weddingYear = parseInt(document.getElementById('weddingYear').value, 10);

  if (!brideYear || !groomYear || !weddingYear) {
    err.textContent = 'Vui lòng nhập đủ năm sinh và năm cưới.';
    return;
  }
  const kb = Lunar.kimLau(brideYear, weddingYear);
  const kg = Lunar.kimLau(groomYear, weddingYear);
  if (!kb || !kg) {
    err.textContent = 'Năm không hợp lệ (năm sinh phải trước năm cưới).';
    return;
  }

  // Theo phong tục, thường tính tuổi Kim Lâu của CÔ DÂU là chính.
  const anyPham = kb.pham || kg.pham;
  const summaryClass = kb.pham ? 'warn' : (kg.pham ? 'warn' : 'good');
  let summaryText;
  if (kb.pham && kg.pham) {
    summaryText = `Cả hai đều phạm Kim Lâu năm ${weddingYear}. Theo phong tục thường nên cân nhắc năm khác hoặc hoá giải (cưới sau sinh nhật âm, mượn tuổi...).`;
  } else if (kb.pham) {
    summaryText = `Cô dâu phạm Kim Lâu năm ${weddingYear} (tuổi cô dâu được xem trọng nhất). Nên cân nhắc năm khác hoặc cách hoá giải theo phong tục.`;
  } else if (kg.pham) {
    summaryText = `Chú rể phạm Kim Lâu năm ${weddingYear}. Theo phong tục Kim Lâu nữ được xem trọng hơn, nhưng vẫn nên cân nhắc.`;
  } else {
    summaryText = `Cả cô dâu và chú rể đều KHÔNG phạm Kim Lâu năm ${weddingYear}. Năm này thuận cho việc cưới hỏi. 🎉`;
  }

  resultEl.innerHTML = `
    <div class="result-card">
      ${personRow('Cô dâu', brideYear, kb)}
      ${personRow('Chú rể', groomYear, kg)}
      <div class="res-summary ${summaryClass}" id="summary">${esc(summaryText)}</div>
    </div>`;
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ===== Giờ hoàng đạo theo ngày ===== */
(function () {
  const ghdForm = document.getElementById('ghdForm');
  const ghdDate = document.getElementById('ghdDate');
  const ghdResult = document.getElementById('ghdResult');
  if (!ghdForm || !ghdDate || !ghdResult || typeof Lunar === 'undefined') return;

  function renderGhd() {
    const v = ghdDate.value;
    if (!v) { ghdResult.innerHTML = ''; return; }
    const parts = v.split('-');
    const date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    const canChi = Lunar.canChiDay(date);
    const hours = Lunar.hoangDaoHours(date);
    const lunar = Lunar.lunarLabel(date);
    ghdResult.innerHTML = `
      <div class="result-card">
        <div class="res-person" style="grid-template-columns:1fr">
          <div>
            <div class="who">Ngày ${esc(canChi)}</div>
            <div class="sub">${esc(lunar)}</div>
          </div>
        </div>
        <div class="ghd-grid">
          ${hours.map((h) => `<div class="ghd-cell"><b>${esc(h.chi)}</b><span>${esc(h.range)}</span></div>`).join('')}
        </div>
      </div>`;
  }

  ghdForm.addEventListener('submit', (e) => { e.preventDefault(); renderGhd(); });
  ghdDate.addEventListener('change', renderGhd);
})();
