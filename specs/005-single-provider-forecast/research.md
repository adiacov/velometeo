# Research: Single Provider & Date-Aware Forecast

**Feature**: 005-single-provider-forecast | **Date**: 2026-07-18

No NEEDS CLARIFICATION markers existed (owner decisions locked in
conversation 2026-07-18). Research consolidates the decisions and the
facts they rest on.

## R1 — Single provider: which one and why

- **Decision**: ECMWF only (`ecmwf_ifs025` via Open-Meteo forecast API).
- **Rationale**: longest free horizon on Open-Meteo (15 days vs ICON's 7),
  global gold-standard model, already the site default
  (`DEFAULT_MODEL_KEY = 'ecmwf'`). Model id verified against the live API
  2026-07-16 (feature 001); no re-verification needed — same id, same
  endpoint.
- **Alternatives considered**: keeping ICON as a comparison model —
  rejected by owner (buttons confused users; on past events they changed
  nothing at all); `best_match` auto-model — rejected: opaque provenance
  contradicts the honest-data principle (rider should know whose forecast
  they read).

## R2 — Past events: today's forecast instead of observed history

- **Decision**: for events with `date < today` (event timezone), fetch the
  forecast for the page-load date; delete the archive path entirely.
- **Rationale**: owner redefined page purpose — "a velo enthusiast may
  want to repeat the race and should know the weather". Removes the
  archive endpoint, the `recent-past`/`archive` states, the
  `ARCHIVE_AFTER_DAYS` lag constant, and the forecast-only
  `precipitation_probability` asymmetry (probability now always present).
- **Alternatives considered**: keeping observed data alongside (rejected:
  "we don't keep historical data"); nightly pre-generation pipeline
  (rejected after discussion: stale up to 24 h, calls the API for every
  event daily regardless of views, regresses constitution VII — client
  fetch retained).

## R3 — Target-date rule and state machine

- **Decision**: `targetDate = eventDate >= today ? eventDate : today`;
  states collapse from 4 (`waiting/forecast/recent-past/archive`) to 2
  (`waiting/forecast`). Boundary: event day == today → upcoming (event-day
  forecast, preparation wording).
- **Rationale**: smallest rule that satisfies FR-002/FR-003; `waiting`
  logic (event > 15 days out) is unchanged and unreachable for past
  events (today is always within horizon).
- **Alternatives considered**: keeping a distinct "recent-past" state for
  events that ended < 7 days ago — obsolete: its only purpose was
  covering the archive reanalysis lag, which no longer exists.

## R4 — Fetch window anchored at target date

- **Decision**: `start_date = targetDate`,
  `end_date = targetDate + ceil((startMinutes/60 + maxDurationHours)/24)`
  — the existing formula with `event.date` replaced by `targetDate`.
  `localIsoHour` anchors at targetDate too, so row lookups and
  past-midnight day offsets keep working unchanged.
- **Rationale**: one batched request per page load is preserved (SC-004);
  ECMWF horizon comfortably covers today + longest brevet (90 h).

## R5 — Status line content and localization

- **Decision**: one line replacing the status pill + switcher sections:
  provider label + explicit date + rationale. Two new i18n keys
  (`status.upcoming`, `status.past`) with a `{date}` placeholder; date
  formatted via `Intl.DateTimeFormat(lang, { day, month: 'long',
  year })` in a new `formatDate` helper (format.js already owns
  presentation formatting). `model.title` and `provenance.*` keys are
  deleted from all three dictionaries; `notes.data` reworded to one
  model.
- **Rationale**: FR-005/FR-006; `Intl` is built-in (no deps), matches the
  existing `nowInTimeZone` reliance on `Intl.DateTimeFormat`.
- **Alternatives considered**: reusing `provenance.forecast` + a separate
  date pill — rejected: two elements where the spec demands one clear
  sentence; raw ISO dates — rejected: non-technical audience (VI).

## R6 — Persisted model preference

- **Decision**: stop reading/writing `localStorage['velometeo.model']`;
  leave stale keys in place (inert).
- **Rationale**: FR-008 "ignored gracefully"; active cleanup
  (`removeItem`) is one more code path for zero user value.

## R7 — Constitution amendment scope

- **Decision**: v1.0.0 → **1.1.0 (MINOR)**. Replace the Additional
  Constraints bullet "Past events … archive API … permanent record" with
  the new target-date rule; trim Principle V's sentence about labeling
  observed data (no observed data exists anymore; the general
  never-mislabel rule stays). Update the Sync Impact Report comment.
- **Rationale**: governance section: MINOR = "materially expanded
  guidance"; no principle is removed or redefined (the archive rule lived
  in Additional Constraints, not in a principle). Owner approval given
  2026-07-18 (this feature's driving conversation).

## R8 — Test impact

- **Decision**: rewrite `tests/weather-api.test.js` state/URL cases
  (drop archive URL + recent-past assertions; add target-date cases:
  future → event day, past → today, boundary equal, waiting unchanged,
  past-midnight window); extend `tests/format.test.js` with `formatDate`
  in three locales. Dictionary-completeness tests must cover the new
  keys and assert the removed ones are gone from usage.
- **Rationale**: SC-005; keeps the fast, dependency-free `node --test`
  setup.
