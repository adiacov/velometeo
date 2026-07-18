# Quickstart: verifying 005-single-provider-forecast

Prerequisites: none beyond the repo (no build, no deps). Serve locally:

```sh
python3 -m http.server 8123   # from repo root
```

## 1. Unit tests

```sh
npm test
```

Expected: all green; no test references archive/recent-past;
target-date cases present (future → event day, past → today, boundary
event-day-equals-today → event day, waiting unchanged, past-midnight
window).

## 2. Past event shows today's forecast (US1)

Open `http://127.0.0.1:8123/event.html?event=delacau-200-brm` (event date
2026-05-31, in the past).

- Status line: `ECMWF` + **today's** long-format date + ride-now wording.
- Table rows: hours starting at the configured start time, dated today
  (verify one row's value against api.open-meteo.com for the same
  coordinates/hour if in doubt).
- Zero occurrences of "observed"/"recorded" wording in any language
  (switch RO/EN/RU).
- Network tab / logs: exactly one weather request, to
  `api.open-meteo.com/v1/forecast` with `models=ecmwf_ifs025`; no
  `archive-api.open-meteo.com` request (SC-001, SC-004).

## 3. No model switcher anywhere (US2)

- Event page and `map.html?event=delacau-200-brm&scenario=…`: no model
  buttons; provider named exactly once (status line) on the event page.
- Set a stale preference then reload — no error, no visible remnant:
  `localStorage.setItem('velometeo.model','icon')` in the console.

## 4. Status line date & languages (US3)

- Past event: RO/EN/RU each show provider + today's date + ride-now
  wording (dates localized, not ISO).
- Upcoming event: temporarily add a manifest entry with a date a few
  days ahead (do not commit), reload: event-day date + preparation
  wording; set the date >15 days out: "waiting" note appears.

## 5. Map page parity (US1/FR-007)

Open the map for a past event scenario: markers/popup hours show
today-anchored times with the same forecast data as the event page.

## 6. Constitution & docs

- `.specify/memory/constitution.md`: v1.1.0; past-events-archive bullet
  replaced by the target-date rule; Sync Impact Report updated.
- `README.md` mentions a single provider (ECMWF); no switcher screenshots
  or text remain.

Suggested automated check (as in 004): headless-Chrome iframe harness
asserting status-line text, absence of `[data-model]` elements, and the
single forecast request URL.
