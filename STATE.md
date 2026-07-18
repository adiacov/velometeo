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

Feature 003 (monochrome e-reader restyle) is **implemented on branch
`003-monochrome-restyle`, awaiting owner review + merge**. Full spec-kit
cycle; all 12 tasks done, phase-gated with a commit per phase; 61 unit
tests green (added `tests/monochrome.test.js` guarding the invariant). The
whole site is strictly black-and-white in both themes: CSS tokens retargeted
to an ink/paper ladder (no hue, no gradients/blur/colored rings; shadows
only at hero, sticky table header, map markers); the 8 weather emoji + theme
toggle replaced by inline Lucide `currentColor` SVG (ISC) so icons always
contrast; ok/warn re-encoded without color (warn inverted, ok hairline);
grayscale/inverted OSM tiles with an ink route line; self-hosted OFL fonts
(Literata headings, Inter body) in `assets/fonts/` (latin/latin-ext/cyrillic,
zero third-party requests). Constitution VI's "study Delacau, don't redesign"
is deliberately superseded on the visual layer only (owner-approved
2026-07-17, recorded in the spec). Verified in both themes via headless-Chrome
screenshots (index/event/map, RO + RU Cyrillic, OS-dark = explicit-dark
parity, WCAG AA contrast). Next: owner review, then merge to `main`.

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

- Add the next real routes (the 300+200 brevet) via `tools/add_route.py` —
  first real-world test of the two-file promise (SC-003).
- Delacau URL story: DONE (2026-07-17) — the old
  `delacau-200-brm-weather-forecast` repo is archived; all its pages
  redirect to `event.html?event=delacau-200-brm` and its daily workflow
  was removed.
- Monochrome restyle (owner request 2026-07-17): DONE as feature 003 —
  implemented on `003-monochrome-restyle`, pending owner review + merge.
- Remaining optional follow-up from `specs/001-velometeo-mvp/parity-check.md`:
  GPX simplification option in `tools/add_route.py` (Pages serves .gpx
  uncompressed, 288 KB for Delacau). The weather icon/label follow-up is
  DONE (feature 002).

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
