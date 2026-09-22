---
name: crowsnest-ui
description: Chris's house design system for React apps - the semantic-token theme, dark mode, cn()/cva conventions, and the shared component set (PageHeader, StateViews, StatCard, FilterBar, SortableHeader, badge maps, data tables, settings fields) extracted from Crow's Nest. Use this whenever building or restyling a React UI in any of Chris's apps: a new page, a dashboard, a table, a form, a settings screen, an empty/loading/error state, a nav shell, or a theme. Also use it when starting a new frontend from scratch, when an app's look needs to match the others, or when a component "should look like Crow's Nest". Load this BEFORE tailwind-ui or shadcn - those supply generic patterns, this supplies the house conventions they must be translated into.
---

# The house design system

This is the design system from Crow's Nest, written down so every other app can
look and behave like it. It is not a component library you install — it is a set
of conventions plus copyable source. You bring the files into the project and own
them.

## Why it looks the way it does

Three decisions produce most of the character. Understanding them matters more
than memorising class strings, because they tell you what to do in the cases this
document does not cover.

**Semantic tokens, never raw colours for chrome.** Every surface, border and
piece of text refers to `background`, `foreground`, `card`, `muted`,
`muted-foreground`, `border`, `primary`, `destructive`. Those resolve to CSS
variables that are redefined for dark mode in one place. A component written this
way is dark-mode-correct without anyone thinking about it, and the whole product
can be recoloured from one file. Raw palette colours (`red-50`, `emerald-300`)
appear in exactly one situation: **encoding a value's meaning** — a severity, a
status, a priority. Those need to survive a theme change because red *means*
something.

**Meaning lives in one map, not in the markup.** Every value→style mapping is a
`cva` map in `lib/variants.js`. Recolouring "critical" everywhere is one edit.
Scattering `className={status === 'bad' ? 'text-red-600' : ...}` across pages is
how a product drifts out of alignment with itself.

**Every data view states its three states explicitly.** Loading, error, empty.
`StateViews.jsx` gives you all three, and a page that renders a bare table with
no empty state is unfinished. The empty state is a design surface — it is what a
new user sees first, so it says what to do next, not "No data".

## Getting started

**New project**: copy `templates/` into `frontend/src/` and the config files into
the frontend root. `references/setup.md` has the dependency list, the Tailwind
config, the token stylesheet, and the pre-paint theme script — do not skip that
last one, it is what stops the white flash on load in dark mode.

**Existing project**: read `references/adoption.md`. It has an ordered migration
path that keeps the app working at every step, and a short audit checklist for
finding what is off-system.

**A single component or page**: skip setup, read `references/components.md` for
the piece you need, and follow the layout recipes below.

## Reference map

Read the one you need; they are independent.

| File | Contents |
|---|---|
| `references/setup.md` | Dependencies, Tailwind config, `index.css` tokens, theme provider, pre-paint script, file layout |
| `references/tokens.md` | The full token table with light/dark values, when to use each, the meaning-colour palettes |
| `references/components.md` | Every shared component: props, when to reach for it, what it deliberately does not do |
| `references/patterns.md` | Page recipes — list+filter page, detail page, dashboard, settings page, dialog flows, tables |
| `references/data.md` | The `api.js` client, `useApi`/`useCollection`, the `{data}` envelope, error and session-expiry handling, toasts |
| `references/adoption.md` | Migrating an existing app onto this system, in an order that never leaves it broken |

`templates/` holds working source to copy: `lib/`, `components/`, `components/ui/`,
`contexts/`, `index.css`, `tailwind.config.js`, `theme.js`. Prefer adapting these
over writing equivalents — they already carry the conventions.

## The rules that matter

Follow these and the result will fit; the references explain the rest.

**Compose classes with `cn()`.** `clsx` + `tailwind-merge`. It lets a caller
override a component's own classes without specificity fights, which is why every
component takes `className` and passes it through `cn()` last.

**Express variants with `cva`, in `lib/variants.js`.** Not inline ternaries. Make
sure Tailwind's `content` glob covers `lib/` or the classes get purged in
production and you get unstyled badges only in the build.

**Order classes layout-first**: display → position → sizing → spacing →
typography → color → border → effects. It makes long class strings scannable and
diffs readable.

**Dark mode is not a feature, it is half of done.** Chrome gets it free from the
tokens. Meaning-colours need an explicit `dark:` pair — the pattern is a light
tint plus a dark translucent tint: `border-red-300 bg-red-50 text-red-800
dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200`. Check both themes
before calling a component finished.

**Responsive down to a phone.** Stack with `flex-col sm:flex-row`, hide
secondary columns with `hidden md:table-cell`, and put wide tables in the
`Table` wrapper, which scrolls horizontally rather than breaking the page.

**Numbers use `tabular-nums`.** Any figure in a table column or a stat tile, so
digits line up between rows. Identifiers and versions use `font-mono`.

**Focus is always visible.** The global `:focus-visible` ring is deliberate and
must not be removed per-component. Interactive elements get an `aria-label` when
their only content is an icon.

**Icons come from `lucide-react`**, sized `h-4 w-4` inline and `h-3 w-3` inside
badges, always `aria-hidden="true"` when adjacent text already says it.

## Writing text in the UI

The tone is part of the design, and it is the part most easily lost. The house
style is plain, specific and honest:

- Say what happened and what to do about it. "No inventory is configured, so
  Crow's Nest cannot tell whether any of this affects you" beats "No data".
- Name the thing that is wrong, in the words of the system the user configures —
  a variable name, a settings page, a provider's own term.
- Never blame the user, and never say "Something went wrong" when you know what
  went wrong.
- Prefer a sentence that teaches over a label that merely identifies. Help text
  under a setting should explain the trade-off, not restate the label.

A component that looks right but says "Error" is not done.

## A component that fits, end to end

```jsx
import { cn } from '@/lib/utils';
import { priorityBadge } from '@/lib/variants';

/**
 * Why this component exists, and any judgement call inside it.
 */
export function PriorityBadge({ priority, className }) {
  if (!priority) return <span className="text-muted-foreground">—</span>;
  return <span className={cn(priorityBadge({ priority }), className)}>{humanize(priority)}</span>;
}
```

Small, one job, `className` passed through, a real fallback for the empty case,
and the colour decision delegated to the shared map. That is the whole pattern.

## Checklist before calling a UI change done

- Both themes checked, including meaning-colours
- Loading, error and empty states all present and written like a human
- Works at phone width with no horizontal page scroll
- Keyboard reachable, focus visible, icon-only controls labelled
- No raw colour classes for chrome; no inline value→style ternaries
- Numbers `tabular-nums`, identifiers `font-mono`
- Colocated `.test.jsx` covering behaviour and rendered output, not internals
