# Feature Specification: Single Provider & Date-Aware Forecast

**Feature Branch**: `005-single-provider-forecast`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "Single weather provider and date-aware forecast. (1) Keep only ECMWF as the weather model: remove the model switcher buttons section entirely; a single simple status line mentions the weather provider. (2) Future events: show the forecast for the event day (already works up to ECMWF's 15-day horizon; \"waiting\" note before that). Client-side fetch stays — no pipeline, no pre-generation. (3) Past events (event date before today): do NOT show observed/archive weather anymore — remove the archive API path entirely; instead show today's forecast (the date the page is loaded) positioned along the route with the same pace/brevet scenarios, so an enthusiast repeating the route knows current conditions. (4) The single status line (where the buttons section was, merging with the section above it) must clearly state the provider AND the date the forecast is for, and make the why obvious: future event → forecast for event day (prepare for the event); past event → forecast for today (ride the route now). All three languages RO/EN/RU. Owner decisions locked: one provider ECMWF, historical/observed data dropped, client-side fetch kept."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ride a past route today (Priority: P1)

A cyclist opens the page of an event whose date has passed (e.g. a brevet
held months ago) because they want to repeat the route now. Instead of a
historical record, the page shows the weather forecast for **the day they
open the page**, positioned along the route by the same pace/brevet
scenarios, so they can decide clothing, wind strategy, and timing for a
ride starting today.

**Why this priority**: This is the new core behavior and the biggest change
in what the product means: event pages stop being an archive and become a
permanently useful "ride this route" tool. It also removes an entire data
path (observed/archive weather).

**Independent Test**: Open the existing Delacau page (event date in the
past). The tables/cards/map show forecast data for the current date with
the event's start time applied to today, and no "observed weather" wording
appears anywhere on the site.

**Acceptance Scenarios**:

1. **Given** an event whose date is before today, **When** a visitor opens
   its page, **Then** all weather rows show the forecast for the current
   date (page-load date in the event's timezone), with scenario hours
   computed from the event's configured start time applied to today.
2. **Given** an event whose date is before today, **When** the page loads,
   **Then** no observed/archive weather is fetched or displayed, and no
   "observed"/"recorded" labeling appears.
3. **Given** a past event page open in any of RO/EN/RU, **When** the
   visitor reads the status line, **Then** it names the forecast date
   (today) and makes clear this is current weather for riding the route
   now, not the weather of the original event day.
4. **Given** a past event, **When** the visitor opens the map page for a
   scenario, **Then** markers/popups show the same today-forecast data and
   labeling as the event page.

---

### User Story 2 - One weather provider, no switcher (Priority: P2)

A visitor reads a forecast page and is never asked to choose between
weather models. The model-switcher buttons section is gone; a single simple
status line mentions the one provider (ECMWF) as the data source.

**Why this priority**: Removes a control that confused users (buttons that
sometimes changed nothing) and simplifies the page. Depends on nothing
else; delivers immediate UX value.

**Independent Test**: Open any event page and the map page: no model
selection buttons exist anywhere; the provider is mentioned exactly once
in the status line; weather data loads from the single provider.

**Acceptance Scenarios**:

1. **Given** any event page, **When** it loads, **Then** there is no model
   switcher UI and the status line names the provider.
2. **Given** a visitor who had previously selected the other model (saved
   preference from an earlier visit), **When** they open any event page,
   **Then** the page works normally with the single provider and no error
   or leftover choice appears.
3. **Given** the map page for any scenario, **When** it loads, **Then** it
   uses the same single provider and shows no model choice.

---

### User Story 3 - Always know which date the forecast is for (Priority: P3)

Every event page states, in one status line where the old status pill and
buttons sections were, (a) the weather provider and (b) the exact date the
displayed forecast is for — event day for upcoming events, today for past
events — phrased so the *why* is obvious: "prepare for the event" vs.
"ride the route now".

**Why this priority**: Transparency glue for stories 1–2. Without it a
past-event page silently showing today's weather would be misleading
(honest-data principle).

**Independent Test**: Check the status line on one upcoming-event page and
one past-event page in all three languages: each names the provider, an
explicit calendar date, and the correct rationale wording.

**Acceptance Scenarios**:

1. **Given** an upcoming event within the forecast horizon, **When** the
   page loads, **Then** the status line shows the provider and the event
   date as the forecast date, phrased as preparation for the event.
2. **Given** a past event, **When** the page loads, **Then** the status
   line shows the provider and today's date as the forecast date, phrased
   as current conditions for riding the route now.
3. **Given** any of the three languages is selected, **When** the status
   line renders, **Then** provider, date, and rationale wording appear
   correctly translated.

---

### Edge Cases

- **Event day itself**: event date equals today → treated as an upcoming
  event; forecast is for the event day (which is today); preparation
  wording applies.
- **Upcoming event beyond the forecast horizon** (more than ~15 days out):
  the existing "waiting, forecast available in N days" note remains, now
  computed for the single provider's horizon only.
- **Ride spanning past midnight**: a scenario starting today whose
  duration crosses into tomorrow must show rows for the following day,
  exactly as event-day scenarios already do.
- **Forecast fetch fails**: existing "weather unavailable" note remains;
  the status line still shows provider and target date; rows show dashes.
- **Saved model preference from before this change**: silently ignored;
  no migration prompt, no breakage.
- **Missing values** (e.g. gusts): dashes, as today. Note: since archive
  data is no longer used, precipitation probability (forecast-only field)
  is now available on all pages.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST use exactly one weather model (ECMWF) for all
  weather data; no model-selection UI exists on any page (event page and
  map page included).
- **FR-002**: For events whose date is today or later, the displayed
  forecast MUST target the event day, with scenario hours derived from the
  configured start time (unchanged behavior); if the event is beyond the
  provider's forecast horizon, the page MUST show the existing "waiting"
  note with days remaining.
- **FR-003**: For events whose date is before today, the displayed
  forecast MUST target the page-load date in the event's timezone:
  same route, same scenarios, event's configured start time applied to
  today's date.
- **FR-004**: Observed/archive weather MUST NOT be fetched or displayed
  anywhere; the archive data path and all "observed/recorded" provenance
  labeling are removed from the product.
- **FR-005**: Each event page MUST show a single status line — replacing
  both the previous status pill section and the model-buttons section —
  stating (a) the provider, (b) the explicit calendar date the forecast is
  for, and (c) rationale wording: preparation (upcoming event) or
  ride-the-route-now (past event).
- **FR-006**: The status line content (provider, date, rationale) MUST be
  available in all three languages (RO/EN/RU), with dates formatted per
  the active language.
- **FR-007**: The map page MUST follow the same single-provider and
  date-targeting rules and present consistent labeling with the event
  page.
- **FR-008**: A previously saved model preference MUST be ignored
  gracefully (no errors, no visible remnants).
- **FR-009**: Honest-data behavior is preserved: values a provider does
  not supply are shown as dashes, never invented.
- **FR-010**: The constitution MUST be amended (owner-approved) to remove
  the past-events-show-observed-weather constraint and record the new
  rule: past events show the current-day forecast, clearly dated.

### Key Entities

- **Event**: a configured route + date + start time + scenario mode; its
  temporal relation to "today" (upcoming vs. past) now selects the
  forecast target date, not the data source.
- **Forecast target date**: the calendar date the displayed weather is
  for — event day (upcoming) or page-load day (past). Drives fetch range,
  row timestamps, and the status line.
- **Status line**: the single provenance element per page: provider +
  target date + rationale wording, localized.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a past event's page, 100% of displayed weather rows are
  forecast data for the page-load date; zero occurrences of
  observed/recorded wording remain anywhere on the site.
- **SC-002**: No model-selection control exists on any page; the provider
  is named exactly once per page, in the status line.
- **SC-003**: In a 3-language check (RO/EN/RU) of one upcoming and one
  past event page, the status line names provider + explicit date +
  correct rationale in every combination (6/6).
- **SC-004**: Page weather appears within the same time budget as before
  the change (no additional round-trips; one fetch per page load).
- **SC-005**: All existing unit tests pass after removal of archive
  logic, and new tests cover the target-date rule (upcoming → event day,
  past → today, boundary: event day = today).

## Assumptions

- The event's configured start time is reused unchanged when projecting
  scenarios onto today's date for past events (a rider repeating the
  route is assumed to start at the same hour).
- The "waiting" state (event too far in the future) keeps its current
  behavior, now with the single provider's horizon.
- The "recent past" distinction (formerly: forecast API still serving
  just-finished events) becomes irrelevant — past events always use
  today's forecast.
- The index page's Upcoming/Past split is unaffected by this feature.
- Removing the second model is not a breaking change for forkers: no
  config field references models; README screenshots/text may need a
  minor refresh where the switcher is visible.
- Constitution amendment (FR-010) is a PATCH-or-MINOR version bump
  executed as part of this feature with explicit owner approval already
  given (2026-07-18 conversation).
