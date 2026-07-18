# Implementation Plan: Single Provider & Date-Aware Forecast

**Branch**: `005-single-provider-forecast` | **Date**: 2026-07-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-single-provider-forecast/spec.md`

## Summary

Collapse the two-model weather system (ECMWF/ICON switcher, forecast/
recent-past/archive state machine) into one provider (ECMWF) and one data
path (forecast endpoint), targeted at a **forecast target date**: the event
day for upcoming events, the page-load day for past events. The archive API
path, "observed/recorded" provenance, the model switcher UI, and the
persisted model preference are removed. A single localized status line
states provider + target date + rationale. The constitution's
past-events-show-observed constraint is amended (owner-approved
2026-07-18).

## Technical Context

**Language/Version**: Vanilla JavaScript (ES modules), no build step, no
runtime dependencies (constitution I / forker promise)

**Primary Dependencies**: Leaflet (vendored, map pages), Open-Meteo
forecast API (keyless, CORS); the archive API dependency is *removed*

**Storage**: none; `localStorage` key `velometeo.model` becomes obsolete
(silently ignored, no migration)

**Testing**: `node --test tests/*.test.js` (61 tests today; archive tests
replaced by target-date tests)

**Target Platform**: static GitHub Pages site, mobile-first browsers

**Project Type**: static multi-page web app (index / event / map)

**Performance Goals**: unchanged — one batched weather request per page
load (SC-004); no extra round-trips

**Constraints**: fully static, keyless, client-side fetch only (owner
re-confirmed: no pipeline/pre-generation); strictly monochrome UI (003);
RO/EN/RU parity for all new strings

**Scale/Scope**: ~6 JS modules touched, 3 dictionaries, 1 HTML container,
1 test file rewritten + 1 extended, constitution + README text updates

## Constitution Check

*GATE: evaluated against constitution v1.0.0.*

| Principle | Verdict | Notes |
|---|---|---|
| I. Fully static, client-side only | ✅ PASS | Removes one external API path; keeps keyless client fetch. |
| II. Curated routes only | ✅ N/A | No route/entry changes. |
| III. Two-file route addition | ✅ PASS | Config schema untouched. |
| IV. Fork-friendly docs | ✅ PASS | README loses the two-model mention; fork flow unchanged. |
| V. Honest data | ✅ PASS | Dashes preserved; the status line *always* names the forecast target date, so today-forecast on a past event page cannot be mistaken for event-day history. The principle's sentence about labeling *observed* data becomes vestigial once observed data no longer exists — amended for accuracy. |
| VI. Mobile-first, multilingual, reused UX | ✅ PASS (deliberate change) | Removing the model switcher deviates from the Delacau UX on one control, owner-directed (2026-07-18) — same precedent as 003's visual supersession. |
| VII. No load-bearing scheduled automation | ✅ PASS | Owner explicitly re-affirmed client-side fetch; no cron introduced. |
| Additional constraint: "Past events MUST switch to archive API…" | ❌ VIOLATION → AMENDMENT | Directly superseded by this feature (FR-010). Owner decision recorded 2026-07-18; amendment ships in this feature (see Complexity Tracking). |

**Post-design re-check**: unchanged — the single violation is resolved by
the in-scope constitution amendment, not by design workarounds.

## Project Structure

### Documentation (this feature)

```text
specs/005-single-provider-forecast/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 (verification guide)
├── contracts/
│   ├── open-meteo.md    # Single-provider request/response contract
│   └── status-line.md   # Status line content & i18n key contract
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
assets/js/lib/weather-api.js   # single MODEL; targetDate rule; states
                               # waiting|forecast; archive path deleted
assets/js/event-data.js        # loadWeather w/o modelKey; targetDate in
                               # result; persistedModel/MODEL_STORAGE_KEY
                               # removed; enrichScenarios(targetDate)
assets/js/event-page.js        # switcher/cache/switchModel removed;
                               # single status line render
assets/js/map-page.js          # loadWeather call w/o model
assets/js/lib/format.js        # + formatDate(iso, lang) (Intl-based)
assets/i18n/{ro,en,ru}.json    # - provenance.*, model.title;
                               # + status.upcoming, status.past;
                               # notes.data reworded (one model)
event.html                     # model-switcher container removed
tests/weather-api.test.js      # archive/state tests → target-date tests
tests/format.test.js           # + formatDate cases
.specify/memory/constitution.md# amendment v1.1.0 (see below)
README.md                      # single-provider wording
STATE.md                       # close-out at merge
```

**Structure Decision**: existing flat static-site layout; no new modules —
this feature is net-negative in code (removal-dominant), in line with the
owner's "prefer removal over cleverness".

## Design Outline

1. **Target-date rule** (new, in `weather-api.js`):
   `targetDate(eventDate, todayLocal) = eventDate >= today ? eventDate : today`.
   States collapse to `waiting | forecast`: `waiting` only when the event
   day is more than `horizonDays` (15) ahead; past events are always
   `forecast` (today is trivially inside the horizon). `recent-past`,
   `archive`, `ARCHIVE_AFTER_DAYS`, `ARCHIVE_BASE`, `HOURLY_ARCHIVE`,
   `provenanceOf` are deleted.
2. **Fetch window**: `start_date = targetDate`,
   `end_date = targetDate + ceil((start + maxDuration)/24)` — identical
   shape to today, just anchored at targetDate. Row timestamps and
   `localIsoHour` also anchor at targetDate, so past-midnight scenarios
   keep working (edge case).
3. **Single model**: `MODELS`/`modelByKey`/`DEFAULT_MODEL_KEY` replaced by
   one exported `MODEL` constant (ECMWF, `ecmwf_ifs025`, 15 days,
   verified live 2026-07-16). `models=` param always sent.
4. **Status line** (event page): one element replacing status pill +
   switcher sections: localized string with provider name, formatted
   target date (Intl per active language), and rationale — `status.upcoming`
   for event-day forecasts, `status.past` for ride-now forecasts. Waiting
   and fetch-failure notes render exactly as today.
5. **Preference cleanup**: stop reading `velometeo.model`; never write it
   (FR-008 — leftover keys are inert).
6. **Constitution amendment (v1.0.0 → 1.1.0, MINOR)**: replace the
   past-events archive constraint with: past events show the forecast for
   the page-load date, clearly dated in the status line; trim Principle
   V's observed-data sentence accordingly. Sync Impact Report updated.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Additional-constraints rule "past events MUST use archive API / show observed weather" is removed | Owner redefined the product meaning of past-event pages (2026-07-18): permanently useful "ride this route now" forecast beats a historical record; also deletes a whole API path and the recent-past/archive state machine | Keeping both (observed + today's forecast) was rejected by the owner — more UI, more states, two data sources on one page; "we don't keep historical data" |
