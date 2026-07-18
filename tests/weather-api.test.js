import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODELS,
  modelByKey,
  forecastTarget,
  selectEventState,
  daysUntilForecast,
  buildWeatherUrl,
  normalizeLocations,
  weatherAt,
  provenanceOf,
  nowInTimeZone,
  localIsoHour,
  HOURLY_FORECAST,
} from '../assets/js/lib/weather-api.js';

const event = { date: '2026-07-20', start: '06:00', maxDurationHours: 13.5 };
const now = (date) => ({ date });

test('forecastTarget: upcoming event → event day', () => {
  assert.deepEqual(forecastTarget(event, now('2026-07-16')), { targetDate: '2026-07-20', kind: 'upcoming' });
});

test('forecastTarget: event day itself → still upcoming, targets event day', () => {
  assert.deepEqual(forecastTarget(event, now('2026-07-20')), { targetDate: '2026-07-20', kind: 'upcoming' });
});

test('forecastTarget: past event → today, never the original event day', () => {
  assert.deepEqual(forecastTarget(event, now('2026-09-01')), { targetDate: '2026-09-01', kind: 'past' });
  assert.deepEqual(forecastTarget(event, now('2026-07-21')), { targetDate: '2026-07-21', kind: 'past' });
});

test('state: event within horizon → forecast', () => {
  assert.equal(selectEventState(event, now('2026-07-16'), 15), 'forecast');
});

test('state: event day itself → forecast', () => {
  assert.equal(selectEventState(event, now('2026-07-20'), 15), 'forecast');
});

test('state: start beyond model horizon → waiting', () => {
  assert.equal(selectEventState(event, now('2026-07-01'), 15), 'waiting');
  // Same date but a shorter (e.g. 7-day) horizon also waits.
  assert.equal(selectEventState(event, now('2026-07-10'), 7), 'waiting');
  assert.equal(selectEventState(event, now('2026-07-10'), 15), 'forecast');
});

test('state: any past event is always forecast, never waiting', () => {
  assert.equal(selectEventState(event, now('2026-07-21'), 15), 'forecast');
  assert.equal(selectEventState(event, now('2026-09-01'), 15), 'forecast');
});

test('daysUntilForecast counts down to the horizon', () => {
  assert.equal(daysUntilForecast(event, now('2026-07-01'), 15), 4);
  assert.equal(daysUntilForecast(event, now('2026-07-16'), 15), 0);
});

const positions = [
  { lat: 47.049313, lon: 28.863206 },
  { lat: 47.256613, lon: 28.802049 },
];

test('forecast URL: batched coordinates, model id, forecast variable set, anchored at target date', () => {
  const url = new URL(buildWeatherUrl({ positions, event, targetDate: '2026-07-20', modelKey: 'ecmwf', timezone: 'Europe/Chisinau' }));
  assert.equal(url.host, 'api.open-meteo.com');
  assert.equal(url.searchParams.get('latitude'), '47.0493,47.2566');
  assert.equal(url.searchParams.get('longitude'), '28.8632,28.8020');
  assert.equal(url.searchParams.get('models'), 'ecmwf_ifs025');
  assert.equal(url.searchParams.get('timezone'), 'Europe/Chisinau');
  assert.equal(url.searchParams.get('wind_speed_unit'), 'kmh');
  assert.equal(url.searchParams.get('hourly'), HOURLY_FORECAST.join(','));
  assert.equal(url.searchParams.get('start_date'), '2026-07-20');
  // 06:00 + 13.5 h ends the same day, but the range still covers it.
  assert.equal(url.searchParams.get('end_date'), '2026-07-21');
});

test('past event: fetch window anchored at today, not the original event date', () => {
  const url = new URL(buildWeatherUrl({ positions, event, targetDate: '2026-09-01', modelKey: 'ecmwf', timezone: 'Europe/Chisinau' }));
  assert.equal(url.searchParams.get('start_date'), '2026-09-01');
  assert.equal(url.searchParams.get('end_date'), '2026-09-02');
});

test('multi-day event extends end_date past midnight, anchored at target date', () => {
  const long = { date: '2026-07-20', start: '20:00', maxDurationHours: 20 };
  const url = new URL(buildWeatherUrl({ positions, event: long, targetDate: '2026-07-20', modelKey: 'ecmwf', timezone: 'Europe/Chisinau' }));
  assert.equal(url.searchParams.get('end_date'), '2026-07-22'); // ends 16:00 two days on
});

test('normalizeLocations: single object becomes one-element array', () => {
  assert.equal(normalizeLocations({ hourly: {} }).length, 1);
  assert.equal(normalizeLocations([{}, {}]).length, 2);
});

test('weatherAt: extracts one hour, preserves nulls (honest data)', () => {
  const location = {
    hourly: {
      time: ['2026-07-20T06:00', '2026-07-20T07:00'],
      temperature_2m: [14.2, 15.1],
      wind_gusts_10m: [null, 30],
      wind_speed_10m: [12, 14],
      wind_direction_10m: [180, 190],
      apparent_temperature: [13.0, 14.0],
      precipitation: [0, 0.3],
      precipitation_probability: [10, 20],
      weather_code: [3, 61],
      cloud_cover: [80, 100],
    },
  };
  const wp = weatherAt(location, '2026-07-20T06:00');
  assert.equal(wp.temperature, 14.2);
  assert.equal(wp.windGusts, null);
  assert.equal(wp.precipitationProbability, 10);
  assert.equal(weatherAt(location, '2026-07-20T09:00'), null); // hour not in range
});

test('provenance: forecast is the only reachable label', () => {
  assert.equal(provenanceOf('forecast'), 'forecast');
  assert.equal(provenanceOf('waiting'), null);
});

test('model table: both launch models present, unknown key falls back to default', () => {
  assert.deepEqual(MODELS.map((m) => m.key), ['ecmwf', 'icon']);
  assert.equal(modelByKey('nope').key, 'ecmwf');
});

test('localIsoHour maps scenario hours to response time strings, across midnight', () => {
  assert.equal(localIsoHour('2026-05-31', { clockTime: '06:00', dayOffset: 0 }), '2026-05-31T06:00');
  assert.equal(localIsoHour('2026-05-31', { clockTime: '02:00', dayOffset: 1 }), '2026-06-01T02:00');
});

test('nowInTimeZone formats an injectable instant in the event timezone', () => {
  const instant = new Date('2026-05-31T03:30:00Z'); // EEST = UTC+3
  const local = nowInTimeZone('Europe/Chisinau', instant);
  assert.equal(local.date, '2026-05-31');
  assert.equal(local.time, '06:30');
});
