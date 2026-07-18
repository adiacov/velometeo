#!/usr/bin/env python3
"""Simplify every committed routes/*.gpx that is not already processed, in place.

Reuses the RDP simplification + idempotency logic from add_route.py (no new
logic here). A GPX carrying our `vm:simplified` marker is left untouched, so
re-running never re-simplifies (idempotent) and the CI job that calls this can
never loop on its own commit.

This is the pipeline entry point for feature 004 US5: the push/dispatch-triggered
GitHub Action (.github/workflows/simplify-routes.yml) runs it so a curator who
just drops a GPX into routes/ never has to simplify by hand.

Exit status:
  0  success (whether or not anything changed)
  1  a GPX had no usable track (surfaced by add_route.simplify_gpx_file → fail)

Stdlib only. Usage: python3 tools/simplify_routes.py [--tolerance METRES]
"""

import argparse
import sys
from pathlib import Path

# Reuse the tested logic; add_route.main() is guarded by __main__, so importing
# it here has no side effects.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_route import (  # noqa: E402
    DEFAULT_SIMPLIFY_M,
    REPO_ROOT,
    is_simplified,
    simplify_gpx_file,
)

ROUTES_DIR = REPO_ROOT / "routes"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--tolerance", type=float, default=DEFAULT_SIMPLIFY_M, metavar="METRES",
        help=f"RDP simplification tolerance in metres (default {DEFAULT_SIMPLIFY_M:g})",
    )
    args = parser.parse_args()

    gpx_files = sorted(ROUTES_DIR.glob("*.gpx"))
    if not gpx_files:
        print("no routes/*.gpx found — nothing to do")
        return

    changed = 0
    for path in gpx_files:
        rel = path.relative_to(REPO_ROOT)
        if is_simplified(path):
            print(f"skip {rel} — already simplified (marker present)")
            continue
        # simplify_gpx_file() fail()s (exit 1) on a GPX with no usable track.
        nb, na, kb, ka = simplify_gpx_file(path, path, args.tolerance)
        pct = 100 * (1 - na / nb) if nb else 0
        print(
            f"simplified {rel}: {nb} -> {na} points ({pct:.0f}% fewer), "
            f"length {kb:.1f} -> {ka:.1f} km, tolerance {args.tolerance:g} m"
        )
        changed += 1

    print(f"done — {changed} file(s) simplified, {len(gpx_files) - changed} left unchanged")


if __name__ == "__main__":
    main()
