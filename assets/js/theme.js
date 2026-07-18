// Adapted from delacau-200-brm-weather-forecast/assets/theme.js (theme part
// only — scenario/accordion handling lives in the page controllers).
(() => {
  const storageKey = 'velometeo.theme';
  const root = document.documentElement;
  const button = document.querySelector('[data-theme-toggle]');

  // Monochrome toggle glyphs (003 R2): inline Lucide SVG (ISC) that inherit
  // currentColor, replacing the former colored sun/moon emoji. Duplicated
  // here because theme.js is a plain script, not a module.
  const svg = (paths) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.1em" height="1.1em"`
    + ` fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"`
    + ` stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const SUN = svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>');
  const MOON = svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>');

  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function currentTheme() {
    return localStorage.getItem(storageKey) || systemTheme();
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (button) {
      button.innerHTML = theme === 'dark' ? SUN : MOON;
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      button.setAttribute('title', theme === 'dark' ? 'Light theme' : 'Dark theme');
    }
  }

  applyTheme(currentTheme());

  if (button) {
    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, next);
      applyTheme(next);
    });
  }
})();
