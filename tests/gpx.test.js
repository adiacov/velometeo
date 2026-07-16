import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGpx, GpxError } from '../assets/js/lib/gpx.js';

const fixture = (name) => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');

test('parses track points and waypoints', () => {
  const route = parseGpx(fixture('with-waypoints.gpx'));
  assert.equal(route.points.length, 3);
  assert.deepEqual(route.points[0], [47.0, 28.8]);
  assert.equal(route.waypoints.length, 2);
  assert.equal(route.waypoints[0].name, 'Start / Finish');
  assert.equal(route.waypoints[1].name, 'CP1');
  assert.ok(Math.abs(route.lengthKm - 2.2238) < 0.002, `got ${route.lengthKm}`);
});

test('waypoints are optional — absent means empty list, not an error', () => {
  const route = parseGpx(fixture('no-waypoints.gpx'));
  assert.deepEqual(route.waypoints, []);
});

test('concatenates track segments; shared boundary point adds no distance', () => {
  const route = parseGpx(fixture('no-waypoints.gpx'));
  assert.equal(route.points.length, 4); // 2 segments × 2 points, midpoint duplicated
  assert.ok(Math.abs(route.lengthKm - 2.2238) < 0.002, `got ${route.lengthKm}`);
});

test('malformed/truncated GPX throws GpxError (no usable track)', () => {
  assert.throws(() => parseGpx(fixture('malformed.gpx')), GpxError);
});

test('non-GPX text throws GpxError with code not-gpx', () => {
  try {
    parseGpx('<html><body>404</body></html>');
    assert.fail('should have thrown');
  } catch (e) {
    assert.equal(e.code, 'not-gpx');
  }
});

test('real Delacau route parses to ~204 km with 12 checkpoints', () => {
  const route = parseGpx(readFileSync(new URL('../routes/delacau-200-brm.gpx', import.meta.url), 'utf8'));
  assert.ok(route.lengthKm > 195 && route.lengthKm < 215, `got ${route.lengthKm}`);
  assert.equal(route.waypoints.length, 12);
  assert.equal(route.waypoints[0].name, 'Start / Finish');
});
