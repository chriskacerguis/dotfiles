# The shared components

Working source for all of these is in `templates/`. This file says what each one
is for and where the judgement calls are.

## Contents

- [Primitives (`ui/`)](#primitives-ui)
- [PageHeader](#pageheader)
- [StateViews](#stateviews) — loading, error, empty, table skeleton
- [StatCard](#statcard)
- [FilterBar](#filterbar) — SearchInput, FilterSelect
- [SortableHeader](#sortableheader)
- [Badges](#badges)
- [Pagination](#pagination)
- [SettingField](#settingfield)
- [Dialogs](#dialogs)
- [Layout shells](#layout-shells)

## Primitives (`ui/`)

Copied-in shadcn-style primitives, owned by the project: `button`, `card`,
`badge`, `table`, `dialog`, `select`, `dropdown-menu`, `switch`, `input`,
`label`, `textarea`, `tabs`, `tooltip`, `separator`, `skeleton`.

Two conventions run through all of them: they accept `className` and merge it
last through `cn()`, and they forward refs. That is what lets a caller adjust one
instance without a wrapper component or an `!important`.

**Button** variants are `default`, `destructive`, `outline`, `secondary`,
`ghost`, `link`; sizes `default`, `sm`, `lg`, `icon`. Page-header actions are
`size="sm"`; table row actions are `variant="ghost" size="icon"` with an
`aria-label`. `asChild` renders through a Radix `Slot`, which is how a Button
becomes a router `Link` without nesting an anchor in a button.

**Table** wraps in `<div class="relative w-full overflow-x-auto">`. That wrapper
is the reason wide tables scroll instead of breaking the page on a phone — keep
it.

## PageHeader

Title, optional description, optional right-hand actions, optional children for a
contextual note.

```jsx
<PageHeader
  title="Watchlist"
  description="Products you have told the system you run."
  actions={canWrite ? <Button size="sm"><Plus className="h-4 w-4" />Watch a product</Button> : null}
>
  {unmatched > 0 ? <p className="mt-2 text-sm text-muted-foreground">…</p> : null}
</PageHeader>
```

It stacks on mobile (`flex-col sm:flex-row`) and the title block is `min-w-0` so
a long title truncates rather than shoving the actions off screen. Actions are
`shrink-0`. Gate write actions on permission at the call site and pass `null` —
the component does not know about roles.

## StateViews

`LoadingState`, `ErrorState`, `EmptyState`, `TableSkeleton`. Every data view
renders all three of the first group:

```jsx
if (loading) return <LoadingState label="Loading the watchlist…" />;
if (error) return <ErrorState error={error} onRetry={reload} />;
```

**`ErrorState` distinguishes three cases**, and the distinction is the point:

- **403** — "You do not have access to this", a lock icon, and *no retry button*,
  because retrying cannot help.
- **401** — "Your session has ended / Taking you to the sign-in page…", also no
  retry. The auth layer is already redirecting; this is the frame before it
  lands. It must not accuse the user of breaking something.
- **anything else** — "Something went wrong", the message, and a retry.

**`EmptyState` is a design surface, not a fallback.** It takes an icon, a title,
a description and an optional action, and it should say what to do next:

```jsx
<EmptyState
  icon={Target}
  title="Nothing on the watchlist"
  description="Add the things your inventory does not cover — a managed database, a load balancer — and they will be watched like any other asset."
  action={canWrite ? <Button size="sm" onClick={openCreate}>Watch the first one</Button> : null}
/>
```

Distinguish "nothing exists yet" from "nothing matches this filter". They are
different situations and deserve different words.

## StatCard

A number on a dashboard. `label`, `value`, `hint`, `tone`, `to`, `icon`.

Tones (`default`, `critical`, `high`, `medium`, `good`) tint the border and the
value, not the whole tile — a wall of filled colour stops meaning anything.

**Pass `to` whenever the number corresponds to a filtered view.** A figure you
cannot click is a dead end; the whole point of a dashboard is to be a way in.
Values render through `formatNumber` with `tabular-nums`.

## FilterBar

`SearchInput` (a magnifier-prefixed input, `pl-8` for the icon, always
`aria-label`led) and `FilterSelect` (a labelled Radix select whose "Any" option
maps to an empty value).

Filters belong in the URL, not component state, so a filtered view can be
shared and survives a reload — see `lib/useFilters.js` in `templates/`.

## SortableHeader

A table header cell that is a sort control: shows direction on the active column,
neutral affordance otherwise, toggles direction on repeat click. Takes
`column`, `label`, `sort`, `order`, `onSort` and an optional `className` for a
width hint.

Width hints (`w-20`, `w-28`, `w-40`) are hints — the table uses auto layout. Pair
a narrow column with `whitespace-nowrap` on the cell, or the content wraps
instead of the column growing.

## Badges

Thin wrappers over the `cva` maps in `lib/variants.js`: `PriorityBadge`,
`SeverityBadge`, `StatusBadge`, and whatever the domain needs.

Each returns an em dash in `text-muted-foreground` for a null value rather than
rendering an empty badge — an absent value and a neutral value look different and
should stay that way.

Add a new badge by adding a `cva` map to `lib/variants.js` and a four-line
wrapper here. Never inline the colour decision at the call site.

## Pagination

Page position, and previous/next controls that disable at the ends. Bind it to
the same URL state as the filters so a page number survives a reload.

## SettingField

Renders one setting from its *declaration* — type, label, help, permitted range —
rather than from a hardcoded form. Adding a setting on the server makes it appear
here with the right control.

Types: `boolean` (switch), `integer`/`number`, `string`, `enum` (select),
`string[]` (multi-select toggles when the declaration carries options, otherwise
a one-per-line textarea), `json` (monospace textarea), `secret`.

**`secret` is the one with a rule.** A stored credential is never sent to the
browser; the field shows whether one is configured, typing replaces it, and
saving it empty clears it. An untouched secret field must stay out of the save
payload or it will wipe the stored value.

A source badge shows where a value came from — set here, from the environment, or
the built-in default — which is what makes "why is this not what I set?"
answerable.

## Dialogs

Radix `Dialog`. Two shapes:

**Confirm**: `max-w-md`, a title that asks the question, a description that says
what actually happens (including what is *not* lost), Cancel then a
`variant="destructive"` confirm.

**Form**: controlled open state, submit disabled while pending, validation errors
under the offending field, a toast on success, the dialog left open on failure so
the entered data is not lost.

## Layout shells

**AppLayout** — sidebar shell. Nav is grouped into labelled sections, because
grouping is itself information: keep "things about us" separate from "reference
data", and never mix a destructive or admin-only route into an everyday group.
Collapses to a sheet on mobile; holds the theme toggle, global search and the
user menu.

**AuthLayout** — centred single-card shell for sign-in, with no nav, because
there is nothing to navigate to yet.
