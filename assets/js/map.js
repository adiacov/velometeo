// Leaflet map primitives for map.html. Adapted from Delacau assets/map.js
// (route polyline, weather markers, wind arrows, popups) — fed from runtime
// data instead of a baked window.*_MAP_DATA object.
import { formatTemperature, formatWind, formatPrecipitation, degreesToCardinal, DASH } from './lib/format.js';

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
  return L.divIcon({
    className: `weather-marker ${cls} ${compact ? 'compact' : ''}`,
    html: `<div class="wm"><span>${escapeHtml(row.timeLabel)}</span><strong>${temp} <em>${arrow}</em></strong></div>`,
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
  return `<div class="weather-popup">
    <b>${escapeHtml(row.timeLabel)} · km ${Math.round(row.km)}</b><br>
    ${t('table.temp')}: <b>${formatTemperature(wp.temperature)}</b> (${t('table.feels')}: ${formatTemperature(wp.apparent)})<br>
    ${t('table.precip')}: <b>${formatPrecipitation(wp.precipitation)}</b><br>
    ${t('table.wind')}: <b>${windLine}</b>
  </div>`;
}

// Create the map with route line and optional checkpoint markers.
// Returns a handle used by renderWeatherMarkers.
export function initMap(containerId, route, waypoints) {
  const map = L.map(containerId, { scrollWheelZoom: false, tap: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const routeLine = L.polyline(route.points, { color: '#0f766e', weight: 5, opacity: 0.9 }).addTo(map);
  const bounds = routeLine.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

  const checkpointLayer = L.layerGroup().addTo(map);
  (waypoints || []).forEach((point) => {
    const marker = L.circleMarker([point.lat, point.lon], {
      radius: 8,
      color: '#2563eb',
      fillColor: '#93c5fd',
      fillOpacity: 0.95,
      weight: 2,
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
