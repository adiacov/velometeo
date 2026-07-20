#!/usr/bin/env python3
"""Add a route to velometeo: copy the GPX into routes/ and insert one entry
into routes/index.json. The primary curator path (BRIEF; contract:
specs/001-velometeo-mvp/contracts/add-route-cli.md). Stdlib only.

Usage:
  python3 tools/add_route.py ride.gpx --name "Delacau 200 BRM" \
      --date 2026-05-31 --start 06:00 --mode brevet [--id slug] \
      [--timezone Europe/Chisinau] [--force] [--commit]

The track is simplified automatically (Ramer–Douglas–Peucker, ~5 m) to shrink
the served .gpx; waypoints are kept. It is idempotent — a file already carrying
our marker is copied unchanged, so re-adding never re-simplifies. Override the
tolerance with --simplify <metres>, or keep the source verbatim with
--no-simplify.
"""

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST = REPO_ROOT / "routes" / "index.json"

# Must mirror assets/js/lib/scenarios.js (STANDARD_DISTANCES / deviation rule).
STANDARD_DISTANCES = [200, 300, 400, 600, 1000, 1200]
DEVIATION_WARN = 0.15

GPX_NS = "{http://www.topografix.com/GPX/1/1}"

# Private marker written onto <gpx> when we simplify, so re-adding an already
# processed route never simplifies it again (idempotent; foreign-namespace
# attributes are ignored by GPX consumers and the site's parser).
VM_NS = "https://adiacov.github.io/velometeo/ns"
VM_SIMPLIFIED = f"{{{VM_NS}}}simplified"
DEFAULT_SIMPLIFY_M = 5.0


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if not slug:
        fail(f"cannot derive an id from name {name!r}; pass --id")
    return slug


def haversine_km(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    )
    return 2 * 6371.0088 * math.asin(math.sqrt(h))


def _equirect_xy(points, lat0_rad):
    """Project (lat, lon) degrees to local metres (equirectangular, good
    enough for point-to-segment distances over a single route)."""
    r = 6371008.8
    cos0 = math.cos(lat0_rad)
    return [(r * math.radians(lon) * cos0, r * math.radians(lat)) for lat, lon in points]


def _perp_dist(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def _rdp_mask(xy, epsilon):
    """Iterative Ramer–Douglas–Peucker; returns a keep-mask over xy."""
    n = len(xy)
    if n < 3:
        return [True] * n
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        s, e = stack.pop()
        a, b = xy[s], xy[e]
        dmax, idx = 0.0, s
        for i in range(s + 1, e):
            d = _perp_dist(xy[i], a, b)
            if d > dmax:
                dmax, idx = d, i
        if dmax > epsilon:
            keep[idx] = True
            stack.append((s, idx))
            stack.append((idx, e))
    return keep


def is_simplified(path: Path) -> bool:
    """True if the GPX carries our simplification marker (already processed)."""
    try:
        return ET.parse(path).getroot().get(VM_SIMPLIFIED) is not None
    except ET.ParseError:
        return False


def simplify_gpx_file(src: Path, dst: Path, tolerance_m: float):
    """Thin each <trkseg> with RDP at `tolerance_m` metres; waypoints and all
    other structure are left untouched. Stamps a marker so it is not
    re-simplified later. Writes dst. Returns
    (pts_before, pts_after, km_before, km_after)."""
    ET.register_namespace("", GPX_NS.strip("{}"))
    ET.register_namespace("vm", VM_NS)
    tree = ET.parse(src)
    root = tree.getroot()
    before = [(float(p.get("lat")), float(p.get("lon"))) for p in root.iter(f"{GPX_NS}trkpt")]
    if len(before) < 2:
        fail(f"{src} has no usable track to simplify")
    km_before = sum(haversine_km(before[i - 1], before[i]) for i in range(1, len(before)))
    lat0 = math.radians(sum(p[0] for p in before) / len(before))
    after = []
    for seg in root.iter(f"{GPX_NS}trkseg"):
        trkpts = list(seg.findall(f"{GPX_NS}trkpt"))
        pts = [(float(p.get("lat")), float(p.get("lon"))) for p in trkpts]
        mask = _rdp_mask(_equirect_xy(pts, lat0), tolerance_m) if len(pts) >= 3 else [True] * len(pts)
        for elem, keep, pt in zip(trkpts, mask, pts):
            if keep:
                after.append(pt)
            else:
                seg.remove(elem)
    km_after = sum(haversine_km(after[i - 1], after[i]) for i in range(1, len(after)))
    root.set(VM_SIMPLIFIED, f"{tolerance_m:g}")
    tree.write(dst, encoding="UTF-8", xml_declaration=True)
    return len(before), len(after), km_before, km_after


def measure_gpx(path: Path) -> float:
    """Parse and validate the GPX; return track length in km."""
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as err:
        fail(f"{path} is not well-formed XML: {err}")
    if not root.tag.endswith("gpx"):
        fail(f"{path} is not a GPX file (root element <{root.tag}>)")
    points = [
        (float(pt.get("lat")), float(pt.get("lon")))
        for pt in root.iter(f"{GPX_NS}trkpt")
        if pt.get("lat") and pt.get("lon")
    ]
    if len(points) < 2:
        fail(f"{path} has no usable track (need at least 2 track points)")
    return sum(haversine_km(points[i - 1], points[i]) for i in range(1, len(points)))

def extract_file_name(path: Path) -> str:
    """Extracts file name; return file name including extension."""
    return path.name


def check_brevet_distance(length_km: float) -> None:
    nearest = min(STANDARD_DISTANCES, key=lambda d: abs(length_km - d))
    deviation = abs(length_km - nearest) / nearest
    if deviation > DEVIATION_WARN:
        print(
            f"warning: measured {length_km:.1f} km deviates {deviation:.0%} from the "
            f"nearest standard brevet distance ({nearest} km) — check date/mode/GPX"
        )
    else:
        print(f"brevet distance: {length_km:.1f} km -> {nearest} km class")


def load_manifest() -> dict:
    try:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {"events": []}
    except json.JSONDecodeError as err:
        fail(f"{MANIFEST} is not valid JSON: {err}")
    if not isinstance(manifest.get("events"), list):
        fail(f"{MANIFEST} has no 'events' array")
    return manifest


def write_manifest(manifest: dict) -> None:
    """Atomic write: temp file in the same directory, then rename."""
    fd, tmp = tempfile.mkstemp(dir=MANIFEST.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp, MANIFEST)
    except BaseException:
        os.unlink(tmp)
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("gpx", type=Path, help="source GPX file")
    parser.add_argument("--name", required=True, help='display name, e.g. "Delacau 200 BRM"')
    parser.add_argument("--date", required=True, help="event date, YYYY-MM-DD")
    parser.add_argument("--start", required=True, help="start time, HH:MM (event-local)")
    parser.add_argument("--mode", required=True, choices=["brevet", "pace"])
    parser.add_argument("--id", dest="event_id", help="URL slug (default: from name)")
    parser.add_argument("--timezone", help="IANA zone (default Europe/Chisinau, omitted if not set)")
    parser.add_argument(
        "--simplify", nargs="?", const=DEFAULT_SIMPLIFY_M, type=float,
        default=DEFAULT_SIMPLIFY_M, metavar="METERS",
        help=f"RDP simplification tolerance in metres (default {DEFAULT_SIMPLIFY_M:g}); "
             "runs automatically, waypoints kept, already-simplified files skipped",
    )
    parser.add_argument("--no-simplify", action="store_true", help="keep the source GPX unchanged (skip simplification)")
    parser.add_argument("--force", action="store_true", help="overwrite an existing routes/<id>.gpx")
    parser.add_argument("--commit", action="store_true", help="git add + commit + push the two files")
    args = parser.parse_args()

    try:
        datetime.strptime(args.date, "%Y-%m-%d")
    except ValueError:
        fail(f"--date {args.date!r} is not a valid YYYY-MM-DD date")
    if not re.fullmatch(r"([01]?\d|2[0-3]):[0-5]\d", args.start):
        fail(f"--start {args.start!r} is not a valid HH:MM time")

    event_id = args.event_id or slugify(args.name)
    if not re.fullmatch(r"[a-z0-9-]+", event_id):
        fail(f"--id {event_id!r} must be a lowercase slug ([a-z0-9-])")

    if not args.gpx.is_file():
        fail(f"{args.gpx} does not exist")
    file_name = extract_file_name(args.gpx)
    length_km = measure_gpx(args.gpx)
    if args.mode == "brevet":
        check_brevet_distance(length_km)
    else:
        print(f"route length: {length_km:.1f} km")

    manifest = load_manifest()
    if any(e.get("id") == event_id for e in manifest["events"]):
        fail(f"id {event_id!r} already exists in {MANIFEST}")

    target = REPO_ROOT / "routes" / f"{file_name}"
    if target.exists() and not args.force:
        fail(f"{target} already exists (use --force to overwrite)")

    entry = {
        "id": event_id,
        "name": args.name,
        "gpx": f"routes/{file_name}",
        "date": args.date,
        "start": args.start,
        "mode": args.mode,
    }
    if args.timezone:
        entry["timezone"] = args.timezone

    if args.no_simplify:
        shutil.copyfile(args.gpx, target)
        print("simplification skipped (--no-simplify)")
    elif is_simplified(args.gpx):
        shutil.copyfile(args.gpx, target)
        print("source GPX already simplified (marker present) — copied unchanged")
    else:
        nb, na, kb, ka = simplify_gpx_file(args.gpx, target, args.simplify)
        pct = 100 * (1 - na / nb) if nb else 0
        print(
            f"simplified track: {nb} -> {na} points ({pct:.0f}% fewer), "
            f"length {kb:.1f} -> {ka:.1f} km, tolerance {args.simplify:g} m"
        )
    manifest["events"].append(entry)
    manifest["events"].sort(key=lambda e: (e.get("date", ""), e.get("id", "")))
    write_manifest(manifest)
    print(f"added: routes/{file_name} + entry in routes/index.json")

    if args.commit:
        rel_gpx = target.relative_to(REPO_ROOT)
        rel_manifest = MANIFEST.relative_to(REPO_ROOT)
        run = lambda *cmd: subprocess.run(cmd, cwd=REPO_ROOT, check=True)  # noqa: E731
        run("git", "add", str(rel_gpx), str(rel_manifest))
        run("git", "commit", "-m", f"feat: add route {args.name}")
        run("git", "push")
        print("committed and pushed")
    else:
        print("review and commit when ready (or rerun with --commit)")


if __name__ == "__main__":
    main()
