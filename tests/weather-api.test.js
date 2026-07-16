import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODELS,
  modelByKey,
  selectEventState,
  daysUntilForecast,
  buildWeatherUrl,
  normalizeLocations,
  weatherAt,
  provenanceOf,
  nowInTimeZone,
  localIsoHour,
  HOURLY_FORECAST,
  HOURLY_ARCHIVE,
} from '../assets/js/lib/weather-api.js';

const event = { date: '2026-07-20', start: '06:00', maxDurationHours: 13.5 };
const now = (date, time = '12:00') => ({ date, time });

test('state: event within horizon → forecast', () => {
  assert.equal(selectEventState(event, now('2026-07-16'), 15), 'forecast');
});

test('state: event day itself and mid-ride → forecast', () => {
  assert.equal(selectEventState(event, now('2026-07-20', '10:00'), 15), 'forecast');
});

test('state: start beyond model horizon → waiting', () => {
  assert.equal(selectEventState(event, now('2026-07-01'), 15), 'waiting');
  // Same date but ICON's shorter horizon (7) also waits.
  assert.equal(selectEventState(event, now('2026-07-10'), 7), 'waiting');
  assert.equal(selectEventState(event, now('2026-07-10'), 15), 'forecast');
});

test('state: ended 2 days ago → recent-past; 8 days ago → archive', () => {
  assert.equal(selectEventState(event, now('2026-07-22'), 15), 'recent-past');
  assert.equal(selectEventState(event, now('2026-07-29'), 15), 'archive');
});

test('state: exactly 7 days after the end is still recent-past', () => {
  // Event ends 2026-07-20 19:30; 7 days later, same time.
  assert.equal(selectEventState(event, now('2026-07-27', '19:30'), 15), 'recent-past');
  assert.equal(selectEventState(event, now('2026-07-27', '19:31'), 15), 'archive');
});

test('daysUntilForecast counts down to the horizon', () => {
  assert.equal(daysUntilForecast(event, now('2026-07-01'), 15), 4);
  assert.equal(daysUntilForecast(event, now('2026-07-16'), 15), 0);
});

const positions = [
  { lat: 47.049313, lon: 28.863206 },
  { lat: 47.256613, lon: 28.802049 },
];

test('forecast URL: batched coordinates, model id, forecast variable set', () => {
  const url = new URL(buildWeatherUrl({ state: 'forecast', positions, event, modelKey: 'ecmwf', timezone: 'Europe/Chisinau' }));
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

test('archive URL: archive host, no models param, no precipitation_probability', () => {
  const url = new URL(buildWeatherUrl({ state: 'archive', positions, event, modelKey: 'ecmwf', timezone: 'Europe/Chisinau' }));
  assert.equal(url.host, 'archive-api.open-meteo.com');
  assert.equal(url.searchParams.get('models'), null);
  const hourly = url.searchParams.get('hourly');
  assert.equal(hourly, HOURLY_ARCHIVE.join(','));
  assert.ok(!hourly.includes('precipitation_probability'));
});

test('recent-past uses the forecast endpoint with explicit past dates', () => {
  const url = new URL(buildWeatherUrl({ state: 'recent-past', positions, event, modelKey: 'icon', timezone: 'Europe/Chisinau' }));
  assert.equal(url.host, 'api.open-meteo.com');
  assert.equal(url.searchParams.get('models'), 'icon_seamless');
});

test('multi-day event extends end_date past midnight', () => {
  const long = { date: '2026-07-20', start: '20:00', maxDurationHours: 20 };
  const url = new URL(buildWeatherUrl({ state: 'forecast', positions, event: long, modelKey: 'ecmwf', timezone: 'Europe/Chisinau' }));
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
      weather_code: [3, 61],
      cloud_cover: [80, 100],
      // precipitation_probability entirely absent (archive case)
    },
  };
  const wp = weatherAt(location, '2026-07-20T06:00');
  assert.equal(wp.temperature, 14.2);
  assert.equal(wp.windGusts, null);
  assert.equal(wp.precipitationProbability, null);
  assert.equal(weatherAt(location, '2026-07-20T09:00'), null); // hour not in range
});

test('provenance labels map from state (FR-013)', () => {
  assert.equal(provenanceOf('forecast'), 'forecast');
  assert.equal(provenanceOf('recent-past'), 'recorded');
  assert.equal(provenanceOf('archive'), 'observed');
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
