// Open-Meteo integration: event temporal state, request building, response
// normalization. Contract: specs/001-velometeo-mvp/contracts/open-meteo.md.

// Model ids verified against the live API on 2026-07-16.
export const MODELS = [
  { key: 'ecmwf', label: 'ECMWF', apiModel: 'ecmwf_ifs025', horizonDays: 15 },
  { key: 'icon', label: 'ICON', apiModel: 'icon_seamless', horizonDays: 7 },
];

export const DEFAULT_MODEL_KEY = 'ecmwf';

export function modelByKey(key) {
  return MODELS.find((m) => m.key === key) || MODELS.find((m) => m.key === DEFAULT_MODEL_KEY);
}

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';

const HOURLY_COMMON = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
];
// precipitation_probability exists only in forecasts; archive rows show `—`.
export const HOURLY_FORECAST = [...HOURLY_COMMON, 'precipitation_probability'];
export const HOURLY_ARCHIVE = HOURLY_COMMON;

// Archive reanalysis lags real time by 2–5 days; until day 7 after the event
// the forecast endpoint still serves those recent past dates (FR-013).
export const ARCHIVE_AFTER_DAYS = 7;

const DAY_MS = 86400000;

function utcDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDays(yyyyMmDd, days) {
  const t = utcDate(yyyyMmDd) + days * DAY_MS;
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Local ISO hour ("YYYY-MM-DDTHH:MM") of a scenario hour on event day —
// the format Open-Meteo uses in hourly.time when a timezone is requested.
export function localIsoHour(eventDate, { clockTime, dayOffset }) {
  return `${addDays(eventDate, dayOffset)}T${clockTime}`;
}

// Current wall-clock date/time in an IANA timezone, without a tz database.
export function nowInTimeZone(timeZone, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

const minutesOf = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Event temporal state (research D9). `event` and `now` are event-local:
// event = { date, start, maxDurationHours }, now = { date, time } (as from
// nowInTimeZone). horizonDays comes from the selected model.
export function selectEventState(event, now, horizonDays) {
  const startMs = utcDate(event.date) + minutesOf(event.start) * 60000;
  const endMs = startMs + event.maxDurationHours * 3600000;
  const nowMs = utcDate(now.date) + minutesOf(now.time) * 60000;

  if (nowMs <= endMs) {
    const daysUntilStart = (utcDate(event.date) - utcDate(now.date)) / DAY_MS;
    return daysUntilStart > horizonDays ? 'waiting' : 'forecast';
  }
  const daysSinceEnd = (nowMs - endMs) / DAY_MS;
  return daysSinceEnd <= ARCHIVE_AFTER_DAYS ? 'recent-past' : 'archive';
}

export function daysUntilForecast(event, now, horizonDays) {
  return Math.max(0, (utcDate(event.date) - utcDate(now.date)) / DAY_MS - horizonDays);
}

// One batched request per model: comma-separated coordinate lists for the
// deduplicated sample positions, date range covering the longest scenario.
// `state` must be 'forecast' | 'recent-past' | 'archive' (never 'waiting').
export function buildWeatherUrl({ state, positions, event, modelKey, timezone }) {
  const model = modelByKey(modelKey);
  const archive = state === 'archive';
  const base = archive ? ARCHIVE_BASE : FORECAST_BASE;
  const hourly = archive ? HOURLY_ARCHIVE : HOURLY_FORECAST;
  const lastDay = addDays(event.date, Math.ceil((minutesOf(event.start) / 60 + event.maxDurationHours) / 24));

  const params = new URLSearchParams({
    latitude: positions.map((p) => p.lat.toFixed(4)).join(','),
    longitude: positions.map((p) => p.lon.toFixed(4)).join(','),
    hourly: hourly.join(','),
    start_date: event.date,
    end_date: lastDay,
    timezone,
    wind_speed_unit: 'kmh',
  });
  if (!archive) params.set('models', model.apiModel);
  return `${base}?${params}`;
}

// Open-Meteo returns an object for one location, an array for several.
export function normalizeLocations(json) {
  return Array.isArray(json) ? json : [json];
}

// WeatherPoint for one location at one local ISO hour ("YYYY-MM-DDTHH:MM").
// Missing variables/values stay null — rendering turns null into `—`
// (FR-016); nothing is interpolated or substituted.
export function weatherAt(location, isoHour) {
  const hourly = location && location.hourly;
  if (!hourly || !Array.isArray(hourly.time)) return null;
  const i = hourly.time.indexOf(isoHour);
  if (i === -1) return null;
  const val = (name) => {
    const arr = hourly[name];
    const v = Array.isArray(arr) ? arr[i] : null;
    return v === undefined ? null : v;
  };
  return {
    time: isoHour,
    temperature: val('temperature_2m'),
    apparent: val('apparent_temperature'),
    precipitation: val('precipitation'),
    precipitationProbability: val('precipitation_probability'),
    weatherCode: val('weather_code'),
    cloudCover: val('cloud_cover'),
    windSpeed: val('wind_speed_10m'),
    windDirection: val('wind_direction_10m'),
    windGusts: val('wind_gusts_10m'),
  };
}

// Page label provenance per state (FR-013).
export function provenanceOf(state) {
  return { forecast: 'forecast', 'recent-past': 'recorded', archive: 'observed' }[state] || null;
}
