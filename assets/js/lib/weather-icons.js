// WMO weather_code → condition bucket (002 research R1). One shared mapping
// so table, mobile cards, and map popup can never disagree (FR-008).
// Unknown or missing codes return null — honest data: no substitute icon.

const BUCKETS = {
  clear: { icon: '☀️', labelKey: 'weather.clear' },
  partlyCloudy: { icon: '⛅', labelKey: 'weather.partlyCloudy' },
  overcast: { icon: '☁️', labelKey: 'weather.overcast' },
  fog: { icon: '🌫️', labelKey: 'weather.fog' },
  drizzle: { icon: '🌦️', labelKey: 'weather.drizzle' },
  rain: { icon: '🌧️', labelKey: 'weather.rain' },
  snow: { icon: '🌨️', labelKey: 'weather.snow' },
  thunderstorm: { icon: '⛈️', labelKey: 'weather.thunderstorm' },
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
