# STATE.md

Single canonical current-context entrypoint for this repository.

## Current status

MVP implemented, merged to `main` (fast-forward, 2026-07-16), and
deployed: all 10 phases (36 tasks) of `specs/001-velometeo-mvp/tasks.md`
complete, phase-gated with owner review after each phase.
**Live at https://adiacov.github.io/velometeo/** (Pages deploys from
`main`, root). 53 unit tests green (`npm test`). Post-plan UX
changes driven by owner feedback are recorded in git history (map moved to
a dedicated page Delacau-style, fit button removed, grouped topbar pills,
sections start folded, 27 km/h pace added, howto note, dictionary
cache revalidation).

## Active work

Feature 003 (monochrome e-reader restyle) is **DONE and merged to `main`
(fast-forward, 2026-07-18); deploying via Pages**. Full spec-kit cycle; all
12 tasks done, phase-gated with a commit per phase; 61 unit tests green
(added `tests/monochrome.test.js` guarding the invariant). The
whole site is strictly black-and-white in both themes: CSS tokens retargeted
to an ink/paper ladder (no hue, no gradients/blur/colored rings; shadows
only at hero, sticky table header, map markers); the 8 weather emoji + theme
toggle replaced by inline Lucide `currentColor` SVG (ISC) so icons always
contrast; ok/warn re-encoded without color (warn inverted, ok hairline);
self-hosted OFL fonts (Literata headings, Inter body) in `assets/fonts/`
(latin/latin-ext/cyrillic, zero third-party requests). Constitution VI's
"study Delacau, don't redesign" is deliberately superseded on the visual
layer only (owner-approved 2026-07-17, recorded in the spec).

Post-implementation owner feedback (2026-07-18) added map + pipeline
follow-ups on the same branch: (1) map basemap swapped from CSS-filtered OSM
to CARTO Positron (keyless minimal monochrome tiles) + a cased route line
(paper halo under ink line); (2) the map is now a single fixed **light**
"printed map" panel in BOTH page themes — a dark basemap made the near-black
weather markers/checkpoint buttons/zoom controls blend into the near-black
tiles, so map overlays are pinned to a fixed light scheme independent of the
page theme (always legible); (3) GPX simplification is now automatic in
`tools/add_route.py` (RDP ~5 m, default on; `--no-simplify` to skip) and
**idempotent** — a private `vm:simplified` marker on `<gpx>` means an
already-processed file is copied unchanged, never re-simplified. Delacau GPX
282→65 KB. Verified in both themes via headless-Chrome screenshots
(index/event/map, RO + RU Cyrillic, OS-dark = explicit-dark parity, WCAG AA
contrast). Live after the Pages deploy.

Feature 002 (weather condition icons) is DONE and merged to `main`
(fast-forward, 2026-07-17; full spec-kit cycle, all 9 tasks [X], 57 tests
green). Owner verified the live site on mobile 2026-07-17 — marker icons
look good, no revert needed. Emoji condition icon from `weather_code` in
four surfaces: table
(narrow icon-only column), mobile card header, map popup header, and — as
a separate revertable commit `fde0802` — the map markers themselves (2x2:
time+icon / temp+arrow). Shared mapping in `assets/js/lib/weather-icons.js`;
labels in ro/en/ru.

## Next action

- **Feature 004 — map legibility & polish: BRIEF ready, not yet specified.**
  Read `specs/004-map-legibility/BRIEF.md` and run the whole Spec Kit flow
  (specify → clarify → plan → tasks → phase-gated implement). Owner decisions
  are locked in the brief (single light map; fewer markers at wide zoom).
  Deferred out of 003 —
  - Labels vs route: route still overlaps some place names. Real fix is a
    layered basemap — CARTO `light_nolabels` base + `light_only_labels` on a
    top pane so labels draw *above* the route (route weight already trimmed
    to 3 in 003 as a stopgap).
  - Marker declutter at the "all hours" zoom (weather cards overlap).
  - Revisit whether a true dark map is wanted (003 uses one fixed light map
    panel in both themes because near-black markers/controls blended on a
    dark basemap).
  - Owner hint: some of this may be assistable by the upload/add-route
    script (e.g. route metadata), TBD when the feature is scoped.
- Add the next real routes (the 300+200 brevet) via `tools/add_route.py` —
  first real-world test of the two-file promise (SC-003).
- Delacau URL story: DONE (2026-07-17) — the old
  `delacau-200-brm-weather-forecast` repo is archived; all its pages
  redirect to `event.html?event=delacau-200-brm` and its daily workflow
  was removed.
- Monochrome restyle (owner request 2026-07-17): DONE as feature 003 —
  implemented on `003-monochrome-restyle`, pending owner review + merge.
- GPX simplification follow-up (`specs/001-velometeo-mvp/parity-check.md`):
  DONE (2026-07-18) — `tools/add_route.py --simplify` (RDP) added; Delacau
  GPX regenerated 282→65 KB. The weather icon/label follow-up is DONE
  (feature 002).

## Blockers

- None.

## Relevant deeper docs

Read these only when they are relevant to the current task or explicitly requested.
Keep this list limited to active work. Remove completed-work pointers when work is closed.

- `specs/003-monochrome-restyle/` — spec, plan, research (R1–R7), data
  model, contract, quickstart, tasks (all done) for the B&W restyle.
- `specs/002-weather-icons/` — spec, plan, research, contract, tasks
  (all [X]) for the condition-icon feature.
- `specs/001-velometeo-mvp/` — spec, plan, research (D1–D12), contracts,
  tasks (all [X]), parity-check.md (T034/T035 report).
- `README.md` — forker-facing docs (fork → add route → enable Pages).
- `.specify/memory/constitution.md` — product non-negotiables (v1.0.0).
- `PROJECT.md` — stable identity and hard constraints.
