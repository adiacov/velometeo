# Quickstart: validating velometeo end-to-end

**Plan**: [plan.md](plan.md) · Contracts: [routes-config](contracts/routes-config.md), [open-meteo](contracts/open-meteo.md), [add-route-cli](contracts/add-route-cli.md)

## Prerequisites

- Any static file server (no build step exists):
  `python3 -m http.server 8000` from the repo root.
- Node 20+ only for unit tests (`node --test tests/`), not for running the
  site.
- Network access to `api.open-meteo.com` / `archive-api.open-meteo.com`.

## Unit tests (pure logic)

```bash
node --test tests/
```

Expected: all pass; covers GPX parsing/distances, brevet band table, pace
scenarios, hour→position interpolation, API mode selection
(forecast/past_days/archive/waiting), request building, dash formatting,
day-context labels.

## Scenario walkthroughs (browser, http://localhost:8000)

1. **Index (US2)**: open `/`. Expect Upcoming and Past groups, newest
   first, each entry linking to `event.html?event=<id>`.
2. **Upcoming brevet page (US1)** — needs an event within ~15 days:
   temporarily set the Delacau entry's `date` to a near date. Expect: map
   with route + hourly markers + wind arrows; three band scenarios
   (8/10/13:30 for a 200); hourly table with temperature, feels-like,
   precipitation, wind (incl. relative direction), gusts; fetched at load.
3. **Waiting mode (FR-014)**: set `date` > 20 days out. Expect route, map,
   scenarios, and a "forecast opens N days before" message; no error.
4. **Past event (US3)**: set `date` well in the past. Expect observed
   weather labeled as such (archive API in the network tab). With a date
   2–5 days ago, expect recent-past data (forecast API with `past_days`).
5. **Pace mode (US4)**: add a `mode: "pace"` event. Expect exactly the
   20/25/30 km/h scenarios; durations = measured length ÷ speed.
6. **Model switch (US5/Q3)**: toggle ECMWF↔ICON. Expect one new fetch,
   table AND map re-render, choice survives reload and page navigation.
7. **Language & theme (US5)**: switch RO/EN/RU and light/dark; both
   persist after reload. Default language RO, theme follows system.
8. **Honest data (FR-016)**: in the network tab, check any null hourly
   values render as `—` (archive responses lack
   `precipitation_probability` — those cells must show `—`).
9. **Failure state (FR-017)**: block api.open-meteo.com in devtools;
   reload. Expect route + map + friendly message, no broken layout.
10. **Broken entry (FR-005)**: add a manifest entry pointing to a missing
    GPX. Expect index still lists the valid events; console warning only.
11. **Route addition (US6)**: run the helper per
    [add-route-cli](contracts/add-route-cli.md) with a spare GPX; expect
    only `routes/<id>.gpx` and `routes/index.json` changed; event appears
    after reload.
12. **Delacau parity (SC-004)**: with the real Delacau entry, compare
    scenario structure and values against the live Delacau page
    side-by-side.

Revert any temporary manifest edits afterwards.

## Deploy check (US7)

Push the branch to GitHub, enable Pages (deploy from branch, root). Expect
the site to work identically at the Pages URL — CORS was verified against a
`github.io` origin.
