import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DASH,
  formatTemperature,
  formatWind,
  formatPrecipitation,
  formatPercent,
  degreesToCardinal,
  windRelative,
  formatHour,
  formatDuration,
} from '../assets/js/lib/format.js';

test('every formatter renders null/undefined as the dash (FR-016)', () => {
  for (const fmt of [formatTemperature, formatWind, formatPrecipitation, formatPercent, degreesToCardinal]) {
    assert.equal(fmt(null), DASH);
    assert.equal(fmt(undefined), DASH);
  }
});

test('zero is a real value, never a dash', () => {
  assert.equal(formatTemperature(0), '0°C');
  assert.equal(formatPrecipitation(0), '0 mm');
  assert.equal(formatPercent(0), '0%');
});

test('units and rounding', () => {
  assert.equal(formatTemperature(14.6), '15°C');
  assert.equal(formatWind(12.3), '12 km/h');
  assert.equal(formatPrecipitation(0.25), '0.3 mm');
});

test('cardinal directions (8-point)', () => {
  assert.equal(degreesToCardinal(0), 'N');
  assert.equal(degreesToCardinal(90), 'E');
  assert.equal(degreesToCardinal(225), 'SW');
  assert.equal(degreesToCardinal(359), 'N');
});

test('wind relative to travel: from ahead = head, from behind = tail', () => {
  assert.equal(windRelative(0, 0), 'head'); // wind from north, riding north
  assert.equal(windRelative(0, 180), 'tail');
  assert.equal(windRelative(0, 90), 'cross');
  assert.equal(windRelative(350, 10), 'head'); // wraparound
  assert.equal(windRelative(0, null), null);
});

test('hour label carries day context across midnight (FR-023)', () => {
  assert.equal(formatHour('08:00', 0), '08:00');
  assert.equal(formatHour('02:00', 1), '02:00 +1d');
});

test('duration labels: whole and fractional hours', () => {
  assert.equal(formatDuration(8), '8 h');
  assert.equal(formatDuration(13.5), '13:30 h');
});
