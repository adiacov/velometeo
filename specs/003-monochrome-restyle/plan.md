# Implementation Plan: Monochrome E-Reader Restyle

**Branch**: `003-monochrome-restyle` | **Date**: 2026-07-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-monochrome-restyle/spec.md`

## Summary

Restyle all three pages into a strictly black-and-white, e-reader-inspired
visual language in both themes. The work is almost entirely in
`assets/css/style.css` (retarget the existing CSS custom properties to an
ink/paper monochrome token set, delete gradients/blur/colored effects, add
grayscale map-tile filters and monochrome focus rings) plus one structural
change: replace the colored emoji condition icons and theme-toggle glyph
with inline monochrome SVG (Lucide, ISC license) that inherit
`currentColor`, so contrast is automatic on every surface. Typography moves
to self-hosted OFL fonts (Literata for headings, Inter for body/data) with
Latin-Extended + Cyrillic coverage for ro/en/ru. No layout, markup
structure, or behavior changes.

## Technical Context

**Language/Version**: Vanilla ES modules (browser), no build step, no
framework — unchanged.

**Primary Dependencies**: Leaflet 1.9.4 (unpkg CDN, unchanged), Open-Meteo
API (unchanged), OSM raster tiles (unchanged, presentation filtered).
New assets checked into the repo: Lucide SVG glyphs (ISC) inlined into
`weather-icons.js`/`theme.js`, Literata + Inter woff2 files (OFL) in
`assets/fonts/`.

**Storage**: N/A (static files only).

**Testing**: `node --test` (`npm test`), 57 existing tests must stay green;
`tests/weather-icons.test.js` asserts `icon.length > 0` and label
coverage — compatible with SVG-string icons. One new test guards the
monochrome stylesheet invariant (no chromatic colors).

**Target Platform**: GitHub Pages static hosting; mobile-first browsers
(Android/iOS/desktop), light + dark themes.

**Project Type**: Static web site (three pages, shared CSS/JS).

**Performance Goals**: No new third-party origins; fonts ≤ ~400 KB total
woff2, loaded with `font-display: swap` so text is never invisible.

**Constraints**: Constitution I (fully static — fonts/icons must be
self-hosted files, no CDN fonts), III (no route-workflow impact), V
(unknown weather code still renders nothing), VI (layout/structure remain
Delacau-derived; only the visual layer changes — owner-approved deviation).

**Scale/Scope**: 1 stylesheet (~195 lines, most color rules touched),
2 JS files with icon markup (`weather-icons.js`, `theme.js`), 2 render
sites already interpolating `cond.icon` as HTML (`event-page.js`,
`map.js` — expected to need no logic change), 3 HTML heads (font
preload), ~10 font files, 9 SVG glyphs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Fully static, client-side only | PASS | Fonts and icons are self-hosted static files; no new origins, keys, or build steps. Map filter is pure CSS. |
| II. Curated routes only | PASS | Not touched. |
| III. Two-file route addition | PASS | No route workflow changes; restyle touches only shared CSS/JS/HTML heads. |
| IV. Fork-friendly docs | PASS | README unaffected; fonts/icons ship inside the repo so forks inherit the look with zero extra steps. |
| V. Honest data | PASS | Unknown `weather_code` still renders nothing (dash in table); no substitute glyphs. |
| VI. Mobile-first, multilingual, reused UX | **DEVIATION (justified)** | "Delacau defines the look — do not redesign" is deliberately superseded on the visual layer only, at the owner's explicit request (2026-07-17, recorded in spec Constitution note). Layout, structure, breakpoints, map behavior, i18n, and themes all remain. See Complexity Tracking. |
| VII. No load-bearing scheduled automation | PASS | Not touched. |

**Post-design re-check (after Phase 1)**: unchanged — the design keeps all
markup/JS behavior intact and adds only static assets; the VI deviation
remains the single, owner-approved exception.

## Project Structure

### Documentation (this feature)

```text
specs/003-monochrome-restyle/
├── plan.md              # This file
├── research.md          # Phase 0 output (R1–R7 decisions)
├── data-model.md        # Phase 1 output (tokens, icon glyphs, status encoding)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/
│   └── monochrome-ui.md # Phase 1 output (token/icon/status contract)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
assets/
├── css/
│   └── style.css            # ~90% of the change: tokens, effects, map filter, focus
├── fonts/                   # NEW: self-hosted woff2 (Literata, Inter; latin/latin-ext/cyrillic)
│   └── OFL.txt              # NEW: font licenses
├── js/
│   ├── theme.js             # toggle glyph 🌙/☀️ → inline SVG (innerHTML)
│   ├── event-page.js        # verify only: interpolates cond.icon as HTML already
│   ├── map.js               # verify only: interpolates cond.icon as HTML already
│   └── lib/
│       └── weather-icons.js # icon: emoji string → inline SVG string (currentColor)
index.html                   # font preload links in head
event.html                   # font preload links in head
map.html                     # font preload links in head
tests/
├── weather-icons.test.js    # extend: icons are SVG, use currentColor, no emoji
└── monochrome.test.js       # NEW: stylesheet audit — every color is achromatic
```

**Structure Decision**: Flat static-site layout unchanged; the only new
directory is `assets/fonts/`. All icon markup stays behind the existing
`weatherCondition()` single mapping (FR-007), so no render site learns
anything new.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution VI: Delacau visual spec superseded (visual layer only) | Owner explicitly requested a strictly monochrome e-reader identity (2026-07-17); color is the one thing the Delacau look cannot express | Keeping Delacau colors contradicts the feature itself; a parallel "theme option" would double every palette rule and violate super-minimalism |
