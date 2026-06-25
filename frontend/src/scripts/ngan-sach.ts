import { DEFAULTS, type BudgetRow } from '../data/budget';

const KEY = 'thiep-ngan-sach';

interface State {
  budget: number | string;
  rows: BudgetRow[];
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as State;
      if (p && Array.isArray(p.rows)) return p;
    }
  } catch (_e) {}
  return JSON.parse(JSON.stringify({ budget: '', rows: DEFAULTS })) as State;
}

function save(state: State): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_e) {}
}

function num(v: number | string): number {
  const n = parseFloat(String(v));
  return isFinite(n) && n > 0 ? n : 0;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + ' ₫';
}

function stat(label: string, value: string, cls: string): string {
  return `<div class="bg-stat ${cls}"><small>${label}</small><b>${value}</b></div>`;
}

const elRows = document.getElementById('rows') as HTMLElement;
const elBudget = document.getElementById('budget') as HTMLInputElement;

let state: State = load();

function render(): void {
  elBudget.value = state.budget ? String(state.budget) : '';
  elRows.innerHTML = '';
  state.rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td><input type="text" data-i="${i}" data-k="name" value="" /></td>` +
      `<td class="num"><input type="number" min="0" step="100000" inputmode="numeric" data-i="${i}" data-k="est" /></td>` +
      `<td class="num"><input type="number" min="0" step="100000" inputmode="numeric" data-i="${i}" data-k="act" /></td>` +
      `<td class="col-pay"><input type="checkbox" class="bg-paid" data-i="${i}" data-k="paid" /></td>` +
      `<td class="act"><button type="button" class="bg-del" data-del="${i}" aria-label="Xoá hạng mục">✕</button></td>`;
    // set values safely (avoid innerHTML injection)
    (tr.querySelector('[data-k="name"]') as HTMLInputElement).value = r.name || '';
    (tr.querySelector('[data-k="est"]') as HTMLInputElement).value = r.est ? String(r.est) : '';
    (tr.querySelector('[data-k="act"]') as HTMLInputElement).value = r.act ? String(r.act) : '';
    (tr.querySelector('[data-k="paid"]') as HTMLInputElement).checked = !!r.paid;
    elRows.appendChild(tr);
  });
  recalc();
}

function recalc(): void {
  let est = 0, act = 0, paid = 0;
  state.rows.forEach((r) => {
    est += num(r.est);
    act += num(r.act);
    if (r.paid) paid += 1;
  });
  const budget = num(state.budget);
  const remain = budget - act;

  (document.getElementById('totalEst') as HTMLElement).textContent = fmt(est);
  (document.getElementById('totalAct') as HTMLElement).textContent = fmt(act);
  (document.getElementById('paidCount') as HTMLElement).textContent = paid + '/' + state.rows.length;

  const pct = budget > 0 ? Math.min(100, Math.round((act / budget) * 100)) : 0;
  const over = budget > 0 && act > budget;
  const bar = document.getElementById('bar') as HTMLElement;
  bar.style.width = pct + '%';
  if (over) {
    bar.setAttribute('data-over', '');
  } else {
    bar.removeAttribute('data-over');
  }
  (document.getElementById('barNote') as HTMLElement).textContent = budget > 0
    ? ('Đã chi ' + pct + '% ngân sách' + (over ? ' — VƯỢT ngân sách!' : ''))
    : 'Nhập tổng ngân sách để xem tiến độ chi tiêu.';

  const sum = document.getElementById('summary') as HTMLElement;
  sum.innerHTML =
    stat('Ngân sách', fmt(budget), '') +
    stat('Tổng dự kiến', fmt(est), '') +
    stat('Đã chi (thực)', fmt(act), '') +
    stat(remain >= 0 ? 'Còn lại' : 'Vượt', fmt(Math.abs(remain)), budget > 0 ? (remain >= 0 ? 'ok' : 'over') : '');
}

// Input events on rows
elRows.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  const i = t.getAttribute('data-i');
  const k = t.getAttribute('data-k');
  if (i === null || !k) return;
  const row = state.rows[+i];
  if (!row) return;
  if (k === 'paid') row.paid = t.checked;
  else (row as unknown as Record<string, unknown>)[k] = t.value;
  save(state);
  recalc();
});

elRows.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.getAttribute('data-k') === 'paid') {
    const i = +(t.getAttribute('data-i') as string);
    if (state.rows[i]) { state.rows[i].paid = t.checked; save(state); recalc(); }
  }
});

elRows.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const del = t.getAttribute('data-del');
  if (del === null) return;
  state.rows.splice(+del, 1);
  save(state);
  render();
});

elBudget.addEventListener('input', () => {
  state.budget = elBudget.value;
  save(state);
  recalc();
});

(document.getElementById('addRow') as HTMLElement).addEventListener('click', () => {
  state.rows.push({ name: '', est: '', act: '', paid: false });
  save(state);
  render();
  const inputs = elRows.querySelectorAll('[data-k="name"]');
  if (inputs.length) (inputs[inputs.length - 1] as HTMLInputElement).focus();
});

(document.getElementById('resetRows') as HTMLElement).addEventListener('click', () => {
  if (!confirm('Khôi phục danh sách hạng mục mặc định? Dữ liệu hiện tại sẽ bị xoá.')) return;
  state = JSON.parse(JSON.stringify({ budget: '', rows: DEFAULTS })) as State;
  save(state);
  render();
});

render();
