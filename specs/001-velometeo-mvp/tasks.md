# Tasks: velometeo — weather along bicycle routes

**Input**: Design documents from `/specs/001-velometeo-mvp/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: included for `assets/js/lib/` modules per research D10 (node:test,
zero dependencies) — scenario math and API mode selection carry real
correctness risk. UI is validated via quickstart walkthroughs.

**Organization**: grouped by user story (US1–US7 from spec.md) so each story
is independently implementable and testable.

## Phase 1: Setup

- [X] T001 Create static site skeleton: `index.html`, `event.html`, `assets/css/`, `assets/js/lib/`, `assets/i18n/`, `routes/`, `tools/`, `tests/fixtures/` per plan.md Project Structure
- [X] T002 [P] Copy `delacau-200-brm.gpx` from `../delacau-200-brm-weather-forecast/` into `routes/` and create `routes/index.json` with the Delacau entry (date 2026-05-31, start 06:00 — verified in the Delacau page's scenario headings, mode brevet) per contracts/routes-config.md
- [X] T003 [P] Copy-and-adapt `assets/theme.js` from Delacau (parametrize storage key to `velometeo.theme`) into `assets/js/theme.js`
- [X] T004 [P] Copy-and-adapt `assets/style.css` from Delacau into `assets/css/style.css` (keep pills, collapsed sections, theme variables; strip provider-page-specific rules)
- [X] T005 [P] Create test fixtures in `tests/fixtures/`: a small GPX with waypoints, one without, one malformed (from truncated Delacau GPX)

## Phase 2: Foundational (blocking all user stories)

- [X] T006 [P] Implement `assets/js/lib/geo.js`: haversine distance, bearing between points, position interpolation along a cumulative-distance table (data-model Route/Scenario derivations)
- [X] T007 [P] Implement `assets/js/lib/gpx.js`: DOMParser-based GPX parsing → `{points, cumKm, waypoints}` with validation rules from data-model.md (≥2 track points, malformed → typed error)
- [X] T008 Implement `assets/js/lib/scenarios.js`: brevet band table (FR-007 table verbatim), nearest-standard-distance matching with >15% deviation warning, pace scenarios (20/25/30), per-hour `{clockTime, dayOffset, km, lat, lon, bearing}` derivation (FR-010); depends on T006
- [X] T009 Implement `assets/js/lib/weather-api.js`: event-state selection (forecast/past_days/archive/waiting per research D9), batched multi-coordinate request building per contracts/open-meteo.md, response slicing into WeatherPoint objects with provenance, model table (ECMWF/ICON) — verify live `models=` ids against the API while implementing
- [X] T010 [P] Implement `assets/js/lib/format.js`: dash-for-null (FR-016), km/h + °C + mm formatting, wind-relative (head/tail/cross) from bearing vs direction, day-context hour labels (FR-023)
- [X] T011 [P] Implement `assets/js/i18n.js`: dictionary fetch, `data-i18n` swap, `velometeo.lang` persistence, RO default (research D5)
- [X] T012 [P] Create `assets/i18n/ro.json`, `assets/i18n/en.json`, `assets/i18n/ru.json` with all UI strings (tone: Delacau pages, non-technical)
- [X] T013 [P] Unit tests `tests/geo.test.js` and `tests/gpx.test.js` against fixtures (distance sanity, waypoint presence/absence, malformed error)
- [X] T014 [P] Unit tests `tests/scenarios.test.js` (band table rows, 207 km → 200 class, >15% deviation warning, pace durations, midnight-crossing hour derivation)
- [X] T015 [P] Unit tests `tests/weather-api.test.js` (state selection boundary dates incl. today/2-days-past/8-days-past/20-days-future, request URL shape per contract, null slicing) and `tests/format.test.js` (dash rules, relative wind, day labels)

**Checkpoint**: `npm test` green — lib layer proven before any UI.

## Phase 3: User Story 1 — upcoming event page (P1) 🎯 MVP

**Goal**: `event.html?event=delacau-200-brm` renders live forecast table + map on a phone.
**Independent test**: quickstart walkthroughs 2, 3, 8, 9.

- [X] T016 [P] [US1] Adapt Delacau `assets/map.js` into `assets/js/map.js`: Leaflet init (CDN+SRI pins), route polyline, hourly weather markers, wind arrows, checkpoint markers from waypoints — fed from runtime data structures instead of baked JSON
- [X] T017 [US1] Implement `assets/js/event-page.js`: read `?event=`, load manifest + GPX, run scenarios, fetch weather for persisted model, render scenario sections (collapsed `<details>` like Delacau) with hourly tables; unknown id / broken GPX → friendly i18n'd error (FR-005)
- [X] T018 [US1] Build `event.html`: mobile-first layout with header (name, date, start, measured length), map container, scenario sections, technical notes at bottom; wire `event-page.js`, `map.js`, `theme.js`, `i18n.js`
- [X] T019 [US1] Implement waiting mode (FR-014: "forecast opens N days before" from model horizon) and fetch-failure state (FR-017: route+map render, i18n'd message) in `assets/js/event-page.js`
- [X] T020 [US1] Verify quickstart walkthroughs 2, 3, 8, 9 on a phone-sized viewport (US1 acceptance scenarios 1–5) with a local static server

**Checkpoint**: MVP — one route, live weather, mobile.

## Phase 4: User Story 2 — index page (P2)

**Goal**: site root lists all events Upcoming/Past, newest first.
**Independent test**: quickstart walkthroughs 1, 10.

- [X] T021 [P] [US2] Implement `assets/js/index-page.js`: fetch manifest, validate entries (skip broken with console warning, FR-005), split Upcoming/Past by event-local date, sort newest-first, render linked list
- [X] T022 [US2] Build `index.html`: minimal landing (site name, one-line what-is-this, the two groups); wire `index-page.js`, `theme.js`, `i18n.js`
- [X] T023 [US2] Verify quickstart walkthroughs 1 and 10 (needs a second temporary manifest entry)

## Phase 5: User Story 3 — past events show observed weather (P3)

**Goal**: past pages render archive data labeled "observed"; recent-past uses `past_days`.
**Independent test**: quickstart walkthrough 4.

- [X] T024 [US3] Wire archive + past_days branches of `assets/js/lib/weather-api.js` into `assets/js/event-page.js`: provenance-driven page label (forecast / recorded / observed), archive's missing `precipitation_probability` → `—`
- [X] T025 [US3] Verify quickstart walkthrough 4 for both a >7-days-past and a 2–5-days-past date

## Phase 6: User Story 4 — pace mode (P4)

**Goal**: `mode: "pace"` pages show 20/25/30 km/h scenarios.
**Independent test**: quickstart walkthrough 5.

- [ ] T026 [US4] Wire pace scenarios through `assets/js/event-page.js` rendering (scenario labels/i18n, exactly one mode per page — FR-009); add a temporary pace event and verify quickstart walkthrough 5

## Phase 7: User Story 5 — model switcher, i18n, theme UX (P5)

**Goal**: ECMWF/ICON switch drives all visuals and persists; language/theme switchers complete.
**Independent test**: quickstart walkthroughs 6, 7.

- [ ] T027 [US5] Implement model switcher pill on `event.html` (`assets/js/event-page.js`): lazy fetch on switch, re-render table + map markers + arrows, persist `velometeo.model` (clarification Q3)
- [ ] T028 [P] [US5] Implement language switcher UI (RO/EN/RU pills in header) on both pages via `assets/js/i18n.js`; ensure dynamic content (tables, labels) re-renders on switch
- [ ] T029 [US5] Verify quickstart walkthroughs 6 and 7 (persistence across reload and page navigation)

## Phase 8: User Story 6 — curator route addition (P6)

**Goal**: two-file addition works; helper script automates it.
**Independent test**: quickstart walkthrough 11.

- [ ] T030 [P] [US6] Implement `tools/add_route.py` per contracts/add-route-cli.md (stdlib only: validation, GPX copy, atomic manifest update, optional --commit)
- [ ] T031 [US6] Verify quickstart walkthrough 11 with a spare GPX; confirm only two paths changed (`routes/<id>.gpx`, `routes/index.json`)

## Phase 9: User Story 7 — fork documentation (P7)

**Goal**: a stranger can fork → add route → enable Pages using README alone.
**Independent test**: quickstart Deploy check + README dry run.

- [ ] T032 [P] [US7] Write `README.md`: what the site is, fork steps, enable-Pages steps, add-a-route (script + manual with copy-paste manifest template), config reference (from contracts/routes-config.md), troubleshooting (CORS/horizon/fair-use), honest-data note
- [ ] T033 [US7] Deploy to GitHub Pages on a test branch/fork and run the quickstart Deploy check at the `github.io` URL (SC-006 dry run)

## Phase 10: Polish & cross-cutting

- [ ] T034 [P] Delacau parity check (SC-004): side-by-side against the live Delacau page; record deviations and fix or justify
- [ ] T035 [P] Mobile performance pass (SC-001): ≤ 4 round-trips before weather renders, no oversized assets; test on throttled connection
- [ ] T036 Update `STATE.md` (implementation status) and prune completed pointers per WORKFLOWS.md

## Dependencies & execution order

- Phase 1 → Phase 2 → US phases. Within Phase 2, T006/T007 before T008; T009 independent after T006.
- US1 (Phase 3) needs all of Phase 2. US2 needs T011/T012 only (can start after Phase 2 regardless of US1). US3–US5 build on US1's page. US6/US7 are independent of the JS (US7 last: documents everything).
- Story order for sequential delivery: US1 → US2 → US3 → US4 → US5 → US6 → US7.

**Parallel opportunities**: within Phase 1 all of T002–T005; within Phase 2 T006+T007+T010+T011+T012 then T013–T015; T016 (map) parallel with T017 scaffolding; T030 and T032 any time after contracts stabilize.

## Implementation strategy

MVP first: stop after Phase 3 (T020) for the first review — one live route
proving the whole architecture (matches BRIEF "first implementation
slice" = index + one route; add Phase 4 for the index if the slice should
match BRIEF exactly). Each later phase is an independently shippable
increment.
