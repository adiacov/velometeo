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

None — awaiting owner decisions to close the milestone.

## Next action

- Add the next real routes (the 300+200 brevet) via `tools/add_route.py` —
  first real-world test of the two-file promise (SC-003).
- Delacau URL story: DONE (2026-07-17) — the old
  `delacau-200-brm-weather-forecast` repo is archived; all its pages
  redirect to `event.html?event=delacau-200-brm` and its daily workflow
  was removed.
- Optional follow-ups recorded in `specs/001-velometeo-mvp/parity-check.md`:
  weather icon/label column (weather_code already fetched), GPX
  simplification option in `tools/add_route.py` (Pages serves .gpx
  uncompressed, 288 KB for Delacau).

## Blockers

- None.

## Relevant deeper docs

Read these only when they are relevant to the current task or explicitly requested.
Keep this list limited to active work. Remove completed-work pointers when work is closed.

- `specs/001-velometeo-mvp/` — spec, plan, research (D1–D12), contracts,
  tasks (all [X]), parity-check.md (T034/T035 report).
- `README.md` — forker-facing docs (fork → add route → enable Pages).
- `.specify/memory/constitution.md` — product non-negotiables (v1.0.0).
- `PROJECT.md` — stable identity and hard constraints.
