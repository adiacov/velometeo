import test from 'node:test';
import assert from 'node:assert/strict';
import { entryProblem, validEvents, splitEvents } from '../assets/js/lib/manifest.js';

const good = { id: 'delacau-200-brm', name: 'Delacau 200 BRM', gpx: 'routes/delacau-200-brm.gpx', date: '2026-05-31', start: '06:00', mode: 'brevet' };

test('a valid entry has no problem', () => {
  assert.equal(entryProblem(good), null);
});

test('entryProblem catches each broken field', () => {
  assert.equal(entryProblem(null), 'not an object');
  assert.equal(entryProblem({ ...good, id: 'Bad Id!' }), 'bad id');
  assert.equal(entryProblem({ ...good, name: ' ' }), 'missing name');
  assert.equal(entryProblem({ ...good, gpx: undefined }), 'missing gpx');
  assert.equal(entryProblem({ ...good, date: '31-05-2026' }), 'bad date');
  assert.equal(entryProblem({ ...good, start: '6am' }), 'bad start');
  assert.equal(entryProblem({ ...good, mode: 'race' }), 'bad mode');
});

test('validEvents skips broken entries and reports them (FR-005)', () => {
  const broken = { ...good, id: 'broken', mode: 'race' };
  const skipped = [];
  const events = validEvents({ events: [good, broken] }, (e, p) => skipped.push([e.id, p]));
  assert.deepEqual(events.map((e) => e.id), ['delacau-200-brm']);
  assert.deepEqual(skipped, [['broken', 'bad mode']]);
});

test('validEvents tolerates a missing or malformed manifest', () => {
  assert.deepEqual(validEvents(null), []);
  assert.deepEqual(validEvents({}), []);
  assert.deepEqual(validEvents({ events: 'nope' }), []);
});

const ev = (id, date, timezone) => ({ ...good, id, date, ...(timezone ? { timezone } : {}) });

test('splitEvents: past is strictly before today; today stays upcoming', () => {
  const today = '2026-07-16';
  const { upcoming, past } = splitEvents(
    [ev('past-1', '2026-05-31'), ev('today-1', '2026-07-16'), ev('future-1', '2026-08-02')],
    () => today,
  );
  assert.deepEqual(upcoming.map((e) => e.id), ['future-1', 'today-1']);
  assert.deepEqual(past.map((e) => e.id), ['past-1']);
});

test('splitEvents: newest date first within each group (FR-018)', () => {
  const { upcoming, past } = splitEvents(
    [ev('a', '2026-08-01'), ev('b', '2026-09-01'), ev('c', '2026-01-10'), ev('d', '2026-03-01')],
    () => '2026-07-16',
  );
  assert.deepEqual(upcoming.map((e) => e.date), ['2026-09-01', '2026-08-01']);
  assert.deepEqual(past.map((e) => e.date), ['2026-03-01', '2026-01-10']);
});

test('splitEvents: the split consults each event own timezone', () => {
  const zones = { 'Pacific/Auckland': '2026-07-17', 'Europe/Chisinau': '2026-07-16' };
  const { upcoming, past } = splitEvents(
    [ev('nz', '2026-07-16', 'Pacific/Auckland'), ev('md', '2026-07-16', 'Europe/Chisinau')],
    (tz) => zones[tz || 'Europe/Chisinau'],
  );
  // In Auckland it is already the 17th → that event is past; Chisinau is not.
  assert.deepEqual(past.map((e) => e.id), ['nz']);
  assert.deepEqual(upcoming.map((e) => e.id), ['md']);
});
