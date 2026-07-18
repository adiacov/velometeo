# Data Model: Map legibility & polish

This feature is UI/ops polish, not a new data domain. The "entities" are the map
layers/panes and the marker-selection function's inputs/outputs, plus the GPX
processed-state marker. No storage schema changes.

## Map layers & panes (US1)

| Layer | CARTO source | Leaflet pane | Purpose |
|-------|--------------|--------------|---------|
| Base tiles | `light_nolabels` | `tilePane` (z 200) | Roads/terrain, no place names |
| Route casing + line | (SVG polylines) | `overlayPane` (z 400) | Cased monochrome route |
| Checkpoints | (circle markers) | `markerPane`/`overlayPane` | Route waypoints |
| Weather markers | (div icons) | `markerPane` (z 600) | Hourly forecast cards |
| **Labels** | `light_only_labels` | **`labels` (custom, z > 400)** | Place names, always on top of route |

Rules:
- The `labels` pane MUST have `z-index` above `overlayPane` and
  `pointer-events: none` (labels are decorative; clicks pass through to the map).
- No new tile origin: both CARTO layers share `basemaps.cartocdn.com` (keyless).
- The base+labels split replaces today's single `light_all` layer.

## Weather-marker subset (US2)

Input → output of the subset selection (pure function of rows + zoom):

| Field | Type | Notes |
|-------|------|-------|
| `rows` | array | Scenario hours (`{ lat, lon, timeLabel, weather, km }`), unchanged content |
| `zoom` | number | Current Leaflet zoom |
| `zMin` | number | Route fit-bounds zoom (wide "all hours" view) |
| `mode` | `'all'`/`'key'` | Only `'all'` is subset; `'key'` uses existing `keyIndexes` |
| → `visibleIndexes` | Set<int> | Indexes of `rows` to render at this zoom |

Invariants (the contract, not the constants):
- `0 ∈ visibleIndexes` and `rows.length-1 ∈ visibleIndexes` at every zoom (start +
  finish always shown).
- `|visibleIndexes|` is **monotonic non-decreasing** in `zoom`.
- At sufficiently high zoom, `visibleIndexes = {0 … n-1}` (all shown).
- If `rows.length ≤ smallThreshold`, `visibleIndexes = {0 … n-1}` at all zooms.
- Selection is even-spacing across `[0 … n-1]`; no clustering, no collision math.
- Marker **content** (time/temp/icon/arrow) is unchanged (feature 002 contract).

## Route line style (US1)

| Element | 003 stopgap | This feature |
|---------|-------------|--------------|
| `.route-line` weight | 3 | comfortable (~4–5, tuned by screenshot) |
| `.route-casing` weight | 6 | proportionally wider (~7–8) |
| Colors | ink over paper (achromatic) | unchanged (achromatic) |

## GPX processed-state marker (US5)

| Attribute | Value | Meaning |
|-----------|-------|---------|
| `vm:simplified` on `<gpx>` | tolerance in metres (e.g. `5`) | File already simplified; pipeline leaves it unchanged |
| absent | — | File is "unprocessed"; pipeline simplifies + stamps the marker |

- Namespace: `https://adiacov.github.io/velometeo/ns` (declared as `xmlns:vm`).
- Written by `simplify_gpx_file()` in `tools/add_route.py` (unchanged logic).
- Read by `is_simplified()` (unchanged). This is the single source of processed
  state — no `index.json` checksum (documented alternative, out of scope).

## Non-changes (guardrails)

- No index/event page data changes.
- No weather-code → icon mapping change (feature 002).
- No new external data/tile origins.
- Map overlays stay pinned to a fixed light scheme (theme-independent).
