# Contract: Open-Meteo (single provider, target-date anchored)

Supersedes `specs/001-velometeo-mvp/contracts/open-meteo.md` for request
building. Response shape and normalization are unchanged.

## Request

Endpoint: `https://api.open-meteo.com/v1/forecast` — **only** endpoint
used; the archive endpoint is no longer called anywhere.

| Param | Value |
|---|---|
| latitude / longitude | comma-joined deduplicated sample positions, 4 decimals (unchanged) |
| hourly | `temperature_2m, apparent_temperature, precipitation, weather_code, cloud_cover, wind_speed_10m, wind_direction_10m, wind_gusts_10m, precipitation_probability` (always; no archive subset) |
| start_date | `targetDate` |
| end_date | `targetDate + ceil((startMinutes/60 + maxDurationHours)/24)` days |
| timezone | event timezone (default `Europe/Chisinau`) |
| wind_speed_unit | `kmh` |
| models | `ecmwf_ifs025` (always) |

`targetDate` = event date if `event.date >= today` (event tz), else
today. One request per page load; none in the `waiting` state.

## Response

Unchanged: object for one location, array for many
(`normalizeLocations`); hourly arrays indexed by local ISO hour; missing
values → null → `—`.

## Preconditions

- `waiting` (event > 15 days out): no request is made.
- Fetch failure: page renders with `fetchFailed`, rows dashed, status
  line still shows provider + target date.
