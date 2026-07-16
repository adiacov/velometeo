// Full-screen map page (map.html?event=<id>&scenario=<kind>&back=...) —
// the Delacau maps/* page rebuilt on runtime data: back link, scenario
// cycler, key/all hours toggle, fit-route button.
import { loadEvent, loadWeather, enrichScenarios, persistedModel, scenarioShortLabel } from './event-data.js';
import { initI18n, t } from './i18n.js';
import { initMap, fitRoute, renderWeatherMarkers } from './map.js';

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
  let scenarioKind = kinds.includes(params.get('scenario')) ? params.get('scenario') : kinds[Math.min(1, kinds.length - 1)];
  let mode = params.get('mode') === 'key' ? 'key' : 'all';

  const mapHandle = initMap('route-map', data.route, data.route.waypoints);
  document.querySelector('[data-fit-route]').addEventListener('click', () => fitRoute(mapHandle));
  document.querySelector('[data-fit-route]').textContent = t('map.fit');

  const { locations } = await loadWeather(data, persistedModel().key);
  const enriched = enrichScenarios(data.scenarios, data.entry.date, locations);
  const byKind = new Map(enriched.map((s) => [s.kind, s]));

  const scenarioControl = document.querySelector('[data-scenario-control]');
  const modeControl = document.querySelector('[data-mode-control]');

  function render() {
    const scenario = byKind.get(scenarioKind);
    scenarioControl.textContent = `${scenarioShortLabel(scenario)} ▾`;
    modeControl.textContent = t(mode === 'key' ? 'map.keyHours' : 'map.allHours');
    renderWeatherMarkers(mapHandle, scenario.rows, t, mode);
  }

  scenarioControl.addEventListener('click', () => {
    scenarioKind = kinds[(kinds.indexOf(scenarioKind) + 1) % kinds.length];
    setParam('scenario', scenarioKind);
    render();
  });
  modeControl.addEventListener('click', () => {
    mode = mode === 'key' ? 'all' : 'key';
    setParam('mode', mode);
    render();
  });

  render();
}

main().catch((err) => {
  console.error('velometeo: unexpected failure', err);
});
