// Formatting rules. The honest-data principle lives here: any null/undefined
// renders as an em dash (FR-016) — no interpolation, no substitutes.

export const DASH = '—';

const isMissing = (v) => v === null || v === undefined || Number.isNaN(v);

export function formatTemperature(v) {
  return isMissing(v) ? DASH : `${Math.round(v)}°C`;
}

export function formatWind(v) {
  return isMissing(v) ? DASH : `${Math.round(v)} km/h`;
}

export function formatPrecipitation(v) {
  return isMissing(v) ? DASH : `${Math.round(v * 10) / 10} mm`;
}

export function formatPercent(v) {
  return isMissing(v) ? DASH : `${Math.round(v)}%`;
}

export function formatKm(v) {
  return isMissing(v) ? DASH : `${Math.round(v)} km`;
}

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// 8-point compass name for a wind-from direction in degrees.
export function degreesToCardinal(deg) {
  if (isMissing(deg)) return DASH;
  return CARDINALS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

// Wind relative to the rider (FR-015). `windFromDeg` is where the wind blows
// FROM (Open-Meteo convention); wind from ahead is a headwind.
export function windRelative(travelBearingDeg, windFromDeg) {
  if (isMissing(travelBearingDeg) || isMissing(windFromDeg)) return null;
  let diff = Math.abs(((windFromDeg - travelBearingDeg) % 360 + 360) % 360);
  if (diff > 180) diff = 360 - diff;
  if (diff < 45) return 'head';
  if (diff > 135) return 'tail';
  return 'cross';
}

// Hour label with day context across midnight (FR-023): "02:00 +1d".
export function formatHour(clockTime, dayOffset) {
  return dayOffset > 0 ? `${clockTime} +${dayOffset}d` : clockTime;
}

// Scenario duration "13:30" style for labels.
export function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h} h` : `${h}:${String(m).padStart(2, '0')} h`;
}

const DATE_LOCALE = { ro: 'ro-RO', en: 'en-US', ru: 'ru-RU' };

// Long localized date ("18 iulie 2026" / "July 18, 2026" / "18 июля 2026 г.")
// for a "YYYY-MM-DD" string — the forecast target date in the status line.
export function formatDate(isoDate, lang) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(DATE_LOCALE[lang] || DATE_LOCALE.ro, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
