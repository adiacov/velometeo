# Quickstart: validating the monochrome restyle

Prerequisites: Node ≥ 20 (for `node --test`), any static file server,
a browser. No build step exists in this repo.

## 1. Unit tests (SC-006, SC-001/SC-002 guards)

```sh
npm test
```

Expected: all existing tests green plus the new ones —
`tests/monochrome.test.js` (stylesheet contains only achromatic colors, no
gradients/backdrop-filter; no emoji in `weather-icons.js`/`theme.js`) and
the extended `tests/weather-icons.test.js` (every `icon` is an inline
`currentColor` SVG).

## 2. Serve and eyeball both themes (US1, US3, SC-007)

```sh
python3 -m http.server 8000
# open http://localhost:8000/event.html?event=delacau-200-brm
```

Check in **light** then **dark** (toggle in the topbar, and once via OS
preference with localStorage cleared — both paths must look identical):

- Zero color anywhere: page, pills, active language link, source
  switcher, hover states, links.
- Emphasis: hero and sticky table header carry a soft shadow in light
  theme; in dark theme they read as slightly raised surfaces + hairline,
  no shadows.
- Status: warn chips/hours are inverted (ink bg, paper text); ok are
  paper + hairline. Distinguishable at a glance.
- Focus: Tab through controls — every stop shows a 2px ink outline.
- Fonts: headings in Literata (serif), body/table in Inter. DevTools →
  Network: no font request to any external origin; text visible before
  fonts load (swap).

## 3. Icons on every surface (US2)

- Table `cond` column, mobile cards (narrow the window ≤ 760px), map
  popup, map markers: condition icon is a crisp single-color line glyph
  matching the neighboring text color — including paper-colored icons on
  inverted warn markers.
- Theme toggle shows a monochrome sun/moon glyph in both themes.
- Cross-platform emoji check (SC-002): open on an Android or iOS device
  (or DevTools device emulation is *not* enough — emoji rendering is
  OS-level); confirm no colored emoji anywhere.

## 4. Map page (US4)

```text
http://localhost:8000/map.html?event=delacau-200-brm&scenario=<any>
```

- Light: grayscale "printed map" tiles; black route line; monochrome
  markers/popups/attribution.
- Dark: inverted dark grayscale tiles; white route line.
- Offline/failed tiles: page chrome stays monochrome and usable.

## 5. Language coverage (fonts, ro/en/ru)

Switch RO → EN → RU in the topbar: Romanian diacritics (ș ț ă â î) and
Cyrillic render in Literata/Inter, not a fallback mismatch (no obvious
font swap mid-word).

## 6. Contrast spot-check (SC-004, FR-013)

DevTools → element picker → check contrast ratio badge on: muted text on
paper, table header labels, popup text, warn chip (paper on ink). All ≥
AA. (Monochrome makes this pass by construction; verify muted shades.)

## 7. Print sanity (spec edge case)

Ctrl+P on the event page in light theme: clean black-on-white output, no
dark backgrounds bleeding ink.
