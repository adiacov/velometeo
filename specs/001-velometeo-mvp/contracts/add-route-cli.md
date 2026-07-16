# Contract: `tools/add_route.py` (curator helper CLI)

Python 3.10+, stdlib only. The primary route-addition path (BRIEF); also
works for forkers.

## Usage

```bash
python3 tools/add_route.py <file.gpx> \
  --name "Delacau 200 BRM" \
  --date 2026-05-31 \
  --start 06:00 \
  --mode brevet \
  [--id delacau-200-brm] \
  [--timezone Europe/Chisinau] \
  [--commit]        # git add + commit (+ push) when set
```

## Behavior

1. Validate inputs: GPX parses and has a track with ≥ 2 points; date/start
   formats; mode ∈ {brevet, pace}; id (default: slugified name) unique in
   the manifest.
2. In brevet mode, measure the track and warn when length deviates > 15%
   from the nearest standard distance (does not block).
3. Copy the GPX to `routes/<id>.gpx` (refuse to overwrite without
   `--force`).
4. Insert the entry into `routes/index.json`, preserving formatting and
   sorting by date.
5. With `--commit`: `git add` both files, commit
   (`feat: add route <name>`), push current branch.
6. Exit non-zero with a human-readable message on any validation failure;
   never leave the manifest half-written (write via temp file + rename).
