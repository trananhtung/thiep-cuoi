// Category filter for the SSG-rendered template grid.
// Clicks a .cat button → sets data-active, shows/hides #grid > a[data-cat] cards.

const buttons = document.querySelectorAll<HTMLButtonElement>('.cat');
const cards = document.querySelectorAll<HTMLAnchorElement>('#grid > a[data-cat]');

function setActive(selected: string): void {
  buttons.forEach((btn) => {
    if (btn.dataset.cat === selected) {
      btn.setAttribute('data-active', '');
    } else {
      btn.removeAttribute('data-active');
    }
  });
  cards.forEach((card) => {
    const match = selected === 'all' || card.dataset.cat === selected;
    if (match) {
      card.removeAttribute('hidden');
    } else {
      card.setAttribute('hidden', '');
    }
  });
}

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.cat ?? 'all';
    setActive(cat);
  });
});

// Initialize: first button (Tất cả) active
setActive('all');
