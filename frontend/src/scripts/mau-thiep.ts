// Category filter for the SSG-rendered template grid.
// Clicks a .cat button → sets data-active, shows/hides #grid > a[data-cat] cards.

const buttons = document.querySelectorAll<HTMLButtonElement>('.cat');
const cards = document.querySelectorAll<HTMLAnchorElement>('#grid > a[data-cat]');
const grid = document.getElementById('grid') as HTMLElement;

let _filterTimer: ReturnType<typeof setTimeout> | null = null;

function applyFilter(selected: string): void {
  buttons.forEach((btn) => {
    if (btn.dataset.cat === selected) btn.setAttribute('data-active', '');
    else btn.removeAttribute('data-active');
  });
  cards.forEach((card) => {
    const match = selected === 'all' || card.dataset.cat === selected;
    if (match) card.removeAttribute('hidden');
    else card.setAttribute('hidden', '');
  });
}

function setActive(selected: string): void {
  if (_filterTimer) clearTimeout(_filterTimer);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { applyFilter(selected); return; }
  grid.style.opacity = '0';
  _filterTimer = setTimeout(() => {
    applyFilter(selected);
    grid.style.opacity = '';
  }, 140);
}

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.cat ?? 'all';
    setActive(cat);
  });
});

// Initialize: first button (Tất cả) active — no fade on first load
applyFilter('all');
