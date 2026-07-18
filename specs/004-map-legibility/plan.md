# Implementation Plan: Map legibility & polish

**Branch**: `004-map-legibility` | **Date**: 2026-07-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-map-legibility/spec.md`

## Summary

Make the monochrome route map (feature 003) genuinely easy to read, plus add the
first CI step that auto-simplifies committed GPX. Five slices:

- **US1 (P1)** — draw place-name labels *above* the route by splitting the CARTO
  basemap into a `light_nolabels` base + a `light_only_labels` layer on a
  dedicated Leaflet pane ordered above the overlay (route/marker) pane; then
  restore a comfortable route weight.
- **US2 (P2)** — in "all hours" mode, show an evenly-spaced subset of hourly
  markers at wide zoom and reveal more on zoom-in (zoom-reactive subsetting;
  always keep start + finish).
- **US3 (P2)** — confirm/verify the single fixed light "printed map" in both page
  themes; no true-dark map. Mostly documentation + regression guard.
- **US4 (P3)** — checkpoint dots, zoom control, popups read cleanly and stay
  monochrome across zoom levels.
- **US5 (P2)** — a push/dispatch-triggered GitHub Action simplifies any
  marker-less `routes/*.gpx` by calling the existing `tools/add_route.py` RDP
  logic and commits the smaller file back; idempotent via the in-file
  `vm:simplified` marker; never a cron; never loops on its own commits.

## Technical Context

**Language/Version**: Vanilla ES modules (browser), no build step; Python 3
(stdlib only) for the reused simplification tool; GitHub Actions YAML for US5.

**Primary Dependencies**: Leaflet 1.9.4 (unpkg CDN, unchanged), CARTO basemaps
(keyless: `light_nolabels` + `light_only_labels` in addition to the current
`light_all`), Open-Meteo (unchanged). No new npm/pip dependencies.

**Storage**: N/A (static files); route GPX under `routes/`, carrying the in-file
`vm:simplified` marker.

**Testing**: `node --test` (`npm test`), 61 existing tests must stay green
(incl. `tests/monochrome.test.js`). US5 GPX logic is exercised via its quickstart
(commit a marker-less GPX, observe the bot commit) and the existing
`tools/add_route.py` behavior; visual US1–US4 verified with the headless-Chrome
CDP screenshot harness (both themes, map page) per the phase-gate rhythm.

**Target Platform**: GitHub Pages static hosting; mobile-first browsers
(light/dark page themes); GitHub Actions ubuntu runner for US5.

**Project Type**: Static web site (three pages, shared CSS/JS) + one CI workflow.

**Performance Goals**: No new third-party data origins beyond CARTO/OSM/Open-Meteo;
the extra labels tile layer reuses the CARTO origin. Marker subsetting reduces DOM
nodes at wide zoom. Route rendering stays smooth on a phone.

**Constraints**: Constitution I (fully static, keyless — CARTO layers are keyless);
II/III (two-file route addition preserved; US5 must not add a manual step);
VI (mobile-first, RO/EN/RU, Delacau UX; map behavior is part of the UX spec);
VII (US5 MUST be push/dispatch-triggered, NEVER `schedule:`). Strict monochrome
(`tests/monochrome.test.js`). Map overlays pinned to a fixed light scheme,
theme-independent.

**Scale/Scope**: `assets/js/map.js` (basemap/panes, route weight, marker
subsetting), `assets/js/map-page.js` (wire zoom-reactive re-render), a small
`assets/css/style.css` block (route weight, label pane z-order, control/popup
polish), one new `.github/workflows/*.yml` reusing `tools/add_route.py`. No changes
to index/event pages.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Fully static, keyless** — PASS. CARTO `light_nolabels`/`light_only_labels`
  are keyless, same origin as today's `light_all`. No backend, no keys. The US5
  Action runs in CI (not part of the served site) and only rewrites committed
  files; the deployed site stays static.
- **II. Curated routes only** — PASS. US5 automates an existing maintainer step;
  it adds no uploads/forms/UGC.
- **III. Two-file route addition (NON-NEGOTIABLE)** — PASS, strengthened. US5
  removes the manual simplification step so the curator still touches exactly two
  files (GPX + `index.json` entry).
- **IV. Fork-friendly docs** — PASS. The US5 workflow is committed and documented
  so a forker inherits auto-simplification; README/quickstart note it.
- **V. Honest data** — PASS. No weather-marker content change (marker subsetting
  hides *whole* markers by position; the forecast table keeps full detail).
- **VI. Mobile-first, multilingual, reused UX** — PASS. Improves Delacau-style map
  legibility on phones; no content/i18n change to markers.
- **VII. No load-bearing scheduled automation** — PASS. US5 is triggered by
  push/pull_request/workflow_dispatch on `routes/**`, NEVER `schedule:`; loop-safe.

No violations → Complexity Tracking empty.

**Post-design re-check (after Phase 1)**: unchanged — the design introduces no new
origins, keys, backend, cron, or manual route step, and keeps the map monochrome
and theme-pinned.

## Project Structure

### Documentation (this feature)

```text
specs/004-map-legibility/
├── BRIEF.md             # Owner hand-off brief (input)
├── spec.md              # Feature spec
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (map + CI contracts)
├── checklists/          # requirements.md (spec quality)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
assets/
├── js/
│   ├── map.js           # Leaflet: split basemap into nolabels+labels pane above
│   │                    #   overlay; restore route weight; zoom-reactive marker
│   │                    #   subset (evenly spaced, keep start+finish)
│   └── map-page.js      # re-render markers on zoomend; unchanged for key mode
└── css/
    └── style.css        # route weight, labels-pane z-index, control/popup polish
                         #   (must stay achromatic — monochrome test)

tools/
└── add_route.py         # UNCHANGED logic; simplify_gpx_file()/is_simplified()
                         #   reused by the Action (CLI invocation)

.github/
└── workflows/
    └── simplify-routes.yml   # NEW: push/PR/dispatch on routes/**; simplify
                              #   marker-less GPX; commit back; loop-safe

tests/
├── monochrome.test.js   # must stay green (guards achromatic CSS)
└── ...                  # existing suite (61 tests) stays green
```

**Structure Decision**: Flat static-site layout unchanged. The only new artifact
is `.github/workflows/simplify-routes.yml` (first workflow in the repo; Pages still
deploys from `main` root and is unaffected). US1/US2/US4 are edits to the two map
JS files and one CSS block. US5 reuses `tools/add_route.py` rather than
reimplementing RDP.

## Complexity Tracking

> No constitution violations — section intentionally empty.
