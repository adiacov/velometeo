# velometeo

Weather along a bicycle route — positioned by where the rider will be at
each hour, for several pace scenarios. One GPX + one config entry = one
event page, hosted for free on GitHub Pages.

- **Brevet mode**: scenarios from the official ACP time limits
  (200 km → 13:30, 300 → 20:00, 400 → 27:00, 600 → 40:00, 1000 → 75:00),
  shown as fast / typical / official-limit bands.
- **Pace mode**: scenarios at 20 / 25 / 27 / 30 km/h average speed.
- Weather is fetched **in the visitor's browser** from
  [Open-Meteo](https://open-meteo.com) (free, no API key), ECMWF model —
  the forecast is fresh on every page load. Upcoming events show the
  forecast for the event day; past events show today's forecast, so you
  can still check conditions before riding the route again.
- Mobile-first, light/dark theme, Romanian / English / Russian, Leaflet map
  with hourly weather markers and wind arrows.
- Fully static: no backend, no build step, no secrets, no scheduled jobs.

## Run your own instance (fork guide)

You need a GitHub account and a GPX file of your route. No programming, no
tools to install.

1. **Fork** this repository (button in the top-right corner on GitHub).
2. **Enable GitHub Pages**: in your fork, *Settings → Pages → Build and
   deployment*, set **Source** to "Deploy from a branch", pick your default
   branch and the `/ (root)` folder, save.
3. Wait a minute, then open `https://<your-username>.github.io/velometeo/`.
   You should see the event list.
4. **Add your route** (next section), remove the sample events, done.

## Adding a route

A route is exactly two things: a GPX file in `routes/` and one entry in
`routes/index.json`. Never edit HTML/CSS/JS for a new route.

### Option A — helper script (one command)

```bash
python3 tools/add_route.py my-ride.gpx \
  --name "Chisinau 300 BRM" \
  --date 2026-08-22 \
  --start 05:00 \
  --mode brevet
```

The script validates the GPX, measures its length, copies it into
`routes/`, and updates `routes/index.json`. Add `--commit` to also
git-commit and push in the same command (requires Python 3.10+, present on
most systems).

### Option B — by hand (works from the GitHub web UI on a phone)

1. Upload your GPX to the `routes/` folder (GitHub: *Add file → Upload
   files*).
2. Edit `routes/index.json` and add one entry:

```json
{
  "id": "chisinau-300-brm",
  "name": "Chisinau 300 BRM",
  "gpx": "routes/chisinau-300-brm.gpx",
  "date": "2026-08-22",
  "start": "05:00",
  "mode": "brevet"
}
```

3. Commit. The page appears on the index after Pages redeploys (~1 min).

You don't need to shrink the GPX yourself. On every push that touches
`routes/`, the **Simplify routes** GitHub Action
(`.github/workflows/simplify-routes.yml`) auto-simplifies any new GPX
(Ramer–Douglas–Peucker, ~5 m; waypoints kept) and commits the smaller file
back. It is idempotent — a file it has already processed carries an internal
marker and is left untouched, so it never re-runs on itself. (Option A's script
already simplifies locally, so those files are skipped by the Action.) Pull
after the Action runs to get the simplified file. This keeps route-adding a
strict two-file operation: your GPX + one `routes/index.json` entry.

### Config reference

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | URL slug (`a-z`, `0-9`, `-`), unique; the page becomes `event.html?event=<id>` |
| `name` | yes | Display name, shown as-is in every language |
| `gpx` | yes | Path to the GPX file inside the repo |
| `date` | yes | Event date, `YYYY-MM-DD` |
| `start` | yes | Start time, `HH:MM`, local to the event |
| `mode` | yes | `brevet` (ACP bands) or `pace` (20/25/27/30 km/h) |
| `timezone` | no | IANA zone, default `Europe/Chisinau` — set this if your event is elsewhere |

Notes:

- Route length is always **measured from the GPX**; there is no length
  field. In brevet mode it is matched to the nearest standard distance
  (a 207 km track is a "200").
- If the GPX contains waypoints (`<wpt>`), they are shown as checkpoints
  on the map; if not, checkpoints are simply omitted.
- A broken GPX or config entry never takes down the site — the event is
  skipped with a warning in the browser console.

## How the weather works

- Every page uses the Open-Meteo **forecast** API with the **ECMWF**
  model, reaching ~15 days out. The status line always states the exact
  date the forecast is for.
- **Upcoming events** show the forecast for the event day; more than
  ~15 days out, the page shows the route and scenarios with a "forecast
  opens in N days" note instead.
- **Past events** show today's forecast (the day the page is opened) —
  useful if you want to ride the route again and need current
  conditions. There is no historical/observed data; velometeo does not
  keep a weather record of what actually happened on event day.
- Missing values are shown as `—`. velometeo never invents numbers.
- Open-Meteo is free for non-commercial use (fair use ~10,000 calls/day;
  a page load costs a couple of calls). No key, no signup.

## Troubleshooting

- **Page shows "weather temporarily unavailable"** — Open-Meteo is
  unreachable (network filter, outage). The route and scenarios still
  render; it recovers on reload once the API is reachable.
- **Event missing from the index** — open the browser console: a skipped
  entry logs its exact problem (bad date format, missing field, …).
- **404 on github.io** — Pages not enabled, still deploying, or the fork
  is private (Pages on private repos needs a paid plan).
- **Forecast page looks empty far ahead of the event** — expected: the
  forecast horizon hasn't been reached yet; the note on the page says when
  data arrives.

## Development

No build step: any static file server runs the site
(`python3 -m http.server 8000`). Unit tests need Node 20+: `npm test`
(zero dependencies — `package.json` exists only to mark ES modules).
Product spec, plan, and task breakdown live in `specs/001-velometeo-mvp/`;
project principles in `.specify/memory/constitution.md`.

velometeo generalizes the one-off
[delacau-200-brm-weather-forecast](https://github.com/adiacov/delacau-200-brm-weather-forecast)
page — same UX, config-driven routes, client-side data.

## License

MIT (see `LICENSE`). Weather data by [Open-Meteo](https://open-meteo.com)
(CC BY 4.0); maps © [OpenStreetMap](https://www.openstreetmap.org/copyright)
contributors; maps rendered with [Leaflet](https://leafletjs.com).
