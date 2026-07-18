# Quickstart: Map legibility & polish

Validation guide — how to prove feature 004 works end-to-end. Run per user story,
phase-gated (one phase → commit → stop for owner review). Screenshots are the UX
feedback loop.

## Prerequisites

- Repo on branch `004-map-legibility`.
- `npm test` green before starting (61 tests).
- Headless-Chrome CDP screenshot harness (same pattern as feature 003).
- A twisty, many-hour route available (Delacau `delacau-200-brm`) served locally
  (e.g. `python3 -m http.server` from repo root), opened at
  `map.html?event=delacau-200-brm`.

## US1 — Labels above the route

1. Load the map; pick a section where the route crosses a named town.
2. Screenshot at ≥3 zoom levels, both page themes.
3. **Expected**: every place-name label is fully readable on top of the route line;
   the route line is a comfortable weight (not the thin 003 stopgap).
4. `npm test` still green (monochrome guard).

## US2 — Marker declutter

1. Ensure "all hours" mode. At the initial fit-bounds (wide) zoom, screenshot.
2. **Expected**: a calm, evenly-spaced subset of markers; no two markers fully
   overlap; start and finish markers present.
3. Zoom in a couple of steps; screenshot each.
4. **Expected**: more markers appear as you zoom; at high zoom all hourly markers
   for the section show. Start + finish always present.
5. Switch to "key hours"; **expected**: unchanged from today.

## US3 — Single fixed light map (both themes)

1. Set the page to dark theme; load the map.
2. **Expected**: the map is the fixed light "printed map" panel, cleanly framed
   inside the dark page; no dark basemap. Light-theme map region looks identical.

## US4 — Checkpoint & control clarity

1. At several zoom levels, screenshot checkpoint dots, the zoom control, and an
   opened popup, both themes.
2. **Expected**: each is legible, distinguishable, and strictly monochrome.
3. `npm test` green (monochrome guard).

## US5 — GPX auto-simplification Action

Exercise the workflow on the branch:

1. Create a deliberately *unprocessed* GPX: copy an existing route GPX and strip
   the `vm:simplified` marker (or use a fresh, un-simplified track), commit it
   under `routes/`, and push.
2. **Expected**: the `simplify-routes` workflow runs (triggered by the `routes/**`
   push), simplifies the file, and commits the smaller, marked file back with the
   `github-actions[bot]` identity.
3. Pull; confirm the file is smaller and now carries the `vm:simplified` marker.
4. Push again (or re-run the workflow). **Expected**: no-op — no new commit (marker
   present → idempotent; no loop).
5. Confirm the workflow file has **no `schedule:` trigger** and only
   push/pull_request/workflow_dispatch on `routes/**`.
6. Confirm the "two-file promise": adding a route needed only the GPX +
   `routes/index.json` entry; no manual simplification step was run.

Edge check: commit a GPX with <2 track points → the job fails visibly and commits
nothing.

## Definition of done

- All acceptance scenarios in `spec.md` pass.
- `npm test` green (61+ tests, incl. `tests/monochrome.test.js`).
- Success criteria SC-001 … SC-006 verified (screenshots + workflow run).
- Each phase committed separately; owner reviewed after each.
