# Contract: Monochrome UI

The promises other code (and future features) can rely on after 003 ships.
Format mirrors `specs/002-weather-icons/contracts/`.

## `weatherCondition(code)` — unchanged signature, new icon representation

```js
import { weatherCondition } from './lib/weather-icons.js';
weatherCondition(61) // → { icon: '<svg …stroke="currentColor"…>…</svg>', labelKey: 'weather.rain' }
weatherCondition(999) // → null (never a substitute icon)
```

- `icon` is now an **inline SVG markup string**: starts with `<svg`,
  contains `stroke="currentColor"` and `aria-hidden="true"`, sized
  `1em × 1em`, contains no emoji code points and no color literals.
- Consumers interpolate it into HTML exactly as before
  (`event-page.js`, `map.js`); anyone using `textContent` would show
  markup — `icon` is HTML by contract, as it factually was for emoji-in-
  template-literals.
- The bucket set, code mapping, `labelKey` values, and null behavior are
  **unchanged** from the 002 contract.

## Stylesheet tokens

- `--paper` and `--ink` exist in `:root` for both themes; every other
  color token derives from them (see `data-model.md` for the ladder).
- Every color literal in `assets/css/style.css` is achromatic. No
  `gradient(`, no `backdrop-filter`, no colored box-shadow rings.
  Enforced by `tests/monochrome.test.js`.
- Status: `.status.warn` / `.weather-marker.warn` render inverted
  (ink bg, paper text); `.status.ok` / `.weather-marker.ok` render paper
  with hairline border. Both themes.
- Focus: every interactive element shows
  `outline: 2px solid var(--text); outline-offset: 2px` on
  `:focus-visible`.
- Shadows exist only at: hero (light theme), sticky table header (light
  theme), map markers. Dark theme has zero shadows.

## Map presentation

- `.leaflet-tile-pane` is filtered: light `grayscale(1) contrast(1.05)`;
  dark `grayscale(1) invert(1) brightness(.85) contrast(1.1)` (both
  dark-selector paths).
- Route polyline stroke follows `var(--text)` via CSS on
  `.leaflet-overlay-pane path`; `map.js` stays theme-unaware.
- Leaflet popup, close button, and attribution follow paper/ink tokens.

## Fonts

- `@font-face` families `Literata` and `Inter` are served from
  `assets/fonts/*.woff2` (latin, latin-ext, cyrillic; `font-display:
  swap`), licensed OFL (`assets/fonts/OFL.txt`). No page makes a font
  request to any third-party origin.

## Out of contract (unchanged)

- HTML structure, class names, responsive breakpoints, folding behavior,
  i18n keys, theme-toggle mechanics (`data-theme` + localStorage), wind
  arrow glyphs, Leaflet/OSM origins, route/config workflow.
