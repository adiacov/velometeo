# Feature Specification: Weather Condition Icons

**Feature Branch**: `002-weather-icons`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "Weather condition icons: show a weather-condition icon (emoji, derived from the already-fetched Open-Meteo weather_code) in three places: (1) the event-page forecast table as a new narrow icon-only column; (2) the mobile card rendering of the forecast; (3) the map marker popup. Map markers themselves stay untouched. Minimalism-first visual design; no new API calls."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conditions at a glance in the forecast table (Priority: P1)

A rider planning a brevet opens an event page and scans the hour-by-hour
forecast table. Today they must mentally combine precipitation millimetres,
probability, and cloud-related intuition to guess "what will it be like".
With this feature, each forecast row shows a single small weather-condition
icon (clear, cloudy, rain, snow, …) so the overall character of each hour is
readable instantly, without interpreting numbers.

**Why this priority**: The table is the primary forecast surface of the site;
this is where the icon delivers most of its value.

**Independent Test**: Open any event page with a loaded forecast and confirm
every table row shows a condition icon that matches the hour's weather code,
with a readable textual label available (hover/assistive tech).

**Acceptance Scenarios**:

1. **Given** a loaded forecast, **When** the table renders, **Then** each row
   contains a condition icon in a dedicated narrow column, and the table's
   overall width and readability are not noticeably degraded.
2. **Given** a rendered icon, **When** the user hovers it (or uses assistive
   technology), **Then** a textual condition label in the current site
   language is available.
3. **Given** an hour whose weather code is missing or unknown, **When** the
   table renders, **Then** the icon cell shows the site's standard
   "no data" dash instead of a wrong icon.

---

### User Story 2 - Conditions in the mobile card view (Priority: P2)

On a narrow screen the forecast table is rendered as stacked cards. The same
condition icon appears in each card's header line, so mobile users get the
same at-a-glance value without any extra card height or clutter.

**Why this priority**: Mobile is a major usage context for riders checking
weather on the road, but it reuses the same data and mapping as P1.

**Independent Test**: Load an event page at a narrow viewport and confirm
each forecast card header shows the condition icon without increasing the
card's size beyond the icon's own width.

**Acceptance Scenarios**:

1. **Given** a narrow viewport, **When** forecast cards render, **Then** each
   card header line includes the condition icon and the card layout is
   otherwise unchanged.

---

### User Story 3 - Conditions in the map popup (Priority: P3)

When a user taps a weather marker on the route map, the popup that opens
shows the condition icon appended to its existing header line
("HH:MM · km N"). The pressable markers themselves are unchanged, so nothing
on the map itself grows or covers more of the route.

**Why this priority**: The popup is a secondary, on-demand surface; the icon
completes consistency across all three forecast views.

**Independent Test**: Open the map, tap a weather marker, and confirm the
popup header ends with the condition icon while the marker size and content
are identical to before.

**Acceptance Scenarios**:

1. **Given** the route map, **When** a weather marker popup opens, **Then**
   its header line includes the condition icon for that hour.
2. **Given** the route map, **When** viewing markers without opening popups,
   **Then** markers are visually identical to the pre-feature state.

---

### Edge Cases

- Weather code missing/undefined for an hour → show the standard "no data"
  dash, never a fallback icon that implies a real condition.
- Weather code outside the known set (future/unmapped codes) → treat as
  unknown (dash + generic label), never crash rendering.
- Language switch → icon labels re-render in the newly selected language,
  like every other translated string.
- Night hours → same icon set as day (no day/night variants) to stay
  minimal; this is an accepted simplification.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST derive a weather condition from each hour's
  already-fetched weather code; no additional network requests may be
  introduced.
- **FR-002**: Conditions MUST be grouped into a small fixed set of buckets
  (clear, partly cloudy, overcast, fog, drizzle, rain, snow, thunderstorm)
  covering all standard WMO weather codes; unknown codes map to "no data".
- **FR-003**: The forecast table MUST show the condition icon in a dedicated
  narrow, icon-only column with a symbol-style header (no text heading) and
  MUST NOT merge the icon into the Time column.
- **FR-004**: Each icon MUST expose a textual condition label in the current
  site language via hover/assistive attributes; the label never renders as
  visible cell text.
- **FR-005**: The mobile card rendering MUST show the same icon in the card
  header line without enlarging the cards.
- **FR-006**: The map marker popup MUST show the same icon appended to its
  existing header line; map markers themselves MUST remain unchanged.
- **FR-007**: Condition labels MUST be translated in all site languages
  (ro, en, ru) through the existing translation mechanism.
- **FR-008**: All three surfaces MUST use one shared code→condition mapping
  so they can never disagree.
- **FR-009**: Icons MUST be plain text glyphs (emoji) requiring no image
  assets, and MUST remain legible in both light and dark themes.

### Key Entities

- **Condition bucket**: a named grouping of WMO weather codes with one icon
  glyph and one translatable label; the full code range maps onto ~8 buckets
  plus an "unknown" fallback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can identify the general weather character (dry/wet/
  snow/storm) of any forecast hour from the icon alone, without reading any
  numeric cell.
- **SC-002**: The forecast table gains no more than one narrow column and
  requires no additional horizontal scrolling at the previously supported
  viewport widths.
- **SC-003**: All three surfaces (table, mobile cards, map popup) show the
  identical condition for the same hour, in all three site languages.
- **SC-004**: Page load makes exactly the same number of network requests as
  before the feature.

## Assumptions

- The eight-bucket grouping is sufficient granularity for ride planning;
  finer distinctions (e.g. rain intensity) remain available in the existing
  numeric columns.
- Emoji rendering differences across operating systems are acceptable; a
  custom icon set is explicitly out of scope for this iteration.
- No day/night icon variants; one glyph per bucket.
- Map marker visuals are frozen: the icon appears only in the popup.
