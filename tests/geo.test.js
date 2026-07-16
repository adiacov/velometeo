import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, bearingDeg, cumulativeKm, pointAtKm } from '../assets/js/lib/geo.js';

// 0.01° of latitude ≈ 1.1119 km everywhere on the sphere.
const A = [47.0, 28.8];
const B = [47.01, 28.8];
const C = [47.02, 28.8];

test('haversine: 0.01° latitude step is ~1.112 km', () => {
  const d = haversineKm(A, B);
  assert.ok(Math.abs(d - 1.1119) < 0.001, `got ${d}`);
});

test('haversine: zero distance for identical points', () => {
  assert.equal(haversineKm(A, A), 0);
});

test('bearing: due north is 0°, due south is 180°', () => {
  assert.ok(Math.abs(bearingDeg(A, B) - 0) < 0.01);
  assert.ok(Math.abs(bearingDeg(B, A) - 180) < 0.01);
});

test('bearing: due east is ~90°', () => {
  const b = bearingDeg([47.0, 28.8], [47.0, 28.9]);
  assert.ok(Math.abs(b - 90) < 0.5, `got ${b}`);
});

test('cumulativeKm starts at 0 and sums segments', () => {
  const cum = cumulativeKm([A, B, C]);
  assert.equal(cum[0], 0);
  assert.ok(Math.abs(cum[2] - 2.2238) < 0.002, `got ${cum[2]}`);
});

test('pointAtKm interpolates linearly inside a segment', () => {
  const points = [A, B, C];
  const cum = cumulativeKm(points);
  const half = pointAtKm(points, cum, cum[2] / 2);
  assert.ok(Math.abs(half.lat - 47.01) < 1e-6, `got ${half.lat}`);
  assert.equal(half.lon, 28.8);
  assert.ok(Math.abs(half.bearing - 0) < 0.01);
});

test('pointAtKm clamps below 0 and beyond route length', () => {
  const points = [A, B, C];
  const cum = cumulativeKm(points);
  assert.equal(pointAtKm(points, cum, -5).lat, 47.0);
  const end = pointAtKm(points, cum, 999);
  assert.equal(end.lat, 47.02);
  // Bearing at the finish keeps the last segment's direction.
  assert.ok(Math.abs(end.bearing - 0) < 0.01);
});

test('pointAtKm tolerates zero-length segments (duplicate points)', () => {
  const points = [A, B, B, C];
  const cum = cumulativeKm(points);
  const p = pointAtKm(points, cum, cum[1]);
  assert.ok(Math.abs(p.lat - 47.01) < 1e-9);
});
