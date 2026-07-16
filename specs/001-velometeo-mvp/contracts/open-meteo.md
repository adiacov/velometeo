# Contract: Open-Meteo usage (external dependency)

Verified 2026-07-16 (docs + live CORS check; see spec Research Findings).
Free non-commercial tier, no API key, `access-control-allow-origin: *`.

## Endpoints & when each is used (research D9)

| Event state | Endpoint | Key params |
|---|---|---|
| Upcoming, within model horizon | `https://api.open-meteo.com/v1/forecast` | `forecast_days` as needed, `models=<apiModel>` |
| Ended ≤ 7 days ago | same forecast endpoint | `start_date`/`end_date` = event day(s) (past dates verified accepted live; equivalent to `past_days` ≤ 92 but slices cleaner) |
| Ended > 7 days ago | `https://archive-api.open-meteo.com/v1/archive` | `start_date`/`end_date` = event day(s) |
| Start beyond horizon | no weather call | waiting mode, message only |

## Request shape (batched, one call per selected model)

- `latitude`/`longitude`: comma-separated lists — the deduplicated sample
  positions for all scenarios of the event (multi-location request).
- `hourly`: `temperature_2m,apparent_temperature,precipitation,`
  `precipitation_probability,weather_code,cloud_cover,wind_speed_10m,`
  `wind_direction_10m,wind_gusts_10m`
  (archive endpoint: without `precipitation_probability`, it is
  forecast-only → renders `—`).
- `timezone`: the event's IANA zone (times arrive event-local).
- `models`: `ecmwf_ifs025` (ECMWF) / `icon_seamless` (ICON) — ids MUST be
  re-verified against the live API during implementation.
- `wind_speed_unit=kmh`.

## Response handling

- Multi-location responses return an array of per-location objects in
  request order; slice each scenario's hours from its positions.
- Any missing/null variable value → `—` (FR-016); never interpolate.
- Fetch failure (network, 4xx/5xx, malformed JSON) → route and map still
  render; weather areas show the i18n'd unavailability message (FR-017).
- Fair use: < 10,000 calls/day; expected usage is ≤ a few calls per page
  view — no client-side rate limiting needed, but never poll or auto-refresh.
