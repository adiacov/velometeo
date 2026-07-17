# Quickstart: validating Weather Condition Icons

## Prerequisites

- Node ≥ 20 (for `node --test`), any static file server for the site.

## Unit tests

```sh
npm test            # runs node --test 'tests/*.test.js', incl. weather-icons.test.js
```

Expected: all tests pass; `weather-icons.test.js` covers every WMO code,
unknown-input fallback, and ro/en/ru dictionary completeness.

## Manual validation

```sh
python3 -m http.server 8000   # from repo root
```

Open `http://localhost:8000/event.html?event=delacau-200-brm`:

1. **Table (P1)**: each forecast row shows an emoji in a narrow column
   between "Approx. km" and "Temperature"; the column header shows no text;
   hovering an icon shows the translated condition label; no horizontal
   scrolling appears that wasn't there before.
2. **Mobile cards (P2)**: narrow the viewport (≤ ~700px); each card header
   reads `HH:MM · km N <icon>`; card height unchanged.
3. **Popup (P3)**: open the map view, tap a weather marker; the popup header
   ends with the same icon; markers themselves look unchanged.
4. **i18n**: switch RO/EN/RU; hover labels change language everywhere.
5. **Honest data**: in DevTools, stub a row's `weatherCode` to `null`
   (or use a past event with archive gaps): table cell shows `—`;
   card/popup headers simply omit the icon.
6. **No new requests (SC-004)**: Network tab request count identical to
   `main` for the same page load.
7. **Themes**: toggle light/dark; icons remain legible.

Contract details: [contracts/weather-icons.md](contracts/weather-icons.md) ·
mapping: [research.md](research.md) R1.
