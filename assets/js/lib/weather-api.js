// Open-Meteo integration: event temporal state, request building, response
// normalization. Contract: specs/001-velometeo-mvp/contracts/open-meteo.md.

// Model id verified against the live API on 2026-07-16. ECMWF is the only
// provider (owner decision 2026-07-18): longest free horizon on Open-Meteo,
// global gold-standard model — see specs/005-single-provider-forecast/research.md R1.
export const MODEL = { label: 'ECMWF', apiModel: 'ecmwf_ifs025', horizonDays: 15 };

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';

export const HOURLY_FORECAST = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
];

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

// Forecast target date (research R2/R3): the event day if it hasn't started
// yet, otherwise today — a past event shows today's forecast for riding the
// route now, never a historical record.
export function forecastTarget(event, now) {
  const upcoming = utcDate(event.date) >= utcDate(now.date);
  return { targetDate: upcoming ? event.date : now.date, kind: upcoming ? 'upcoming' : 'past' };
}

// Event temporal state: 'waiting' only when an upcoming event's day is
// beyond the model horizon; everything else (including any past event,
// whose target date is always today) is 'forecast'. `event` and `now` are
// event-local: event = { date }, now = { date } (as from nowInTimeZone).
export function selectEventState(event, now, horizonDays) {
  const daysUntilStart = (utcDate(event.date) - utcDate(now.date)) / DAY_MS;
  return daysUntilStart > horizonDays ? 'waiting' : 'forecast';
}

export function daysUntilForecast(event, now, horizonDays) {
  return Math.max(0, (utcDate(event.date) - utcDate(now.date)) / DAY_MS - horizonDays);
}

// One batched request: comma-separated coordinate lists for the
// deduplicated sample positions, date range covering the longest scenario
// anchored at the forecast target date (event day if upcoming, today if
// past — see forecastTarget). `event` supplies start/maxDurationHours only.
export function buildWeatherUrl({ positions, event, targetDate, timezone }) {
  const lastDay = addDays(targetDate, Math.ceil((minutesOf(event.start) / 60 + event.maxDurationHours) / 24));

  const params = new URLSearchParams({
    latitude: positions.map((p) => p.lat.toFixed(4)).join(','),
    longitude: positions.map((p) => p.lon.toFixed(4)).join(','),
    hourly: HOURLY_FORECAST.join(','),
    start_date: targetDate,
    end_date: lastDay,
    timezone,
    wind_speed_unit: 'kmh',
    models: MODEL.apiModel,
  });
  return `${FORECAST_BASE}?${params}`;
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

// Page label provenance per state. Only 'forecast' remains reachable
// (see selectEventState); kept as a function so callers don't special-case
// 'waiting'. Superseded by the status line in US3 (T013).
export function provenanceOf(state) {
  return state === 'forecast' ? 'forecast' : null;
}
