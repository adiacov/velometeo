# Contract: Map legibility (US1–US4)

Client-side (Leaflet) behavior contract for the route map. These are the
observable guarantees; constants are tuned by screenshot but the rules below hold.

## C1 — Label layering (US1)

- The basemap MUST be rendered as `light_nolabels` (base) + `light_only_labels`
  (labels) using keyless CARTO tiles (no new origin).
- The labels layer MUST live on a Leaflet pane whose `z-index` is above the
  overlay pane so place-name labels paint on top of the route at every zoom.
- The labels pane MUST NOT capture pointer events (`pointer-events: none`).
- The route line MUST use a comfortable weight (thicker than the 003 stopgap of 3)
  and keep its cased paper-halo-under-ink appearance.

**Verification**: screenshot a route crossing a named town at ≥3 zoom levels, both
page themes; every label legible over the route.

## C2 — Marker subset (US2)

- In `mode === 'all'`, the set of rendered markers MUST follow the invariants in
  `data-model.md` § Weather-marker subset:
  - start (index 0) and finish (last index) always shown;
  - count monotonic non-decreasing in zoom;
  - all markers shown at high zoom / when `rows.length ≤ smallThreshold`;
  - even-spacing selection; no clustering; no collision hide/offset.
- Markers MUST re-render on `zoomend`.
- `mode === 'key'` behavior MUST be unchanged (existing `keyIndexes`).
- Marker DOM content (time/temp/icon/arrow) MUST be unchanged.

**Verification**: "all hours" on a twisty many-hour route — wide view calm (no full
overlaps), zoom-in reveals more; start+finish present at every zoom.

## C3 — Fixed light map, both themes (US3)

- The map MUST render as the fixed light "printed map" in both page themes.
- Map overlays (route, markers, checkpoints, controls, popups) MUST be identical
  across page themes (theme-independent, fixed light scheme).
- No true-dark basemap.

**Verification**: dark-theme screenshot shows the light panel cleanly framed;
light vs dark map region visually identical.

## C4 — Checkpoint & control clarity + monochrome (US4)

- Checkpoint dots, zoom control, and popups MUST be legible and distinguishable at
  all zoom levels.
- Every map element MUST be strictly achromatic (white/black/gray).
- `tests/monochrome.test.js` MUST pass (no colored literals/effects introduced).

**Verification**: `npm test` green; screenshot audit of checkpoints/zoom/popup at
multiple zooms, both themes.

## Non-goals

- No change to index/event pages, weather-marker content, or the weather-code →
  icon mapping (feature 002).
- No new external tile/data origins.
