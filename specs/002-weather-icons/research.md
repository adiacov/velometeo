# Research: Weather Condition Icons

## R1. WMO code → bucket grouping

**Decision**: Map the standard Open-Meteo/WMO hourly `weather_code` values
onto 8 buckets:

| Bucket | Codes | Icon | Label key |
|---|---|---|---|
| clear | 0 | ☀️ | `weather.clear` |
| partly cloudy | 1, 2 | ⛅ | `weather.partlyCloudy` |
| overcast | 3 | ☁️ | `weather.overcast` |
| fog | 45, 48 | 🌫️ | `weather.fog` |
| drizzle | 51, 53, 55, 56, 57 | 🌦️ | `weather.drizzle` |
| rain | 61, 63, 65, 66, 67, 80, 81, 82 | 🌧️ | `weather.rain` |
| snow | 71, 73, 75, 77, 85, 86 | 🌨️ | `weather.snow` |
| thunderstorm | 95, 96, 99 | ⛈️ | `weather.thunderstorm` |

Any other value (or null/undefined) → no bucket → render the standard dash.

**Rationale**: This is the full documented Open-Meteo WMO set (28 codes).
Freezing drizzle/rain (56/57, 66/67) join their liquid siblings — the
temperature column already communicates freezing risk (Honest Data: the icon
states precipitation type at coarse granularity, numbers carry precision).
Rain showers (80–82) read as rain; snow showers/grains (85/86, 77) as snow.

**Alternatives considered**: Open-Meteo's own richer icon sets (day/night,
per-intensity) — rejected as anti-minimal; intensity is already a numeric
column. A "mostly cloudy" 9th bucket for code 2 — rejected, ⛅ covers 1–2
without meaningful information loss for ride planning.

## R2. Emoji vs SVG icons

**Decision**: Text emoji glyphs, no assets.

**Rationale**: Zero bytes of assets, inherits font rendering in light/dark
themes, satisfies the fully-static + minimalism constraints. Cross-OS
rendering variance accepted (spec assumption).

**Alternatives considered**: Inline monochrome SVG set — more visual
control, but adds asset weight and theming work for marginal gain; can be
swapped in later behind the same mapping module without touching call sites.

## R3. Table column placement and header

**Decision**: Insert the icon column between "Approx. km" and "Temperature".
Header cell is visually empty (no text) with `aria-label`/`title` from the
existing, currently unused `table.weather` dictionary key. Cell content is
the bare emoji with `title` + `aria-label` carrying the translated bucket
label; unknown → `DASH`.

**Rationale**: Time·km form the "where/when" prefix; the icon opens the
"what" group naturally. Reusing `table.weather` (already present in all
three dictionaries) keeps header semantics accessible without adding visible
width. An icon-only column costs ~2ch.

**Alternatives considered**: Merging into Time — vetoed by the user
(ambiguity). Text header "Weather" — rejected: the header word would be
wider than every cell, defeating the narrow-column goal.

## R4. Mobile cards and popup insertion points

**Decision**: Cards — append the icon to the existing header line
(`HH:MM · km N <icon>`), no new grid row. Popup — same: append to the
`<b>HH:MM · km N</b>` header line in `popupHtml()`. Both skip the icon
entirely (no dash) when the code is unknown, keeping the line clean.

**Rationale**: Header lines have free horizontal space; appending one glyph
adds no height on mobile and no popup redesign. In a one-line header a dash
would be noise, unlike in a table column where the empty cell needs an
explicit "no data" marker (Honest Data is still served: absence of an icon
asserts nothing).

**Alternatives considered**: A dedicated "Weather: …" row in cards/popup —
rejected, grows both surfaces for information the icon conveys in-line.

## R5. Module shape

**Decision**: `assets/js/lib/weather-icons.js` exports
`weatherCondition(code) → { icon, labelKey } | null` as a pure function over
a frozen lookup table. Callers translate `labelKey` via existing `t()`.

**Rationale**: Matches the lib convention (pure, DOM-free, Node-testable);
one shared mapping guarantees FR-008 (surfaces can never disagree).
