# Data Model: velometeo MVP

**Date**: 2026-07-16 · **Plan**: [plan.md](plan.md)

All data is either repository files (manifest + GPX), derived in-browser
state, or provider responses. Nothing is persisted server-side.

## Event (manifest entry — `routes/index.json`)

| Field | Type | Required | Validation |
|---|---|---|---|
| `id` | string | yes | URL-safe slug (`[a-z0-9-]+`), unique in manifest |
| `name` | string | yes | non-empty; shown verbatim (not translated) |
| `gpx` | string | yes | repo-relative path under `routes/`, file exists |
| `date` | string | yes | `YYYY-MM-DD` |
| `start` | string | yes | `HH:MM` 24-h, event-local (clarification Q2) |
| `mode` | string | yes | `brevet` \| `pace` |
| `timezone` | string | no | IANA zone; default `Europe/Chisinau` |

Derived at runtime: measured length (km), brevet distance class + band
trio (brevet mode), upcoming/past/waiting status, event page URL
(`event.html?event=<id>`).

State transitions (derived, never stored): `waiting` (start beyond
forecast horizon) → `forecast` (within horizon) → `recent-past` (ended,
≤ 7 days; forecast API `past_days`) → `archive` (> 7 days; archive API).
Transitions happen implicitly as wall-clock time passes; every page load
re-derives the state (research D9).

## Route (parsed GPX)

- `points`: ordered `[lat, lon]` track points (first `<trk>`; segments
  concatenated).
- `cumKm`: cumulative haversine distance per point; total = measured length.
- `waypoints`: optional `<wpt>` list `{lat, lon, name}` → checkpoints
  (FR-003); absence is valid.
- Validation: parseable XML, ≥ 2 track points, total length > 0; in brevet
  mode, warn (console + curator docs) when length deviates > 15% from the
  nearest standard distance (spec edge case).

## Scenario

| Field | Type | Notes |
|---|---|---|
| `label` | i18n key + params | e.g. "fast (8 h)" / "25 km/h" |
| `durationHours` | number | brevet: band table; pace: length ÷ speed |
| `kind` | `fast`\|`typical`\|`max` or `pace-20`\|`pace-25`\|`pace-30` | exactly one mode's set per page (FR-009) |

Derived: `hours[]` — for each whole hour h ∈ [0, ceil(duration)]:
`{ clockTime, dayOffset, km: min(speed·h, length), lat, lon, bearing }`
where speed = length / duration and position interpolates along `cumKm`
(FR-010); `bearing` is the local direction of travel used for
wind-relative display (FR-015).

Brevet band table (from spec FR-007; source of truth for `scenarios.js`):
200 → 8/10/13.5 h; 300 → 12/15/20; 400 → 16/20/27; 600 → 24/30/40;
1000 → 45/56/75; 1200 (RM) → 54/68/90.

## WeatherPoint (provider response slice)

| Field | Type | Notes |
|---|---|---|
| `time` | ISO local hour | in event timezone |
| `temperature`, `apparent` | °C or null | null → `—` (FR-016) |
| `precipitation` | mm or null | plus `precipitationProbability` % (forecast only; null in archive → `—`) |
| `weatherCode`, `cloudCover` | WMO code / % or null | icon + text |
| `windSpeed`, `windGusts` | km/h or null | |
| `windDirection` | ° or null | + derived `windRelative` (head/tail/cross) from scenario `bearing` |
| `provenance` | `forecast`\|`recorded`\|`observed` | drives the page label (FR-013) |

Keyed by (scenario, hour) after slicing the batched response; missing any
field renders as `—`, never interpolated.

## Model (weather provider entry — static table in `weather-api.js`)

| Field | Example | Notes |
|---|---|---|
| `key` | `ecmwf` | persisted in `localStorage.velometeo.model` |
| `label` | `ECMWF` | shown on the switcher pill |
| `apiModel` | `ecmwf_ifs025` | Open-Meteo `models=` value (re-verify at impl.) |
| `horizonDays` | 15 | drives waiting-mode boundary (D9) |

Launch set: ECMWF, ICON. Adding a model = one row here (no per-route edits;
constitution III untouched since models are product code, not routes).

## Visitor preferences (`localStorage`)

`velometeo.theme` (`light`|`dark`, default system), `velometeo.lang`
(`ro`|`en`|`ru`, default `ro`), `velometeo.model` (model key, default
`ecmwf`). All survive across pages and visits (clarification Q3).

## Relationships

```text
manifest 1—n Event ──1 Route (gpx path)
Event ──1 mode ──n Scenario ──n hours ──1 WeatherPoint (per model)
Model 1—n WeatherPoint (provenance per event state)
```
