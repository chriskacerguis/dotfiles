# Copyable source

Working files lifted from the apps this system came from (Crow's Nest first,
then refined in the help site). Copy what you need,
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

These identifiers are app-specific and are left as obvious placeholders:

| Where | What | Notes |
|---|---|---|
| `theme.js` and `contexts/ThemeContext.jsx` | `STORAGE_KEY = 'app-theme'` | The two **must** match, or every load flashes the wrong theme |
| `lib/listView.js` | `KEY = 'app:list-views'` | Namespace it per app so two apps on one origin don't share back-links |
| `lib/api.js` | the `csrf_token` cookie name, `/api/v1/auth/refresh` | Match the server; drop both if the app uses server-side sessions with no refresh token |
| `lib/api.js` | `VITE_API_BASE_URL` | Leave empty when the SPA and API share an origin |
| `lib/useDocumentTitle.js` | `VITE_SITE_NAME` | The suffix in every browser tab title |

## What is generic and what is an example

**Generic — use as is**: `utils.js`, `api.js`, `errors.js`, `useApi.js`,
`useFilters.js`, `listView.js`, `useDebouncedValue.js`, `useDocumentTitle.js`,
`format.js`, everything in `components/ui/`, every component in `components/`
except `Badges.jsx`, both contexts, the stylesheet and the Tailwind config.

**Examples to replace**: the bottom halves of `lib/variants.js` and
`components/Badges.jsx` (below the "Examples" rule) — `priority`,
`requestStatus`, `health` and their badges.

Keep the top halves as they are: `TONES`, `badge`, `humanize`, `concept()` and
`ConceptBadge` are the system. Replace the example *vocabulary* with the app's
own. An order-tracking app has `pending`/`shipped`/`delivered`, not
`urgent`/`high`/`low` — but it maps them onto exactly the same eight tones with
the same one-concept-per-meaning discipline.

`ui/command.jsx` needs `cmdk`, and `ui/popover.jsx` needs
`@radix-ui/react-popover`; skip both until the app has a picker.

`format.js` similarly mixes generic formatters (`formatDate`, `formatNumber`,
`formatRelative`, `truncate`) with domain ones (`formatCvss`, `formatEpss`).
Keep the first group, drop the second.

## Tests

The originals ship with colocated tests. They are not copied here because they
assert the original app's vocabulary, but the pattern is worth keeping: a
`Foo.test.jsx` beside `Foo.jsx` asserting rendered output and behaviour, never
internals. For badges, assert the words (`'Waiting for customer'`, not the slug),
that the classes are `TONES[tone]`, that `null` renders a dash, and that an
unknown value renders neutrally in its own words.
