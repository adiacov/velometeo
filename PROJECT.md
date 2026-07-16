# PROJECT.md — velometeo

Stable identity of the project. This describes what the project *is*, not
its implementation progress.

## What it is

`velometeo` is a static, client-side web app (GitHub Pages) that shows the
expected weather **along a bicycle route**, positioned by where the rider
will be at each hour for several pace scenarios. It generalizes the
one-off `delacau-200-brm-weather-forecast` project into a multi-route,
config-driven app: **one config + one GPX = one event page**, plus an index
page listing all events.

It is the successor of the Delacau project; Delacau becomes its first
curated route. The live Delacau page stays untouched until velometeo is
ready.

## Why it exists

The Delacau page proved the concept (riders loved seeing weather *along the
route by finish time*), but everything was hardcoded to one route. The user
rides more brevets (next: a 300 + 200 event) and regular training rides, and
wants to add a new route by dropping a GPX and a small config — no code
changes.

## Who it is for

- Primary: the user, curating event pages for brevets and rides in Moldova.
- Secondary: riders of those events, reading the pages on their phones
  (non-technical audience — pages must stay simple and mobile-first).
- Tertiary: other cyclists/organizers who **fork the repo** to run their own
  instance with their own routes. Documentation is a first-class feature for
  this audience.

## Core model

Per-event config (one per route; a multi-route brevet = multiple configs):

```
name:   "Delacau 200 BRM"
route:  routes/delacau-200.gpx   # length auto-measured from the GPX
date:   2026-05-31
mode:   brevet                    # brevet | pace
```

Scenario times come from the mode:

- **brevet** — official ACP time limits by distance (200 km → 13.5 h,
  300 → 20 h, 400 → 27 h, 600 → 40 h, 1000 → 75 h, 1200 → 90 h). Show
  several bands (fast / typical / max cutoff) so riders of different
  preparation levels find themselves.
- **pace** — fixed average speeds (20 / 25 / 27 / 30 km/h) × measured route
  length, for non-brevet rides.

Weather is fetched **in the visitor's browser** from Open-Meteo (free, no
API key, CORS-enabled) — providers ECMWF and ICON (more free Open-Meteo
models may be added). Forecasts are therefore fresh on every page load; no
daily regeneration job is needed.

## Hard constraints

1. **Fully static.** No backend, no server, no API keys, no paid services.
   Hosted on GitHub Pages; anything that can't work client-side is out.
2. **Curated routes only.** New events enter the repo as committed
   GPX + config by the repo owner. No upload/bot/user-generated content on
   the public site — other people fork instead.
3. **Fork-friendly + best-in-class docs.** A stranger must be able to fork,
   add their GPX + config, enable Pages, and have a working site by
   following the README alone.
4. **Reuse the Delacau UX.** Mobile-first pages, light/dark theme,
   multilingual (RO/EN/RU), Leaflet map with route, weather markers and
   wind arrows. Checkpoints are optional: shown if the GPX has waypoints,
   omitted otherwise.

## Boundaries / non-goals

- No accounts, tracking, or live GPS following.
- No AccuWeather (requires an API key — incompatible with client-side
  static hosting).
- No route planning/editing — GPX files come from elsewhere.
- Not a general weather app: the value is *weather positioned along a route
  by pace scenario*, nothing more.

## Core principles

- Adding a route must stay a two-file operation (GPX + config entry).
- Index page: minimal list of all events, newest date first.
- Honest data: if a provider lacks a value (e.g. max/gust wind), show a
  dash, never invent numbers (inherited from Delacau).
- Simple, practical, readable on a phone — technical notes at the bottom
  only.
