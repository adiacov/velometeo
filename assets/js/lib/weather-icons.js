// WMO weather_code → condition bucket (002 research R1). One shared mapping
// so table, mobile cards, and map popup can never disagree (FR-008).
// Unknown or missing codes return null — honest data: no substitute icon.
//
// 003 (research R2): icons are inline monochrome SVG glyphs that inherit the
// surrounding text color via `currentColor`, so they always contrast on any
// surface (paper, inverted marker) in both themes — no colored emoji. Glyphs
// from Lucide (https://lucide.dev), ISC License, © Lucide contributors.

// Shared SVG envelope: 1em-sized, currentColor stroke, decorative (the
// accessible name lives on the wrapping element at each call site).
const svg = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em"`
  + ` fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"`
  + ` stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

// Lucide path data (v0.4xx). Precip variants share the open cloud arc so the
// marks sit below it; `cloud`/`sun` are the closed standalone glyphs.
const CLOUD_ARC = '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>';
const ICONS = {
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
  cloudSun: svg('<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>'),
  cloud: svg('<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>'),
  cloudFog: svg(CLOUD_ARC + '<path d="M16 17H7"/><path d="M17 21H9"/>'),
  cloudDrizzle: svg(CLOUD_ARC + '<path d="M8 19v1"/><path d="M8 14v1"/><path d="M16 19v1"/><path d="M16 14v1"/><path d="M12 21v1"/><path d="M12 16v1"/>'),
  cloudRain: svg(CLOUD_ARC + '<path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>'),
  cloudSnow: svg(CLOUD_ARC + '<path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/>'),
  cloudLightning: svg('<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/>'),
};

const BUCKETS = {
  clear: { icon: ICONS.sun, labelKey: 'weather.clear' },
  partlyCloudy: { icon: ICONS.cloudSun, labelKey: 'weather.partlyCloudy' },
  overcast: { icon: ICONS.cloud, labelKey: 'weather.overcast' },
  fog: { icon: ICONS.cloudFog, labelKey: 'weather.fog' },
  drizzle: { icon: ICONS.cloudDrizzle, labelKey: 'weather.drizzle' },
  rain: { icon: ICONS.cloudRain, labelKey: 'weather.rain' },
  snow: { icon: ICONS.cloudSnow, labelKey: 'weather.snow' },
  thunderstorm: { icon: ICONS.cloudLightning, labelKey: 'weather.thunderstorm' },
};
Object.values(BUCKETS).forEach(Object.freeze);

const CODE_TO_BUCKET = new Map();
const assign = (codes, bucket) => codes.forEach((c) => CODE_TO_BUCKET.set(c, BUCKETS[bucket]));
assign([0], 'clear');
assign([1, 2], 'partlyCloudy');
assign([3], 'overcast');
assign([45, 48], 'fog');
assign([51, 53, 55, 56, 57], 'drizzle');
assign([61, 63, 65, 66, 67, 80, 81, 82], 'rain');
assign([71, 73, 75, 77, 85, 86], 'snow');
assign([95, 96, 99], 'thunderstorm');

export function weatherCondition(code) {
  return typeof code === 'number' ? CODE_TO_BUCKET.get(code) ?? null : null;
}
