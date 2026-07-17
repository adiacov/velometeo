# Tasks: Monochrome E-Reader Restyle

**Input**: Design documents from `/specs/003-monochrome-restyle/`

**Prerequisites**: plan.md, spec.md, research.md (R1–R7), data-model.md,
contracts/monochrome-ui.md, quickstart.md

**Tests**: Included — the spec makes the monochrome invariant executable
(SC-001/SC-002, research R7), so guard tests are written first and must
fail before the implementation turns them green.

**Organization**: Grouped by user story; US1+US2 are both P1 (US1 is the
page look, US2 removes the last colored pixels — the emoji), so the MVP
checkpoint is after Phase 4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (paper look), US2 (icons), US3 (status), US4 (fonts+map)

## Path Conventions

Flat static site at repo root: `assets/css/`, `assets/js/`, `assets/fonts/`
(new), `tests/`, page HTML at root. See plan.md Project Structure.

---

## Phase 1: Setup (guard tests first)

**Purpose**: Make the monochrome invariant executable before touching any
pixel, so every later task is verified by `npm test`.

- [ ] T001 Create tests/monochrome.test.js: parse assets/css/style.css and
      assert every color literal (hex, rgb/rgba, hsl, named) is achromatic
      (channel-equal or alpha over achromatic), assert zero `gradient(` and
      `backdrop-filter` occurrences, and assert
      assets/js/lib/weather-icons.js and assets/js/theme.js contain no
      emoji code points (research R7). Run `npm test` — the new file MUST
      fail against the current colored stylesheet; all 57 existing tests
      stay green.

---

## Phase 2: Foundational (token retarget — blocks all stories)

**Purpose**: The ink/paper palette every story's rules resolve against.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 In assets/css/style.css, add `--paper`/`--ink` and retarget the
      values of every existing custom property (`--bg` … `--soft-shadow`)
      to the achromatic ladder from data-model.md, identically in all
      three theme blocks (`:root`, `:root[data-theme="dark"]`, and the
      `@media (prefers-color-scheme: dark)` duplicate — keep them in
      byte-for-byte sync per spec edge case). Legacy names (`--sky`,
      `--amber*`, `--ok-*`, `--warn-*`) get their monochrome/inversion
      values here (R1, R3 tokens). Do not touch component rules yet.

**Checkpoint**: Site already renders mostly monochrome; guard test still
fails on hardcoded literals and effects.

---

## Phase 3: User Story 1 — Monochrome paper look on every page (P1) 🎯 MVP part 1

**Goal**: Strict ink/paper rendering on all three pages, both themes; flat
e-reader surfaces; shadows only at emphasis points; visible monochrome
focus.

**Independent Test**: quickstart.md §2 — open index/event/map in both
themes: zero hue anywhere except the (not yet replaced) emoji and map
tiles; `tests/monochrome.test.js` stylesheet assertions pass.

- [ ] T003 [US1] In assets/css/style.css remove/replace non-color effects:
      body radial-gradient → plain `var(--bg)`; hero linear-gradient →
      `var(--surface)`; delete the `.hero:before` colored stripe; delete
      `backdrop-filter` on `.lang a`/`.theme-toggle`; replace every
      colored `box-shadow: 0 0 0 …ring` with border/inversion styling;
      add `:focus-visible { outline: 2px solid var(--text);
      outline-offset: 2px }` for links, buttons, summaries (R6, FR-002,
      FR-011).
- [ ] T004 [US1] In assets/css/style.css sweep remaining hardcoded color
      literals in component rules: `#fff`/`#06201d`/`#061815` on active
      pills and buttons → `var(--paper)`/`var(--ink)` scheme; dark-theme
      zebra hexes `#1d2c44`/`#111827` → translucent-ink zebra tokens;
      `.weather-marker` border `#fff` → `var(--paper)` and its
      `rgba(0,0,0,…)` shadows to the neutral emphasis values; apply the
      shadow policy (light: hero + sticky `th` + markers only, all other
      `--soft-shadow` uses → none; dark blocks: shadows none, raised
      surface + hairline) (R1, R6, FR-004). Run `npm test`: stylesheet
      assertions of tests/monochrome.test.js now pass (emoji assertion
      still red until US2).

**Checkpoint**: Pages are flat ink-on-paper in both themes; only emoji and
map tiles still show color.

---

## Phase 4: User Story 2 — Monochrome icons that always contrast (P1) 🎯 MVP part 2

**Goal**: Zero colored emoji anywhere; all icons are `currentColor` inline
SVG that inherit surrounding text color on every surface.

**Independent Test**: quickstart.md §3 — table, mobile cards, map popup,
map markers, theme toggle all show single-color line glyphs in both
themes (including on inverted surfaces); full `npm test` green including
the emoji assertions.

- [ ] T005 [P] [US2] In assets/js/lib/weather-icons.js replace the eight
      emoji `icon` values with inline Lucide SVG strings (sun, cloud-sun,
      cloud, cloud-fog, cloud-drizzle, cloud-rain, cloud-snow,
      cloud-lightning) using the exact attribute shape from data-model.md
      (`viewBox="0 0 24 24"`, `width/height="1em"`, `fill="none"`,
      `stroke="currentColor"`, `aria-hidden="true"`); add the ISC license
      attribution to the file header. Extend tests/weather-icons.test.js:
      every bucket `icon` starts with `<svg`, contains `currentColor` and
      `aria-hidden`, and contains no code point above U+2000.
- [ ] T006 [P] [US2] In assets/js/theme.js replace the 🌙/☀️ toggle text
      with the Lucide moon/sun SVG strings via `innerHTML` (same attribute
      shape), keeping the existing aria-label/title behavior intact.
- [ ] T007 [US2] In assets/css/style.css add icon alignment rules:
      `td.cond svg, .weather-cell svg, .weather-marker svg,
      .weather-popup svg, .hour-card svg, .theme-toggle svg
      { vertical-align: -0.125em }` (adjust selectors to actual markup),
      verify sizing inherits correctly at table 16px / marker 11px /
      popup 14px, and confirm by reading assets/js/event-page.js and
      assets/js/map.js that no JS change is needed (icon already
      interpolated as HTML). Run `npm test` — everything green,
      including tests/monochrome.test.js emoji assertions.

**Checkpoint**: MVP complete — strictly monochrome site except map tiles;
US1+US2 independently verified. Good owner-review/screenshot point.

---

## Phase 5: User Story 3 — Status meaning survives without color (P2)

**Goal**: ok/warn distinguishable with zero color: warn inverted, ok paper
+ hairline, consistent across chips, cards, markers, both themes.

**Independent Test**: quickstart.md §2 status bullet — side-by-side ok vs
warn hour in table, mobile cards, and map markers; warn reads as the
stronger signal on a grayscale screen.

- [ ] T008 [US3] In assets/css/style.css apply the status encoding on top
      of the R3 tokens: `.status.ok` and `.weather-marker.ok` get
      `border: 1px solid var(--border)` on paper; verify `.status.warn` /
      `.weather-marker.warn` render inverted (ink bg, paper text/icons —
      icons inherit via currentColor from US2) in both themes; keep the
      2px `var(--paper)` marker outline from T004 so markers separate
      from tiles (FR-008).

**Checkpoint**: All safety-relevant signals readable without color.

---

## Phase 6: User Story 4 — E-reader typography and monochrome map (P3)

**Goal**: Self-hosted Literata (headings) + Inter (body) with ro/en/ru
coverage; grayscale "printed map" in light, inverted in dark; ink route
line.

**Independent Test**: quickstart.md §2 fonts bullet, §4 and §5 — no
third-party font requests, serif headings/sans body in all three
languages, grayscale tiles + ink route line in both themes.

- [ ] T009 [P] [US4] Create assets/fonts/: download Fontsource woff2 for
      Literata 600+700 and Inter 400+700 in latin, latin-ext, cyrillic
      subsets (12 files, ≈300–400 KB total) plus OFL.txt with both
      licenses; add `@font-face` rules with `unicode-range` per subset and
      `font-display: swap` to assets/css/style.css; apply
      `Literata, Georgia, "Times New Roman", serif` to `h1,h2,h3,.subtitle`,
      keep the body `Inter, ui-sans-serif, …` stack (now resolving);
      collapse nonstandard weights (750/800/850/950) to 700; add
      `<link rel="preload" as="font" type="font/woff2" crossorigin>` for
      the latin regular/bold files in index.html, event.html, map.html
      (R5, FR-010).
- [ ] T010 [P] [US4] In assets/css/style.css add map monochrome rules:
      `.leaflet-tile-pane { filter: grayscale(1) contrast(1.05) }` (light)
      and `grayscale(1) invert(1) brightness(.85) contrast(1.1)` in both
      dark selector paths; `.leaflet-overlay-pane path { stroke:
      var(--text) }` for the route line; restyle
      `.leaflet-popup-content-wrapper`, popup close button, and
      `.leaflet-control-attribution` (incl. `.leaflet-container a`) to
      paper/ink tokens (R4, FR-009). Verify assets/js/map.js needs no
      change.

**Checkpoint**: Full e-reader look complete on all pages.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T011 Full validation pass per specs/003-monochrome-restyle/quickstart.md:
      `npm test` (all green), both themes × three pages served locally,
      OS-derived vs explicit dark theme identical, focus traversal,
      contrast spot-checks (SC-004), print sanity, RO/EN/RU font
      rendering; screenshot event page (light + dark) for owner review
      per phase-gated workflow.
- [ ] T012 Update STATE.md (Active work → feature 003 status, Next action
      cleanup: remove the restyle backlog item) and record the
      constitution VI visual-layer supersession note; verify CLAUDE.md
      speckit pointer already targets specs/003-monochrome-restyle/plan.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately.
- **Foundational (Phase 2)**: after T001 — BLOCKS all stories.
- **US1 (Phase 3)**: after Phase 2. Sequential T003 → T004 (same file).
- **US2 (Phase 4)**: after Phase 2; independent of US1 (different files,
  except T007 in style.css — do T007 after T003/T004 if US1 done first).
- **US3 (Phase 5)**: after Phase 2 (tokens carry the inversion); visually
  meaningful once US1 landed.
- **US4 (Phase 6)**: after Phase 2; T009 ∥ T010 (different concerns,
  same stylesheet — coordinate edits).
- **Polish (Phase 7)**: after all stories.

### Parallel Opportunities

- T005 ∥ T006 (different JS files).
- T009 ∥ T010 conceptually parallel; in a single-agent run do them
  sequentially to avoid style.css conflicts.
- Single-agent recommended order: T001 → T002 → T003 → T004 → T005 →
  T006 → T007 → T008 → T009 → T010 → T011 → T012.

---

## Implementation Strategy

**MVP first**: Phases 1–4 (T001–T007) deliver the strictly monochrome
site (US1+US2, both P1). Stop, screenshot both themes, owner review —
per the phase-gated workflow (one phase → commit → stop applies at each
checkpoint; commit messages per phase like features 001/002).

**Incremental**: US3 (one task) then US4 (fonts+map) each independently
verifiable; polish closes with the full quickstart run and STATE.md
update.

**Risk notes**: the two dark-theme selector paths must stay in sync
(guard: eyeball + T011 dual-path check); font files are the only binary
assets — verify subsets actually cover ș/ț (latin-ext) and Cyrillic
before committing (T009).
