// Scenario derivation: brevet bands (spec FR-007 table) and pace scenarios
// (FR-008), plus the per-hour rider position mapping (FR-010).
import { pointAtKm } from './geo.js';

// Fast/typical are the spec's per-distance table (clarification Q1); max is
// the official ACP BRM limit (Article 10, Jan 2024). 1200 is Randonneurs
// Mondiaux, not BRM — label accordingly.
export const BREVET_BANDS = {
  200: { fast: 8, typical: 10, max: 13.5 },
  300: { fast: 12, typical: 15, max: 20 },
  400: { fast: 16, typical: 20, max: 27 },
  600: { fast: 24, typical: 30, max: 40 },
  1000: { fast: 45, typical: 56, max: 75 },
  1200: { fast: 54, typical: 68, max: 90, rm: true },
};

export const STANDARD_DISTANCES = Object.keys(BREVET_BANDS).map(Number);

export const PACE_SPEEDS_KMH = [20, 25, 30];

// Deviation beyond this fraction from the nearest standard distance is
// surfaced to the curator (spec edge case; data-model Route validation).
export const BREVET_DEVIATION_WARN = 0.15;

// Match measured length to the nearest standard brevet distance.
export function classifyBrevet(lengthKm) {
  let distance = STANDARD_DISTANCES[0];
  for (const d of STANDARD_DISTANCES) {
    if (Math.abs(lengthKm - d) < Math.abs(lengthKm - distance)) distance = d;
  }
  const deviation = Math.abs(lengthKm - distance) / distance;
  return { distance, deviation, warn: deviation > BREVET_DEVIATION_WARN, rm: Boolean(BREVET_BANDS[distance].rm) };
}

// Scenario: { kind, durationHours, speedKmh } — exactly one mode's set per
// page (FR-009), so callers pick one of the two builders.
export function brevetScenarios(lengthKm) {
  const { distance } = classifyBrevet(lengthKm);
  const bands = BREVET_BANDS[distance];
  return ['fast', 'typical', 'max'].map((kind) => ({
    kind,
    durationHours: bands[kind],
    speedKmh: lengthKm / bands[kind],
  }));
}

export function paceScenarios(lengthKm) {
  return PACE_SPEEDS_KMH.map((speedKmh) => ({
    kind: `pace-${speedKmh}`,
    durationHours: lengthKm / speedKmh,
    speedKmh,
  }));
}

function parseHhMm(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Invalid start time: ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

const pad2 = (n) => String(n).padStart(2, '0');

// Hourly waypoints of one scenario: where the rider is at each whole hour
// after the start, at constant scenario speed (spec assumption). The last
// entry is the finish (km clamped to route length). dayOffset carries the
// day context across midnight (FR-023).
export function scenarioHours(scenario, route, startHhMm) {
  const startMin = parseHhMm(startHhMm);
  const total = route.lengthKm;
  const lastHour = Math.ceil(scenario.durationHours);
  const hours = [];
  for (let h = 0; h <= lastHour; h++) {
    const km = Math.min(scenario.speedKmh * h, total);
    const { lat, lon, bearing } = pointAtKm(route.points, route.cumKm, km);
    const clockMin = startMin + h * 60;
    hours.push({
      hour: h,
      km,
      lat,
      lon,
      bearing,
      clockTime: `${pad2(Math.floor(clockMin / 60) % 24)}:${pad2(clockMin % 60)}`,
      dayOffset: Math.floor(clockMin / 1440),
    });
  }
  return hours;
}
