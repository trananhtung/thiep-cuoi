import { PHASES } from '../data/checklist';

const weddingDateEl = document.getElementById('weddingDate') as HTMLInputElement;
const progressEl = document.getElementById('progress') as HTMLElement;
const out = document.getElementById('out') as HTMLElement;

let doneSet = new Set<string>();

function storeKey(): string {
  return 'checklist:' + (weddingDateEl.value || '');
}

function loadDone(): void {
  try {
    doneSet = new Set<string>(JSON.parse(localStorage.getItem(storeKey()) || '[]'));
  } catch (_e) {
    doneSet = new Set<string>();
  }
}

function saveDone(): void {
  try {
    localStorage.setItem(storeKey(), JSON.stringify([...doneSet]));
  } catch (_e) {}
}

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function render(): void {
  const val = weddingDateEl.value;
  const weddingDate = val ? new Date(val + 'T00:00:00') : null;
  loadDone();

  let total = 0;
  let done = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  out.innerHTML = '';

  let globalIdx = 0;
  PHASES.forEach((ph) => {
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'cl-phase';

    const title = document.createElement('h3');
    title.className = 'cl-phase-title';
    title.textContent = ph.title;
    title.style.animationDelay = Math.min(globalIdx * 0.03, 0.45) + 's';
    phaseDiv.appendChild(title);

    ph.items.forEach((it) => {
      const id = ph.key + '|' + it.t;
      const checked = doneSet.has(id);
      total++;
      if (checked) done++;

      const label = document.createElement('label');
      label.className = 'cl-item';
      label.style.animationDelay = Math.min(globalIdx++ * 0.03, 0.45) + 's';
      if (checked) label.setAttribute('data-done', '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'cl-check';
      checkbox.dataset.id = id;
      checkbox.checked = checked;

      const textSpan = document.createElement('span');
      textSpan.className = 'cl-text';

      if (it.link) {
        const a = document.createElement('a');
        a.href = it.link;
        a.className = 'cl-link';
        a.textContent = it.t + ' ↗';
        textSpan.appendChild(a);
      } else {
        textSpan.textContent = it.t;
      }

      label.appendChild(checkbox);
      label.appendChild(textSpan);

      if (weddingDate) {
        const due = new Date(weddingDate.getTime() - it.d * 86400000);
        const overdue = !checked && due < now;
        const dueSpan = document.createElement('span');
        dueSpan.className = 'cl-due';
        dueSpan.textContent = `Hạn: ${fmtDate(due)}${overdue ? ' · trễ' : ''}`;
        if (overdue) {
          dueSpan.setAttribute('data-overdue', '');
          label.setAttribute('data-overdue', '');
        }
        label.appendChild(dueSpan);
      }

      checkbox.addEventListener('change', () => {
        const itemId = checkbox.dataset.id as string;
        if (checkbox.checked) {
          doneSet.add(itemId);
        } else {
          doneSet.delete(itemId);
        }
        saveDone();
        render();
      });

      phaseDiv.appendChild(label);
    });

    out.appendChild(phaseDiv);
  });

  progressEl.textContent = `Hoàn thành ${done}/${total} việc`;
  progressEl.classList.remove('progress-tick');
  void (progressEl as HTMLElement).offsetWidth;
  progressEl.classList.add('progress-tick');
}

// Set default date to today + 90 days
(function setDefaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  const p = (n: number) => String(n).padStart(2, '0');
  weddingDateEl.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

weddingDateEl.addEventListener('change', render);
render();
