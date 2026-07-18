# Tasks: Single Provider & Date-Aware Forecast

**Input**: Design documents from `/specs/005-single-provider-forecast/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: included — SC-005 explicitly requires target-date unit tests and a green suite after archive removal.

**Organization**: phase-gated per repo convention — one story phase → commit → owner review. Story order US1 → US2 → US3 is both priority and dependency order (US2 deletes plumbing US1 still tolerates; US3 replaces the pill US1/US2 leave in place), so the site stays working at every commit.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (governance gate)

**Purpose**: resolve the Constitution Check violation before any behavior change.

- [x] T001 Amend `.specify/memory/constitution.md` to v1.1.0 (owner-approved 2026-07-18): replace the Additional Constraints bullet "Past events … MUST switch to Open-Meteo's archive API … permanent record" with the target-date rule (past events show the forecast for the page-load date, clearly dated in the status line); trim Principle V's observed-data labeling sentence (observed data no longer exists; the never-mislabel rule stays); update the Sync Impact Report comment and version/amended dates.

**Checkpoint**: constitution gate passes; no code changed.

---

## Phase 2: User Story 1 — Ride a past route today (P1) 🎯 MVP

**Goal**: past events show today's forecast along the route; archive path deleted.

**Independent Test**: quickstart §2/§5 — Delacau page rows dated today, one `api.open-meteo.com/v1/forecast` request, zero archive requests, map parity. (Model switcher still present in this phase; both models are now forecast-only, which is consistent.)

- [x] T002 [US1] Rewrite temporal core in `assets/js/lib/weather-api.js`: add `forecastTarget(event, now)` returning `{ targetDate, kind: 'upcoming'|'past' }` per data-model.md (boundary: event day == today → `upcoming`); collapse `selectEventState` to `waiting | forecast` (waiting only when event day > horizonDays ahead; past → always forecast); anchor `buildWeatherUrl` `start_date`/`end_date` and callers' `localIsoHour` at `targetDate`; always request `HOURLY_FORECAST` with `models=`; delete `ARCHIVE_BASE`, `HOURLY_ARCHIVE`, `ARCHIVE_AFTER_DAYS` and all archive/recent-past branches; reduce `provenanceOf` to the forecast label only (deleted for good in T013).
- [x] T003 [US1] Propagate the target in `assets/js/event-data.js`: `loadWeather` computes and returns `target` (ForecastTarget); `enrichScenarios(scenarios, targetDate, locations)` anchors row lookups at `target.targetDate`; update both call sites `assets/js/event-page.js` and `assets/js/map-page.js` to pass `weather.target.targetDate`.
- [x] T004 [P] [US1] Rewrite `tests/weather-api.test.js` per research R8: target-date cases (future → event day, past → today, boundary event-day-equals-today → upcoming/event day, waiting beyond horizon unchanged, past-midnight fetch window anchored at targetDate); URL assertions forecast-endpoint-only; remove every archive/recent-past reference. `npm test` green.
- [x] T005 [US1] Verify per quickstart §2 + §5: headless-Chrome iframe harness on the served site — past event (Delacau) rows dated today with the configured start time, exactly one forecast request (`models=ecmwf_ifs025` for the current default), no archive request, map page markers/popups match. Commit the story.

**Checkpoint**: US1 delivers the new product meaning on its own.

---

## Phase 3: User Story 2 — One provider, no switcher (P2)

**Goal**: ECMWF only; model-selection UI and persisted preference gone.

**Independent Test**: quickstart §3 — no `[data-model]` elements on event/map pages; stale `localStorage['velometeo.model']` is inert; weather loads normally.

- [x] T006 [US2] Collapse to a single model in `assets/js/lib/weather-api.js`: replace `MODELS`/`modelByKey`/`DEFAULT_MODEL_KEY` with one exported `MODEL = { label: 'ECMWF', apiModel: 'ecmwf_ifs025', horizonDays: 15 }`; update all importers.
- [x] T007 [US2] Remove preference plumbing in `assets/js/event-data.js`: delete `persistedModel`, `MODEL_STORAGE_KEY`; `loadWeather(data)` loses the modelKey parameter (never read/write localStorage — FR-008).
- [x] T008 [US2] Remove the switcher from the event page: in `assets/js/event-page.js` delete `switcherHtml`, `switchModel`, `weatherByModel`, `fetchSeq`, the `[data-model]` click wiring and the switcher render; in `event.html` remove the `[data-model-switcher]` container; keep the existing status pill (forecast · ECMWF) as-is until US3.
- [x] T009 [US2] Update `assets/js/map-page.js`: call `loadWeather(data)` without the persisted model; remove the `persistedModel` import.
- [x] T010 [US2] Verify per quickstart §3 (harness: zero `[data-model]` nodes on both pages; set stale localStorage key → no error, no remnant) and `npm test` green; `node --check` on edited modules. Commit the story.

**Checkpoint**: single-provider site, still labeled by the old pill.

---

## Phase 4: User Story 3 — Status line with provider + date + why (P3)

**Goal**: one localized status line replaces the pill; users always know which date the forecast is for.

**Independent Test**: quickstart §4 — RO/EN/RU × upcoming/past = 6/6 correct provider + localized date + rationale.

- [ ] T011 [P] [US3] Add `formatDate(isoDate, lang)` (Intl long date) to `assets/js/lib/format.js`; extend `tests/format.test.js` with RO/EN/RU cases.
- [ ] T012 [P] [US3] Update dictionaries `assets/i18n/ro.json`, `assets/i18n/en.json`, `assets/i18n/ru.json`: add `status.upcoming` / `status.past` (contract: contracts/status-line.md, `{date}` placeholder, wording follows existing dictionary tone); delete `model.title`, `provenance.forecast`, `provenance.recorded`, `provenance.observed`; reword `notes.data` to the single ECMWF model.
- [ ] T013 [US3] Render the status line in `assets/js/event-page.js`: `statusHtml` becomes provider (`MODEL.label`) + `formatDate(weather.target.targetDate, lang)` + `status.upcoming|status.past` by `target.kind`; waiting (`weather.waiting`) and failure (`weather.unavailable`) notes unchanged; delete the now-unused `provenanceOf` from `assets/js/lib/weather-api.js`.
- [ ] T014 [US3] Verify per quickstart §4 (harness: 6/6 language×state matrix; grep site source + rendered DOM for observed/recorded remnants — SC-001) and `npm test` green. Commit the story.

**Checkpoint**: full feature behavior delivered.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T015 [P] Update `README.md`: single provider (ECMWF via Open-Meteo), remove model-switcher mentions; check forker instructions unaffected (constitution IV).
- [ ] T016 Final sweep: `npm test` (all green), `node --check` on all edited JS, headless-Chrome screenshots of index/event/map in both themes for the owner review, quickstart §6 doc checks (constitution v1.1.0, README). Commit.

---

## Dependencies

```
T001 (constitution) ──► T002 ─► T003 ─► T005 ─► [US1 commit]
                         T004 ─┘ (parallel with T003)
[US1] ──► T006 ─► T007 ─► T008 ─► T009 ─► T010 ─► [US2 commit]
[US2] ──► T011 ┐
          T012 ├─► T013 ─► T014 ─► [US3 commit]
(T011 ∥ T012)  ┘
[US3] ──► T015 ∥ T016 ─► [polish commit]
```

Stories are sequential by design (shared files: weather-api.js, event-page.js); parallelism exists inside phases: T004∥T003, T011∥T012, T015∥T016-prep.

## Implementation Strategy

MVP = Phase 1 + Phase 2 (US1): the product's new meaning (past routes ride-able today) ships first and alone. US2 and US3 are removal/labeling layers on top. Per repo convention: stop after every story commit for owner review (screenshots as UX feedback).
