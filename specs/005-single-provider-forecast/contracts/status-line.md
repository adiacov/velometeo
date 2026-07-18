# Contract: Status line & i18n keys

One status element per event page, rendered where the status pill +
model-switcher sections were. The map page shows no provider/date UI of
its own but its data follows the same target-date rule.

## Content

`<provider> · <localized sentence containing the formatted target date>`

- Provider: `ECMWF` (from the single MODEL constant; named exactly once
  per page — SC-002).
- Date: `formatDate(targetDate, lang)` — `Intl.DateTimeFormat` long date
  in the active language (e.g. `18 iulie 2026` / `July 18, 2026` /
  `18 июля 2026 г.`).

## i18n keys (all three dictionaries: ro, en, ru)

| Key | Placeholder | Meaning (EN reference wording) |
|---|---|---|
| `status.upcoming` | `{date}` | "Weather forecast for {date} — the event day. Use it to prepare for the ride." |
| `status.past` | `{date}` | "The event has passed. Showing the weather forecast for {date} (today) — for riding the route now." |

Exact RO/RU phrasing is authored at implementation, following existing
dictionary tone; keys and placeholders are the contract.

### Removed keys

`model.title`, `provenance.forecast`, `provenance.recorded`,
`provenance.observed` — deleted from all three dictionaries and all
usage sites. `notes.data` is reworded to name one model (ECMWF via
Open-Meteo).

## States

| Page state | Status area shows |
|---|---|
| forecast, upcoming | status line with event date, preparation wording |
| forecast, past | status line with today's date, ride-now wording |
| waiting | existing `weather.waiting` note (unchanged) |
| fetch failed | status line + existing `weather.unavailable` note |
