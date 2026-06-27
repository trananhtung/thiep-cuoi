import { CEREMONIES } from '../data/ceremonies';

const tabsEl = document.getElementById('tabs') as HTMLElement;
const panelEl = document.getElementById('panel') as HTMLElement;
let active = CEREMONIES[0].key;

function renderTabs(): void {
  tabsEl.innerHTML = '';
  for (const c of CEREMONIES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nl-tab';
    btn.textContent = c.name;
    btn.dataset.key = c.key;
    if (c.key === active) {
      btn.setAttribute('data-active', '');
    }
    btn.addEventListener('click', () => {
      active = c.key;
      renderTabs();
      renderPanel();
    });
    tabsEl.appendChild(btn);
  }
}

function renderPanel(): void {
  const c = CEREMONIES.find((x) => x.key === active);
  if (!c) return;
  panelEl.innerHTML = '';
  panelEl.style.animation = 'none';
  void panelEl.offsetWidth; // reflow to restart animation
  panelEl.style.animation = '';

  const h2 = document.createElement('h2');
  h2.className = 'nl-name font-display text-2xl font-bold mb-2';
  h2.textContent = c.name;
  panelEl.appendChild(h2);

  const intro = document.createElement('p');
  intro.className = 'leading-relaxed mb-4 opacity-90';
  intro.textContent = c.intro;
  panelEl.appendChild(intro);

  const subSteps = document.createElement('h3');
  subSteps.className = 'text-[12.5px] font-semibold uppercase tracking-[2px] text-gold-deep mt-5 mb-2.5';
  subSteps.textContent = 'Trình tự';
  panelEl.appendChild(subSteps);

  const ol = document.createElement('ol');
  ol.className = 'nl-steps pl-5 grid gap-2 list-decimal';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  c.steps.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'leading-relaxed pl-1';
    li.textContent = s;
    if (!reduced) li.style.cssText = `animation:panelFadeIn .22s ease both;animation-delay:${Math.min(i * 0.06, 0.42)}s`;
    ol.appendChild(li);
  });
  panelEl.appendChild(ol);

  const subRoles = document.createElement('h3');
  subRoles.className = 'text-[12.5px] font-semibold uppercase tracking-[2px] text-gold-deep mt-5 mb-2.5';
  subRoles.textContent = 'Ai làm gì';
  panelEl.appendChild(subRoles);

  const ul = document.createElement('ul');
  ul.className = 'nl-roles pl-5 grid gap-1.5 list-disc';
  c.roles.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'leading-relaxed';
    li.textContent = r;
    if (!reduced) li.style.cssText = `animation:panelFadeIn .22s ease both;animation-delay:${Math.min((c.steps.length + i) * 0.06, 0.54)}s`;
    ul.appendChild(li);
  });
  panelEl.appendChild(ul);
}

renderTabs();
renderPanel();
