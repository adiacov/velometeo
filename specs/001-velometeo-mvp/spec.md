# Feature Specification: velometeo — weather along bicycle routes

**Feature Branch**: `001-velometeo-mvp`

**Created**: 2026-07-16

**Status**: Draft

**Input**: User description: "Config-driven static site showing weather along
bicycle routes positioned by rider pace scenarios, with brevet and pace modes,
live client-side Open-Meteo data, index page, i18n, and fork documentation"

## Overview

velometeo is a static, client-side web site (GitHub Pages) that shows the
expected weather **along a bicycle route**, positioned by where a rider will
be at each hour under several pace scenarios. One config entry + one GPX file
= one event page; an index page lists all events. It generalizes the one-off
Delacau 200 BRM page into a multi-route, config-driven product. Weather is
fetched in the visitor's browser, so forecasts are fresh on every page load
and no scheduled regeneration exists.

Decisions already made (see `PROJECT.md`, `BRIEF.md`, and the constitution)
are treated as fixed input, not re-opened here: fully static, curated routes
only, no AccuWeather, client-side fetch from Open-Meteo, two scenario modes,
fork-first distribution.

## Clarifications

### Session 2026-07-16

- Q: How are the fast/typical brevet bands defined (max is always the
  official ACP limit)? → A: A built-in per-distance table, tuned like
  Delacau's 200 km → 8 h / 10 h / 13:30 (see FR-007 for the full table).
- Q: Where does the ride start time come from (config has only a date)? →
  A: A required `start` field (HH:MM, event-local time) in every event
  config.
- Q: How do riders compare weather models for one event? → A: A single
  event page with a model switcher; the selected model drives ALL visuals
  (tables, map markers, wind arrows) at once and persists across pages and
  visits — mirroring Delacau's active-source behavior, where a chosen
  provider carries through every section and map without re-selection.

## Research Findings *(verified 2026-07-16)*

### ACP brevet time limits (authoritative)

Source: Audax Club Parisien, *Rules of Brevets Randonneurs Mondiaux* (January
2024 edition, official PDF from audax-club-parisien.com), Article 10:

> "Overall time limits vary for each brevet according to the distance. These
> are: (in hours and minutes, HH:MM) 13:30 for 200 KM, 20:00 for 300 KM,
> 27:00 for 400 KM, 40:00 for 600 KM, and 75:00 for 1000 KM."

| Distance | Max time | Implied min. avg speed |
|----------|----------|------------------------|
| 200 km   | 13:30    | ≈ 14.8 km/h            |
| 300 km   | 20:00    | 15.0 km/h              |
| 400 km   | 27:00    | ≈ 14.8 km/h            |
| 600 km   | 40:00    | 15.0 km/h              |
| 1000 km  | 75:00    | ≈ 13.3 km/h            |

Notes:

- The BRM rules cover 200–1000 km. **1200 km+ events (e.g.
  Paris–Brest–Paris, commonly 90:00) are a separate Randonneurs Mondiaux
  category**, not governed by this document. The product may include
  1200 → 90:00 as a conventional value but must label it as RM, not BRM.
- Article 10 also defines checkpoint opening speeds (34 km/h for km 1–200,
  32 km/h km 201–400, 30 km/h km 401–600, 28 km/h km 601–1000) and closing
  speeds (1 h + 20 km/h for km 1–60; 15 km/h km 61–600; 11.428 km/h
  km 601–1000) — relevant only if per-checkpoint times are ever displayed.
- A brevet distance is matched from the measured GPX length by rounding to
  the nearest standard distance (real routes are slightly longer than
  nominal, e.g. 207 km for a "200").

### Open-Meteo APIs (verified against live service and current docs)

- **Forecast API**: `https://api.open-meteo.com/v1/forecast`. Hourly
  variables include `temperature_2m`, `apparent_temperature`,
  `precipitation`, `precipitation_probability`, `wind_speed_10m`,
  `wind_direction_10m`, `wind_gusts_10m`, `weather_code`, `cloud_cover`.
  `forecast_days` up to 16 (default 7); `past_days` allows retrieving up to
  92 recent past days from the same endpoint. `timezone=auto` resolves
  coordinates to local time. Multiple coordinates per request are supported
  (comma-separated lists), reducing request counts.
- **Model selection**: `models=` parameter; relevant free models include
  ECMWF IFS (~9–25 km grid, 15-day horizon, 6-hourly updates), DWD ICON
  (~2–11 km, ~7.5-day horizon, 3-hourly updates), NOAA GFS (~3–25 km,
  16-day horizon, hourly updates). Default is "best match".
- **Historical (archive) API**:
  `https://archive-api.open-meteo.com/v1/archive`. Reanalysis data back to
  1940; **data lags real time by ~2 days (ECMWF IFS assimilation) to ~5 days
  (ERA5)**. Same hourly variable families (wind/temperature/precipitation).
- **Access policy**: both endpoints are free for non-commercial use, no API
  key. **CORS verified live on 2026-07-16**: both `api.open-meteo.com` and
  `archive-api.open-meteo.com` return `access-control-allow-origin: *` to a
  browser origin — the client-side architecture is confirmed viable.
- Fair-use limit: under 10,000 API calls/day for the free tier — far above
  expected traffic.

### Implication of the archive delay

Immediately after an event, the archive API has no data yet (2–5 day lag).
The forecast API's `past_days` parameter covers exactly this gap: a page for
an event 0–92 days in the past can use the forecast endpoint's recent-past
data until the archive has it. This resolves what would otherwise be a
broken transition window.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rider checks an upcoming event page (Priority: P1)

A rider opens the event page for an upcoming brevet on their phone. They see
the route on a map, the event date, and an hour-by-hour weather table for
several finish-time scenarios (e.g. fast / typical / maximum-time for their
brevet distance). Each scenario shows, for every hour of the ride, where on
the route the rider will be and the forecast weather at that place and time:
temperature, precipitation, wind speed/direction relative to the route, and
gusts. Weather markers with wind arrows appear along the route on the map.
The data is fetched fresh when the page opens.

**Why this priority**: this is the entire value proposition — weather
positioned along a route by pace scenario. Everything else supports it.

**Independent Test**: publish one route (Delacau 200 GPX, brevet mode) and
open its page in a browser before the event date; verify table and map render
live forecast data for all scenario bands without any server component.

**Acceptance Scenarios**:

1. **Given** a published event page for an upcoming event within the
   forecast horizon, **When** a visitor opens it, **Then** an hourly weather
   table for every pace scenario and a map with route, weather markers, and
   wind arrows render using data fetched during that page load.
2. **Given** the same page opened on a phone-sized screen, **When** the
   rider scrolls the table and map, **Then** all content is readable and
   usable without horizontal page scrolling.
3. **Given** an event more than the forecast horizon (~16 days) in the
   future, **When** a visitor opens the page, **Then** the page shows route,
   map, date, and scenarios with a clear message that the forecast becomes
   available N days before the event — never an error or invented data.
4. **Given** a weather provider returns no value for a field (e.g. gusts),
   **When** the table renders, **Then** the cell shows a dash (`—`).
5. **Given** the weather service is unreachable, **When** the page loads,
   **Then** the route and map still render with a clear, non-technical
   error message about weather being temporarily unavailable.

---

### User Story 2 - Visitor finds events on the index page (Priority: P2)

A visitor opens the site root and sees a minimal list of all events split
into Upcoming and Past, newest first within each group, each linking to its
event page.

**Why this priority**: with more than one route, discovery is required; the
index is also the fork's landing page.

**Independent Test**: with two or more configured events (one upcoming, one
past), open the site root and verify the split, ordering, and links.

**Acceptance Scenarios**:

1. **Given** configured events on both sides of today's date, **When** the
   index loads, **Then** upcoming events appear in one group and past events
   in another, each sorted newest-date-first, each entry linking to its page.
2. **Given** a new route was added as config + GPX only, **When** the site
   redeploys, **Then** the new event appears on the index without any
   HTML/CSS/JS edits.

---

### User Story 3 - Rider checks a past event's actual weather (Priority: P3)

After the event, the page permanently shows the **actual observed weather**
of event day (from the historical archive), clearly labeled as observed
rather than forecast. The page becomes a permanent record.

**Why this priority**: fixes a real defect of the predecessor (pages decayed
after event day); makes the site an archive, not just a countdown.

**Independent Test**: configure an event with a past date and verify the
page renders observed data with an "observed" label.

**Acceptance Scenarios**:

1. **Given** an event whose date is in the past, **When** its page loads,
   **Then** weather comes from historical/observed data and the page clearly
   labels it as actual observed weather of the event day.
2. **Given** an event that finished so recently that observed archive data
   is not yet available (≤ ~5 days), **When** the page loads, **Then** the
   page still shows the event-day weather using recent-past data, without
   error, labeled appropriately.

---

### User Story 4 - Training rides with pace scenarios (Priority: P4)

For a non-brevet route, the config sets `pace` mode; the page shows the
same weather-along-route view but with scenarios at fixed average speeds
(20 / 25 / 30 km/h) × route length measured from the GPX.

**Why this priority**: second of the two scenario modes; extends the site
from brevets to regular riding, but brevets are the founding use case.

**Independent Test**: add a training route config in pace mode and verify
scenario durations equal measured length ÷ each speed.

**Acceptance Scenarios**:

1. **Given** a route config in pace mode, **When** its page loads, **Then**
   exactly the pace scenarios (not brevet bands) appear, with durations
   derived from GPX-measured length at 20/25/30 km/h.
2. **Given** any route config, **When** modes are evaluated, **Then**
   exactly one mode's scenarios are shown — never both.

---

### User Story 5 - Multilingual, themed, provider-comparable pages (Priority: P5)

A rider switches the page between RO/EN/RU at runtime and between light and
dark theme; the choice persists across visits. Riders can compare at least
two forecast models (ECMWF and ICON) for the same event.

**Why this priority**: inherited UX promises of the Delacau page; the
audience is trilingual and rides at dawn/dusk (dark theme matters).

**Independent Test**: switch language and theme on an event page, reload,
verify persistence; switch provider and verify data changes accordingly.

**Acceptance Scenarios**:

1. **Given** any page, **When** the visitor selects a language (RO/EN/RU),
   **Then** all UI text switches at runtime and the choice persists on
   reload.
2. **Given** any page, **When** the visitor toggles light/dark, **Then** the
   theme applies immediately and persists.
3. **Given** an event page, **When** the visitor selects a different
   forecast model (ECMWF/ICON), **Then** the table and map show that model's
   data, labeled with the model name.

---

### User Story 6 - Curator adds a route in two files (Priority: P6)

The repo owner drops a GPX into `routes/`, adds one config entry (name, gpx
path, date, start time, mode), commits and pushes. The event page and index
entry exist
on next deploy. A helper script automates the copy/config/commit steps into
one command.

**Why this priority**: the operational promise that makes the product
config-driven; exercised every time a route is added, but only by curators.

**Independent Test**: perform the two-file addition on a fresh clone and
verify the event goes live with no HTML/CSS/JS edits.

**Acceptance Scenarios**:

1. **Given** a valid GPX and a config entry, **When** they are committed and
   the site redeploys, **Then** the event page renders and the index lists
   it — no other file was modified.
2. **Given** the GPX contains waypoints, **When** the event page renders,
   **Then** checkpoints are shown; **Given** it has none, **Then** the
   checkpoint display is silently omitted (weather markers are unaffected —
   they are positioned by time/distance along the track).
3. **Given** the helper script is run with a GPX path, name, date, start
   time, and mode,
   **When** it completes, **Then** the route file is in place and the config
   updated, ready to commit (or committed and pushed, per its options).

---

### User Story 7 - A stranger forks and runs their own instance (Priority: P7)

A cyclist elsewhere forks the repository, follows the README, replaces the
routes with their own GPX + config, enables GitHub Pages, and has a working
site — without reading any code.

**Why this priority**: forking is the only supported third-party path, and
documentation is a first-class deliverable — but it delivers nothing until
the product itself (P1–P6) works.

**Independent Test**: fresh fork by someone (or a clean simulation)
following only the README; site works with their route.

**Acceptance Scenarios**:

1. **Given** a fork with Pages enabled, **When** the forker follows the
   README's add-a-route steps, **Then** their event page and index work on
   their own GitHub Pages URL with no code changes.

---

### Edge Cases

- Event date is today (event in progress): the page is in forecast mode for
  the remaining hours; treat "past" as date < today in the event's local
  timezone.
- Event beyond the ~16-day forecast horizon: informative "forecast opens N
  days before" state (US1 scenario 3), map and scenarios still shown.
- Event finished < 5 days ago: archive not yet populated; use recent-past
  data from the forecast endpoint (US3 scenario 2).
- GPX has no waypoints: checkpoints omitted silently; never an error.
- Malformed/missing GPX or config entry: broken event must not take down
  the index; the index skips or flags it, other events still work.
- Weather API unreachable / rate-limited: route and map render; weather
  areas show a friendly unavailability message; no invented data.
- Route crosses midnight (long brevets: 300+ km start before dawn, finish
  after dark): hourly rows must carry day context, not just clock time.
- Multi-day events (600+ km up to 40–75 h): tables must remain usable for
  scenarios spanning several days.
- GPX length that doesn't match a standard brevet distance in brevet mode
  (e.g. 215 km): match to nearest standard distance; if wildly off (e.g.
  250 km), the mismatch must be visible to the curator, not silently wrong.
- A provider model lacks a variable entirely (e.g. no gust data): dash per
  honest-data principle.
- Very slow connections / phones: pages must stay lightweight (few requests,
  no heavy assets) — riders check them on cellular, sometimes mid-ride.

## Requirements *(mandatory)*

### Functional Requirements

**Route & config model**

- **FR-001**: The system MUST render one event page per config entry, where
  a config entry consists of: display name, GPX file reference, event date,
  start time (HH:MM, event-local — required), and scenario mode (`brevet`
  or `pace`).
- **FR-002**: The system MUST derive route length and geometry exclusively
  from the GPX track — never from config.
- **FR-003**: The system MUST display checkpoints when the GPX contains
  waypoints and silently omit them otherwise; weather-marker placement MUST
  be independent of checkpoints.
- **FR-004**: Adding a route MUST require only (a) adding a GPX file and
  (b) adding one config entry; the system MUST NOT require edits to any
  HTML/CSS/JS for a new route.
- **FR-005**: A malformed GPX or config entry MUST NOT break the index or
  other event pages.

**Scenarios**

- **FR-006**: In `brevet` mode, the system MUST derive the maximum-time
  scenario from the official ACP BRM limits (Article 10, Jan 2024): 200 km →
  13:30, 300 → 20:00, 400 → 27:00, 600 → 40:00, 1000 → 75:00, matching the
  nearest standard distance to the measured GPX length. 1200 km → 90:00 MAY
  be supported, labeled as Randonneurs Mondiaux (not BRM).
- **FR-007**: In `brevet` mode, the system MUST display three finish-time
  bands (fast / typical / maximum cutoff) from a built-in per-distance
  table; the maximum band is always the official limit. The table
  (fast ≈ 60%, typical ≈ 75% of the limit, rounded to rider-friendly
  hours; the 200 row is the proven Delacau trio):

  | Distance | Fast | Typical | Max (official) |
  |----------|------|---------|----------------|
  | 200 km   | 8 h  | 10 h    | 13:30          |
  | 300 km   | 12 h | 15 h    | 20:00          |
  | 400 km   | 16 h | 20 h    | 27:00          |
  | 600 km   | 24 h | 30 h    | 40:00          |
  | 1000 km  | 45 h | 56 h    | 75:00          |
  | 1200 km  | 54 h | 68 h    | 90:00 (RM)     |
- **FR-008**: In `pace` mode, the system MUST display scenarios at fixed
  average speeds of 20, 25, and 30 km/h over the GPX-measured length.
- **FR-009**: A page MUST show scenarios of exactly one mode, per config.
- **FR-010**: For each scenario and each hour of the ride, the system MUST
  compute the rider's position along the route (assuming constant average
  speed for that scenario) and obtain weather for that position at that hour.

**Weather data**

- **FR-011**: Weather MUST be fetched in the visitor's browser at page open;
  there MUST be no build-time or scheduled weather generation.
- **FR-012**: For upcoming events within the forecast horizon, the system
  MUST use Open-Meteo forecast data; at least the ECMWF and ICON models MUST
  be available for comparison, labeled by name. Model selection happens on
  the event page (single page per event, no per-model pages); the selected
  model MUST drive all visuals at once (tables, map markers, wind arrows)
  and MUST persist across pages and visits, like the theme choice.
- **FR-013**: For past events, the system MUST show actual observed weather
  for event day, clearly labeled as observed (not forecast); while archive
  data is not yet available (~5 days), it MUST fall back to recent-past data
  without error.
- **FR-014**: For events beyond the forecast horizon, the page MUST render
  route, map, date, and scenarios with a message stating when the forecast
  becomes available.
- **FR-015**: Displayed weather MUST include at least: temperature,
  apparent/feels-like temperature, precipitation, wind speed, wind
  direction (also expressed relative to the rider's direction of travel),
  and wind gusts.
- **FR-016**: Any value a provider does not supply MUST be rendered as a
  dash (`—`); the system MUST NOT interpolate, substitute, or invent values
  presented as real.
- **FR-017**: If weather fetching fails, the page MUST still render route,
  map, and scenario structure with a non-technical unavailability message.

**Pages & UX**

- **FR-018**: The site MUST provide an index page listing all events split
  Upcoming / Past, newest date first within each group, each linking to the
  event page.
- **FR-019**: Event pages MUST show a map with the route line, weather
  markers positioned along the route by scenario time, and wind direction
  arrows, matching the Delacau UX.
- **FR-020**: All pages MUST be mobile-first and usable by a non-technical
  audience; technical notes appear only at the bottom of the page.
- **FR-021**: All pages MUST support RO, EN, and RU at runtime with the
  selection persisted across visits.
- **FR-022**: All pages MUST support light and dark themes, persisted across
  visits, defaulting to the visitor's system preference.
- **FR-023**: Hourly rows MUST remain unambiguous across midnight and for
  multi-day scenarios (day context visible).

**Operations & distribution**

- **FR-024**: The site MUST function entirely as static files on GitHub
  Pages: no backend, no API keys, no paid services, no scheduled jobs.
- **FR-025**: The repository MUST include a helper script that performs a
  route addition (copy GPX, update config) as one command, usable by forkers.
- **FR-026**: The repository README MUST enable a stranger to fork, add
  their route, enable Pages, and get a working site without reading code.
- **FR-027**: The public site MUST NOT accept uploads or user-generated
  content of any kind.
- **FR-028**: The live Delacau page/repository MUST remain untouched by this
  work until velometeo is ready to supersede it.

### Key Entities

- **Event**: one curated ride page. Attributes: display name, GPX
  reference, date, start time, scenario mode. Derived: route
  geometry/length, upcoming/past status, brevet distance class (brevet
  mode).
- **Route (GPX)**: the track geometry (source of length and positions) and
  optional waypoints (checkpoints).
- **Scenario**: a labeled finish-time band (brevet) or average speed
  (pace); yields a total duration and a position-at-each-hour mapping.
- **Weather point**: weather values for one (position, hour) pair from one
  model, including its forecast-vs-observed provenance.
- **Provider/model**: a selectable weather model (ECMWF, ICON, …) with a
  display label.
- **Event index**: the derived list of all events with dates and links,
  split upcoming/past.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor on a phone can open an event page and read the
  weather for their scenario within 10 seconds on a typical mobile
  connection, with no interaction required.
- **SC-002**: Forecasts on an event page are never staler than the page
  load: 100% of page views fetch current provider data (no cached daily
  builds).
- **SC-003**: Adding a route takes the curator under 5 minutes and touches
  exactly two things (GPX file + config entry); zero code edits, verified
  over the first three real route additions.
- **SC-004**: The Delacau 200 event, recreated in velometeo, shows the same
  scenario structure and equivalent weather data as the original page
  (parity check by the curator).
- **SC-005**: Event pages remain correct after event day: 100% of past
  events display observed weather with an explicit "observed" label.
- **SC-006**: A person outside the project can fork and launch their own
  working instance following only the README, with no support requests
  needed (validated by at least one dry run).
- **SC-007**: No invented data ever appears: every missing provider value
  renders as a dash in 100% of cases.
- **SC-008**: All three languages and both themes are reachable within two
  taps from any page, and the choices persist across visits.

## Assumptions

- Open-Meteo remains free, keyless, and CORS-open for non-commercial use at
  current fair-use limits (~10k calls/day) — verified 2026-07-16; usage is
  expected to stay orders of magnitude below the limit.
- Riders assume constant average speed within a scenario; no
  elevation-adjusted or segment-based pacing in this product generation.
- "Past" vs "upcoming" is decided by the event date in the event's local
  timezone, compared to the visitor's current date.
- Brevet distance classes are matched by nearest standard distance to the
  measured GPX length; a large mismatch is surfaced to the curator.
- The Delacau UX (layout, tone, map behavior) is the design specification;
  no redesign is in scope.
- The default language before a visitor chooses one is Romanian (the
  primary audience), with EN/RU one tap away.
- Curator workflows beyond the helper script (workflow_dispatch form, manual
  edits) are documentation concerns, not product features, for this spec.
- The strava-routes and Delacau repos are available locally as reference
  material during implementation.
