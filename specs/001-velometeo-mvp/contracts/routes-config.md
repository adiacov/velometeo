# Contract: `routes/index.json` (curator-facing)

The single configuration surface of the site. Adding a route = add the GPX
file + one object to `events`. Breaking this contract breaks forks —
changes require a constitution-level decision.

## Shape

```json
{
  "events": [
    {
      "id": "delacau-200-brm",
      "name": "Delacau 200 BRM",
      "gpx": "routes/delacau-200-brm.gpx",
      "date": "2026-05-31",
      "start": "06:00",
      "mode": "brevet"
    },
    {
      "id": "evening-training-60",
      "name": "Evening training loop",
      "gpx": "routes/evening-training-60.gpx",
      "date": "2026-08-02",
      "start": "18:00",
      "mode": "pace",
      "timezone": "Europe/Chisinau"
    }
  ]
}
```

## Rules

- `id`: URL-safe slug `[a-z0-9-]+`, unique; becomes `event.html?event=<id>`.
- `name`: display string, shown verbatim in all languages.
- `gpx`: repo-relative path; the file must exist and contain a `<trk>` with
  ≥ 2 points. `<wpt>` waypoints are optional checkpoints.
- `date`: `YYYY-MM-DD`; `start`: `HH:MM` (24-h), both in the event's local
  timezone.
- `mode`: `brevet` (ACP band scenarios) or `pace` (20/25/30 km/h) — never
  both.
- `timezone`: optional IANA name, defaults to `Europe/Chisinau`.
- Order in the array is irrelevant; pages sort by `date`.
- Consumers (index and event pages) MUST skip invalid entries with a
  console warning and keep rendering the valid ones (FR-005).
