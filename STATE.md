# STATE.md

Single canonical current-context entrypoint for this repository.

## Current status

Spec Kit flow completed through checklist on 2026-07-16 (branch
`001-velometeo-mvp`; Spec Kit v0.9.4 initialized, constitution v1.0.0
ratified). All planning artifacts exist; **no implementation code yet** —
by design, the owner reviews first.

## Active work

Owner review of the spec and plan before `/speckit-implement`.

## Next action

- Review, in order: `specs/001-velometeo-mvp/spec.md` (incl. Clarifications
  + Research Findings), `plan.md`, `research.md` (decisions D1–D12),
  `data-model.md`, `contracts/`, `tasks.md`, and the two checklists
  (`checklists/requirements.md` — 16/16; `checklists/review.md` — 5 open
  reviewer judgment calls: CHK006/011/019/024/028).
- After approval: run `/speckit-implement` (planned for Opus per the owner;
  planning was done by Fable). MVP checkpoint = tasks.md Phase 3 (US1).

## Blockers

- None. The 5 open checklist items are non-blocking judgment calls.

## Relevant deeper docs

Read these only when they are relevant to the current task or explicitly requested.
Keep this list limited to active work. Remove completed-work pointers when work is closed.

- `specs/001-velometeo-mvp/` — the full Spec Kit artifact set (see Next
  action for reading order).
- `PROJECT.md` — stable identity and hard constraints.
- `BRIEF.md` — conception history; its open questions are now resolved in
  spec Clarifications + research.md.
- `.specify/memory/constitution.md` — product non-negotiables (v1.0.0).
