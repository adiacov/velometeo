import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Guards the monochrome invariant of feature 003 (research R7, SC-001/SC-002):
// the stylesheet may only use achromatic colors (channel-equal / alpha over
// achromatic) and no colored effects, and the icon sources may contain no
// emoji. These tests are expected to FAIL until the restyle lands.

const cssUrl = new URL('../assets/css/style.css', import.meta.url);
const CSS = readFileSync(cssUrl, 'utf8');
// Strip CSS comments so header prose can't leak fake color literals.
const CSS_CODE = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

// Named colors that are unambiguously achromatic and allowed.
const ACHROMATIC_NAMES = new Set(['white', 'black', 'transparent', 'currentcolor', 'inherit', 'none']);

function hexIsAchromatic(hex) {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return r === g && g === b;
}

function rgbIsAchromatic(inside) {
  const nums = inside.split(/[,\/\s]+/).filter(Boolean).slice(0, 3).map(Number);
  return nums.length === 3 && nums[0] === nums[1] && nums[1] === nums[2];
}

function hslIsAchromatic(inside) {
  // Achromatic when saturation (2nd component) is 0.
  const parts = inside.split(/[,\/\s]+/).filter(Boolean);
  return parts.length >= 2 && parseFloat(parts[1]) === 0;
}

test('every color literal in style.css is achromatic', () => {
  const offenders = [];

  for (const m of CSS_CODE.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    if (!hexIsAchromatic(m[0])) offenders.push(m[0]);
  }
  for (const m of CSS_CODE.matchAll(/\brgba?\(([^)]*)\)/gi)) {
    if (!rgbIsAchromatic(m[1])) offenders.push(m[0]);
  }
  for (const m of CSS_CODE.matchAll(/\bhsla?\(([^)]*)\)/gi)) {
    if (!hslIsAchromatic(m[1])) offenders.push(m[0]);
  }
  for (const m of CSS_CODE.matchAll(/\b([a-z]+)\b/gi)) {
    const w = m[1].toLowerCase();
    // Only flag words that are real CSS named colors and chromatic.
    if (NAMED_COLORS.has(w) && !ACHROMATIC_NAMES.has(w)) offenders.push(w);
  }

  assert.deepEqual(offenders, [], `chromatic colors found: ${[...new Set(offenders)].join(', ')}`);
});

test('style.css uses no gradients or backdrop-filter', () => {
  assert.equal(/gradient\(/i.test(CSS_CODE), false, 'gradient() present');
  assert.equal(/backdrop-filter/i.test(CSS_CODE), false, 'backdrop-filter present');
});

test('icon sources contain no emoji', () => {
  const emoji = /[☀-➿\u{1f000}-\u{1faff}️]/u;
  for (const rel of ['../assets/js/lib/weather-icons.js', '../assets/js/theme.js']) {
    const src = readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.equal(emoji.test(src), false, `emoji found in ${rel}`);
  }
});

// A minimal set of chromatic CSS named colors we want to catch if ever used.
const NAMED_COLORS = new Set([
  'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
  'cyan', 'magenta', 'teal', 'navy', 'olive', 'maroon', 'lime', 'aqua',
  'fuchsia', 'silver', 'gold', 'coral', 'salmon', 'crimson', 'indigo',
  'violet', 'khaki', 'tan', 'beige', 'ivory', 'skyblue', 'tomato',
  'white', 'black', // included so ACHROMATIC_NAMES gate is exercised
]);
