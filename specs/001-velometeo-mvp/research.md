# Phase 0 Research: velometeo MVP

**Date**: 2026-07-16 · **Spec**: [spec.md](spec.md)

External facts (ACP limits, Open-Meteo endpoints/CORS) were verified and are
recorded in the spec's Research Findings section; this file records the
*technical decisions* that resolve the open questions from `BRIEF.md`.

## D1. Tech shape: framework-free vanilla JS, no build step

- **Decision**: Plain HTML + CSS + ES-module JavaScript served as-is from
  the repository root by GitHub Pages. No bundler, no framework, no Node
  toolchain required to run or fork the site.
- **Rationale**: Constitution IV promises "fork → add route → enable Pages
  → working site". Any build step breaks that promise (forkers would need
  a build Action or committed dist artifacts). Delacau's proven assets
  (`style.css`, `theme.js`, `map.js`) are vanilla and lift cleanly. The
  page complexity (one table + one map) does not justify a framework.
- **Alternatives considered**: Vite + React + TS (used in the user's
  strava-routes MVP) — rejected: adds a toolchain between forkers and a
  working site, and BRIEF itself notes the audience "argues for the
  simplest thing that stays maintainable".

## D2. Config format: single `routes/index.json`

- **Decision**: One JSON file listing all events; each entry: `id`, `name`,
  `gpx` (path), `date` (YYYY-MM-DD), `start` (HH:MM), `mode`
  (`brevet`|`pace`), optional `timezone` (IANA; default
  `Europe/Chisinau`).
- **Rationale**: Static hosting cannot enumerate directories, so the index
  page needs a manifest no matter what; per-route config files would still
  require that manifest, making them a second file to touch (violating the
  two-file promise: GPX + one config *entry*). A single file is also one
  fetch on the index page.
- **Alternatives considered**: one config file per route — rejected as
  above; YAML — rejected: needs a parser library, JSON is native.

## D3. Page model: one `event.html` template + query parameter

- **Decision**: `index.html` (event list) and a single `event.html`
  rendered per event via `event.html?event=<id>`. No per-event HTML files.
- **Rationale**: FR-004 forbids HTML edits per route; generating per-event
  pages would need a build step (banned by D1). Query-param routing works
  on GitHub Pages without any server rewrite rules.
- **Alternatives considered**: hash routing (`#delacau-200`) — works too,
  but query params survive social-media unfurlers better and match the
  "one page per event" mental model; per-event generated HTML — rejected
  (build step).

## D4. Leaflet via CDN with SRI pins (as Delacau)

- **Decision**: Leaflet 1.9.x from unpkg with `integrity` +
  `crossorigin` attributes, exactly as the Delacau map pages do.
- **Rationale**: proven in production with this audience; keeps the repo
  free of vendored binaries; SRI pin removes the supply-chain concern.
- **Alternatives considered**: vendoring Leaflet into the repo — viable
  fallback if the CDN ever becomes a problem; rejected for now to keep the
  repo lean and diffs readable.

## D5. i18n: runtime dictionaries, `data-i18n` attributes, RO default

- **Decision**: One JSON dictionary per language (`assets/i18n/ro.json`,
  `en.json`, `ru.json`). Static text carries `data-i18n="key"` attributes;
  a small module swaps text at runtime and re-renders dynamic content.
  Language persisted in `localStorage` (`velometeo.lang`), default `ro`.
- **Rationale**: Delacau generated three page trees because it was
  build-time; a client-side app switches at runtime for free (BRIEF
  explicitly notes this). Dictionaries as JSON keep translations editable
  without touching code.
- **Alternatives considered**: three page trees (Delacau style) — rejected:
  triples page count and violates D3; an i18n library — rejected: three
  languages and ~100 keys don't need one.

## D6. Persistence keys (theme / language / model)

- **Decision**: `localStorage` keys `velometeo.theme`, `velometeo.lang`,
  `velometeo.model`. Theme defaults to `prefers-color-scheme`; model
  defaults to ECMWF; all three persist across pages and visits (per
  clarification Q3, mirroring Delacau's carry-through behavior).
- **Rationale**: same mechanism Delacau's `theme.js` already uses
  (verified in its code: `localStorage.getItem(storageKey) || systemTheme()`).

## D7. GPX handling: browser DOMParser + haversine, reimplemented in JS

- **Decision**: Parse GPX with the native `DOMParser`; compute cumulative
  track distance with the haversine formula; sample rider position at each
  scenario hour by linear interpolation along the cumulative-distance
  table; read `<wpt>` elements as optional checkpoints.
- **Rationale**: this reimplements the knowledge in Delacau's Python
  (`haversine_km`, `load_gpx_points`, `route_samples_from_gpx`,
  `load_gpx_waypoints`) as instructed by BRIEF ("read the script for its
  knowledge... reimplement in JS"). No external GPX library needed.

## D8. Weather fetch strategy: one batched request per model

- **Decision**: For the selected model, collect the deduplicated
  (position, hour) sample points for all scenarios, then issue **one**
  Open-Meteo request with comma-separated `latitude`/`longitude` lists and
  the union hourly variable set; slice per scenario client-side. Fetch
  only the currently selected model; fetch another model lazily on switch.
  `timezone` = the event's configured IANA zone.
- **Rationale**: Open-Meteo supports multi-coordinate requests (verified
  in docs); one request per model keeps SC-001 (10 s on mobile) and stays
  far below fair-use limits. Lazy per-model fetch halves the default
  payload.
- **Variables**: `temperature_2m`, `apparent_temperature`, `precipitation`,
  `precipitation_probability`, `weather_code`, `cloud_cover`,
  `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`.
- **Models**: `ecmwf_ifs025` (label "ECMWF") and `icon_seamless` (label
  "ICON") at launch; adding a model = one entry in a models table (still
  no per-route edits). Exact model ids re-checked against the live API at
  implementation time.

## D9. Past/upcoming/far-future mode selection (per event, client-side)

- **Decision**, evaluated at page load in the event's timezone:
  - event end (start + max scenario duration) in the future and start
    within the forecast horizon → **forecast API** (forecast mode);
  - event start beyond the horizon (> ~15 days for ECMWF / ~7 for ICON) →
    **waiting mode**: route + map + scenarios + "forecast opens N days
    before" message (FR-014);
  - event in the past ≤ 7 days → **forecast API with `past_days`**
    (observed-ish recent data, labeled "recorded weather", FR-013
    fallback);
  - event in the past > 7 days → **archive API** (observed, labeled).
- **Rationale**: spec Research Findings — archive lags 2–5 days;
  `past_days` (≤ 92) covers the gap seamlessly.

## D10. Testing: Node built-in test runner for pure logic + browser checks

- **Decision**: Keep domain logic (GPX math, scenario/band computation,
  mode selection, request building, formatting) in dependency-free ES
  modules under `assets/js/lib/`, unit-tested with `node --test` (no npm
  dependencies; a `package.json` marked `"type": "module"` only, or none
  at all). UI behavior validated via the quickstart manual scenarios
  against a local static server.
- **Rationale**: forkers never need to run tests, so a dev-only Node
  requirement is acceptable and keeps CI trivial; zero dependencies
  preserves the static-purity of the repo.
- **Alternatives considered**: no tests (Delacau had none) — rejected:
  scenario math and mode selection carry real correctness risk (ENGINEERING
  guidance); browser test frameworks (Playwright) — deferred, manual
  quickstart suffices at this scale.

## D11. Helper script: Python, stdlib-only (`tools/add_route.py`)

- **Decision**: `python3 tools/add_route.py <file.gpx> --name "…" --date
  YYYY-MM-DD --start HH:MM --mode brevet|pace [--id slug] [--commit]`.
  Copies the GPX into `routes/`, inserts the config entry into
  `routes/index.json` (sorted), validates (GPX parses, date/start formats,
  mode enum, id uniqueness, brevet distance sanity per FR edge case), and
  optionally commits/pushes.
- **Rationale**: BRIEF names this the primary curator path; Python stdlib
  (xml.etree, json, argparse) avoids any dependency; also usable by
  forkers. The `workflow_dispatch` Action and manual-edit paths remain
  documentation-level (spec Assumptions).

## D12. Delacau asset reuse map

| Delacau file | Verdict |
|---|---|
| `assets/theme.js` (83 lines) | Lift nearly as-is; parametrize storage key |
| `assets/style.css` (174 lines) | Copy-and-adapt; keep pills/sections/theme variables |
| `assets/map.js` (165 lines) | Adapt: route polyline, weather markers, wind arrows stay; feed from runtime data instead of baked JSON |
| `brevet_delacau_weather_research.py` | Knowledge only (D7, D8); never ported line-by-line |
| Generated HTML trees (`ro/`, `en/`, `sources/`, `maps/`) | UX reference only; never copied |
| `delacau-200-brm.gpx` | Copied in as the first route |
