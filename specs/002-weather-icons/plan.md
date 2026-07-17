# Implementation Plan: Weather Condition Icons

**Branch**: `002-weather-icons` | **Date**: 2026-07-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-weather-icons/spec.md`

## Summary

Show a weather-condition emoji, derived from the already-fetched Open-Meteo
`weather_code`, in three surfaces: a new narrow icon-only column in the
event-page forecast table, the mobile card header line, and the map popup
header line. One shared pure mapping module (`assets/js/lib/weather-icons.js`)
groups all WMO codes into 8 buckets; labels come from the existing runtime
i18n dictionaries. No new network requests, no new assets, map markers
untouched.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES modules), no build step

**Primary Dependencies**: None new. Existing: Leaflet (map popups), runtime
i18n (`assets/js/i18n.js` + `assets/i18n/*.json`)

**Storage**: N/A (pure presentation of already-fetched data)

**Testing**: `node --test tests/*.test.js` — new `tests/weather-icons.test.js`
for the pure mapping module

**Target Platform**: Static site on GitHub Pages, evergreen browsers, mobile-first

**Project Type**: Static web app

**Performance Goals**: Zero additional network requests (SC-004); mapping is
a constant-time lookup

**Constraints**: Minimalism-first visuals; table must not gain horizontal
scroll at supported widths; cards must not grow; markers frozen

**Scale/Scope**: ~1 new lib module + tests, 3 render-site edits
(`event-page.js` table + cards, `map.js` popup), 8 label keys × 3 languages,
possibly a few lines of CSS for the narrow column

## Constitution Check

*GATE: evaluated against constitution v1.0.0.*

- **I. Fully static, client-side only** — PASS: pure client-side rendering
  of a field already fetched from Open-Meteo; no new requests, keys, or
  build steps.
- **II. Curated routes only** — PASS: no route/content surface touched.
- **III. Two-file route addition** — PASS: no config or route schema change;
  feature applies to all routes automatically.
- **IV. Fork-friendly docs** — PASS: no fork-workflow change; nothing to
  document for forkers (behavior is automatic).
- **V. Honest data** — PASS by design: missing/unknown `weather_code`
  renders the standard dash, never a substitute icon (FR-002, edge cases).
- **VI. Mobile-first, multilingual, reused UX** — PASS: mobile cards are a
  first-class surface (P2); labels translated ro/en/ru; additive minimal
  change to the validated Delacau-derived UX, not a redesign.
- **VII. No load-bearing scheduled automation** — PASS: N/A.

No violations → Complexity Tracking not needed. Re-checked after Phase 1
design: still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-weather-icons/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── weather-icons.md # Phase 1 — module contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
assets/
├── js/
│   ├── lib/
│   │   └── weather-icons.js   # NEW: WMO code → {icon, labelKey} mapping
│   ├── event-page.js          # EDIT: table column + card header icon
│   └── map.js                 # EDIT: popup header icon
├── i18n/
│   ├── ro.json                # EDIT: +8 weather.* labels
│   ├── en.json                # EDIT: +8 weather.* labels
│   └── ru.json                # EDIT: +8 weather.* labels
└── style.css                  # EDIT (if needed): narrow icon column sizing

tests/
└── weather-icons.test.js      # NEW: mapping coverage of all WMO codes
```

**Structure Decision**: follows the established layout — pure logic in
`assets/js/lib/` with a Node test, DOM rendering inline in the page modules,
labels in the runtime dictionaries.
