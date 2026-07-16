// Event page controller: ?event=<id> → manifest entry → GPX → scenarios →
// one batched Open-Meteo request → table + map. Broken input degrades to a
// friendly message (FR-005); weather failure keeps route and map (FR-017).
import { parseGpx } from './lib/gpx.js';
import { brevetScenarios, paceScenarios, classifyBrevet, scenarioHours } from './lib/scenarios.js';
import {
  modelByKey,
  selectEventState,
  daysUntilForecast,
  buildWeatherUrl,
  normalizeLocations,
  weatherAt,
  provenanceOf,
  nowInTimeZone,
  localIsoHour,
} from './lib/weather-api.js';
import {
  DASH,
  formatTemperature,
  formatWind,
  formatPrecipitation,
  formatPercent,
  formatKm,
  formatHour,
  formatDuration,
  degreesToCardinal,
  windRelative,
} from './lib/format.js';
import { initI18n, t } from './i18n.js';
import { initMap, fitRoute, renderWeatherMarkers } from './map.js';

const DEFAULT_TIMEZONE = 'Europe/Chisinau';
const MODEL_STORAGE_KEY = 'velometeo.model';

const $ = (sel) => document.querySelector(sel);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function showError(key) {
  $('[data-event-status]').innerHTML = `<div class="note">${escapeHtml(t(key))}</div>`;
}

function scenarioTitle(scenario, startHhMm, lastHour) {
  const from = startHhMm;
  const to = formatHour(lastHour.clockTime, lastHour.dayOffset);
  if (scenario.kind.startsWith('pace-')) {
    return t('scenario.pace', { speed: scenario.speedKmh, from, to });
  }
  return t(`scenario.${scenario.kind}`, { duration: formatDuration(scenario.durationHours), from, to });
}

function windCellHtml(row) {
  const wp = row.weather;
  if (!wp || wp.windDirection === null || wp.windDirection === undefined) return DASH;
  const rel = windRelative(row.bearing, wp.windDirection);
  const relText = rel ? ` (${t(`wind.${rel}`)})` : '';
  return `<span class="wind-dir">${escapeHtml(degreesToCardinal(wp.windDirection))}${escapeHtml(relText)}</span>`;
}

function tableHtml(rows) {
  const head = ['table.time', 'table.km', 'table.temp', 'table.feels', 'table.precip', 'table.precipProb', 'table.wind', 'table.gusts', 'table.windDir']
    .map((k) => `<th>${escapeHtml(t(k))}</th>`)
    .join('');
  const body = rows
    .map((row) => {
      const wp = row.weather || {};
      return `<tr>
        <td>${escapeHtml(row.timeLabel)}</td>
        <td>${Math.round(row.km)}</td>
        <td>${escapeHtml(formatTemperature(wp.temperature))}</td>
        <td>${escapeHtml(formatTemperature(wp.apparent))}</td>
        <td>${escapeHtml(formatPrecipitation(wp.precipitation))}</td>
        <td>${escapeHtml(formatPercent(wp.precipitationProbability))}</td>
        <td>${escapeHtml(formatWind(wp.windSpeed))}</td>
        <td>${escapeHtml(formatWind(wp.windGusts))}</td>
        <td>${windCellHtml(row)}</td>
      </tr>`;
    })
    .join('');
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function cardsHtml(rows) {
  return `<div class="cards-mobile">${rows
    .map((row) => {
      const wp = row.weather || {};
      return `<div class="hour-card">
        <div class="time">${escapeHtml(row.timeLabel)} · km ${Math.round(row.km)}</div>
        <div class="grid">
          <div>${escapeHtml(t('table.temp'))} <b>${escapeHtml(formatTemperature(wp.temperature))}</b></div>
          <div>${escapeHtml(t('table.feels'))} <b>${escapeHtml(formatTemperature(wp.apparent))}</b></div>
          <div>${escapeHtml(t('table.precip'))} <b>${escapeHtml(formatPrecipitation(wp.precipitation))}</b></div>
          <div>${escapeHtml(t('table.precipProb'))} <b>${escapeHtml(formatPercent(wp.precipitationProbability))}</b></div>
          <div>${escapeHtml(t('table.wind'))} <b>${escapeHtml(formatWind(wp.windSpeed))}</b></div>
          <div>${escapeHtml(t('table.gusts'))} <b>${escapeHtml(formatWind(wp.windGusts))}</b></div>
          <div>${escapeHtml(t('table.windDir'))} <b>${windCellHtml(row)}</b></div>
        </div>
      </div>`;
    })
    .join('')}</div>`;
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

async function main() {
  await initI18n();

  const id = new URLSearchParams(window.location.search).get('event');

  let manifest;
  try {
    const res = await fetch('routes/index.json');
    manifest = await res.json();
  } catch {
    showError('error.unknownEvent');
    return;
  }

  const entry = (manifest.events || []).find((e) => e && e.id === id);
  if (!entry || !entry.gpx || !entry.date || !entry.start || !entry.mode) {
    showError('error.unknownEvent');
    return;
  }

  document.title = `${entry.name} — velometeo`;
  $('[data-event-name]').textContent = entry.name;

  let route;
  try {
    const res = await fetch(entry.gpx);
    if (!res.ok) throw new Error(String(res.status));
    route = parseGpx(await res.text());
  } catch (err) {
    console.warn(`velometeo: broken route for "${id}"`, err);
    showError('error.badRoute');
    return;
  }

  // Header pills.
  $('[data-event-date]').textContent = entry.date;
  $('[data-event-start]').textContent = entry.start;
  $('[data-event-distance]').textContent = formatKm(route.lengthKm);
  const cpPill = $('[data-event-checkpoints]');
  if (route.waypoints.length > 0) {
    cpPill.querySelector('b').textContent = String(route.waypoints.length);
  } else {
    cpPill.remove(); // checkpoints are optional (FR-003)
  }

  // Scenarios for the configured mode (exactly one mode per page, FR-009).
  const base = entry.mode === 'pace' ? paceScenarios(route.lengthKm) : brevetScenarios(route.lengthKm);
  if (entry.mode === 'brevet') {
    const cls = classifyBrevet(route.lengthKm);
    if (cls.warn) {
      console.warn(`velometeo: measured ${route.lengthKm.toFixed(1)} km deviates >15% from nearest standard ${cls.distance} km`);
    }
  }
  const scenarios = base.map((s) => ({ ...s, hours: scenarioHours(s, route, entry.start) }));
  const maxDurationHours = Math.max(...scenarios.map((s) => s.durationHours));

  const mapHandle = initMap('route-map', route, route.waypoints);
  $('[data-fit-route]').addEventListener('click', () => fitRoute(mapHandle));

  // Temporal state for the persisted model choice.
  const timezone = entry.timezone || DEFAULT_TIMEZONE;
  const model = modelByKey(localStorage.getItem(MODEL_STORAGE_KEY));
  const now = nowInTimeZone(timezone);
  const eventTimes = { date: entry.date, start: entry.start, maxDurationHours };
  const state = selectEventState(eventTimes, now, model.horizonDays);

  const statusEl = $('[data-event-status]');
  const provenance = provenanceOf(state);
  if (provenance) {
    statusEl.innerHTML = `<span class="pill"><b>${escapeHtml(t(`provenance.${provenance}`))}</b> · ${escapeHtml(model.label)}</span>`;
  }

  // Weather lookup per scenario hour; null until (unless) the fetch lands.
  let locations = null;
  const { positions, indexed } = collectPositions(scenarios);

  if (state === 'waiting') {
    const days = Math.ceil(daysUntilForecast(eventTimes, now, model.horizonDays));
    statusEl.innerHTML = `<div class="note">${escapeHtml(t('weather.waiting', { days }))}</div>`;
  } else {
    try {
      const res = await fetch(buildWeatherUrl({ state, positions, event: eventTimes, modelKey: model.key, timezone }));
      if (!res.ok) throw new Error(String(res.status));
      locations = normalizeLocations(await res.json());
    } catch (err) {
      console.warn('velometeo: weather fetch failed', err);
      statusEl.innerHTML = `<div class="note">${escapeHtml(t('weather.unavailable'))}</div>`;
    }
  }

  const enriched = indexed.map((s) => ({
    ...s,
    rows: s.hours.map((h) => ({
      ...h,
      timeLabel: formatHour(h.clockTime, h.dayOffset),
      weather: locations ? weatherAt(locations[h.positionIndex], localIsoHour(entry.date, h)) : null,
    })),
  }));

  // Scenario sections: collapsed <details>, one open at a time (Delacau UX);
  // the open scenario drives the map markers.
  const container = $('[data-scenarios]');
  container.innerHTML = enriched
    .map((s, i) => `<details class="scenario" data-scenario="${escapeHtml(s.kind)}" ${s.kind === 'typical' || (entry.mode === 'pace' && i === 1) ? 'open' : ''}>
      <summary class="scenario-head"><h3>${escapeHtml(scenarioTitle(s, entry.start, s.rows[s.rows.length - 1]))}</h3></summary>
      ${tableHtml(s.rows)}
      ${cardsHtml(s.rows)}
    </details>`)
    .join('');

  const byKind = new Map(enriched.map((s) => [s.kind, s]));
  const details = [...container.querySelectorAll('.scenario')];
  details.forEach((el) => {
    el.addEventListener('toggle', () => {
      if (!el.open) return;
      details.forEach((other) => {
        if (other !== el) other.open = false;
      });
      renderWeatherMarkers(mapHandle, byKind.get(el.dataset.scenario).rows, t);
    });
  });
  const initiallyOpen = container.querySelector('.scenario[open]') || details[0];
  if (initiallyOpen && !initiallyOpen.open) initiallyOpen.open = true;
  renderWeatherMarkers(mapHandle, byKind.get(initiallyOpen.dataset.scenario).rows, t);
}

main().catch((err) => {
  console.error('velometeo: unexpected failure', err);
  const el = document.querySelector('[data-event-status]');
  if (el) el.innerHTML = `<div class="note">${escapeHtml(t('weather.unavailable'))}</div>`;
});
