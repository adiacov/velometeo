# BRIEF.md — velometeo

Handoff context for the dedicated repo. Complements `PROJECT.md` (stable
identity) with conception history, decisions, scope, and next steps.
Written 2026-07-15.

## Agent kickoff — what to read

Read, in order: this repo's agent instructions (`AGENTS.md` and whatever
they point to), then `PROJECT.md` (identity, constraints), then this
`BRIEF.md` in full. Nothing else is required reading. The Delacau repo at
`../delacau-200-brm-weather-forecast` (see "Reference" below) is source
material — consult its listed files when implementing, don't read it
wholesale.

## How the idea was conceived

The user built `../delacau-200-brm-weather-forecast` — a static multilingual
(RO/EN/RU) GitHub Pages site showing weather along the Delacau 200 BRM route
(Moldova, 31 May 2026) for three finish-time scenarios (8/10/13 h), with
provider pages (ECMWF/ICON/AccuWeather), Leaflet maps with wind arrows, and
a daily-regeneration GitHub Action driven by a Python generator script.

It worked, but everything was hardcoded to one route. The next brevet is a
300 + 200 (two routes), and the user also wants pages for regular training
rides. The generalization: one app, config-driven routes.

## Decisions so far (2026-07-15, brainstormed with the user)

- **Name: `velometeo`** — reads naturally in RO/RU/FR/EN. Target URL:
  `adiacov.github.io/velometeo`.
- **New repo; Delacau is its first config/migration target.** The live
  Delacau page is not touched until velometeo is ready.
- **Architecture flip: generator → client-side app.** Weather is fetched in
  the visitor's browser from Open-Meteo (free, keyless, CORS-enabled).
  Consequences: forecasts fresh on every load; no daily-update Action; no
  Python regeneration step; **AccuWeather dropped** (needs a secret key —
  impossible in public client-side code). Providers: ECMWF + ICON via
  Open-Meteo; other free Open-Meteo models (e.g. GFS) may be added.
- **One config = one route = one page.** A multi-route brevet (the 300+200)
  is simply two configs/two pages; no multi-route event picker.
- **Two scenario modes, chosen per route in config (never both on a page):**
  - `brevet` — official ACP limits: 200→13.5 h, 300→20 h, 400→27 h,
    600→40 h, 1000→75 h, 1200→90 h (not a constant speed — verify exact
    table against ACP sources during implementation). Show several bands
    (fast / typical / max cutoff) for different preparation levels, like
    Delacau's 8/10/13 h did for the 200.
  - `pace` — 20 / 25 / 30 km/h × route length measured from the GPX.
  - Route length is **not** in the config — always derived from the GPX.
- **Curated only.** Rejected alternatives, in order considered:
  1. in-browser "drop your own GPX" mode (ephemeral, localStorage) —
     rejected: user decided only he creates events;
  2. Telegram bot committing routes via GitHub API (Cloudflare Worker
     webhook) — rejected: no strangers touching the repo, keep it static.
  Others get their own routes by **forking**, which makes documentation a
  first-class deliverable.
- **Index page:** minimal landing page listing all events sorted newest
  date first (from the configs / an `index.json`); optionally
  upcoming/past split.
- **Checkpoints optional:** shown when the GPX contains waypoints,
  silently omitted otherwise. Weather markers are placed by time/distance
  along the track and never depend on checkpoints.
- Keep from Delacau: mobile-first design, light/dark theme, RO/EN/RU,
  Leaflet map behavior (weather markers, wind arrows), honest-data rule
  (`—` instead of invented values).

## Lessons from Delacau (2026-07-15)

- **The daily-update GitHub Action failed silently** — it did not fire at
  the scheduled hour. This is a known GitHub weakness: `schedule:` crons
  are best-effort (delayed/skipped under load, disabled after 60 days of
  repo inactivity). Velometeo's client-side fetch removes the job entirely
  — this is part of why the architecture flipped. **Do not reintroduce
  scheduled Actions** for anything load-bearing; if one is ever truly
  needed, it must have failure alerting.

## How to use the Delacau code

Delacau is **the spec and the parts bin, not the skeleton**:

- **UX = specification.** The live Delacau pages define the target look
  and tone (mobile-first layout, pills, collapsed sections, wording for
  non-technical riders). Study them; don't redesign.
- **Lift the architecture-independent assets:** `assets/style.css`,
  `assets/theme.js`, `assets/map.js` (Leaflet route/markers/wind arrows)
  are good copy-and-adapt candidates.
- **Do not copy the generated HTML or port the Python script.** The HTML
  is baked output of `brevet_delacau_weather_research.py`; velometeo pages
  fetch data at runtime. Read the script for its knowledge (Open-Meteo
  endpoints/params, GPX distance math, hourly route-position logic) and
  reimplement that logic in JS.

## Adding a route (target workflow — ease of use is a requirement)

1. Drop the GPX into `routes/`; 2. add a config entry (name, gpx, date,
mode); 3. commit + push → Pages redeploys, event appears on the index.
Must **never** require touching HTML/CSS/JS.

Paths, in priority order (2026-07-15):

1. **Primary: local helper script** — e.g.
   `add_route.py <file.gpx> "<name>" <date> <mode>`: copies the GPX,
   updates the config, commits and pushes. One command → live on next
   page open. Ship this with the repo (forkers benefit too).
2. **Phone-friendly: `workflow_dispatch` Action** — a manual "Add route"
   form in the GitHub Actions tab (name/date/mode inputs). Manually
   triggered Actions are reliable — the cron ban above applies only to
   `schedule:` triggers.
3. By hand / via an agent: edit the config + upload GPX (docs show a
   copy-paste template; GitHub web UI works from a phone).

Rejected: a form on the public site that commits to the repo — a static
page cannot hold credentials without exposing them. At most, a form that
*generates* the config snippet to paste.

## Past events (fixes a real Delacau bug)

In Delacau, the daily cron kept regenerating after event day (31 May);
providers no longer return a forecast for a past date, so the page
degraded instead of freezing at the last pre-event forecast. In velometeo
the event `date` in config drives a mode switch, client-side:

- **Upcoming** → Open-Meteo *forecast* API; fresh on every load, precision
  improves as the date nears (what the cron was trying to do, for free).
- **Past** → Open-Meteo *archive* API (free, keyless, CORS): show the
  **actual observed weather** of event day, clearly labeled as such —
  better than a frozen forecast; past pages become a permanent record.
- Index page splits **Upcoming / Past** (newest first within each).

## Open questions

- Exact brevet bands to display (e.g. for a 200: ~8 h / ~10 h / 13.5 h) —
  fastest band should be realistic, not the theoretical minimum; decide as
  fractions of max time or a small per-distance table.
- Tech shape of the client app: keep it framework-free (vanilla JS like
  Delacau's assets) or a small build (e.g. Vite)? Delacau's audience argues
  for the simplest thing that stays maintainable. The user's
  `strava-routes` MVP used Vite + React + TS + Leaflet — reusable
  experience either way.
- How much of the Delacau HTML/CSS/JS is directly liftable vs. rewritten
  (theme.js, style.css, map.js are the reuse candidates).
- i18n mechanism for a client-side app (Delacau generated three page trees;
  a client app can switch language at runtime).
- Config format: one file per route vs. a single `routes/index.json`.

## Next steps

1. User creates the `velometeo` repo (agent-ws initialized, as usual) and
   copies this `BRIEF.md` + `PROJECT.md` into it.
2. Write repo agent instructions.
3. First implementation slice: index page + one route (Delacau GPX, brevet
   mode) rendering table + map with live Open-Meteo data in the browser.
4. Then: pace mode, second provider, i18n, docs-for-forkers, and migration
   of the Delacau URL story (link or redirect from the old page).

## Reference

- **`../delacau-200-brm-weather-forecast`** — the sibling repo being
  generalized. Read/copy from it directly instead of redoing working
  things; the useful files are:
  - `assets/style.css`, `assets/theme.js`, `assets/map.js` —
    copy-and-adapt candidates;
  - `brevet_delacau_weather_research.py` — knowledge source (Open-Meteo
    endpoints/params, GPX distance math, hourly route-position logic);
    reimplement in JS, don't port line-by-line;
  - a generated `index.html` — the UX spec;
  - `delacau-200-brm.gpx` — copy in as the first real route.
- Open-Meteo: free, no key, CORS-enabled; models incl. ECMWF, ICON, GFS.
- ACP brevet time limits: verify current official numbers (Audax Club
  Parisien) during implementation.
