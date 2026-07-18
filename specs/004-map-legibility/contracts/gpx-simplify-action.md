# Contract: GPX auto-simplification Action (US5)

CI behavior contract for `.github/workflows/simplify-routes.yml` (the repo's first
workflow). Reuses `tools/add_route.py` RDP logic; does not reimplement it.

## Triggers

- `push` on paths `routes/**`.
- `pull_request` on paths `routes/**`.
- `workflow_dispatch` (manual).
- **MUST NOT** use `schedule:` (constitution VII).

## Permissions

- `permissions: contents: write` (needed to commit the simplified file back).
- Uses the built-in `GITHUB_TOKEN`; no external secrets/keys (constitution I).

## Job behavior

1. Checkout the ref (full enough history to push a commit back).
2. Set up Python 3 (stdlib only; no pip installs required).
3. For every `routes/*.gpx` **lacking** the `vm:simplified` marker
   (`is_simplified()` false): simplify in place at the default tolerance (~5 m)
   via `simplify_gpx_file()`, stamping the marker.
4. If any file changed (`git diff` non-empty): commit with the
   `github-actions[bot]` identity and push to the branch. Otherwise: no-op.

## Guarantees

| # | Guarantee | Maps to |
|---|-----------|---------|
| G1 | Marker-less committed GPX is simplified and committed back smaller | FR-013 |
| G2 | GPX carrying the marker is left unchanged (idempotent) | FR-014 |
| G3 | The bot's own commit produces only marked files → next run is a no-op (no loop) | FR-016 |
| G4 | Trigger is push/PR/dispatch on `routes/**`, never a cron | FR-015 |
| G5 | GPX with <2 usable points fails the job visibly, commits nothing | FR-017 |
| G6 | Curator still adds exactly two files (GPX + index.json entry); no manual simplify step | FR-018 |
| G7 | On a `pull_request` from a fork (no write token), the job MUST NOT fail the PR hard — it reports what would change without pushing (documented behavior) | FR-015/IV |

## Loop-safety detail

- Primary: idempotency via the marker (G2 → G3).
- Secondary (belt-and-suspenders): the commit step runs only when `git diff`
  shows changes, and/or the job skips when the triggering commit is the bot's own
  (author `github-actions[bot]`).

## Reuse boundary

- The RDP math and marker logic (`_rdp_mask`, `simplify_gpx_file`,
  `is_simplified`, namespace constants) in `tools/add_route.py` are **unchanged**.
- The Action calls them via a thin driver (small script or a minimal
  batch/in-place CLI path on `add_route.py`) that only iterates marker-less
  `routes/*.gpx`. Keep any CLI addition minimal and covered by the existing tool
  behavior.

## Non-goals

- No `index.json` `gpxChecksum` state (documented alternative only).
- No change to how routes are served or to the site build (Pages still deploys
  from `main` root).
