# Research: Monochrome E-Reader Restyle

All spec-level unknowns resolved. Numbered R1–R7; referenced from plan,
data-model, and tasks.

## R1 — Monochrome token strategy: retarget existing CSS variables

**Decision**: Keep every existing custom-property *name* in `style.css`
(`--bg`, `--text`, `--accent`, `--ok-bg`, `--warn-bg`, …) and retarget the
*values* to an ink/paper monochrome palette. Add two root tokens `--paper`
and `--ink` per theme; derive everything else from them (translucent ink
for muted/hairline/zebra/shadow). Delete rules that are effects, not
colors: body radial gradient, hero gradient + colored top stripe,
`backdrop-filter`, colored `--accent-ring` glows.

**Rationale**: Selectors and HTML never change — the diff stays reviewable
and the Delacau-derived structure (constitution VI) is untouched. Variables
that lose meaning (`--sky`, `--amber`) get achromatic values rather than
removal, so no rule can dangle.

**Alternatives considered**: A rewritten two-token stylesheet from scratch
(cleaner names, but redesigns structure and risks regressions across ~195
dense lines); `filter: grayscale(1)` on `<body>` (desaturates but keeps
muddy gray-greens, breaks `position: fixed` descendants, and is a hack, not
a design).

**Palette values** (channel-equal only):

- Light: paper `#ffffff`, ink `#111111`; muted `rgba(17,17,17,.60)`,
  muted2 `rgba(17,17,17,.45)`, hairline `rgba(17,17,17,.16)`, faint line
  `rgba(17,17,17,.09)`, zebra `rgba(17,17,17,.03)`, soft surface
  `rgba(17,17,17,.04)`, shadow `rgba(0,0,0,.10)` / `.16` at emphasis.
- Dark: paper `#111111`, ink `#f5f5f5`; same alpha ladder over white;
  emphasis via raised surface `#1a1a1a` + hairline `rgba(245,245,245,.18)`
  instead of shadows (invisible on black).
- Contrast: ink-on-paper ≈ 18.9:1; muted (.60 over white ≈ `#6f6f6f`)
  ≈ 5.3:1 — WCAG AA holds for all text tokens (FR-013). Dark-theme
  duplicated selector blocks (`[data-theme="dark"]` and
  `@media (prefers-color-scheme: dark)`) must both be retargeted (spec
  edge case).

## R2 — Icon replacement: inline Lucide SVG strings behind the existing mapping

**Decision**: Replace the emoji `icon` values in
`assets/js/lib/weather-icons.js` with inline SVG markup strings (24×24
viewBox, `fill="none" stroke="currentColor" stroke-width="2"`, sized
`width="1em" height="1em"`), taken from **Lucide** (ISC license):
`sun`, `cloud-sun`, `cloud`, `cloud-fog`, `cloud-drizzle`, `cloud-rain`,
`cloud-snow`, `cloud-lightning` for the eight buckets; `sun`/`moon` for the
theme toggle in `theme.js` (switched to `innerHTML`). License recorded in
the source header comment.

**Rationale**: Colored emoji ignore CSS `color` — strict monochrome is
impossible with them (Android also ignores the U+FE0E text-presentation
hint, and fog/drizzle/snow-shower have no text glyph at all).
`currentColor` SVG inherits the surrounding text color, so contrast on
paper, inverted, and marker surfaces is structural (spec US2), in both
themes, on every platform. All four render surfaces already interpolate
`cond.icon` into HTML template literals (`event-page.js:61,78`,
`map.js:45,59-61`), so SVG strings drop in without logic changes; the
`role="img"`/`title`/`aria-label` wrapper in the table survives as-is.
Existing tests (`icon.length > 0`) stay green. Lucide is the actively
maintained Feather successor with the most consistent stroke geometry.

**Alternatives considered**: Unicode text-presentation glyphs (☀︎ ☁︎) —
incomplete coverage, platform-dependent, rejected; `filter: grayscale(1)`
on emoji — muddy grays, not crisp ink, rejected; icon font (Erik Flowers
weather-icons) — extra font file, FOUT on icons, dated set, rejected;
Tabler/Phosphor — equivalent, Lucide chosen for stroke consistency and ISC
license. A `lucide` npm/CDN dependency — violates constitution I
(self-contained static files); we inline the 9 needed glyphs instead.

## R3 — Status without color: inversion vs hairline

**Decision**: `warn` = inverted chip/marker (ink background, paper text and
icons); `ok` = paper background, regular ink, 1px hairline border. Applied
via the existing `--ok-bg/--ok-text/--warn-bg/--warn-text` tokens plus a
border rule on `.status.ok` and `.weather-marker.ok`. The white marker
border (`.weather-marker{border:2px solid #fff}`) becomes theme-aware paper
so it works on dark.

**Rationale**: Owner-approved (2026-07-17). Inversion is the strongest
achromatic signal — reads instantly on grayscale/e-ink (SC-003) and
naturally makes warn the louder state. Encoding purely by border weight or
dashing is too subtle at marker size on a phone.

**Alternatives considered**: dashed vs solid borders (too subtle),
bold/underline text (invisible at map-marker size), pattern fills
(hatching — visually noisy, anti-minimalist).

## R4 — Map: CSS filters on tiles, ink route line

**Decision**: Filter the Leaflet tile pane with
`.leaflet-tile-pane { filter: grayscale(1) contrast(1.05) }` in light
theme; dark theme uses
`filter: grayscale(1) invert(1) brightness(.85) contrast(1.1)`
(scoped via the same two dark-theme selector paths as the rest of the
stylesheet). Route polyline color comes from a CSS-driven value: set the
polyline to `var(--ink)` equivalent by reading the computed style or simply
styling the SVG path via CSS (`.leaflet-overlay-pane path { stroke: var(--text) }`).
Popup wrapper, close button, and attribution links restyled to
paper/ink (`.leaflet-container a { color: var(--text) }`).

**Rationale**: Standard, well-proven Leaflet monochrome/dark technique;
zero new dependencies or tile sources (constitution I), fully reversible.
Styling the overlay path via CSS keeps `map.js` free of theme logic.

**Alternatives considered**: A grayscale tile provider (Stamen Toner,
Carto) — new third-party origin, availability risk, rejected;
canvas-recoloring tiles in JS — complexity for no gain, rejected.

## R5 — Typography: self-hosted Literata + Inter (OFL), three subsets

**Decision**: Self-host **Literata** (headings: `h1`, `h2`, `h3`, hero
subtitle) and **Inter** (body, tables, controls) as static woff2 files in
`assets/fonts/`, subsets **latin, latin-ext, cyrillic** (Romanian
diacritics + Russian), obtained as woff2 from the Fontsource distribution
(both OFL; `OFL.txt` committed alongside). Weights: Literata 600 (+700
optional), Inter 400 + 700 — regular/bold static files, no variable fonts.
Loaded via `@font-face` with `font-display: swap` and `<link rel="preload">`
in the three HTML heads; font stacks keep the current system fallbacks
(`Georgia, serif` for headings, existing `ui-sans-serif` stack for body).

**Rationale**: Literata is Google's e-book serif designed for e-ink
screens — exactly the requested aesthetic; Inter is already named (but
never loaded) in the CSS, so it becomes real. Self-hosting satisfies
constitution I and SC-005 (no new origins). Static weights in three
subsets keep total payload ≈ 300–400 KB with per-script unicode-range so
browsers fetch only what the page language needs.

**Alternatives considered**: Google Fonts CDN — external origin, rejected
(constitution I / SC-005); variable fonts — larger single files, overkill
for 2 weights; IBM Plex Sans — fine, but Inter is already the declared
intent of the stylesheet; system fonts only — free, but the owner asked
for a deliberate, pleasant e-reader typography.

## R6 — Emphasis shadows and focus rings

**Decision**: Light theme keeps exactly three shadow sites: hero
(`--shadow`), sticky table header (small y-offset drop), and map markers
(existing marker shadow, neutralized to pure black alpha). All other
`--soft-shadow` usages become `none`. Dark theme: shadows set to `none`;
emphasis via raised surface (`#1a1a1a`) + hairline. Focus:
`:focus-visible { outline: 2px solid var(--text); outline-offset: 2px }`
replaces all colored `--accent-ring` box-shadow rings (FR-011); the ring
token itself becomes translucent ink so any missed usage degrades safely.

**Rationale**: Matches the owner's "shadows at important places" brief
while keeping the page flat and paper-like; visible monochrome focus keeps
WCAG 2.4.7 without color.

**Alternatives considered**: Keeping all current shadows in gray (too
soft/cloudy, not minimalist); borders-only everywhere (loses the requested
emphasis).

## R7 — Guarding the invariant: monochrome stylesheet test

**Decision**: Add `tests/monochrome.test.js`: parse `assets/css/style.css`,
extract every color literal (hex, rgb/rgba, hsl, named), and assert each is
achromatic (R=G=B, or alpha-only over an achromatic base); additionally
assert the absence of `gradient(`, `backdrop-filter`, and emoji ranges in
`weather-icons.js`/`theme.js`. Extend `weather-icons.test.js`: every
`icon` starts with `<svg`, contains `currentColor`, and contains no
code point above U+2000 (no emoji).

**Rationale**: SC-001/SC-002 become executable instead of eyeball-only;
future edits can't silently reintroduce color.

**Alternatives considered**: Screenshot-diff tooling — heavy for a
no-build static repo; manual review only — doesn't survive future
features.
