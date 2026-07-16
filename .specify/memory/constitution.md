<!--
Sync Impact Report
- Version change: (template) → 1.0.0 (initial ratification)
- Modified principles: all placeholders replaced (initial adoption)
- Added sections: Core Principles (7), Additional Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gate compatible; no edits needed)
  - ✅ .specify/templates/spec-template.md (no constitution-specific sections required)
  - ✅ .specify/templates/tasks-template.md (no principle-driven task types beyond defaults)
- Follow-up TODOs: none
-->

# velometeo Constitution

## Core Principles

### I. Fully Static, Client-Side Only (NON-NEGOTIABLE)

The site MUST work as static files on GitHub Pages. No backend, no server-side
code, no API keys, no paid services, no build-time secrets. Anything that
cannot run in the visitor's browser is out of scope. Weather data MUST be
fetched client-side from Open-Meteo (free, keyless, CORS-enabled); providers
that require secret keys (e.g. AccuWeather) are excluded by architecture.

*Rationale: a static site is free to host, impossible to leak credentials
from, and trivially forkable — all three are product requirements.*

### II. Curated Routes Only

New events enter the repository exclusively as committed GPX + config by the
repository owner. The public site MUST NOT offer uploads, forms that write to
the repo, bots, or any user-generated content. Third parties get their own
routes by forking the repository.

*Rationale: keeps the site static (Principle I), removes moderation and
security burden, and makes documentation the distribution mechanism.*

### III. Two-File Route Addition (NON-NEGOTIABLE)

Adding a route MUST remain a two-file operation: drop a GPX into `routes/`
and add one config entry (name, gpx path, date, mode). It MUST NEVER require
touching HTML, CSS, or JavaScript. Route length is always derived from the
GPX, never stated in config. Checkpoints are optional: rendered when the GPX
contains waypoints, silently omitted otherwise.

*Rationale: this is the core generalization over the hardcoded Delacau
project and the primary usability promise to forkers.*

### IV. Fork-Friendly With First-Class Documentation

A stranger MUST be able to fork the repo, add their GPX + config, enable
GitHub Pages, and have a working site by following the README alone.
Documentation for forkers is a deliverable, not an afterthought; changes that
break the fork workflow are breaking changes.

*Rationale: forking is the only supported path for third-party routes
(Principle II), so the docs carry the product for that audience.*

### V. Honest Data

If a provider lacks a value (e.g. wind gusts), the UI MUST show a dash (`—`),
never an invented, interpolated-as-real, or silently substituted number.
Observed (archive) data MUST be clearly labeled as observed, never presented
as a forecast, and vice versa.

*Rationale: riders make safety-relevant decisions (clothing, wind exposure)
from these pages; inherited as a hard rule from the Delacau project.*

### VI. Mobile-First, Multilingual, Reused UX

Pages MUST be mobile-first and readable by a non-technical audience, with
light/dark theme and RO/EN/RU languages. The Delacau pages define the target
look and tone — study them, do not redesign. Technical notes belong at the
bottom of the page only. The Leaflet map behavior (route line, weather
markers positioned by time along the route, wind arrows) is part of the UX
specification.

*Rationale: the audience reads these pages on phones at 5 a.m. before a
brevet; the Delacau UX is validated with real riders.*

### VII. No Load-Bearing Scheduled Automation

`schedule:`-triggered GitHub Actions MUST NOT be load-bearing for the site.
GitHub's scheduled crons are best-effort (delayed, skipped, auto-disabled)
and already failed silently in the predecessor project. Manually triggered
(`workflow_dispatch`) Actions are acceptable. If a scheduled job is ever
truly required, it MUST have failure alerting.

*Rationale: fetching weather in the browser exists precisely to eliminate
the fragile daily-regeneration job; reintroducing one would regress the
architecture.*

## Additional Constraints

- Scenario modes are exactly two, chosen per route in config, never both on
  one page: `brevet` (official ACP time limits per distance) and `pace`
  (fixed average speeds × GPX-measured length).
- One config = one route = one page; a multi-route brevet is multiple
  configs. The index page lists all events, split Upcoming/Past, newest
  first within each group.
- Past events (event date passed) MUST switch to Open-Meteo's archive API
  and show actual observed weather, clearly labeled; pages become a
  permanent record instead of degrading.
- No accounts, tracking, live GPS following, or route planning/editing.
- The live Delacau page stays untouched until velometeo is ready to
  supersede it.

## Development Workflow

- Spec-driven: constitution → specify → clarify → plan → tasks → analyze →
  checklist precede implementation; the repo owner reviews spec and plan
  before any implementation begins.
- Delacau (`../delacau-200-brm-weather-forecast`) is the spec and parts bin,
  not the skeleton: reuse `style.css`, `theme.js`, `map.js` as candidates;
  read the Python generator for domain knowledge and reimplement in JS;
  never copy generated HTML.
- Repository instruction files (`AGENTS.md` → `WORKFLOWS.md`,
  `ENGINEERING.md`) govern agent behavior; this constitution governs the
  product's non-negotiables. On conflict about product scope, this
  constitution wins.

## Governance

This constitution supersedes ad-hoc practices for product scope and
architecture decisions. Amendments require: (1) an explicit decision by the
repository owner, (2) a version bump per semantic versioning (MAJOR:
principle removal/redefinition; MINOR: new principle or materially expanded
guidance; PATCH: clarifications), and (3) propagation to dependent templates
and docs. Every plan MUST pass the Constitution Check gate against these
principles; violations must be justified in the plan's Complexity Tracking
section or the design changed.

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
