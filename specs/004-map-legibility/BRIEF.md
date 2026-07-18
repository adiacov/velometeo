# Feature 004 — Map legibility & polish (pre-spec brief)

**Status:** DRAFT / not yet specified. This is a hand-off brief written
2026-07-18 after feature 003 (monochrome restyle) merged. The owner reviewed
and locked the key decisions below.

## For the next agent — what to do

Run the **full Spec Kit flow** for this feature, following `WORKFLOWS.md`
and the repo's spec-driven process (same as features 001–003):

1. `/speckit-specify` using this brief as the feature description. Let the
   git hook create the `004-map-legibility` branch. Keep the spec in this
   folder (`specs/004-map-legibility/`).
2. `/speckit-clarify` if anything below is still ambiguous (most decisions
   are already locked — see "Owner decisions").
3. `/speckit-plan` → `/speckit-tasks`, then implement **phase-gated**: one
   phase → commit → stop for owner review (the established rhythm; screenshots
   are the UX feedback loop — use the headless-Chrome CDP screenshot harness
   pattern from 003, both themes, on the map page).
4. Verify against the acceptance criteria; run `npm test` (61 tests today,
   incl. `tests/monochrome.test.js` — keep the monochrome invariant green).
5. Merge fast-forward to `main` on owner approval; update `STATE.md`.

Do **not** start implementing before the owner has reviewed the spec and plan.

## Problem

The monochrome map from 003 is readable but has rough edges when a route is
dense or has many hourly weather markers. On a phone, at the wide "all hours"
zoom and on twisty sections, the weather cards overlap and the route line
sits on top of place names. This feature makes the route map genuinely easy
to read. It is a pure map feature; nothing on the index/event pages changes.

## User stories (proposed — refine in the spec)

- **US1 — Labels above the route (P1).** Place names must never be hidden by
  the route line. Intended approach: layered CARTO tiles — a `light_nolabels`
  base plus a `light_only_labels` layer on a Leaflet pane above the route
  overlay — so labels always draw over the route. Once labels sit on top, the
  route line can return to a comfortable weight (003 trimmed it to 3 as a
  stopgap; casing 6).
- **US2 — Readable markers when crowded (P2).** In the "all hours" view (and
  on tight sections) weather cards overlap. Show a **reduced, evenly-spaced
  subset of markers at wide zoom, revealing more as the user zooms in**
  (owner-chosen approach — not clustering, not collision hide/offset). The
  hourly forecast table already carries the full detail, so the map can be
  calmer.
- **US3 — Confirm the single light map (P2, mostly documentation).** The map
  stays **one fixed light "printed map" panel in both page themes** — the
  owner confirmed 003's choice (a dark basemap made near-black markers/
  controls blend). This story just verifies the framing reads well inside the
  dark page and records the decision; no true-dark map.
- **US4 — Checkpoint & control clarity (P3).** Checkpoint dots, zoom controls,
  and popups read cleanly at all zoom levels and stay on-brand (monochrome).

## Owner decisions (locked 2026-07-18)

- Dark map: **keep the single light panel** in both themes. No true-dark map.
- Marker declutter: **fewer markers at wide zoom**, more as you zoom in.
- Process: create this brief now; next agent runs the whole Spec Kit flow.

## Out of scope

- Live GPS / turn-by-turn / route editing / uploads (barred by constitution
  II & the product's no-tracking rule).
- Changing weather-marker *content* (time/temp/icon/arrow) or the shared
  weather-code → icon mapping (feature 002 contract).
- Any non-map page (index, event) and the add-route tooling.
- New external tile/data origins beyond the existing CARTO + OSM + Open-Meteo.

## Constraints carried over

- Strictly monochrome (achromatic only; `tests/monochrome.test.js` guards the
  stylesheet). Any new map colours must be white/black/gray.
- Fully static, keyless (constitution I): CARTO tiles are keyless; no API keys.
- Mobile-first, RO/EN/RU, light+dark page themes.
- The map's overlays are currently pinned to a fixed light scheme in
  `assets/css/style.css` (theme-independent) — keep that model.

## Pointers (context for the next agent)

- `assets/js/map.js` — Leaflet setup: CARTO `light_all` tile layer, cased
  route line (`.route-casing` / `.route-line`), checkpoints
  (`.route-checkpoint`), weather markers, attribution prefix. The place to add
  the layered nolabels+labels approach (US1) and the wide-zoom marker
  subsetting (US2, see `keyIndexes()` / `markerIcon()` there).
- `assets/css/style.css` — the `.leaflet-*` / `.weather-marker` block with the
  fixed light-scheme map overlays.
- `assets/js/map-page.js` — the map page controller (hour selector, "all
  hours" toggle, back link).
- `specs/003-monochrome-restyle/` — spec/plan/research/contract for the
  monochrome work this builds on; `research.md` R4 covers the map/tiles
  decisions and why filtered-OSM was dropped for CARTO.
- `.specify/memory/constitution.md` — product non-negotiables (esp. I, II, VI).
- STATE.md "Next action" lists these same deferred map items.
