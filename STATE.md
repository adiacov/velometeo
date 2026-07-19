# STATE.md

Single canonical current-context entrypoint for this repository.

## Current status

velometeo is **live at https://adiacov.github.io/velometeo/** (Pages
deploys from `main`, root) and current through **feature 005**. 63 unit
tests green (`npm test`). Features 001 (MVP) → 005 all shipped via the
spec-kit cycle, phase-gated with owner review per phase; each is merged
fast-forward to `main`. Full history in git log and the `specs/*/`
directories.

## Active work

**None in progress.** Last shipped: **feature 005 — single provider &
date-aware forecast** (merged ff to `main` 2026-07-18 at `da65619`;
deployed and verified on the live site). What it changed:
- **One provider (ECMWF).** The ECMWF/ICON model switcher is gone; a
  single `MODEL` constant. No model-selection UI or persisted preference.
- **Date-aware forecast.** Upcoming events show the forecast for the
  event day; **past events now show today's forecast** (page-load date)
  so a rider can repeat the route — the observed/archive data path is
  **deleted entirely**.
- **Status line** states provider + the exact forecast date + why
  (prepare for the event vs. ride it now), localized RO/EN/RU.
- Follow-ups same branch: a one-line note that each hour's weather is for
  the rider's real position along the route; a monochrome GitHub link in
  the footer of index + event pages.
- **Constitution amended to v1.1.0** (owner-approved): past-events rule
  changed from "archive/observed" to the target-date forecast.
- Verified: 63 tests + headless-Chrome against the **live** Delacau page
  (temps render, correct status line in all 3 languages, footer present).

## Next action

- Future improvement (owner, not yet scoped): make `tools/add_route.py`
  interactive — prompt for any missing argument (numbered choices /
  optional readline autocomplete) alongside the current flag-based path;
  must stay stdlib-only and non-TTY-safe. Revisit after seeing the tools
  in use post-004.
- Contribution path for others: explored and **dropped** (owner call,
  2026-07-18) — all variants were too complex or too compromised. Forking
  remains the only contribution path. Do not re-propose.

## Blockers

- None.

## Relevant deeper docs

Read these only when they are relevant to the current task or explicitly requested.
Keep this list limited to active work. Remove completed-work pointers when work is closed.

- `specs/005-single-provider-forecast/` — spec, plan, research (R1–R8),
  data model, contracts, quickstart, tasks (all done) for the latest
  feature.
- Earlier features: `specs/00{1,2,3,4}-*/` — all specs/tasks done; consult
  only if revisiting that area.
- `README.md` — forker-facing docs (fork → add route → enable Pages).
- `.specify/memory/constitution.md` — product non-negotiables (v1.1.0).
- `PROJECT.md` — stable identity and hard constraints.
