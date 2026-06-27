import { MAMQUA } from '../data/mamqua';

const regionBtns = document.querySelectorAll<HTMLElement>('.region-btn');
const countSel = document.getElementById('countSel') as HTMLSelectElement;
const ruleEl = document.getElementById('rule') as HTMLElement;
const listEl = document.getElementById('checklist') as HTMLElement;
const progressEl = document.getElementById('progress') as HTMLElement;
let region: 'bac' | 'nam' = 'bac';

function populateCounts(): void {
  const counts = Object.keys(MAMQUA[region].counts);
  countSel.innerHTML = counts
    .map((c) => `<option value="${c}">${c} ${region === 'bac' ? 'tráp' : 'mâm'}</option>`)
    .join('');
  ruleEl.textContent = MAMQUA[region].rule;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ruleEl.classList.remove('rule-in');
    void (ruleEl as HTMLElement).offsetWidth;
    ruleEl.classList.add('rule-in');
  }
}

function renderList(): void {
  const count = countSel.value;
  const items: string[] = MAMQUA[region].counts[count] || [];
  listEl.innerHTML = '';
  items.forEach((_it, i) => {
    const label = document.createElement('label');
    label.className = 'mq-item';
    label.setAttribute('data-i', String(i));

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'mq-check';
    checkbox.dataset.i = String(i);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'mq-name';
    // items may contain HTML entities like &amp; — use innerHTML to decode them
    const tmp = document.createElement('span');
    tmp.innerHTML = items[i];
    nameSpan.textContent = tmp.textContent || tmp.innerText || items[i];

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        label.setAttribute('data-done', '');
      } else {
        label.removeAttribute('data-done');
      }
      updateProgress();
    });

    label.appendChild(checkbox);
    label.appendChild(nameSpan);
    listEl.appendChild(label);
  });
  updateProgress();
}

function updateProgress(): void {
  const all = listEl.querySelectorAll('.mq-check');
  const done = listEl.querySelectorAll('.mq-check:checked');
  progressEl.textContent = `Đã chuẩn bị ${done.length}/${all.length} lễ vật`;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    progressEl.classList.remove('mq-progress-tick');
    void (progressEl as HTMLElement).offsetWidth;
    progressEl.classList.add('mq-progress-tick');
  }
}

regionBtns.forEach((b) => {
  b.addEventListener('click', () => {
    region = (b.getAttribute('data-region') as 'bac' | 'nam') || 'bac';
    regionBtns.forEach((x) => {
      if (x === b) {
        x.setAttribute('data-active', '');
      } else {
        x.removeAttribute('data-active');
      }
    });
    populateCounts();
    renderList();
  });
});

countSel.addEventListener('change', renderList);

// Initialize with default region (bac)
const defaultBtn = document.querySelector<HTMLElement>('.region-btn[data-region="bac"]');
if (defaultBtn) defaultBtn.setAttribute('data-active', '');

populateCounts();
renderList();
