# Contract: `assets/js/lib/weather-icons.js`

Pure ES module, DOM-free, no imports beyond the standard language.

## Export

```js
export function weatherCondition(code) → { icon: string, labelKey: string } | null
```

- `code`: the raw Open-Meteo WMO `weather_code` value for one hour
  (number, or `null`/`undefined` when the provider had no value).
- Returns a frozen bucket descriptor for every documented WMO code
  (see research R1 table), or `null` for anything else. Never throws.

## Consumer obligations

| Consumer | On bucket | On `null` |
|---|---|---|
| `event-page.js` table cell | `<td title/aria-label=t(labelKey)>icon</td>` | `DASH` cell |
| `event-page.js` card header | append ` icon` to header line | append nothing |
| `map.js` `popupHtml()` header | append ` icon` to header line | append nothing |

- Labels are always passed through `t()` at render time (never cached
  across language switches) and escaped with `escapeHtml` when placed in
  attributes.
- Consumers must not maintain their own code→icon logic (FR-008).

## Tests (`tests/weather-icons.test.js`)

- Every documented WMO code returns a bucket with non-empty `icon` and a
  `labelKey` matching `/^weather\./`.
- Representative codes land in the right bucket (0→clear, 2→partlyCloudy,
  48→fog, 55→drizzle, 82→rain, 86→snow, 99→thunderstorm, …).
- `null`, `undefined`, `-1`, `100`, `'0'` (string) → `null`.
- Each of `assets/i18n/{ro,en,ru}.json` contains every `labelKey` the
  module can return.
