# Feature Specification: Map legibility & polish

**Feature Branch**: `004-map-legibility`

**Created**: 2026-07-18

**Status**: Draft

**Input**: Owner brief `specs/004-map-legibility/BRIEF.md` (decisions locked 2026-07-18), building on feature 003 (monochrome restyle).

## User Scenarios & Testing *(mandatory)*

The monochrome route map from feature 003 is readable but has rough edges when a
route is dense or carries many hourly weather markers. On a phone, at the wide
"all hours" zoom and on twisty sections, the weather cards overlap and the route
line sits on top of place names. This feature makes the route map genuinely easy
to read. It is a **pure map feature**: nothing on the index or event pages
changes, and no weather-marker content changes.

### User Story 1 - Place names are never hidden by the route (Priority: P1)

A rider opens the map to see where the route goes relative to towns and villages.
Today the route line can cover place-name labels on the basemap, so a rider
cannot tell which settlement a section passes through. The rider needs the map's
place names to always be readable, even where the route runs straight over a
town.

**Why this priority**: This is the core legibility complaint and the reason the
route line was trimmed to a thin stopgap weight in 003. Fixing label layering is
the highest-value change and unblocks restoring a comfortable route weight.

**Independent Test**: Load the map for a route that passes directly over a named
settlement, at several zoom levels, and confirm every place-name label remains
fully legible on top of the route line — verifiable by screenshot inspection in
both page themes without any other story implemented.

**Acceptance Scenarios**:

1. **Given** a route that runs straight through a named town, **When** the map
   renders at the default fit-bounds zoom, **Then** the town's label is drawn on
   top of the route line and is fully readable.
2. **Given** the map is displayed, **When** the rider zooms in and out across the
   route, **Then** place-name labels remain above the route line at every zoom
   level.
3. **Given** labels now draw above the route, **When** the route line is rendered,
   **Then** it uses a comfortable, easily-followed weight (thicker than the 003
   stopgap) without obscuring labels.

---

### User Story 2 - Readable weather markers when crowded (Priority: P2)

A rider viewing the whole route ("all hours") on a phone sees weather cards piled
on top of each other on tight/twisty sections, making individual cards
unreadable. The rider needs a calmer map that shows a manageable number of
weather markers when zoomed out, and progressively reveals more as they zoom in
to inspect a section.

**Why this priority**: High-value readability improvement, but the map already
degrades gracefully (the full hourly detail lives in the forecast table), so it
ranks below the P1 label fix.

**Independent Test**: Open the map in "all hours" mode for a route with many
hours on a twisty profile; confirm that at the wide fit-bounds zoom only an
evenly-spaced subset of markers is shown with little/no overlap, and that zooming
in reveals additional markers — verifiable by screenshot at two or more zoom
levels.

**Acceptance Scenarios**:

1. **Given** a scenario with many hourly markers in "all hours" mode, **When** the
   map is at the wide fit-bounds zoom, **Then** a reduced, evenly-spaced subset of
   the markers is shown and overlap is substantially reduced compared to today.
2. **Given** the reduced subset is shown, **When** the rider zooms in, **Then**
   additional markers become visible, and at sufficiently high zoom all hourly
   markers for the section are shown.
3. **Given** any zoom level, **When** markers are shown, **Then** the first hour
   (start) and last hour (finish) markers are always among those displayed.
4. **Given** "key hours" mode is selected, **When** the map renders, **Then** the
   existing key-hours behavior is unchanged (this story only adjusts "all hours").

---

### User Story 3 - Single fixed light map confirmed in both themes (Priority: P2)

A rider using the site in dark mode opens the map and sees a light "printed map"
panel framed cleanly inside the dark page. The product keeps one fixed light map
in both page themes (a dark basemap makes near-black markers and controls blend
into near-black tiles). This story verifies the framing reads well and records
the decision; it does not add a true-dark map.

**Why this priority**: Mostly documentation and verification of an existing 003
decision, but it must be explicitly confirmed as part of this map-polish pass and
guards against regressions when US1/US2/US4 touch the map.

**Independent Test**: Load the map with the page in dark theme and confirm the
light map panel is clearly framed (border/rounding/surface) and legible, and that
no true-dark basemap is introduced — verifiable by screenshot in dark theme.

**Acceptance Scenarios**:

1. **Given** the page is in dark theme, **When** the map renders, **Then** the map
   panel is the fixed light "printed map" scheme and is clearly framed within the
   dark page.
2. **Given** either page theme, **When** the map renders, **Then** the basemap,
   route, markers, checkpoints, and controls are identical (theme-independent map
   overlays).

---

### User Story 4 - Checkpoint & control clarity (Priority: P3)

A rider inspecting checkpoints, using the zoom buttons, or opening a marker popup
sees clean, on-brand monochrome elements at every zoom level. Checkpoint dots,
zoom controls, and popups read cleanly and never introduce color.

**Why this priority**: Polish on top of the higher-value legibility work; nice to
have but not blocking.

**Independent Test**: At several zoom levels, inspect checkpoint dots, the zoom
control, and an opened popup; confirm each is legible, correctly sized, and
strictly monochrome — verifiable by screenshot.

**Acceptance Scenarios**:

1. **Given** the map at any zoom level, **When** checkpoint dots are shown, **Then**
   they are legible and distinguishable from weather markers and the route line.
2. **Given** the map, **When** the rider uses the zoom control, **Then** the
   control is legible and on-brand (monochrome) in both page themes.
3. **Given** a weather or checkpoint marker, **When** its popup is opened, **Then**
   the popup content is legible and strictly monochrome.

---

### User Story 5 - GPX auto-simplified in the pipeline (Priority: P2)

The route curator adds a route by dropping a GPX into `routes/` and a config entry
into `routes/index.json`, then pushing — never running a simplification step by
hand. An automated pipeline step simplifies any unprocessed committed GPX and
commits the smaller file back, so committed routes stay small without manual work.

**Why this priority**: Ops/tooling value that preserves the two-file promise
(constitution III) and route efficiency, but it is independent of the visual map
polish and could be split into its own small feature.

**Independent Test**: On a branch, commit an unprocessed (un-simplified) GPX under
`routes/` and push; confirm the pipeline simplifies it, commits the smaller file
back with the processed marker, and that a subsequent push does not re-simplify or
loop — verifiable from the resulting commit and file size.

**Acceptance Scenarios**:

1. **Given** an unprocessed GPX committed under `routes/`, **When** the change is
   pushed, **Then** the pipeline simplifies the track using the existing RDP logic
   and commits the smaller, marked file back to the branch.
2. **Given** a GPX that already carries the processed marker, **When** any push
   touches `routes/`, **Then** the pipeline leaves it unchanged (idempotent — no
   re-simplification).
3. **Given** the pipeline itself commits a simplified file back, **When** that
   commit lands, **Then** the pipeline does not re-trigger into a loop on its own
   commit.
4. **Given** the pipeline runs, **When** it is configured, **Then** it is triggered
   only by push / pull_request / manual dispatch on `routes/**` and NEVER by a
   scheduled cron.
5. **Given** the curator's workflow, **When** they add a route, **Then** they still
   only touch two files (GPX + `routes/index.json` entry) and never run
   simplification by hand.

---

### Edge Cases

- **Route with no named settlements nearby**: US1 still holds — there are simply
  no labels to cover; the layered approach must not break the basemap rendering.
- **Very short route / few hours**: US2 subsetting must not hide so much that the
  map looks empty; start and finish markers are always shown, and if the total
  marker count is already small enough to not overlap, all are shown.
- **Marker exactly on a checkpoint**: US4 — both remain distinguishable.
- **GPX already simplified elsewhere before commit**: US5 — the processed marker is
  respected and the file is left unchanged.
- **GPX committed with no usable track (<2 points)**: US5 — the pipeline must fail
  clearly (or skip) rather than commit a broken file; surfaced as a failed run.
- **Multiple GPX files committed in one push**: US5 — every unprocessed file is
  simplified in that run.
- **Push touching `routes/index.json` only (no GPX change)**: US5 — nothing to
  simplify; the run is a no-op and commits nothing.

## Requirements *(mandatory)*

### Functional Requirements

**Labels & route (US1)**

- **FR-001**: Place-name labels on the basemap MUST always render above the route
  line at every supported zoom level.
- **FR-002**: With labels drawn above the route, the route line MUST use a
  comfortable, easily-followed weight (thicker than the 003 stopgap) while keeping
  its cased paper-halo-under-ink appearance.
- **FR-003**: The map MUST NOT introduce any new external tile/data origin beyond
  the already-used CARTO + OpenStreetMap + Open-Meteo.

**Marker declutter (US2)**

- **FR-004**: In "all hours" mode at the wide fit-bounds zoom, the map MUST display
  a reduced, evenly-spaced subset of the hourly weather markers rather than all of
  them.
- **FR-005**: As the user zooms in, the map MUST progressively reveal additional
  markers, showing all hourly markers for a section at sufficiently high zoom.
- **FR-006**: The start (first hour) and finish (last hour) markers MUST always be
  among the displayed subset at any zoom level.
- **FR-007**: The declutter behavior MUST NOT change weather-marker content
  (time/temp/icon/arrow) nor the weather-code → icon mapping (feature 002
  contract), and MUST NOT use clustering or collision-based hide/offset.
- **FR-008**: "Key hours" mode behavior MUST remain unchanged.

**Single light map (US3)**

- **FR-009**: The map MUST remain a single fixed light "printed map" panel in both
  page themes; no true-dark basemap is introduced.
- **FR-010**: The map's overlays (route, markers, checkpoints, controls, popups)
  MUST stay pinned to a fixed light scheme independent of the page theme.

**Checkpoint & control clarity (US4)**

- **FR-011**: Checkpoint dots, the zoom control, and popups MUST be legible and
  distinguishable at all supported zoom levels.
- **FR-012**: All map elements MUST remain strictly monochrome (achromatic only:
  white / black / gray); the stylesheet guard (`tests/monochrome.test.js`) MUST
  stay green.

**GPX auto-simplification pipeline (US5)**

- **FR-013**: An automated pipeline step MUST simplify any committed `routes/*.gpx`
  that lacks the processed marker, reusing the existing RDP simplification logic,
  and commit the smaller file back.
- **FR-014**: The pipeline MUST determine "already processed" via the in-file
  `vm:simplified` marker on `<gpx>` (idempotent; travels with the file). A file
  carrying the marker MUST be left unchanged.
- **FR-015**: The pipeline MUST be triggered only by push / pull_request / manual
  dispatch scoped to `routes/**`, and MUST NEVER use a scheduled cron
  (constitution VII).
- **FR-016**: The pipeline MUST NOT loop on its own commits (it must skip
  already-marked files and/or ignore its own bot commits).
- **FR-017**: The pipeline MUST fail visibly (surface an error, commit nothing)
  when a committed GPX has no usable track, rather than committing a broken file.
- **FR-018**: Adding a route MUST remain a two-file operation for the curator (GPX
  + one `routes/index.json` entry); the pipeline MUST NOT require any additional
  manual step (constitution III).

### Key Entities *(include if data involved)*

- **Route GPX file**: The committed track under `routes/`. Carries an optional
  in-file `vm:simplified` marker on its `<gpx>` root indicating it has been
  processed by the simplification logic (tolerance recorded as the marker value).
- **Basemap label layer**: The set of place-name labels rendered from the tile
  source; in this feature it becomes a distinct layer drawn above the route
  overlay (conceptually — the base tiles without labels, plus a labels-only layer
  on top).
- **Weather marker subset**: The evenly-spaced selection of hourly markers chosen
  for display at a given zoom level, always including start and finish.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a route passing directly over a named settlement, 100% of
  place-name labels remain fully readable over the route line at the default zoom
  and at least two additional zoom levels, verified by screenshot in both page
  themes.
- **SC-002**: In "all hours" mode at the wide fit-bounds zoom on a twisty,
  many-hour route, no two displayed weather markers fully overlap (each is
  individually readable), and zooming in reveals more markers.
- **SC-003**: Start and finish markers are visible at every zoom level in "all
  hours" mode.
- **SC-004**: The map renders as a fixed light panel in both page themes with no
  color anywhere; `npm test` passes including `tests/monochrome.test.js`, with no
  net loss of existing tests (61 today).
- **SC-005**: A curator can add a route by committing exactly two files (GPX +
  `routes/index.json` entry) and pushing, with the committed GPX ending up
  simplified automatically and no manual simplification step performed.
- **SC-006**: Re-pushing an already-simplified route triggers no further
  simplification commit (idempotent; no pipeline loop).

## Assumptions

- The layered-labels approach uses the existing CARTO tile family (a no-labels base
  plus a labels-only overlay); no new tile origin is added (brief US1).
- Marker declutter is implemented by choosing an evenly-spaced subset per zoom, not
  by clustering or collision detection (owner decision, locked 2026-07-18).
- The map stays a single fixed light panel in both themes; no true-dark map is in
  scope (owner decision, locked 2026-07-18).
- Processed-state tracking uses the in-file `vm:simplified` marker (recommended in
  the brief); an `index.json` checksum is the documented alternative and is out of
  scope unless marker-stripping proves to be a real concern.
- The site currently has no `.github/workflows/`; this feature introduces the first
  workflow. GitHub Pages continues to deploy from `main` root and is unaffected.
- The RDP simplification logic in `tools/add_route.py` (functions such as
  `simplify_gpx_file`, `is_simplified`) is reused by the pipeline rather than
  reimplemented.
- Weather-marker content and the weather-code → icon mapping (feature 002) are
  unchanged.
- Implementation is phase-gated per the established rhythm: one phase → commit →
  stop for owner review, with headless-Chrome screenshots (both themes, map page)
  as the UX feedback loop.

## Out of Scope

- Live GPS / turn-by-turn / route editing / uploads (constitution II).
- Changing weather-marker content (time/temp/icon/arrow) or the shared
  weather-code → icon mapping (feature 002 contract).
- Any non-map page (index, event). The add-route pipeline is in scope for US5 only
  (GPX auto-simplification); no other tooling changes.
- New external tile/data origins beyond the existing CARTO + OSM + Open-Meteo.
- A true-dark map basemap.
- An `index.json` per-route checksum for processed-state tracking (documented
  alternative only).
