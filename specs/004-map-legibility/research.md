# Research: Map legibility & polish

Phase 0 for feature 004. Resolves the technical approach behind each user story.
No open NEEDS CLARIFICATION — owner decisions were locked in `BRIEF.md`
(2026-07-18); this document records *how* to realize them.

## R1 — Labels above the route (US1)

**Decision**: Replace the single CARTO `light_all` tile layer with two keyless
CARTO layers — `light_nolabels` as the base (in the default `tilePane`) and
`light_only_labels` on a **dedicated Leaflet pane** whose `z-index` sits above the
`overlayPane` (where the route polylines and, by default, SVG live). Create the
pane once in `initMap` (e.g. `map.createPane('labels')` with a z-index above the
overlay pane, and `pane.style.pointerEvents = 'none'` so labels never eat clicks),
add the labels layer with `{ pane: 'labels' }`. Then restore the route line to a
comfortable weight (line ~4–5, casing ~7–8 — tune by screenshot; 003 trimmed line
to 3 / casing 6 as a stopgap precisely because labels were under the route).

**Rationale**: Leaflet default pane z-order is tilePane(200) < overlayPane(400) <
markerPane(600) < popupPane(700). Placing a labels-only raster tile layer in a
custom pane above overlayPane makes town names paint on top of the route SVG at
every zoom, which is exactly the brief's intended approach and adds no new origin
(same `basemaps.cartocdn.com` host, keyless).

**Interaction with existing CSS**: `assets/css/style.css` currently applies
`.leaflet-tile-pane{filter:grayscale(1)}`. CARTO Positron layers are already
achromatic, so grayscale is a no-op safety net; the labels pane is **not** the
default tile pane, so confirm its rendering — either move the grayscale filter to
`.leaflet-container` / apply to both panes, or rely on CARTO's already-gray
labels. Keep whatever keeps the monochrome test green and labels legible.

**Alternatives considered**:
- *Keep `light_all` and just thin the route* (003 stopgap) — rejected: route still
  crosses labels; owner wants labels always on top and a comfortable route weight.
- *SVG label halos / manual relabeling* — rejected: no label data client-side; not
  static-friendly.
- *Filtered raw OSM tiles* — rejected already in 003 research R4 (CARTO chosen).

## R2 — Zoom-reactive marker subset (US2)

**Decision**: In "all hours" mode, render an **evenly-spaced subset** of the hourly
rows whose size grows with zoom. Compute a target count from the current zoom
between the route's fit-bounds zoom (`minZoom_eff`) and a "show all" zoom
(`maxZoom_eff`), then pick indices by even spacing across `rows`, **always
including index 0 (start) and the last index (finish)**. Re-render markers on
Leaflet's `zoomend` event. "Key hours" mode is untouched (it already uses
`keyIndexes`).

**Chosen selection rule** (deterministic, no clustering, no collision math):
- Let `n = rows.length`. If `n` is small enough to never overlap (≤ a threshold,
  e.g. ≤ 6), show all regardless of zoom.
- Else target `k = clamp(round(base * 2^((z - zMin))), kMin, n)` markers where
  `zMin` is the initial fit zoom and `base`/`kMin` are tuned so the wide view
  shows a calm count (≈5–8) and each zoom step roughly doubles until all `n` show.
- Select `k` indices evenly across `[0 … n-1]` (`round(i*(n-1)/(k-1))`), deduped,
  guaranteeing start and finish are present.

**Rationale**: Matches the owner's locked choice ("fewer markers at wide zoom, more
as you zoom in — not clustering, not collision hide/offset"). Even spacing keeps
geographic coverage; forcing start/finish preserves the two most meaningful hours.
The forecast table still carries every hour (honest-data intact). `zoomend`
re-render is cheap because subsetting reduces DOM nodes.

**Tuning note**: exact `base`/`kMin`/threshold and the zoom→count curve are tuned
by screenshot during the US2 phase (twisty many-hour route, phone width). The
contract fixes the *rules* (even spacing, start+finish always, monotonic in zoom),
not the constants.

**Alternatives considered**:
- *Leaflet.markercluster* — rejected: owner ruled out clustering; adds a dependency
  (violates the keyless/no-build ethos) and changes marker semantics.
- *Collision detection (hide/offset overlapping markers)* — rejected by owner;
  also jittery and expensive on a phone.
- *Fixed subset regardless of zoom* — rejected: zoom-in must reveal detail.

## R3 — Single fixed light map, both themes (US3)

**Decision**: No change to the model — keep the map a fixed light "printed map"
panel in both page themes, with overlays pinned to a fixed light scheme in
`assets/css/style.css` (theme-independent), as established in 003. This story is
**verification + documentation**: screenshot the map inside the dark page, confirm
the framing (border/rounding/surface/shadow on `.route-map`) reads well, and
record the decision. Add/confirm a regression guard so later US1/US2/US4 edits
can't accidentally introduce a theme-reactive or dark basemap.

**Rationale**: A dark basemap makes near-black markers/checkpoints/zoom controls
blend into near-black tiles (the reason 003 pinned light). Re-confirming avoids
re-litigating a settled decision while this feature touches the map.

**Alternatives considered**:
- *True-dark map in dark theme* — rejected (owner-locked; legibility regression).

## R4 — Checkpoint & control clarity (US4)

**Decision**: Audit and lightly polish the fixed-light overlay CSS block
(`.route-checkpoint`, `.leaflet-bar`/zoom control, `.leaflet-popup-*`,
`.weather-marker`) so each element is legible and distinguishable at all zooms,
staying strictly achromatic. Likely touch-ups: ensure checkpoint dots stay
distinct from `ok` weather markers (both white fill) — rely on shape/size/border;
verify zoom-control contrast; confirm popup close button and text contrast. Keep
all values white/black/gray so `tests/monochrome.test.js` stays green.

**Rationale**: Polish on top of higher-value work; the current block is already
close (003), so this is small, screenshot-driven tuning, not a redesign.

**Alternatives considered**:
- *Recolor checkpoints for contrast* — rejected: would break monochrome.

## R5 — GPX auto-simplification Action (US5)

**Decision**: Add `.github/workflows/simplify-routes.yml`, the repo's first
workflow:
- **Triggers**: `push` and `pull_request` on paths `routes/**`, plus
  `workflow_dispatch`. **No `schedule:`** (constitution VII).
- **Job**: checkout, set up Python 3, run a small step that finds every
  `routes/*.gpx` **lacking** the `vm:simplified` marker (reuse
  `is_simplified()` / `simplify_gpx_file()` from `tools/add_route.py`) and
  simplifies it in place at the default tolerance (~5 m), then, if any file
  changed, commits the result back with a bot identity
  (`github-actions[bot]`) using `GITHUB_TOKEN`.
- **Loop safety**: the marker makes it idempotent — the bot's own commit produces
  only already-marked files, so the next `push` event simplifies nothing and
  commits nothing (no-op, no loop). Belt-and-suspenders: the commit step is a
  no-op when `git diff --quiet`, and/or skip when the head commit is the bot's.
- **Reuse**: invoke the existing tool rather than reimplement RDP. Preferred entry
  is a tiny driver that imports `simplify_gpx_file`/`is_simplified` and iterates
  marker-less `routes/*.gpx`, OR a `--simplify-in-place`-style path added to
  `add_route.py`'s CLI (decide in the map/CI contract; keep the change minimal and
  the RDP math untouched).
- **Permissions**: `permissions: contents: write` so the job can push the commit.
- **Failure**: a GPX with <2 usable points makes `simplify_gpx_file` `fail()` →
  the job fails visibly and commits nothing (FR-017).

**Rationale**: Directly encodes the owner-locked ops decision. The in-file marker
is self-contained state that travels with the file, so no `index.json` bookkeeping
is needed (the checksum alternative is documented but out of scope). Push-triggered
+ marker-idempotent satisfies constitution VII and the two-file promise (III).

**Alternatives considered**:
- *`index.json` per-route `gpxChecksum`* — documented alternative; rejected as
  default (extra state that can drift; only needed if marker-stripping is a real
  worry).
- *Scheduled cron* — barred by constitution VII.
- *Simplify at serve time in the browser* — rejected: wasteful, and the committed
  file should be the small one.
- *Reimplement RDP in JS/Action* — rejected: duplicates tested Python logic.

## R6 — Testing & verification strategy

**Decision**:
- Keep `npm test` (61 tests) green; `tests/monochrome.test.js` is the hard guard
  for US1–US4 CSS. Add a small assertion if useful (e.g., route weight present,
  labels pane rule present) but do not weaken the achromatic check.
- US1–US4: headless-Chrome CDP screenshots on `map.html`, both themes, RO + a
  Cyrillic locale, at ≥3 zoom levels, on a twisty many-hour route (Delacau).
- US5: exercise the workflow on the branch — commit a deliberately un-simplified
  GPX (strip the marker on a copy), push, and confirm the bot commit shrinks it and
  a second push is a no-op. Validate loop-safety and the `routes/**` path filter.

**Rationale**: Mirrors the established phase-gated rhythm (screenshots as the UX
feedback loop) and the constitution's spec-driven verification.
