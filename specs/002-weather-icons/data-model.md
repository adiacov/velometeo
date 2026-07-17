# Data Model: Weather Condition Icons

No stored data changes. One new in-memory concept:

## Condition bucket

A named grouping of WMO weather codes.

| Field | Type | Notes |
|---|---|---|
| `icon` | string | Single emoji glyph, theme-neutral |
| `labelKey` | string | i18n key `weather.<bucket>`, translated at render time |

**Source value**: `weather.weatherCode` on each forecast row — already
parsed from Open-Meteo `hourly.weather_code` by
`assets/js/lib/weather-api.js` (line ~146); may be `null` for missing hours.

**Mapping** (total function over all inputs):

- 0 → clear · 1–2 → partly cloudy · 3 → overcast · 45, 48 → fog ·
  51–57 → drizzle · 61–67, 80–82 → rain · 71–77, 85–86 → snow ·
  95–99 → thunderstorm (exact code lists in [research.md](research.md) R1)
- any other number, `null`, `undefined`, non-numeric → `null` (unknown)

**Validation rules**:

- Unknown never renders an icon: table cell shows `DASH`; card/popup header
  omits the icon entirely (research R4).
- All 8 `labelKey` values exist in all three dictionaries (ro/en/ru);
  `t()` falls back to the raw key, which would be visibly wrong — tests
  guard dictionary completeness.

**State transitions**: none (pure lookup, recomputed on each render;
language switch re-renders labels via the existing i18n listener flow).
