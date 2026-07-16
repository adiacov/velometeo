// Full-screen map page (map.html?event=<id>&scenario=<kind>&back=...) —
// the Delacau maps/* page rebuilt on runtime data: back link, scenario
// cycler, key/all hours toggle. The map, route, and controls render
// immediately; weather markers appear as soon as the fetch lands.
import { loadEvent, loadWeather, enrichScenarios, persistedModel, scenarioShortLabel } from './event-data.js';
import { initI18n, t } from './i18n.js';
import { initMap, renderWeatherMarkers } from './map.js';

const params = new URLSearchParams(window.location.search);

function setParam(name, value) {
  const next = new URLSearchParams(window.location.search);
  next.set(name, value);
  window.history.replaceState(null, '', `${window.location.pathname}?${next.toString()}`);
}

async function main() {
  await initI18n();

  const back = params.get('back') || 'index.html';
  const backLink = document.querySelector('[data-back-link]');
  backLink.href = back;
  backLink.textContent = t('map.back');
  backLink.addEventListener('click', (event) => {
    // Prefer real history so scroll position survives (Delacau behavior).
    if (window.history.length > 1 && document.referrer) {
      event.preventDefault();
      window.history.back();
    }
  });

  let data;
  try {
    data = await loadEvent(params.get('event'));
  } catch (err) {
    document.querySelector('.map-page').innerHTML = `<div class="note">${t(err.key || 'error.unknownEvent')}</div>`;
    return;
  }
  document.title = `${data.entry.name} — velometeo`;

  const kinds = data.scenarios.map((s) => s.kind);
  const byKind = new Map(data.scenarios.map((s) => [s.kind, s]));
  let scenarioKind = kinds.includes(params.get('scenario')) ? params.get('scenario') : kinds[Math.min(1, kinds.length - 1)];
  let mode = params.get('mode') === 'key' ? 'key' : 'all';
  let rowsByKind = null; // filled when the weather fetch lands

  // Map, route, and checkpoints appear before any weather round-trip.
  const mapHandle = initMap('route-map', data.route, data.route.waypoints);

  const scenarioControl = document.querySelector('[data-scenario-control]');
  const modeControl = document.querySelector('[data-mode-control]');

  function renderControls() {
    scenarioControl.textContent = `${scenarioShortLabel(byKind.get(scenarioKind))} ▾`;
    modeControl.textContent = t(mode === 'key' ? 'map.keyHours' : 'map.allHours');
  }

  function renderMarkers() {
    if (rowsByKind) renderWeatherMarkers(mapHandle, rowsByKind.get(scenarioKind).rows, t, mode);
  }

  scenarioControl.addEventListener('click', () => {
    scenarioKind = kinds[(kinds.indexOf(scenarioKind) + 1) % kinds.length];
    setParam('scenario', scenarioKind);
    renderControls();
    renderMarkers();
  });
  modeControl.addEventListener('click', () => {
    mode = mode === 'key' ? 'all' : 'key';
    setParam('mode', mode);
    renderControls();
    renderMarkers();
  });

  renderControls();

  const { locations } = await loadWeather(data, persistedModel().key);
  rowsByKind = new Map(enrichScenarios(data.scenarios, data.entry.date, locations).map((s) => [s.kind, s]));
  renderMarkers();
}

main().catch((err) => {
  console.error('velometeo: unexpected failure', err);
});
