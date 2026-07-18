---
description: "Task list for feature 004 — map legibility & polish"
---

# Tasks: Map legibility & polish

**Input**: Design documents from `/specs/004-map-legibility/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No TDD contract tests are added (this is UI/ops polish on an existing,
tested codebase). The hard guard is the existing suite — `npm test` (61 tests,
incl. `tests/monochrome.test.js`) MUST stay green — plus headless-Chrome CDP
screenshots as the UX feedback loop (both page themes, map page), per the
established phase-gated rhythm.

**Organization**: Tasks are grouped by user story. Implement **phase-gated**: one
phase → commit → **stop for owner review** (screenshots attached). Do NOT batch
multiple stories into one commit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in each task.

## Path Conventions

Flat static site: `assets/js/`, `assets/css/`, `tools/`, `.github/workflows/`,
`tests/`, `routes/` at repo root (per plan.md Structure Decision). No build step.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean starting point before touching the map.

- [ ] T001 Confirm branch `004-map-legibility` is checked out and `npm test` is green (61 tests) as the baseline; note the baseline `routes/delacau-200-brm.gpx` size for later US5 comparison.
- [ ] T002 Serve the site locally (`python3 -m http.server` from repo root) and open `map.html?event=delacau-200-brm`; capture "before" screenshots (both page themes, wide + zoomed-in) to compare US1–US4 against.

**Checkpoint**: Baseline captured; ready to start user stories.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required. US1–US5 are independent slices over existing, working
code; there is no shared new infrastructure to build first. (The labels pane is
created inside US1's `initMap` change, scoped to that story.)

> No foundational tasks — proceed directly to user stories in priority order.

**Checkpoint**: N/A — user stories can begin.

---

## Phase 3: User Story 1 — Labels above the route (Priority: P1) 🎯 MVP

**Goal**: Place-name labels always paint on top of the route line at every zoom;
route line returns to a comfortable weight.

**Independent Test**: Load a route crossing a named town at ≥3 zoom levels, both
themes; every label legible over the route; `npm test` green.

### Implementation for User Story 1

- [ ] T003 [US1] In `assets/js/map.js` `initMap`: replace the single CARTO `light_all` tile layer with `light_nolabels` as the base layer (same keyless origin, subdomains, retina, attribution).
- [ ] T004 [US1] In `assets/js/map.js` `initMap`: create a dedicated `labels` pane (`map.createPane('labels')`) with `pointer-events: none`, add a CARTO `light_only_labels` tile layer bound to `{ pane: 'labels' }`. (Pane z-order set in CSS — T006.)
- [ ] T005 [US1] In `assets/js/map.js` `initMap`: restore a comfortable route weight — bump `.route-line` and `.route-casing` polyline weights above the 003 stopgap (line ~4–5, casing ~7–8), keeping the cased ink-over-paper look and achromatic fallback colors; tune final values by screenshot.
- [ ] T006 [US1] In `assets/css/style.css` map block: add a rule giving the `labels` pane (`.leaflet-labels-pane` / the created pane's class) a `z-index` above the overlay pane, and reconcile the existing `.leaflet-tile-pane{filter:grayscale(1)}` so both the base and labels layers stay legible and achromatic; update the `.route-line`/`.route-casing` stroke widths to match T005. Keep every value white/black/gray.
- [ ] T007 [US1] Verify: `npm test` green (monochrome guard); screenshot `map.html` at ≥3 zoom levels, both themes, on a section crossing a named town — confirm labels are on top of the route and the route weight reads comfortably (SC-001, C1).
- [ ] T008 [US1] **Commit** ("feat(004): US1 — layered CARTO labels above the route; restore route weight") and **stop for owner review** with screenshots.

**Checkpoint**: US1 delivered — labels legible over the route (MVP).

---

## Phase 4: User Story 2 — Readable markers when crowded (Priority: P2)

**Goal**: In "all hours" mode, show an evenly-spaced marker subset at wide zoom and
reveal more on zoom-in; start + finish always shown; "key hours" unchanged.

**Independent Test**: "all hours" on the twisty many-hour route — wide view calm
(no full overlaps), zoom-in reveals more markers; start+finish present at every
zoom.

### Implementation for User Story 2

- [ ] T009 [US2] In `assets/js/map.js`: add a pure subset-selection helper (e.g. `visibleAllHourIndexes(rows, zoom, zMin, ...)`) implementing the invariants in `data-model.md` § Weather-marker subset — even spacing across `[0…n-1]`, always include index 0 and last, count monotonic non-decreasing in zoom, all shown at high zoom or when `rows.length ≤ smallThreshold`; no clustering, no collision math.
- [ ] T010 [US2] In `assets/js/map.js` `renderWeatherMarkers`: when `mode === 'all'`, render only the indexes returned by T009's helper for the map's current zoom; leave `mode === 'key'` on the existing `keyIndexes` path unchanged. Pass the map/zoom through so the helper can read it.
- [ ] T011 [US2] In `assets/js/map-page.js`: re-render markers on Leaflet's `zoomend` (call `renderMarkers()` when rows are loaded); ensure no duplicate rendering and that scenario/mode toggles still work.
- [ ] T012 [US2] Tune the subset constants (`smallThreshold`, wide-view target count ~5–8, zoom→count curve) by screenshot on the Delacau route at phone width so the wide view has no full overlaps and each zoom step reveals more.
- [ ] T013 [US2] Verify: `npm test` green; screenshots at ≥2 zoom levels in "all hours" (both themes) showing the calm wide subset, zoom-in reveal, and start+finish always present; confirm "key hours" is visually unchanged (SC-002, SC-003, C2).
- [ ] T014 [US2] **Commit** ("feat(004): US2 — zoom-reactive weather-marker subset in all-hours mode") and **stop for owner review** with screenshots.

**Checkpoint**: US1 + US2 both work independently.

---

## Phase 5: User Story 3 — Confirm single fixed light map (Priority: P2)

**Goal**: Verify and document the fixed light "printed map" in both themes; no
true-dark map. Regression guard against US1/US2/US4 edits.

**Independent Test**: Dark-theme screenshot shows the light panel cleanly framed;
light vs dark map region visually identical.

### Implementation for User Story 3

- [ ] T015 [US3] Audit `assets/js/map.js` + the `.leaflet-*` / map block in `assets/css/style.css` after US1/US2: confirm the basemap, route, markers, checkpoints, controls, and popups are pinned to a fixed light scheme, theme-independent, and no dark basemap was introduced (FR-009, FR-010, C3).
- [ ] T016 [US3] Verify: screenshot `map.html` with the page in dark theme — confirm the light map panel is cleanly framed (`.route-map` border/rounding/surface/shadow) and legible; compare against the light-theme map region for parity.
- [ ] T017 [US3] Record the confirmation in `specs/004-map-legibility/quickstart.md` (or a short note in the spec) that the single-light-map decision holds post-US1/US2; **commit** ("docs(004): US3 — confirm single fixed light map in both themes") and **stop for owner review**.

**Checkpoint**: Single-light-map decision verified and recorded.

---

## Phase 6: User Story 5 — GPX auto-simplification Action (Priority: P2)

**Goal**: A push/dispatch-triggered GitHub Action simplifies marker-less
`routes/*.gpx` via the existing RDP logic and commits the smaller file back;
idempotent via the `vm:simplified` marker; never a cron; never loops.

**Independent Test**: Commit an unprocessed GPX under `routes/` and push; the
workflow simplifies it, commits it back smaller + marked; a second push is a
no-op.

### Implementation for User Story 5

- [ ] T018 [US5] Add a thin driver `tools/simplify_routes.py` (or a minimal batch/in-place path on `tools/add_route.py`'s CLI) that iterates `routes/*.gpx`, skips files where `is_simplified()` is true, and calls `simplify_gpx_file()` in place at the default tolerance for the rest — reusing the existing RDP/marker logic **unchanged** (research R5, contract § Reuse boundary). Fail visibly on a GPX with <2 usable points (FR-017).
- [ ] T019 [US5] Create `.github/workflows/simplify-routes.yml` (repo's first workflow) triggered by `push` + `pull_request` on paths `routes/**` and `workflow_dispatch`; **no `schedule:`** (constitution VII). Set `permissions: contents: write`.
- [ ] T020 [US5] In the workflow job: checkout, set up Python 3, run the T018 driver, then commit + push changed files with the `github-actions[bot]` identity only when `git diff` shows changes; make it loop-safe (skip when nothing marker-less remains and/or when the head commit is the bot's own) (FR-016, G3).
- [ ] T021 [US5] Verify on the branch (quickstart US5): commit a deliberately un-simplified GPX under `routes/` (strip the `vm:simplified` marker on a copy), push, confirm the bot commit shrinks + marks it; push again and confirm a no-op (idempotent, no loop); confirm the trigger has no cron and is scoped to `routes/**` (SC-005, SC-006, G1–G6). Restore `routes/` to its intended state afterward.
- [ ] T022 [US5] Document the auto-simplification in `README.md` (forker-facing: drop GPX + index.json entry, push, the Action simplifies it — no manual step) to preserve the two-file promise / fork-friendliness (constitution III/IV, FR-018); **commit** ("feat(004): US5 — push-triggered GPX auto-simplification Action") and **stop for owner review**.

**Checkpoint**: Curator can add a route in two files; committed GPX auto-simplifies.

---

## Phase 7: User Story 4 — Checkpoint & control clarity (Priority: P3)

**Goal**: Checkpoint dots, zoom control, and popups read cleanly at all zooms and
stay strictly monochrome.

**Independent Test**: At several zoom levels, checkpoints/zoom/popup are legible,
distinguishable, and achromatic; `npm test` green.

### Implementation for User Story 4

- [ ] T023 [US4] Audit + lightly polish the fixed-light overlay CSS in `assets/css/style.css` (`.route-checkpoint`, `.leaflet-bar`/zoom control, `.leaflet-popup-*`, `.weather-marker`): ensure checkpoint dots stay distinguishable from `ok` weather markers (shape/size/border, not color), zoom-control contrast is good, and popup text/close button are legible — all values white/black/gray (FR-011, FR-012, C4).
- [ ] T024 [US4] Verify: `npm test` green (monochrome guard); screenshot checkpoints, the zoom control, and an opened popup at multiple zoom levels, both themes.
- [ ] T025 [US4] **Commit** ("feat(004): US4 — checkpoint/control/popup clarity, monochrome") and **stop for owner review** with screenshots.

**Checkpoint**: All user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and state update before merge.

- [ ] T026 Run the full `specs/004-map-legibility/quickstart.md` validation end-to-end (US1–US5), confirming SC-001…SC-006.
- [ ] T027 Confirm `npm test` green (≥61 tests, no net loss); confirm no new external tile/data origins beyond CARTO/OSM/Open-Meteo and no `schedule:` trigger anywhere.
- [ ] T028 Update `STATE.md` (feature 004 status, changed files, verification) and mark tasks `[X]`; on owner approval, fast-forward merge to `main`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: none (empty).
- **User stories (Phases 3–7)**: each depends only on Setup. Recommended order is
  priority-then-owner-rhythm: **US1 (P1) → US2 (P2) → US3 (P2) → US5 (P2) → US4
  (P3)**, one phase → commit → stop for owner review.
- **Polish (Phase 8)**: after all desired stories are complete and approved.

### User Story Dependencies

- **US1 (P1)**: independent (map.js/css). MVP.
- **US2 (P2)**: independent (map.js/map-page.js). Best done after US1 so screenshots
  reflect the final route/labels look, but not technically blocked by it.
- **US3 (P2)**: verification of US1/US2 output; naturally runs after them.
- **US5 (P2)**: fully independent (tools/ + .github/workflows/ + routes/ + README);
  can be done in any order relative to US1–US4.
- **US4 (P3)**: independent (css); last per priority.

### Within Each User Story

- Code edits before verification; verification before the phase commit.
- Commit closes the phase; owner reviews before the next phase starts.

### Parallel Opportunities

- US5 (tools/CI) touches entirely different files from US1–US4 (map JS/CSS), so it
  could be worked in parallel by a second contributor if staffed. Within a single
  agent, keep the phase-gated one-at-a-time rhythm.

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → capture baseline.
2. Phase 3 US1 → labels above route + comfortable weight.
3. **STOP and VALIDATE** (screenshots, `npm test`) → owner review.

### Incremental Delivery

US1 → US2 → US3 → US5 → US4, each a separate commit and owner-reviewed increment;
then Phase 8 polish + merge. Each story adds value without breaking prior ones and
must keep the monochrome guard green.

---

## Notes

- `[P]` tasks = different files, no dependencies (here, cross-story: US5 vs US1–US4).
- Reuse over reimplementation: US5 calls the existing `tools/add_route.py` RDP/marker
  logic unchanged.
- Hard invariants every phase: `tests/monochrome.test.js` green; no new origins; no
  `schedule:` cron; map overlays stay fixed-light/theme-independent; weather-marker
  content and the feature-002 icon mapping unchanged.
- Commit after each phase; stop for owner review with screenshots (the UX feedback
  loop). Do NOT run `/speckit-implement` without owner sign-off on this spec/plan.
