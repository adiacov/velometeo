# Requirements Review Checklist: velometeo MVP

**Purpose**: pre-implementation review gate — validates the quality of the
requirements in [spec.md](../spec.md) / [plan.md](../plan.md) /
[tasks.md](../tasks.md), for the repo owner's review before
`/speckit-implement`.
**Created**: 2026-07-16 · **Depth**: standard · **Audience**: reviewer

Items checked `[x]` were verified against the artifacts during the
checklist pass; unchecked items are judgment calls left for the human
reviewer.

## Requirement Completeness

- [x] CHK001 Are all four event-config fields plus defaults fully enumerated, typed, and validated somewhere normative? [Completeness, contracts/routes-config.md]
- [x] CHK002 Are requirements defined for every event temporal state (waiting / forecast / recent-past / archive)? [Completeness, Spec FR-012..014, research D9]
- [x] CHK003 Are error-handling requirements defined for all external failure modes (API down, malformed GPX, unknown event id, broken manifest entry)? [Completeness, Spec FR-005/017, edge cases]
- [x] CHK004 Are persistence requirements (theme, language, model) each specified with default and scope? [Completeness, data-model Visitor preferences]
- [x] CHK005 Are the exact brevet band values specified per distance rather than left as adjectives? [Completeness, Spec FR-007 table]
- [ ] CHK006 Is the visual design specified beyond "match Delacau UX" — is that reference precise enough for a non-author implementer? [Gap — acceptable if the implementer can open the Delacau pages; confirm]

## Requirement Clarity

- [x] CHK007 Is "fast band must be realistic" made concrete (fixed table values, not a vague aspiration)? [Clarity, Spec FR-007]
- [x] CHK008 Is "positioned along the route" defined mathematically (constant scenario speed, interpolation on cumulative distance)? [Clarity, Spec FR-010 + data-model Scenario]
- [x] CHK009 Is "honest data" operationalized (null → `—`, no interpolation, provenance labels)? [Clarity, Spec FR-016, data-model WeatherPoint]
- [x] CHK010 Is "mobile-first" backed by at least one measurable criterion? [Clarity, SC-001 10 s; US1-AS2 no horizontal scroll]
- [ ] CHK011 Is "wind direction relative to travel" display format pinned down (arrow? head/tail/cross text? both)? [Ambiguity — data-model says head/tail/cross, map shows arrows; exact table presentation left to implementation. Confirm this freedom is intended]

## Requirement Consistency

- [x] CHK012 Do the recent-past window numbers agree across spec, research, and contracts after analyze remediation (7 days everywhere)? [Consistency]
- [x] CHK013 Does the forecast-horizon wording agree (model-dependent, not fixed 16) across spec US1-AS3, FR-014, D9? [Consistency]
- [x] CHK014 Does every artifact keep route length GPX-derived only (no length field anywhere in config contract)? [Consistency, FR-002 vs contracts/routes-config.md]
- [x] CHK015 Are the two scenario modes mutually exclusive in spec (FR-009), data model (Scenario.kind), and page design? [Consistency]
- [x] CHK016 Does the tasks file avoid any task that would touch the live Delacau repo (FR-028)? [Consistency]

## Acceptance Criteria Quality

- [x] CHK017 Does every user story have Given/When/Then scenarios and an independent test? [Coverage, Spec US1–US7]
- [x] CHK018 Are success criteria measurable and implementation-free (post-analyze SC-004 rewording included)? [Measurability, SC-001..008]
- [ ] CHK019 Is SC-003 ("under 5 minutes, first three real additions") verifiable before launch, or accepted as a post-launch metric? [Measurability — post-launch by design; confirm acceptable]

## Scenario & Edge Case Coverage

- [x] CHK020 Are midnight-crossing and multi-day scenarios covered by a requirement, not just an edge-case note? [Coverage, FR-023]
- [x] CHK021 Is the GPX-length vs standard-distance mismatch behavior specified with a threshold and a surface (curator warning)? [Edge Case, data-model Route; add_route contract]
- [x] CHK022 Is the event-in-progress (date = today) state assigned to a mode? [Edge Case, spec edge cases → forecast mode]
- [x] CHK023 Is zero/absent-waypoints behavior explicit (silent omission, markers unaffected)? [Edge Case, FR-003]
- [ ] CHK024 Is a zero-events or single-group index state (no past events yet) specified? [Gap — minor: index with an empty group; behavior implied but not stated. Decide: hide empty group vs show empty heading]

## Non-Functional & Dependencies

- [x] CHK025 Are external-dependency assumptions (Open-Meteo free tier, CORS, fair use) documented with verification dates? [Dependencies, spec Research Findings]
- [x] CHK026 Is the no-build-toolchain constraint traced from constitution to plan to structure (forker never runs npm)? [Dependencies, D1/D10]
- [x] CHK027 Are i18n scope boundaries clear (UI strings translated; event names verbatim)? [Clarity, data-model Event.name]
- [ ] CHK028 Are accessibility requirements beyond mobile readability (contrast in both themes, tap-target size) specified? [Gap — inherited implicitly from Delacau CSS; decide whether to make explicit]

## Outstanding for the reviewer

CHK006, CHK011, CHK019, CHK024, CHK028 — none block implementation; each is
either an accepted scope boundary or a small decision that can be made
during the relevant task.
