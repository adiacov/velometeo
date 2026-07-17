# Tasks: Weather Condition Icons

**Input**: Design documents from `/specs/002-weather-icons/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/weather-icons.md, quickstart.md

**Tests**: included — the module contract explicitly defines a test file
(`tests/weather-icons.test.js`) and the repo convention is a Node test per
lib module.

**Organization**: foundational shared mapping first, then one phase per user
story (table → cards → popup), then polish.

## Phase 1: Setup

No setup tasks — no new dependencies, no build step, structure already
exists (`assets/js/lib/`, `tests/`).

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the shared code→condition mapping and its labels; every user
story consumes these.

- [ ] T001 Create pure mapping module `assets/js/lib/weather-icons.js`
      exporting `weatherCondition(code) → {icon, labelKey} | null` per
      contracts/weather-icons.md and research R1 (8 buckets, unknown → null,
      never throws, frozen lookup)
- [ ] T002 [P] Create `tests/weather-icons.test.js` covering: every
      documented WMO code returns a bucket; representative bucket
      assignments; `null`/`undefined`/`-1`/`100`/`'0'` → null; every
      returnable labelKey exists in `assets/i18n/ro.json`, `en.json`,
      `ru.json`
- [ ] T003 [P] Add the 8 `weather.*` label keys (clear, partlyCloudy,
      overcast, fog, drizzle, rain, snow, thunderstorm) to
      `assets/i18n/ro.json`, `assets/i18n/en.json`, `assets/i18n/ru.json`

**Checkpoint**: `npm test` passes including the new suite.

## Phase 3: User Story 1 — Conditions in the forecast table (P1) 🎯 MVP

**Goal**: each table row shows the condition icon in a narrow icon-only
column between "Approx. km" and "Temperature".

**Independent Test**: load an event page; every row shows the correct icon
with translated hover label; unknown code shows `—`; no new horizontal
scroll.

- [ ] T004 [US1] In `assets/js/event-page.js` `tableHtml()`: insert a
      header cell after `table.km` — visually empty, `aria-label`/`title`
      from existing `table.weather` key — and a body cell rendering
      `weatherCondition(wp.weatherCode)` as the emoji with
      `title`/`aria-label` = `t(labelKey)` (escaped), or `DASH` when null
- [ ] T005 [US1] In `assets/style.css` (only if needed after visual check):
      keep the icon column narrow/centered so the table gains no meaningful
      width in light and dark themes

**Checkpoint**: table validated per quickstart step 1 — MVP delivered.

## Phase 4: User Story 2 — Conditions in the mobile cards (P2)

**Goal**: card header line reads `HH:MM · km N <icon>`; cards do not grow.

**Independent Test**: narrow viewport; icons appear in card headers, layout
otherwise unchanged; unknown code → no icon, no dash.

- [ ] T006 [US2] In `assets/js/event-page.js` `cardsHtml()`: append the
      condition icon (with `title`/`aria-label` label) to the `.time`
      header line; append nothing when `weatherCondition` returns null

**Checkpoint**: cards validated per quickstart step 2.

## Phase 5: User Story 3 — Conditions in the map popup (P3)

**Goal**: popup header line ends with the icon; markers untouched.

**Independent Test**: tap a weather marker; popup header shows the icon;
marker visuals identical to before.

- [ ] T007 [US3] In `assets/js/map.js` `popupHtml()`: import
      `weatherCondition` and append the icon (with `title` label) to the
      `<b>${timeLabel} · km N</b>` header line; append nothing when null;
      do not touch `markerIcon()`/divIcon rendering

**Checkpoint**: popup validated per quickstart step 3.

## Phase 6: Polish & cross-cutting

- [ ] T008 Run full validation: `npm test` plus quickstart.md manual steps
      1–7 (three languages, both themes, mobile viewport, no-new-requests
      check)
- [ ] T009 Update `STATE.md`: mark the weather-icon follow-up from
      `specs/001-velometeo-mvp/parity-check.md` as done; record feature 002
      status

## Dependencies

- Phase 2 (T001–T003) blocks all user stories; T002 and T003 can run in
  parallel after T001 exists (T002 asserts against T003's keys — finish
  both before the checkpoint).
- US1 (T004–T005), US2 (T006), US3 (T007) are mutually independent once
  Phase 2 is done; ordered P1 → P2 → P3 for incremental delivery.
- Phase 6 requires all story phases.

## Parallel example

After T001: run T002 and T003 in parallel. After Phase 2: T004, T006, T007
touch different render sites and could proceed in parallel (T004+T006 share
`event-page.js`, so sequence those two if working concurrently).

## Implementation strategy

MVP = Phase 2 + Phase 3 (table). Then cards, then popup, then polish — each
checkpoint leaves the site shippable.
