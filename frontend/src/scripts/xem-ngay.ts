import { kimLau, canChiDay, hoangDaoHours, lunarLabel } from '../lib/lunar';

/* ===== Kim Lâu form ===== */
const form = document.getElementById('form') as HTMLFormElement | null;
const resultEl = document.getElementById('result') as HTMLElement | null;

function personRow(who: string, year: number, k: NonNullable<ReturnType<typeof kimLau>>): HTMLElement {
  const ok = !k.pham;
  const row = document.createElement('div');
  row.className = 'res-person';

  const info = document.createElement('div');

  const whoDiv = document.createElement('div');
  whoDiv.className = 'who';
  whoDiv.textContent = who + ' ';
  const sub1 = document.createElement('span');
  sub1.className = 'sub';
  sub1.textContent = '(sinh ' + year + ' · ' + k.canChi + ')';
  whoDiv.appendChild(sub1);

  const sub2 = document.createElement('div');
  sub2.className = 'sub';
  sub2.textContent =
    'Tuổi mụ năm cưới: ' + k.age + ' · chia 9 dư ' + k.remainder + (k.pham ? ' · ' + k.type : '');

  info.appendChild(whoDiv);
  info.appendChild(sub2);

  const verdict = document.createElement('span');
  verdict.className = 'verdict';
  verdict.dataset.verdict = ok ? 'ok' : 'bad';
  verdict.textContent = ok ? '✓ Không phạm' : '✗ Phạm Kim Lâu';

  row.appendChild(info);
  row.appendChild(verdict);
  return row;
}

if (form && resultEl) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Remove any existing inline error
    const existingErr = form.querySelector('.err-inline');
    if (existingErr) existingErr.textContent = '';

    resultEl.innerHTML = '';

    const brideYear = parseInt((document.getElementById('brideYear') as HTMLInputElement).value, 10);
    const groomYear = parseInt((document.getElementById('groomYear') as HTMLInputElement).value, 10);
    const weddingYear = parseInt((document.getElementById('weddingYear') as HTMLInputElement).value, 10);

    const errEl = form.querySelector('.err-inline') as HTMLElement | null;

    const showErr = (msg: string) => {
      if (errEl) {
        errEl.textContent = msg;
      } else {
        // Create inline error element if not present
        const e2 = document.createElement('div');
        e2.className = 'err-inline';
        e2.textContent = msg;
        form.appendChild(e2);
      }
    };

    if (!brideYear || !groomYear || !weddingYear) {
      showErr('Vui lòng nhập đủ năm sinh và năm cưới.');
      return;
    }

    const kb = kimLau(brideYear, weddingYear);
    const kg = kimLau(groomYear, weddingYear);

    if (!kb || !kg) {
      showErr('Năm không hợp lệ (năm sinh phải trước năm cưới).');
      return;
    }

    let summaryText: string;
    let summaryVerdict: string;

    if (kb.pham && kg.pham) {
      summaryVerdict = 'warn';
      summaryText = `Cả hai đều phạm Kim Lâu năm ${weddingYear}. Theo phong tục thường nên cân nhắc năm khác hoặc hoá giải (cưới sau sinh nhật âm, mượn tuổi...).`;
    } else if (kb.pham) {
      summaryVerdict = 'warn';
      summaryText = `Cô dâu phạm Kim Lâu năm ${weddingYear} (tuổi cô dâu được xem trọng nhất). Nên cân nhắc năm khác hoặc cách hoá giải theo phong tục.`;
    } else if (kg.pham) {
      summaryVerdict = 'warn';
      summaryText = `Chú rể phạm Kim Lâu năm ${weddingYear}. Theo phong tục Kim Lâu nữ được xem trọng hơn, nhưng vẫn nên cân nhắc.`;
    } else {
      summaryVerdict = 'good';
      summaryText = `Cả cô dâu và chú rể đều KHÔNG phạm Kim Lâu năm ${weddingYear}. Năm này thuận cho việc cưới hỏi. 🎉`;
    }

    const card = document.createElement('div');
    card.className = 'result-card';

    card.appendChild(personRow('Cô dâu', brideYear, kb));
    card.appendChild(personRow('Chú rể', groomYear, kg));

    const summary = document.createElement('div');
    summary.className = 'res-summary';
    summary.dataset.summary = summaryVerdict;
    summary.id = 'summary';
    summary.textContent = summaryText;
    card.appendChild(summary);

    resultEl.appendChild(card);
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/* ===== Giờ hoàng đạo form ===== */
(function () {
  const ghdForm = document.getElementById('ghdForm') as HTMLFormElement | null;
  const ghdDate = document.getElementById('ghdDate') as HTMLInputElement | null;
  const ghdResult = document.getElementById('ghdResult') as HTMLElement | null;
  if (!ghdForm || !ghdDate || !ghdResult) return;

  function renderGhd(): void {
    const v = ghdDate!.value;
    if (!v) {
      ghdResult!.innerHTML = '';
      return;
    }
    const parts = v.split('-');
    const date = new Date(+parts[0], +parts[1] - 1, +parts[2]);

    const canChi = canChiDay(date);
    const hours = hoangDaoHours(date);
    const lunar = lunarLabel(date);

    const card = document.createElement('div');
    card.className = 'result-card';

    const header = document.createElement('div');
    header.className = 'res-person';
    header.style.gridTemplateColumns = '1fr';

    const headerInner = document.createElement('div');

    const whoDiv = document.createElement('div');
    whoDiv.className = 'who';
    whoDiv.textContent = 'Ngày ' + canChi;

    const subDiv = document.createElement('div');
    subDiv.className = 'sub';
    subDiv.textContent = lunar;

    headerInner.appendChild(whoDiv);
    headerInner.appendChild(subDiv);
    header.appendChild(headerInner);
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'ghd-grid';

    for (let ci = 0; ci < hours.length; ci++) {
      const h = hours[ci];
      const cell = document.createElement('div');
      cell.className = 'ghd-cell';
      cell.style.animationDelay = Math.min(ci * 0.04, 0.36) + 's';

      const b = document.createElement('b');
      b.textContent = h.chi;

      const span = document.createElement('span');
      span.textContent = h.range;

      cell.appendChild(b);
      cell.appendChild(span);
      grid.appendChild(cell);
    }

    card.appendChild(grid);
    ghdResult!.innerHTML = '';
    ghdResult!.appendChild(card);
  }

  ghdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    renderGhd();
  });
  ghdDate.addEventListener('change', renderGhd);
})();
