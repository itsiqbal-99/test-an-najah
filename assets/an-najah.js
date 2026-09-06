const root = document.documentElement;
const menuButton = document.getElementById('menuButton');
const mobilePanel = document.getElementById('mobilePanel');
const themeButton = document.getElementById('themeToggle');
const mobileThemeButton = document.getElementById('mobileThemeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year').textContent = new Date().getFullYear();

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  mobilePanel.hidden = !open;
}

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
mobilePanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobilePanel.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});

function applyTheme(theme, persist = true) {
  root.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeButton.textContent = isDark ? 'Mode terang' : 'Mode gelap';
  mobileThemeButton.textContent = isDark ? 'Mode terang' : 'Mode gelap';
  themeButton.setAttribute('aria-pressed', String(isDark));
  mobileThemeButton.setAttribute('aria-pressed', String(isDark));
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#07150f' : '#f2f5f0';
  if (persist) persistTheme(theme);
}

function readTheme() {
  try {
    return localStorage.getItem('annajah-theme');
  } catch {
    return null;
  }
}

function persistTheme(theme) {
  try {
    localStorage.setItem('annajah-theme', theme);
  } catch {
    // The selected theme still applies for this visit when storage is unavailable.
  }
}

const savedTheme = readTheme();
applyTheme(savedTheme || (prefersDark.matches ? 'dark' : 'light'), false);

[themeButton, mobileThemeButton].forEach((button) => button.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  if (button === mobileThemeButton) setMenu(false);
}));

prefersDark.addEventListener('change', (event) => {
  if (!readTheme()) applyTheme(event.matches ? 'dark' : 'light', false);
});

function bindTabs(tabSelector, panelSelector) {
  const tabs = [...document.querySelectorAll(tabSelector)];
  const panels = [...document.querySelectorAll(panelSelector)];

  function activate(tab, focus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      const nextKeys = ['ArrowDown', 'ArrowRight'];
      const prevKeys = ['ArrowUp', 'ArrowLeft'];
      if (![...nextKeys, ...prevKeys, 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = index;
      if (nextKeys.includes(event.key)) targetIndex = (index + 1) % tabs.length;
      if (prevKeys.includes(event.key)) targetIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = tabs.length - 1;
      activate(tabs[targetIndex], true);
    });
  });
}

bindTabs('.program-tab', '.program-panel');
bindTabs('.voice-button', '.voice-panel');

const facilityTrack = document.getElementById('facilityTrack');
const facilityPrev = document.getElementById('facilityPrev');
const facilityNext = document.getElementById('facilityNext');
let facilityFrame;

function updateFacilityControls() {
  const maxScroll = facilityTrack.scrollWidth - facilityTrack.clientWidth;
  facilityPrev.disabled = facilityTrack.scrollLeft <= 4;
  facilityNext.disabled = facilityTrack.scrollLeft >= maxScroll - 4;
}

function moveFacilities(direction) {
  if ((direction < 0 && facilityPrev.disabled) || (direction > 0 && facilityNext.disabled)) return;
  facilityTrack.scrollBy({
    left: direction * facilityTrack.clientWidth * 0.78,
    behavior: reduceMotion ? 'auto' : 'smooth'
  });
}

facilityPrev.addEventListener('click', () => moveFacilities(-1));
facilityNext.addEventListener('click', () => moveFacilities(1));
facilityTrack.addEventListener('scroll', () => {
  cancelAnimationFrame(facilityFrame);
  facilityFrame = requestAnimationFrame(updateFacilityControls);
}, { passive: true });
updateFacilityControls();

const revealElements = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  revealElements.forEach((element) => revealObserver.observe(element));
}

const counters = document.querySelectorAll('.counter');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.target);
      const suffix = element.dataset.suffix || '';
      const started = performance.now();

      function animate(now) {
        const progress = Math.min((now - started) / 1200, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.floor(target * eased).toLocaleString('id-ID') + suffix;
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
      observer.unobserve(element);
    });
  }, { threshold: 0.7 });
  counters.forEach((counter) => counterObserver.observe(counter));
}
