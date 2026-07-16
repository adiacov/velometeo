# T034/T035 Polish Report: Delacau parity + mobile performance

**Date**: 2026-07-16 · per SC-004 (structure, UX, labeling — raw values not
comparable: the Delacau event has passed, velometeo shows observed data).

## Delacau parity (T034)

| Delacau element | velometeo | Verdict |
|---|---|---|
| Hero: title, date/start/distance pills | Same, plus checkpoints pill | ✅ |
| "Cum se citeste prognoza" note above scenarios | Ported, generalized for both modes | ✅ |
| "Sursa meteo" section with active source pill | Model switcher pills (ECMWF/ICON), persistent choice | ✅ (single page instead of per-provider pages — clarification Q3) |
| Scenario `<details>` with "Vezi pe harta" button | Same markup/CSS, one open at a time | ✅ |
| Hourly table (desktop) + hour cards (mobile) | Same responsive pattern | ✅ |
| Map page: back / scenario / key-all controls | Same; fit-route button removed (user decision) | ✅ |
| Map markers: time + temp + wind arrow, ok/warn colors, popups | Same | ✅ |
| Light/dark theme, RO/EN/RU | Same (runtime i18n instead of page trees) | ✅ |
| "Zona traseului" column (place names per km) | Absent | Justified: Delacau's place names were a hand-curated per-route list; incompatible with the two-file route promise (constitution III) |
| Summary cards (General / Temp / Vant / Ploaie) + total climb pill | Absent | Justified: derived overview + elevation math not in MVP FRs; candidate future enhancement |
| Weather icon/label column ("noros" etc.) | Absent from tables (weather_code is fetched) | Justified for MVP; cheap future enhancement since the data is already in the response |
| Daily "auto-update" note + updated timestamp | Absent | Correct: data is fetched live on every open — the note would be misleading |

## Mobile performance (T035)

Live gzipped transfer, event page (phone, cold cache):
HTML 0.7 KB + CSS 4 KB + 8 JS modules ≈ 12.7 KB + dictionary 1.1 KB +
manifest 0.2 KB ≈ **19 KB**, plus the GPX. Request waves before weather
renders: HTML → CSS/JS (parallel) → manifest/dictionary/GPX (parallel) →
one weather call. No Leaflet on the event page (map is a separate page).

**Known trade-off**: GitHub Pages does not compress `application/gpx+xml`,
so the Delacau GPX transfers at its full 288 KB (~2–3 s on slow cellular;
within SC-001's 10 s). Rejected fixes: renaming to `.xml` (breaks the
natural curator format) or stripping `<ele>`/precision (mutates curator
files). Future option: `tools/add_route.py --simplify` writing a reduced
copy. Weather stays one batched request per model; map page renders route
and controls before the weather round-trip.
