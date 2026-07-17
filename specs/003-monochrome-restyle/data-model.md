# Data Model: Monochrome E-Reader Restyle

No stored data changes. The "entities" are design tokens and static
assets. Weather data, config, GPX, and i18n structures are untouched
(except no i18n change is expected at all — toggle labels are already
`aria-label`-driven).

## Ink/paper token set (per theme)

| Token (existing name) | Light value | Dark value | Role |
|---|---|---|---|
| `--paper` (new) | `#ffffff` | `#111111` | page + surface base |
| `--ink` (new) | `#111111` | `#f5f5f5` | text, icons, route line |
| `--bg`, `--surface` | paper | paper / `#1a1a1a` raised | backgrounds |
| `--bg-soft`, `--surface-soft`, `--surface-tint` | ink @ 3–4% | ink @ 4–6% | zebra, soft panels |
| `--text` | ink | ink | primary text |
| `--muted` | ink @ 60% | ink @ 60% | secondary text (AA-safe) |
| `--muted2` | ink @ 45% | ink @ 45% | tertiary/labels (large text only) |
| `--border` | ink @ 16% | ink @ 18% | hairlines |
| `--line` | ink @ 9% | ink @ 10% | faint separators |
| `--accent`, `--accent-strong` | ink | ink | active/primary controls (now achromatic) |
| `--accent-soft` | ink @ 5% | ink @ 8% | hover fills |
| `--accent-ring` | ink @ 25% | ink @ 30% | legacy ring fallback (focus uses outline) |
| `--sky`, `--amber`, `--amber-bg`, `--amber-border` | remapped to ink/alpha ladder | same | legacy names, achromatic values |
| `--ok-bg` / `--ok-text` | paper / ink | paper / ink | ok = paper + hairline border |
| `--warn-bg` / `--warn-text` | ink / paper | ink / paper | warn = inverted |
| `--shadow` | black @ 16%, large blur | `none` | hero emphasis |
| `--soft-shadow` | `none` (kept only at 3 sites) | `none` | de-emphasized |

Invariant: **every color literal in `style.css` is achromatic**
(channel-equal or alpha over achromatic). Enforced by
`tests/monochrome.test.js` (research R7).

Both dark-theme selector paths (`:root[data-theme="dark"]` and
`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`)
carry identical values — sync is part of the invariant.

## Condition icon glyphs (research R2)

`assets/js/lib/weather-icons.js` — the `icon` field of each bucket changes
representation, nothing else:

| Bucket | Was (emoji) | Becomes (Lucide glyph, inline SVG string) |
|---|---|---|
| clear | ☀️ | `sun` |
| partlyCloudy | ⛅ | `cloud-sun` |
| overcast | ☁️ | `cloud` |
| fog | 🌫️ | `cloud-fog` |
| drizzle | 🌦️ | `cloud-drizzle` |
| rain | 🌧️ | `cloud-rain` |
| snow | 🌨️ | `cloud-snow` |
| thunderstorm | ⛈️ | `cloud-lightning` |

SVG string shape (identical attributes for all nine glyphs, toggle
included):

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em"
     fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">…paths…</svg>
```

Rules:

- `currentColor` only; no `fill` colors, no hardcoded stroke.
- `1em` sizing → inherits surrounding font-size (table 16px, marker 11px,
  popup 14px) with `vertical-align: -0.125em` via CSS.
- `aria-hidden="true"` on the SVG; accessibility text stays on the
  existing wrapper (`role="img"` + `aria-label` in the table, `title` in
  popup).
- Unknown/missing code → `weatherCondition()` returns `null` → dash/blank
  exactly as today (constitution V).
- Theme toggle (`theme.js`): same SVG shape, `sun` when showing light
  action, `moon` for dark; injected via `innerHTML` instead of
  `textContent`.

## Status encoding (research R3)

| State | Surface | Encoding |
|---|---|---|
| ok | `.status.ok`, `.weather-marker.ok`, hour cards | paper background, ink text/icons, 1px hairline border |
| warn | `.status.warn`, `.weather-marker.warn` | ink background, paper text/icons (inverted); no border needed |

Same rule in both themes (inversion flips with the theme automatically via
tokens). Marker border `2px solid #fff` → `2px solid var(--paper)`.

## Typefaces (research R5)

| Family | Files (woff2, `assets/fonts/`) | Subsets | Weights | Applied to |
|---|---|---|---|---|
| Literata | `literata-{latin,latin-ext,cyrillic}-{600,700}.woff2` | latin, latin-ext, cyrillic | 600, 700 | `h1 h2 h3`, `.subtitle` |
| Inter | `inter-{latin,latin-ext,cyrillic}-{400,700}.woff2` | latin, latin-ext, cyrillic | 400, 700 | `html` base (body, tables, controls) |

`@font-face` with `unicode-range` per subset + `font-display: swap`;
`OFL.txt` committed in `assets/fonts/`. Fallback stacks: headings
`Literata, Georgia, "Times New Roman", serif`; body keeps the existing
`Inter, ui-sans-serif, system-ui, …` stack (now actually resolving to
Inter). Intermediate weights (750/800/850/950 in current CSS) collapse to
700.
