// GPX extraction without DOMParser: Node (used by tests) has no DOM, so the
// same attribute/tag scanning runs in both the browser and node:test. GPX is
// machine-generated; this is an extractor for well-formed route files, not a
// general XML parser.
import { cumulativeKm } from './geo.js';

export class GpxError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GpxError';
    this.code = code; // 'not-gpx' | 'no-track'
  }
}

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };

function decodeEntities(text) {
  return text.replace(/&(?:amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m]);
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function latLonOf(tag) {
  const lat = Number(attr(tag, 'lat'));
  const lon = Number(attr(tag, 'lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return [lat, lon];
}

// Parse GPX text into { points, cumKm, lengthKm, waypoints }.
// Track segments are concatenated in document order (data-model Route).
// Throws GpxError when the text is not GPX or has fewer than 2 track points.
export function parseGpx(text) {
  if (!/<gpx[\s>]/.test(text)) {
    throw new GpxError('not-gpx', 'File does not look like GPX');
  }

  const points = [];
  for (const m of text.matchAll(/<trkpt\b[^>]*>/g)) {
    const p = latLonOf(m[0]);
    if (p) points.push(p);
  }
  if (points.length < 2) {
    throw new GpxError('no-track', 'GPX has no usable track (need at least 2 track points)');
  }

  const waypoints = [];
  for (const m of text.matchAll(/<wpt\b([^>]*)>([\s\S]*?)<\/wpt>/g)) {
    const p = latLonOf(m[1]);
    if (!p) continue;
    const nameMatch = m[2].match(/<name>([\s\S]*?)<\/name>/);
    waypoints.push({
      lat: p[0],
      lon: p[1],
      name: nameMatch ? decodeEntities(nameMatch[1].trim()) : '',
    });
  }

  const cumKm = cumulativeKm(points);
  return { points, cumKm, lengthKm: cumKm[cumKm.length - 1], waypoints };
}
