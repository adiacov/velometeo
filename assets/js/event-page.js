// Event page controller: ?event=<id> → scenario sections with hourly
// weather tables; each scenario header links to the full-screen map page
// (Delacau UX). Broken input degrades to a friendly message (FR-005);
// weather failure keeps the page structure (FR-017). Rendering is
// repeatable: language switch re-renders, model switch refetches then
// re-renders (clarification Q3).
import {
  loadEvent,
  loadWeather,
  enrichScenarios,
  persistedModel,
  MODEL_STORAGE_KEY,
  EventDataError,
} from './event-data.js';
import { MODELS, modelByKey, daysUntilForecast, provenanceOf, nowInTimeZone } from './lib/weather-api.js';
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
import { initI18n, t, onLangChange } from './i18n.js';

const $ = (sel) => document.querySelector(sel);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
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

async function main() {
  await initI18n();

  // Errors before the page can exist: message survives language switches.
  let fatalErrorKey = null;
  const showError = (key) => {
    fatalErrorKey = key;
    $('[data-event-status]').innerHTML = `<div class="note">${escapeHtml(t(key))}</div>`;
    $('[data-scenarios]').innerHTML = '';
  };
  onLangChange(() => {
    if (fatalErrorKey) showError(fatalErrorKey);
  });

  const id = new URLSearchParams(window.location.search).get('event');

  let data;
  try {
    data = await loadEvent(id);
  } catch (err) {
    showError(err instanceof EventDataError ? err.key : 'error.unknownEvent');
    return;
  }
  const { entry, route } = data;

  document.title = `${entry.name} — velometeo`;
  $('[data-event-name]').textContent = entry.name;
  $('[data-event-date]').textContent = entry.date;
  $('[data-event-start]').textContent = entry.start;
  $('[data-event-distance]').textContent = formatKm(route.lengthKm);
  const cpPill = $('[data-event-checkpoints]');
  if (route.waypoints.length > 0) {
    cpPill.querySelector('b').textContent = String(route.waypoints.length);
  } else {
    cpPill.remove(); // checkpoints are optional (FR-003)
  }

  // Mutable view state: model choice, fetch outcome, open scenario.
  // All sections start closed; openKind only tracks the visitor's choice.
  let modelKey = persistedModel().key;
  let weather = null;
  let openKind = null;

  function mapPageUrl(kind) {
    const q = new URLSearchParams({ event: entry.id, scenario: kind, back: `event.html?event=${entry.id}` });
    return `map.html?${q}`;
  }

  function switcherHtml(model) {
    const links = MODELS.map((m) => `<a href="#" data-model="${escapeHtml(m.key)}" class="${m.key === model.key ? 'active' : ''}">${escapeHtml(m.label)}</a>`).join('');
    return `<div class="model-switcher"><span class="pill"><b>${escapeHtml(t('model.title'))}</b></span><div class="source-links">${links}</div></div>`;
  }

  function statusHtml(model) {
    if (weather.state === 'waiting') {
      const days = Math.ceil(daysUntilForecast(data.eventTimes, nowInTimeZone(data.timezone), model.horizonDays));
      return `<div class="note">${escapeHtml(t('weather.waiting', { days }))}</div>`;
    }
    const provenance = provenanceOf(weather.state);
    const pill = `<span class="pill"><b>${escapeHtml(t(`provenance.${provenance}`))}</b> · ${escapeHtml(model.label)}</span>`;
    return weather.fetchFailed ? `${pill}<div class="note">${escapeHtml(t('weather.unavailable'))}</div>` : pill;
  }

  function renderAll() {
    const model = modelByKey(modelKey);

    $('[data-event-status]').innerHTML = statusHtml(model);
    $('[data-model-switcher]').innerHTML = switcherHtml(model);
    document.querySelectorAll('[data-model]').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        if (el.dataset.model === modelKey) return;
        modelKey = modelByKey(el.dataset.model).key;
        localStorage.setItem(MODEL_STORAGE_KEY, modelKey);
        weather = await loadWeather(data, modelKey); // lazy: selected model only
        renderAll();
      });
    });

    const enriched = enrichScenarios(data.scenarios, entry.date, weather.locations);

    const container = $('[data-scenarios]');
    container.innerHTML = enriched
      .map((s) => `<details class="scenario" data-scenario="${escapeHtml(s.kind)}" ${s.kind === openKind ? 'open' : ''}>
        <summary class="scenario-head">
          <h3>${escapeHtml(scenarioTitle(s, entry.start, s.rows[s.rows.length - 1]))}</h3>
          <a class="map-button" href="${mapPageUrl(s.kind)}" onclick="event.stopPropagation()">${escapeHtml(t('map.view'))}</a>
        </summary>
        ${tableHtml(s.rows)}
        ${cardsHtml(s.rows)}
      </details>`)
      .join('');

    const details = [...container.querySelectorAll('.scenario')];
    details.forEach((el) => {
      el.addEventListener('toggle', () => {
        if (!el.open) {
          // Closing the tracked section means nothing stays open —
          // re-renders (model/language switch) must not reopen it.
          if (el.dataset.scenario === openKind) openKind = null;
          return;
        }
        openKind = el.dataset.scenario;
        details.forEach((other) => {
          if (other !== el) other.open = false;
        });
      });
    });
  }

  onLangChange(() => {
    if (!fatalErrorKey) renderAll(); // same data, new language (no refetch)
  });

  weather = await loadWeather(data, modelKey);
  renderAll();
}

main().catch((err) => {
  console.error('velometeo: unexpected failure', err);
  const el = document.querySelector('[data-event-status]');
  if (el) el.innerHTML = '<div class="note">…</div>';
});
