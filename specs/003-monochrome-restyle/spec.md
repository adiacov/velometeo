# Feature Specification: Monochrome E-Reader Restyle

**Feature Branch**: `003-monochrome-restyle`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "Restyle the entire site (index, event, map pages) into a strictly black-and-white, super-minimalist visual language inspired by e-readers/e-ink devices. Both light (white paper, black ink) and dark (near-black paper, white ink) themes kept. No color anywhere. All icons monochrome and always contrasted against their background. Soft shadows only at a few emphasis points. Pleasant free typography. Layout and structure stay as-is."

## Constitution note

Constitution principle VI names the Delacau stylesheet as the UX
specification. This feature **deliberately supersedes Delacau on the visual
layer only** (colors, shadows, icon rendering, typography), at the owner's
explicit request (2026-07-17). Layout, structure, information hierarchy,
component behavior, and responsive breakpoints remain governed by the
Delacau-derived structure. This deviation is owner-approved and recorded
here as the new visual baseline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monochrome paper look on every page (Priority: P1)

A rider opens any page of the site (event list, event forecast, route map)
in either theme and sees a strictly black-and-white "e-reader page": white
(or near-black) paper, black (or white) ink, hairline separators, generous
whitespace, no colored element anywhere — no teal, amber, green, blue,
no gradients, no blur effects, no colored glows.

**Why this priority**: This is the feature itself — the visual identity
change. Without it nothing else matters.

**Independent Test**: Open each page in both themes and verify by
inspection (and by an automated color audit of the stylesheet) that every
rendered color is white, black, or a translucent/gray shade of them.

**Acceptance Scenarios**:

1. **Given** the light theme, **When** any page renders, **Then** every
   background is white/paper, every text is black ink, and separators are
   translucent ink — no hue anywhere.
2. **Given** the dark theme, **When** any page renders, **Then** paper is
   near-black, ink is white, and contrast relationships mirror the light
   theme.
3. **Given** any page in either theme, **When** inspecting elements that
   previously used accent/status colors (pills, active language link,
   source switcher, map button, status chips), **Then** they are styled
   with ink/paper/hairline/inversion only and remain clearly
   distinguishable.
4. **Given** the emphasis points (hero, sticky table header, map markers),
   **When** viewed in light theme, **Then** a soft neutral shadow sets them
   apart; **When** viewed in dark theme, **Then** a lighter surface plus
   hairline provides the same emphasis (shadows are invisible on black).

---

### User Story 2 - Monochrome icons that always contrast (Priority: P1)

A rider sees the weather condition icons (table column, mobile cards, map
popups, map markers) and the theme toggle icon rendered as crisp
monochrome glyphs that always contrast with whatever surface they sit on:
never white-on-white, never black-on-black, and never rendered by the
platform as a colored emoji.

**Why this priority**: Colored emoji are the one element CSS cannot
recolor; without replacing them the site can never be strictly
monochrome. Contrast is a hard owner requirement.

**Independent Test**: View all icon surfaces (table, cards, popup,
markers, theme toggle) in both themes on desktop and mobile; every icon
is a single-color glyph matching the surrounding text color.

**Acceptance Scenarios**:

1. **Given** any weather condition in the forecast table, mobile card,
   map popup, or map marker, **When** it renders in either theme, **Then**
   the condition icon is a monochrome vector glyph that inherits the
   surrounding text color.
2. **Given** an inverted surface (e.g., a warn marker with ink
   background), **When** an icon renders on it, **Then** the icon is paper
   colored — contrast is automatic, not hand-tuned per case.
3. **Given** the theme toggle, **When** it renders, **Then** its sun/moon
   indicator is monochrome in both themes.
4. **Given** a platform that renders emoji in color (Android, iOS,
   Windows), **When** any page renders, **Then** no colored emoji appears
   anywhere (wind arrows, which are plain text glyphs, remain).

---

### User Story 3 - Status meaning survives without color (Priority: P2)

A rider distinguishes "ok" from "warn" hours (status chips in the table
and cards, weather markers on the map) without any color cue: warn is
inverted (ink background, paper text), ok is plain paper with a hairline
border.

**Why this priority**: Green/amber currently carry meaning; monochrome
must re-encode it or the forecast loses its most actionable signal.

**Independent Test**: Compare an ok hour and a warn hour side by side in
table, cards, and map in both themes; the two states are instantly
distinguishable and the warn state reads as the stronger signal.

**Acceptance Scenarios**:

1. **Given** a warn-status hour, **When** its chip or marker renders,
   **Then** it appears inverted (ink background, paper text/icons) in
   both themes.
2. **Given** an ok-status hour, **When** its chip or marker renders,
   **Then** it appears as paper with a hairline border and regular ink.
3. **Given** a grayscale-only display (e-reader), **When** the page
   renders, **Then** ok and warn remain distinguishable.

---

### User Story 4 - E-reader typography and monochrome map (Priority: P3)

A rider reads the site set in pleasant, book-like free typography
(a serif designed for e-ink screens for headings, a clean sans for data),
and the route map renders as a grayscale "printed map" with a monochrome
route line, consistent with the rest of the page in both themes.

**Why this priority**: Completes the e-reader feel; valuable polish but
the site is already monochrome and functional without it.

**Independent Test**: Load pages with network inspector open — headings
and body render in the self-hosted fonts with no third-party font
requests; the map page shows grayscale tiles in light theme and inverted
grayscale in dark theme.

**Acceptance Scenarios**:

1. **Given** any page, **When** fonts load, **Then** headings use the
   e-book serif and body/data use the sans, both served from this site
   (no third-party requests), with readable system fallbacks before load.
2. **Given** the map page in light theme, **When** tiles render, **Then**
   they appear grayscale with adequate contrast; **Given** dark theme,
   **Then** tiles appear as an inverted (dark) grayscale map.
3. **Given** the route line on the map, **When** it renders, **Then** it
   is ink-colored (black on light, white on dark) and clearly visible
   over the tiles.

---

### Edge Cases

- Icon glyph fails to load or a weather code is unknown: the existing
  "honest data" rule holds — show nothing rather than a substitute icon.
- Fonts blocked or slow: system fallback fonts must keep layout stable
  and readable (no invisible text).
- Forced-colors / high-contrast OS mode: the design must not fight it;
  ink/paper tokens should degrade gracefully.
- User has theme set to "dark" while OS is light (and vice versa): both
  explicit and OS-derived theme paths must produce identical monochrome
  palettes (the stylesheet currently duplicates dark rules in two
  selector forms — both must stay in sync).
- Printing a page: monochrome design should print cleanly on paper by
  construction.
- Map tiles unavailable/offline: page chrome remains monochrome and
  usable; no colored fallback appears.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every rendered surface, text, border, separator, shadow,
  and interactive state on all three pages MUST use only paper (white /
  near-black), ink (black / white), or translucent shades of ink — no
  hue in either theme.
- **FR-002**: Gradients, backdrop blur, colored glow rings, and the
  colored hero top-stripe MUST be removed.
- **FR-003**: Both themes MUST be kept, selectable exactly as today
  (explicit toggle overriding OS preference), with the monochrome
  palette applied identically through both the explicit and OS-derived
  dark-theme paths.
- **FR-004**: Soft neutral shadows MUST appear only at designated
  emphasis points (hero, sticky table header, map markers) in light
  theme; dark theme MUST express the same emphasis via lighter surface
  plus hairline instead of shadows.
- **FR-005**: All eight weather-condition icons and the theme-toggle
  icon MUST be replaced by monochrome vector glyphs that inherit the
  current text color, guaranteeing contrast on any surface (paper,
  inverted, marker) in both themes; no colored emoji may remain anywhere
  on the site. Wind direction arrows (plain text glyphs) remain as-is.
- **FR-006**: Replacement icons MUST come from (or be drawn in the style
  of) a free, permissively licensed monochrome icon set, with license
  compatibility recorded.
- **FR-007**: The shared one-mapping rule from feature 002 holds: table,
  cards, map popup, and markers MUST all derive the condition icon from
  the same single mapping; unknown codes still show nothing.
- **FR-008**: Ok/warn status MUST be encoded without color: warn =
  inverted (ink background, paper text), ok = paper with hairline
  border; applied consistently to status chips, hour cards, and map
  markers in both themes.
- **FR-009**: Map tiles MUST render grayscale in light theme and
  inverted grayscale in dark theme; the route line MUST be ink-colored
  per theme; map popups and attribution MUST follow the monochrome
  palette.
- **FR-010**: Headings MUST use a free (OFL) serif designed for e-ink
  reading; body and data MUST use a free (OFL) sans; both self-hosted
  from this site with no third-party font requests and with system-font
  fallbacks.
- **FR-011**: Keyboard focus MUST remain clearly visible on every
  interactive element via an ink/paper ring or equivalent monochrome
  treatment.
- **FR-012**: Layout, structure, spacing system, responsive breakpoints,
  folding behavior, and page composition MUST NOT change; this feature
  touches only the visual layer.
- **FR-013**: All text/background combinations MUST meet WCAG AA
  contrast in both themes (monochrome makes this achievable by
  construction; muted ink shades must stay above threshold).

### Key Entities

- **Design tokens (ink/paper palette)**: the two-token system (paper,
  ink) plus derived translucent shades (muted text, hairline, zebra,
  shadow); one set per theme.
- **Condition icon glyph**: monochrome vector representation of one of
  the eight weather condition buckets; inherits surrounding text color;
  replaces the emoji in the existing shared mapping.
- **Status encoding**: the non-color visual rule (inverted vs hairline)
  applied to ok/warn wherever status appears.
- **Typefaces**: two self-hosted free font families (e-book serif for
  headings, sans for body/data) with fallback stacks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An automated audit of the stylesheet and rendered pages
  finds zero chromatic colors (every color channel-equal or fully
  transparent) in both themes.
- **SC-002**: 100% of icon occurrences (weather icons across four
  surfaces, theme toggle) render as monochrome glyphs on Android, iOS,
  and desktop — zero colored emoji sightings.
- **SC-003**: Ok vs warn hours are correctly identified by a viewer on a
  grayscale screen at a glance (side-by-side distinguishability in
  table, cards, and map, both themes).
- **SC-004**: All text/background pairs pass WCAG AA contrast in both
  themes.
- **SC-005**: Pages load no third-party requests beyond the existing
  Leaflet CDN and OSM tiles — fonts and icons add zero new external
  origins.
- **SC-006**: All existing unit tests keep passing; the shared
  weather-code mapping still resolves the same buckets.
- **SC-007**: The owner signs off that the result looks "e-reader like":
  minimalist, black-and-white, visually pleasant, in both themes.

## Assumptions

- Owner-approved research decisions (2026-07-17) are baked in:
  translucent-ink grays count as monochrome (like e-ink dithering);
  warn = inversion; Literata-class e-book serif + Inter-class sans;
  grayscale-filtered OSM tiles.
- "Strictly black and white" permits neutral grays (channel-equal
  colors) for muted text, hairlines, shadows, and map tiles — pure hues
  are what is forbidden.
- The Leaflet CDN dependency and OSM tile source stay as-is; only their
  presentation changes.
- The wind-arrow text glyphs and the collapse chevron are already
  monochrome text and are out of scope beyond verifying contrast.
- No new pages, content, or behavior; i18n strings unaffected except any
  label tied to the theme toggle if its glyph changes form.
- E-reader devices are an aesthetic reference, not a supported target
  platform; no e-ink-specific testing infrastructure is required.
