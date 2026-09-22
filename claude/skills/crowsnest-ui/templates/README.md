# Copyable source

Working files lifted from the app this system came from. Copy what you need,
then own them — these are not a dependency, and editing them in place is the
intended way to use them.

## Where things go

```
templates/index.css          →  src/index.css
templates/tailwind.config.js →  tailwind.config.js
templates/theme.js           →  public/theme.js   (referenced from index.html)
templates/lib/*              →  src/lib/
templates/components/*       →  src/components/
templates/components/ui/*    →  src/components/ui/
templates/contexts/*         →  src/contexts/
```

## Rename before you run

Three identifiers are app-specific and are left as obvious placeholders:

| Where | What | Notes |
|---|---|---|
| `theme.js` and `contexts/ThemeContext.jsx` | `STORAGE_KEY = 'app-theme'` | The two **must** match, or every load flashes the wrong theme |
| `lib/api.js` | the `csrf_token` cookie name | Match whatever the server sets |
| `lib/api.js` | `VITE_API_BASE_URL` | Leave empty when the SPA and API share an origin |

## What is generic and what is an example

**Generic — use as is**: `utils.js`, `useApi.js`, `useFilters.js`, `api.js`,
`format.js`, everything in `components/ui/`, `PageHeader`, `StateViews`,
`StatCard`, `FilterBar`, `SortableHeader`, `Pagination`, `SettingField`, both
contexts, the stylesheet and the Tailwind config.

**Examples to replace**: `lib/variants.js` and `components/Badges.jsx` carry the
original app's domain — priorities, severities, exploit and match statuses.

Keep their *shape*: a `cva` map per concept, the light/dark colour pairs, the
`humanize`/`labelFor` helpers, and a four-line badge wrapper per map. Replace
their *vocabulary* with the app's own. An order-tracking app has
`pending`/`shipped`/`delivered`, not `critical`/`high`/`low` — but it wants
exactly the same escalation palette and the same one-map-per-concept discipline.

`format.js` similarly mixes generic formatters (`formatDate`, `formatNumber`,
`formatRelative`, `truncate`) with domain ones (`formatCvss`, `formatEpss`).
Keep the first group, drop the second.

## Tests

The originals ship with colocated tests. They are not copied here because they
assert the original app's vocabulary, but the pattern is worth keeping: a
`Foo.test.jsx` beside `Foo.jsx` asserting rendered output and behaviour, never
internals.
