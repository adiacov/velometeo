# Data Model: Single Provider & Date-Aware Forecast

**Feature**: 005-single-provider-forecast | **Date**: 2026-07-18

## Model (weather provider)

Single constant (was: `MODELS` array + persisted choice).

| Field | Value | Notes |
|---|---|---|
| label | `ECMWF` | user-visible, in the status line and notes |
| apiModel | `ecmwf_ifs025` | Open-Meteo `models=` parameter |
| horizonDays | `15` | drives the `waiting` state |

## Event temporal state

Collapsed from 4 states to 2.

```
waiting   — event day more than horizonDays ahead of today (event tz)
forecast  — everything else (upcoming within horizon, event day, past)
```

Transitions are pure functions of (event.date, now); no stored state.
`recent-past`, `archive`, and `ARCHIVE_AFTER_DAYS` are deleted.

## ForecastTarget (new concept)

| Field | Type | Rule |
|---|---|---|
| targetDate | `YYYY-MM-DD` | `event.date >= today ? event.date : today` (today = `nowInTimeZone(event tz).date`) |
| kind | `upcoming \| past` | `upcoming` iff `event.date >= today` (boundary: event day == today → `upcoming`) |

Drives: fetch `start_date`/`end_date`, row hour lookups
(`localIsoHour(targetDate, …)`), and status-line wording/date.

## Weather fetch result (event-data)

| Field | Change |
|---|---|
| `model` | removed as a parameter; implied single MODEL |
| `state` | `waiting \| forecast` only |
| `target` | **new**: ForecastTarget (date + kind) for the status line |
| `locations` | unchanged (null when waiting/failed) |
| `fetchFailed` | unchanged |

## StatusLine (presentation contract)

One element per event page (replaces status pill + model switcher):

| Part | Source |
|---|---|
| provider | `MODEL.label` |
| date | `formatDate(target.targetDate, lang)` — Intl long date per active language |
| rationale | i18n `status.upcoming` (prepare for the event) or `status.past` (ride the route now) |

Waiting and fetch-failure notes are unchanged and render in place of /
alongside the line exactly as before.

## WeatherPoint

Unchanged shape. `precipitationProbability` is now always requested
(forecast endpoint only) — the archive-era null asymmetry disappears;
missing values still render as `—` (honest data).

## Removed

- `MODELS`, `modelByKey`, `DEFAULT_MODEL_KEY`, `persistedModel`,
  `MODEL_STORAGE_KEY` (+ its localStorage use)
- `ARCHIVE_BASE`, `HOURLY_ARCHIVE`, `ARCHIVE_AFTER_DAYS`
- states `recent-past`/`archive`, `provenanceOf`
- i18n keys: `model.title`, `provenance.forecast`, `provenance.recorded`,
  `provenance.observed`
- event.html model-switcher container; event-page switcher render/cache
