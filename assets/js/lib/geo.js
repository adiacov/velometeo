// Geometry helpers. Points are [lat, lon] pairs (Leaflet's array convention).

const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// Initial bearing from a to b, degrees clockwise from north in [0, 360).
export function bearingDeg([lat1, lon1], [lat2, lon2]) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Cumulative distance in km for each point; cumKm[0] === 0.
export function cumulativeKm(points) {
  const cum = new Array(points.length);
  cum[0] = 0;
  for (let i = 1; i < points.length; i++) {
    cum[i] = cum[i - 1] + haversineKm(points[i - 1], points[i]);
  }
  return cum;
}

// Position and local direction of travel at `km` along the track.
// `km` is clamped to [0, total]. Bearing at the very end keeps the last
// segment's direction so wind-relative values stay meaningful at the finish.
export function pointAtKm(points, cumKm, km) {
  const total = cumKm[cumKm.length - 1];
  const target = Math.min(Math.max(km, 0), total);

  let lo = 0;
  let hi = cumKm.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumKm[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  // lo is the first index with cumKm[lo] >= target.
  const j = Math.max(lo, 1);
  const i = j - 1;
  const segLen = cumKm[j] - cumKm[i];
  const t = segLen > 0 ? (target - cumKm[i]) / segLen : 0;
  const lat = points[i][0] + (points[j][0] - points[i][0]) * t;
  const lon = points[i][1] + (points[j][1] - points[i][1]) * t;
  return { lat, lon, bearing: bearingDeg(points[i], points[j]) };
}
