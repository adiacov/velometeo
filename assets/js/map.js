// Leaflet map primitives for map.html. Adapted from Delacau assets/map.js
// (route polyline, weather markers, wind arrows, popups) — fed from runtime
// data instead of a baked window.*_MAP_DATA object.
import { formatTemperature, formatWind, formatPrecipitation, degreesToCardinal, DASH } from './lib/format.js';
import { weatherCondition } from './lib/weather-icons.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

// Arrows show where the wind blows TO; directions name where it comes FROM.
function windArrow(windFromDeg) {
  if (windFromDeg === null || windFromDeg === undefined) return '·';
  const toArrow = { N: '↓', NE: '↙', E: '←', SE: '↖', S: '↑', SW: '↗', W: '→', NW: '↘' };
  return toArrow[degreesToCardinal(windFromDeg)] || '·';
}

// A row is worth a caution color when rain is likely or falling.
function isCaution(wp) {
  if (!wp) return false;
  return (wp.precipitation ?? 0) >= 0.2 || (wp.precipitationProbability ?? 0) >= 50;
}

function keyIndexes(rows) {
  const last = rows.length - 1;
  const indexes = new Set([0, Math.round(last * 0.25), Math.round(last * 0.5), Math.round(last * 0.75), last]);
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    const next = rows[i + 1];
    const caution = isCaution(row.weather);
    if (caution && (!prev || !isCaution(prev.weather))) indexes.add(i);
    if (caution && (!next || !isCaution(next.weather))) indexes.add(i);
  });
  return indexes;
}

function markerIcon(row, compact) {
  const wp = row.weather;
  const cls = isCaution(wp) ? 'warn' : 'ok';
  const temp = wp && wp.temperature !== null ? `${Math.round(wp.temperature)}°` : DASH;
  const arrow = windArrow(wp ? wp.windDirection : null);
  const cond = weatherCondition(wp ? wp.weatherCode : null);
  return L.divIcon({
    className: `weather-marker ${cls} ${compact ? 'compact' : ''}`,
    html: `<div class="wm"><span>${escapeHtml(row.timeLabel)}${cond ? ` <em class="cond">${cond.icon}</em>` : ''}</span><strong>${temp} <em>${arrow}</em></strong></div>`,
    iconSize: compact ? [54, 42] : [62, 48],
    iconAnchor: compact ? [27, 42] : [31, 48],
    popupAnchor: [0, -46],
  });
}

function popupHtml(row, t) {
  const wp = row.weather || {};
  const dir = wp.windDirection;
  const windLine = dir === null || dir === undefined
    ? DASH
    : `<span class="popup-wind-arrow">${windArrow(dir)}</span> ${degreesToCardinal(dir)}, ${formatWind(wp.windSpeed)} / ${formatWind(wp.windGusts)}`;
  const cond = weatherCondition(wp.weatherCode);
  const condIcon = cond ? ` <span title="${escapeHtml(t(cond.labelKey))}">${cond.icon}</span>` : '';
  return `<div class="weather-popup">
    <b>${escapeHtml(row.timeLabel)} · km ${Math.round(row.km)}</b>${condIcon}<br>
    ${t('table.temp')}: <b>${formatTemperature(wp.temperature)}</b> (${t('table.feels')}: ${formatTemperature(wp.apparent)})<br>
    ${t('table.precip')}: <b>${formatPrecipitation(wp.precipitation)}</b><br>
    ${t('table.wind')}: <b>${windLine}</b>
  </div>`;
}

// Create the map with route line and optional checkpoint markers.
// Returns a handle used by renderWeatherMarkers.
export function initMap(containerId, route, waypoints) {
  const map = L.map(containerId, { scrollWheelZoom: false, tap: true });
  // Drop Leaflet's default prefix (it embeds a colored flag emoji) — keep the
  // page strictly monochrome (003).
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  // Minimal monochrome basemap: CARTO Positron (keyless), used in BOTH page
  // themes. A dark basemap makes the near-black weather markers/controls blend
  // in; a single light "printed map" panel stays legible everywhere, so the
  // map's overlays are pinned to a fixed light scheme in CSS (theme-independent).
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    detectRetina: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  // A cased route line: a wide paper-colored halo (.route-casing) under the
  // ink line (.route-line) so the route reads over any basemap. Colors are
  // monochrome fallbacks; real per-theme ink/paper comes from CSS.
  L.polyline(route.points, { color: '#fff', weight: 8, opacity: 1, className: 'route-casing' }).addTo(map);
  const routeLine = L.polyline(route.points, { color: '#111', weight: 4, opacity: 1, className: 'route-line' }).addTo(map);
  const bounds = routeLine.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

  const checkpointLayer = L.layerGroup().addTo(map);
  (waypoints || []).forEach((point) => {
    const marker = L.circleMarker([point.lat, point.lon], {
      radius: 8,
      color: '#111',
      fillColor: '#fff',
      fillOpacity: 0.95,
      weight: 2,
      className: 'route-checkpoint',
    });
    if (point.name) marker.bindPopup(`<b>${escapeHtml(point.name)}</b>`);
    marker.addTo(checkpointLayer);
  });

  const weatherLayer = L.layerGroup().addTo(map);
  return { map, bounds, weatherLayer };
}

// Render hourly markers for one scenario. `rows` are scenario hours enriched
// with { timeLabel, weather } (weather may be null — markers then show
// dashes, honest-data rule). `mode` mirrors Delacau: 'all' shows every hour
// with compact icons, 'key' shows start/quarters/finish plus rain
// transitions with full-size icons.
export function renderWeatherMarkers(handle, rows, t, mode = 'all') {
  handle.weatherLayer.clearLayers();
  const keys = mode === 'all' ? null : keyIndexes(rows);
  rows.forEach((row, i) => {
    if (keys && !keys.has(i)) return;
    const marker = L.marker([row.lat, row.lon], { icon: markerIcon(row, mode === 'all') });
    marker.bindPopup(popupHtml(row, t), { autoPan: true, keepInView: true, autoPanPadding: [18, 72], offset: [0, -8] });
    marker.addTo(handle.weatherLayer);
  });
}
