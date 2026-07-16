// Runtime i18n (research D5): JSON dictionary per language, `data-i18n`
// attribute swap for static text, `t()` for dynamic rendering. Language
// persists in localStorage and defaults to Romanian (primary audience).

const STORAGE_KEY = 'velometeo.lang';
export const LANGS = ['ro', 'en', 'ru'];
const DEFAULT_LANG = 'ro';

let dict = {};
let lang = DEFAULT_LANG;
const listeners = [];

export function getLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return LANGS.includes(stored) ? stored : DEFAULT_LANG;
}

// Translate a key; {placeholders} are filled from params. Unknown keys
// return the key itself so a missing translation is visible, not silent.
export function t(key, params = {}) {
  let text = dict[key] ?? key;
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
}

async function load(next) {
  // Revalidate instead of trusting the HTTP cache: after a deploy, a stale
  // cached dictionary next to fresh HTML would render raw i18n keys.
  const res = await fetch(`assets/i18n/${next}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Cannot load dictionary ${next}`);
  dict = await res.json();
  lang = next;
}

export async function setLang(next) {
  if (!LANGS.includes(next)) return;
  await load(next);
  localStorage.setItem(STORAGE_KEY, next);
  applyStatic();
  listeners.forEach((fn) => fn(lang));
}

// Re-render hook for dynamic content (tables, labels) on language switch.
export function onLangChange(fn) {
  listeners.push(fn);
}

// Load the persisted language, apply static texts, wire [data-lang] pills.
export async function initI18n() {
  await load(getLang());
  applyStatic();
  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      setLang(el.dataset.lang);
    });
  });
  return t;
}
