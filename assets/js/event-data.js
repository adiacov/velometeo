// Shared event data pipeline for event.html and map.html: manifest entry →
// GPX route → scenarios with hourly positions → one batched weather fetch.
import { parseGpx } from './lib/gpx.js';
import { brevetScenarios, paceScenarios, classifyBrevet, scenarioHours } from './lib/scenarios.js';
import {
  modelByKey,
  selectEventState,
  forecastTarget,
  buildWeatherUrl,
  normalizeLocations,
  weatherAt,
  nowInTimeZone,
  localIsoHour,
} from './lib/weather-api.js';
import { formatHour } from './lib/format.js';

export const DEFAULT_TIMEZONE = 'Europe/Chisinau';
export const MODEL_STORAGE_KEY = 'velometeo.model';

export class EventDataError extends Error {
  constructor(key) {
    super(key);
    this.key = key; // i18n key: 'error.unknownEvent' | 'error.badRoute'
  }
}

// Deduplicated request positions + per-scenario index mapping into them.
function collectPositions(scenarios) {
  const positions = [];
  const indexByKey = new Map();
  const indexed = scenarios.map((s) => ({
    ...s,
    hours: s.hours.map((h) => {
      const key = `${h.lat.toFixed(4)},${h.lon.toFixed(4)}`;
      if (!indexByKey.has(key)) {
        indexByKey.set(key, positions.length);
        positions.push({ lat: h.lat, lon: h.lon });
      }
      return { ...h, positionIndex: indexByKey.get(key) };
    }),
  }));
  return { positions, indexed };
}

// Load everything language-independent for one event id.
// Throws EventDataError with an i18n key on broken input (FR-005).
export async function loadEvent(id) {
  let manifest;
  try {
    const res = await fetch('routes/index.json');
    manifest = await res.json();
  } catch {
    throw new EventDataError('error.unknownEvent');
  }

  const entry = (manifest.events || []).find((e) => e && e.id === id);
  if (!entry || !entry.gpx || !entry.date || !entry.start || !entry.mode) {
    throw new EventDataError('error.unknownEvent');
  }

  let route;
  try {
    const res = await fetch(entry.gpx);
    if (!res.ok) throw new Error(String(res.status));
    route = parseGpx(await res.text());
  } catch (err) {
    console.warn(`velometeo: broken route for "${id}"`, err);
    throw new EventDataError('error.badRoute');
  }

  const base = entry.mode === 'pace' ? paceScenarios(route.lengthKm) : brevetScenarios(route.lengthKm);
  if (entry.mode === 'brevet') {
    const cls = classifyBrevet(route.lengthKm);
    if (cls.warn) {
      console.warn(`velometeo: measured ${route.lengthKm.toFixed(1)} km deviates >15% from nearest standard ${cls.distance} km`);
    }
  }
  const scenarios = base.map((s) => ({ ...s, hours: scenarioHours(s, route, entry.start) }));
  const maxDurationHours = Math.max(...scenarios.map((s) => s.durationHours));
  const { positions, indexed } = collectPositions(scenarios);

  return {
    entry,
    route,
    scenarios: indexed,
    positions,
    timezone: entry.timezone || DEFAULT_TIMEZONE,
    eventTimes: { date: entry.date, start: entry.start, maxDurationHours },
  };
}

export function persistedModel() {
  return modelByKey(localStorage.getItem(MODEL_STORAGE_KEY));
}

// Fetch weather for one model. Never throws: waiting yields no locations,
// failure sets fetchFailed (FR-017 — the page still renders). `target` is
// the forecast target date/kind (event day if upcoming, today if past).
export async function loadWeather({ eventTimes, positions, timezone }, modelKey) {
  const model = modelByKey(modelKey);
  const now = nowInTimeZone(timezone);
  const state = selectEventState(eventTimes, now, model.horizonDays);
  const target = forecastTarget(eventTimes, now);
  if (state === 'waiting') {
    return { model, now, state, target, locations: null, fetchFailed: false };
  }
  try {
    const url = buildWeatherUrl({ positions, event: eventTimes, targetDate: target.targetDate, modelKey: model.key, timezone });
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    return { model, now, state, target, locations: normalizeLocations(await res.json()), fetchFailed: false };
  } catch (err) {
    console.warn('velometeo: weather fetch failed', err);
    return { model, now, state, target, locations: null, fetchFailed: true };
  }
}

// Scenario rows ready for rendering: time label + weather (null-safe).
// `targetDate` anchors hour lookups (event day if upcoming, today if past).
export function enrichScenarios(scenarios, targetDate, locations) {
  return scenarios.map((s) => ({
    ...s,
    rows: s.hours.map((h) => ({
      ...h,
      timeLabel: formatHour(h.clockTime, h.dayOffset),
      weather: locations ? weatherAt(locations[h.positionIndex], localIsoHour(targetDate, h)) : null,
    })),
  }));
}

// Short language-neutral scenario label for compact controls ("8 h" / "25 km/h").
export function scenarioShortLabel(scenario) {
  if (scenario.kind.startsWith('pace-')) return `${scenario.speedKmh} km/h`;
  const h = Math.floor(scenario.durationHours);
  const m = Math.round((scenario.durationHours - h) * 60);
  return m === 0 ? `${h} h` : `${h}:${String(m).padStart(2, '0')} h`;
}
