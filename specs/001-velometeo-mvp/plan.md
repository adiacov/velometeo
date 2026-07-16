# Implementation Plan: velometeo — weather along bicycle routes

**Branch**: `001-velometeo-mvp` | **Date**: 2026-07-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-velometeo-mvp/spec.md`

## Summary

Build a fully static, client-side site (GitHub Pages) where one config entry
+ one GPX = one event page showing weather along the route positioned by
pace scenarios (brevet ACP bands or fixed paces). Technical approach:
framework-free vanilla JS ES modules with no build step; a single
`routes/index.json` manifest; one `event.html` template driven by
`?event=<id>`; runtime i18n (RO/EN/RU); Leaflet via pinned CDN; weather
fetched in the browser from Open-Meteo (forecast/`past_days`/archive chosen
by event date), one batched multi-coordinate request per selected model.
All decisions with rationale: [research.md](research.md).

## Technical Context

**Language/Version**: JavaScript (ES2020+ modules, browser-native); Python 3.10+ stdlib for the curator helper script only

**Primary Dependencies**: Leaflet 1.9.x (CDN, SRI-pinned) — the only runtime dependency; zero npm dependencies

**Storage**: Repository files (GPX + `routes/index.json`); visitor prefs in `localStorage` (`velometeo.theme|lang|model`); no database

**Testing**: `node --test` for pure-logic modules in `assets/js/lib/`; manual browser scenarios per [quickstart.md](quickstart.md)

**Target Platform**: Mobile-first browsers (evergreen); hosted on GitHub Pages (static file serving from repo root)

**Project Type**: Static client-side web app (single project)

**Performance Goals**: Event page readable ≤ 10 s on typical mobile (SC-001); ≤ 4 network round-trips before weather renders (config, GPX, Leaflet, one weather call)

**Constraints**: No backend/keys/paid services/build step; no scheduled Actions; Open-Meteo free-tier fair use (~10k calls/day, expected ≪); honest-data rendering (`—` for missing)

**Scale/Scope**: ~2 HTML pages + ~8 JS modules; tens of routes over the product's life; three languages; two weather models at launch

## Constitution Check

*GATE: evaluated against constitution v1.0.0 — all PASS, pre- and post-design.*

| Principle | Verdict | Evidence in this design |
|---|---|---|
| I. Fully static, client-side | PASS | No build step, no server, keyless Open-Meteo only (D1, D8) |
| II. Curated routes only | PASS | Routes enter via repo commits; no upload surface anywhere |
| III. Two-file route addition | PASS | GPX file + one entry in `routes/index.json` (D2); `event.html` is shared (D3) |
| IV. Fork-friendly, docs first-class | PASS | No toolchain to run the site (D1); README + helper script tasks are P6/P7 user stories |
| V. Honest data | PASS | `—` rendering is a lib-level formatting rule (D8 variables; FR-016) |
| VI. Mobile-first, RO/EN/RU, Delacau UX | PASS | Runtime i18n (D5), theme module lifted from Delacau (D6, D12), Leaflet map behavior preserved (D12) |
| VII. No load-bearing scheduled automation | PASS | Zero scheduled Actions; weather is fetched at page load |

No violations → Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-velometeo-mvp/
├── plan.md              # This file
├── research.md          # Phase 0: decisions D1–D12
├── data-model.md        # Phase 1: entities & validation
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   ├── routes-config.md # routes/index.json contract (curator-facing)
│   ├── open-meteo.md    # external API usage contract
│   └── add-route-cli.md # helper script CLI contract
├── checklists/
│   └── requirements.md  # spec quality checklist (16/16)
└── tasks.md             # Phase 2 (/speckit-tasks output)
```

### Source Code (repository root)

```text
index.html                  # event list (Upcoming / Past)
event.html                  # single event page template (?event=<id>)
assets/
├── css/
│   └── style.css           # adapted from Delacau style.css
├── js/
│   ├── lib/                # pure logic — dependency-free, node:test-able
│   │   ├── gpx.js          # parse GPX, cumulative distance, waypoints
│   │   ├── geo.js          # haversine, bearing, position interpolation
│   │   ├── scenarios.js    # brevet band table, pace scenarios, hour→position
│   │   ├── weather-api.js  # request building, mode selection (forecast/past_days/archive), response slicing
│   │   └── format.js       # units, dash-for-missing, day-context time labels
│   ├── i18n.js             # dictionary loading, data-i18n swap, persistence
│   ├── theme.js            # lifted from Delacau (storage key parametrized)
│   ├── map.js              # adapted from Delacau: route, markers, wind arrows
│   ├── event-page.js       # event.html controller: load config+GPX, fetch, render
│   └── index-page.js       # index.html controller: manifest → Upcoming/Past lists
├── i18n/
│   ├── ro.json  en.json  ru.json
routes/
├── index.json              # event manifest (D2) — the only config file
└── delacau-200-brm.gpx     # first route, copied from the Delacau repo
tools/
└── add_route.py            # curator helper (D11, stdlib-only)
tests/
├── gpx.test.js  geo.test.js  scenarios.test.js  weather-api.test.js  format.test.js
└── fixtures/               # small GPX fixtures (with/without waypoints)
README.md                   # forker-facing: fork → add route → enable Pages
```

**Structure Decision**: single static project served from the repository
root (GitHub Pages "deploy from branch", root folder). The `assets/js/lib/`
vs page-controller split exists so all correctness-critical logic runs under
`node --test` without a browser.

## Design outline (how the pieces meet the requirements)

- **Event page flow** (`event-page.js`): read `?event=` → fetch
  `routes/index.json` → find entry (unknown id → friendly error, FR-005) →
  fetch GPX → `gpx.js`/`geo.js` build the cumulative-distance track and
  measured length → `scenarios.js` derives bands (brevet table, FR-007) or
  paces (FR-008) and the per-hour positions (FR-010) → `weather-api.js`
  picks forecast/past_days/archive mode (D9; FR-012/013/014) and builds one
  batched request for the persisted model choice → render table
  (`format.js`: dashes, day context — FR-016/023) and map (`map.js`:
  polyline, hourly markers, wind arrows — FR-019; waypoints → checkpoints,
  FR-003). Model switch re-runs only the fetch+render stage (Q3
  clarification).
- **Index flow** (`index-page.js`): fetch manifest → validate entries
  (skip+console-warn broken ones, FR-005) → split Upcoming/Past by event
  date in its timezone → render newest-first lists (FR-018).
- **Failure states**: fetch errors render the i18n'd unavailability message
  while route/map remain (FR-017); far-future events render waiting mode
  with the countdown (FR-014).
- **Delacau parity** (SC-004): first route = Delacau GPX in brevet mode;
  quickstart includes a side-by-side check against the live Delacau page.

## Complexity Tracking

*(empty — no constitution violations)*
