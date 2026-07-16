import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREVET_BANDS,
  classifyBrevet,
  brevetScenarios,
  paceScenarios,
  scenarioHours,
} from '../assets/js/lib/scenarios.js';
import { cumulativeKm } from '../assets/js/lib/geo.js';

test('brevet band table matches spec FR-007 exactly', () => {
  assert.deepEqual(BREVET_BANDS[200], { fast: 8, typical: 10, max: 13.5 });
  assert.deepEqual(BREVET_BANDS[300], { fast: 12, typical: 15, max: 20 });
  assert.deepEqual(BREVET_BANDS[400], { fast: 16, typical: 20, max: 27 });
  assert.deepEqual(BREVET_BANDS[600], { fast: 24, typical: 30, max: 40 });
  assert.deepEqual(BREVET_BANDS[1000], { fast: 45, typical: 56, max: 75 });
  assert.deepEqual(BREVET_BANDS[1200], { fast: 54, typical: 68, max: 90, rm: true });
});

test('207 km classifies as a 200 without warning (real routes run long)', () => {
  const c = classifyBrevet(207);
  assert.equal(c.distance, 200);
  assert.equal(c.warn, false);
  assert.equal(c.rm, false);
});

test('240 km still classifies as 200 but warns (>15% deviation)', () => {
  const c = classifyBrevet(240);
  assert.equal(c.distance, 200);
  assert.equal(c.warn, true);
});

test('1200 classification carries the RM flag', () => {
  assert.equal(classifyBrevet(1210).rm, true);
});

test('brevet scenarios: three bands, max = official limit', () => {
  const s = brevetScenarios(207);
  assert.deepEqual(s.map((x) => x.kind), ['fast', 'typical', 'max']);
  assert.equal(s[2].durationHours, 13.5);
  assert.ok(Math.abs(s[0].speedKmh - 207 / 8) < 1e-9);
});

test('pace scenarios: 20/25/30 km/h over measured length', () => {
  const s = paceScenarios(210);
  assert.deepEqual(s.map((x) => x.kind), ['pace-20', 'pace-25', 'pace-30']);
  assert.equal(s[2].durationHours, 7); // 210 / 30
});

// Straight 4-point north-going track for position checks.
const points = [
  [47.0, 28.8],
  [47.01, 28.8],
  [47.02, 28.8],
  [47.03, 28.8],
];
const route = { points, cumKm: cumulativeKm(points), lengthKm: cumulativeKm(points)[3] };

test('scenarioHours: hourly positions advance at constant speed and clamp at finish', () => {
  // ~3.34 km route at 1 km/h → 4-hour ride.
  const scenario = { kind: 'pace-1', durationHours: route.lengthKm, speedKmh: 1 };
  const hours = scenarioHours(scenario, route, '06:00');
  assert.equal(hours.length, Math.ceil(route.lengthKm) + 1);
  assert.equal(hours[0].km, 0);
  assert.equal(hours[0].clockTime, '06:00');
  assert.ok(Math.abs(hours[1].km - 1) < 1e-9);
  const last = hours[hours.length - 1];
  assert.equal(last.km, route.lengthKm); // clamped, never beyond
  assert.ok(Math.abs(last.lat - 47.03) < 1e-9);
});

test('scenarioHours: midnight crossing carries dayOffset (FR-023)', () => {
  const scenario = { kind: 'pace-1', durationHours: 4, speedKmh: 1 };
  const hours = scenarioHours(scenario, route, '22:00');
  assert.equal(hours[0].clockTime, '22:00');
  assert.equal(hours[0].dayOffset, 0);
  assert.equal(hours[2].clockTime, '00:00');
  assert.equal(hours[2].dayOffset, 1);
  assert.equal(hours[4].clockTime, '02:00');
  assert.equal(hours[4].dayOffset, 1);
});

test('scenarioHours: fractional duration rounds the last hour up', () => {
  const scenario = { kind: 'max', durationHours: 2.5, speedKmh: route.lengthKm / 2.5 };
  const hours = scenarioHours(scenario, route, '06:00');
  assert.equal(hours.length, 4); // hours 0,1,2,3 — finish inside hour 3
  assert.equal(hours[3].km, route.lengthKm);
});
