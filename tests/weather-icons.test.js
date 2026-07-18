import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { weatherCondition } from '../assets/js/lib/weather-icons.js';

// The full documented Open-Meteo WMO hourly weather_code set.
const ALL_WMO_CODES = [
  0, 1, 2, 3, 45, 48,
  51, 53, 55, 56, 57,
  61, 63, 65, 66, 67,
  71, 73, 75, 77,
  80, 81, 82, 85, 86,
  95, 96, 99,
];

test('every documented WMO code maps to a bucket', () => {
  for (const code of ALL_WMO_CODES) {
    const bucket = weatherCondition(code);
    assert.ok(bucket, `code ${code} has no bucket`);
    assert.ok(bucket.icon.length > 0);
    assert.match(bucket.labelKey, /^weather\./);
  }
});

test('every icon is a monochrome currentColor SVG with no emoji (003 US2)', () => {
  const emoji = /[☀-➿\u{1f000}-\u{1faff}️]/u;
  const seen = new Set();
  for (const code of ALL_WMO_CODES) {
    const { icon } = weatherCondition(code);
    if (seen.has(icon)) continue;
    seen.add(icon);
    assert.ok(icon.startsWith('<svg'), `icon for code ${code} is not inline SVG`);
    assert.match(icon, /stroke="currentColor"/, `icon for code ${code} lacks currentColor`);
    assert.match(icon, /aria-hidden="true"/, `icon for code ${code} lacks aria-hidden`);
    assert.doesNotMatch(icon, emoji, `icon for code ${code} still contains emoji`);
    assert.doesNotMatch(icon, /fill="#|stroke="#|rgb/, `icon for code ${code} has a hardcoded color`);
  }
  assert.equal(seen.size, 8, 'expected 8 distinct condition glyphs');
});

test('representative codes land in the right bucket', () => {
  const expect = {
    0: 'weather.clear',
    2: 'weather.partlyCloudy',
    3: 'weather.overcast',
    48: 'weather.fog',
    55: 'weather.drizzle',
    57: 'weather.drizzle',
    66: 'weather.rain',
    82: 'weather.rain',
    77: 'weather.snow',
    86: 'weather.snow',
    99: 'weather.thunderstorm',
  };
  for (const [code, labelKey] of Object.entries(expect)) {
    assert.equal(weatherCondition(Number(code)).labelKey, labelKey);
  }
});

test('unknown or missing codes return null, never an icon', () => {
  for (const bad of [null, undefined, -1, 4, 100, '0', NaN]) {
    assert.equal(weatherCondition(bad), null);
  }
});

test('every returnable labelKey is translated in all dictionaries', () => {
  const labelKeys = new Set(ALL_WMO_CODES.map((c) => weatherCondition(c).labelKey));
  for (const lang of ['ro', 'en', 'ru']) {
    const dict = JSON.parse(readFileSync(new URL(`../assets/i18n/${lang}.json`, import.meta.url), 'utf8'));
    for (const key of labelKeys) {
      assert.ok(typeof dict[key] === 'string' && dict[key].length > 0, `${lang}.json missing ${key}`);
    }
  }
});
