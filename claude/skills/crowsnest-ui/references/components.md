# The shared components

Working source for all of these is in `templates/`. This file says what each one
is for and where the judgement calls are.

## Contents

- [Primitives (`ui/`)](#primitives-ui)
- [PageHeader](#pageheader)
- [StateViews](#stateviews) — loading, error, empty, table skeleton
- [StatCard](#statcard)
- [FilterBar](#filterbar) — FilterBar, SearchInput, FilterSelect
- [SearchField](#searchfield)
- [ChipFilter](#chipfilter)
- [SortableHeader](#sortableheader)
- [Badges](#badges) — ConceptBadge and its wrappers
- [Notice](#notice)
- [Pagination](#pagination)
- [Field](#field)
- [SettingField](#settingfield)
- [SectionCard and DetailList](#sectioncard-and-detaillist)
- [Disclosure](#disclosure)
- [Dialogs](#dialogs) — ConfirmDialog, TypedConfirmDialog, form dialogs
- [Links](#links) — BackLink, ExternalLink
- [ThemeToggle](#themetoggle)
- [Layout shells](#layout-shells)

## Primitives (`ui/`)

Copied-in shadcn-style primitives, owned by the project: `button`, `card`,
`badge`, `table`, `dialog`, `select`, `dropdown-menu`, `switch`, `input`,
`label`, `textarea`, `tabs`, `tooltip`, `separator`, `skeleton`, plus `popover`
and `command` (the pair a searchable picker is built from) and `sheet` (the
mobile navigation drawer).

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
it. `TableFooter` is for a totals row.

**Input, Textarea and SelectTrigger** turn their border destructive under
`aria-invalid="true"`. They never decide that themselves — `Field` sets it from
the server's refusal.

**Sheet** is built on the Dialog primitive, so it traps focus, closes on Escape
and returns focus to the button that opened it — which is why the mobile nav is a
sheet and not a hand-rolled slide-out.

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

**`ErrorState` says what actually happened**, through `describeError` in
`lib/errors.js` — one place, so a 403 reads the same in a panel and on a full
page:

| Kind | Status | Says | Retry? |
|---|---|---|---|
| `unauthorized` | 401 | "Your session has ended / Taking you to the sign-in page…" | No — the auth layer is already redirecting |
| `forbidden` | 403 | "You do not have access to this", lock icon | No — retrying cannot help |
| `notFound` | 404 | "This could not be found" | No |
| `unreachable` | none | "The server could not be reached / Check your network…" | Yes |
| `failed` | 5xx etc. | "This could not be loaded" | Yes |

The API's own message is shown whenever it says something specific — it is
written for the reader. The one exception is the server's generic 5xx sentence
("Internal server error"), which says nothing a person can act on, so it is
replaced with what they can do. Use `describeError` for toasts too, so a failed
action and a failed page say the same thing.

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
different situations and deserve different words — the second uses `SearchX`
and a "Clear filters" action (see the list recipe in `patterns.md`).

## StatCard

A number on a dashboard. `label`, `value`, `hint`, `tone`, `to`, `icon`.

Tones (`default`, `critical`, `high`, `medium`, `good`) tint the border and the
value, not the whole tile — a wall of filled colour stops meaning anything.

**Pass `to` whenever the number corresponds to a filtered view.** A figure you
cannot click is a dead end; the whole point of a dashboard is to be a way in.
A number `value` renders through `formatNumber` with `tabular-nums`; a string —
a rate, a duration, a size the caller has already worded — is shown as it is.

## FilterBar

`FilterBar` is the strip above a table: its controls as children, and a "Clear"
that appears only when `activeCount` is non-zero. `SearchInput` is a
magnifier-prefixed input (`pl-8` for the icon, always `aria-label`led) and
`FilterSelect` a labelled Radix select whose "Any" option maps to an empty value.

Filters belong in the URL, not component state, so a filtered view can be
shared and survives a reload — see `useFilters` in `data.md`.

## SearchField

`SearchInput` bound to a URL filter: it updates the filter once the person
pauses typing (`useDebouncedValue`, 300 ms) rather than on every keystroke, and
it follows the URL back, so a "Clear filters" elsewhere empties it. Use this on
a list page; use bare `SearchInput` for a local, in-memory filter.

```jsx
<SearchField value={filters.q} onSearch={(q) => setFilter('q', q)} placeholder="Search…" className="w-full lg:w-80" />
```

## ChipFilter

A short set of mutually exclusive choices shown all at once — a catalog's
categories, a handful of statuses — where a select would hide them. Options are
`{ value, label, count?, icon? }`; the "all" choice is value `''`. Each chip is
a toggle button with `aria-pressed`, and the group is labelled. More than about
seven options wants a `FilterSelect` instead.

## SortableHeader

A table header cell that is a sort control. Takes `column`, `label`, `sort`,
`order`, `onSort(column, order)`, and optionally `firstOrder`, `align` and a
`className` for a width or a responsive hide.

**`firstOrder` is the direction a person reads that column in first**: newest
for a date, soonest for a due date, A–Z for a name. Clicking an inactive column
sorts it that way; clicking the active one flips it. `align="right"` puts the
arrow on the left for a right-aligned numeric column. `aria-sort` is on the
`<th>`, where assistive technology reads it.

Width hints (`w-20`, `w-28`, `w-40`) are hints — the table uses auto layout. Pair
a narrow column with `whitespace-nowrap` on the cell, or the content wraps
instead of the column growing.

## Badges

Every badge is a `ConceptBadge`: a `concept` from `lib/variants.js`, a `value`,
an optional `icon`, an optional `label`. `Badges.jsx` holds thin named wrappers —
`<PriorityBadge priority={…} />` — so a page says what it is showing and never
decides a colour.

What `ConceptBadge` does for free:

- **Words, not slugs.** The concept's `labels`, else `humanize(value)`:
  `waiting_for_customer` → "Waiting for customer". A value already stored as
  words ("Ready to Deploy") is left alone.
- **A dash for nothing.** `null`/`''` renders an em dash in
  `text-muted-foreground`, never an empty pill — an absent value and a neutral
  value look different and should.
- **Unknown values degrade gracefully.** A state the server added before the UI
  learned of it renders in the `neutral` tone, in its own words.

`label` overrides the words when context says more than the concept can — and it
may be a node. The house example is an approval waiting on a named person:

```jsx
const label = approver ? <>Awaiting<span className="sr-only"> approval from</span> {approver.name}</> : undefined;
<ConceptBadge concept={requestStatus} value="pending" label={label} icon={Clock} />
```

Sighted readers get "Awaiting Dana Reyes" in amber; a screen reader hears
"Awaiting approval from Dana Reyes" — the meaning the colour carried.

**Add a badge** by adding a `concept({ tones, labels? })` to `variants.js` —
tones chosen from the eight in `TONES` — and a one-line wrapper here. Never
inline the colour decision at the call site, and never write a new colour string
for a badge.

## Notice

A sentence the page needs to say about what just happened or why nothing can be
done — "You approved request #12", "This request has been closed". `tone` is one
of the `TONES` (default `low`); the icon follows it, so a warning looks like
every other warning. `role="status"`, so a screen reader announces it when it
appears after an action without interrupting.

A Notice is page state; a toast is the result of an action. If it should still
be there on reload, it is a Notice.

## Pagination

"Showing 26–50 of 312" and previous/next controls that disable at the ends.
Takes the `pagination` block a list response carries — `{ total, page, pages,
limit }` — and `onPageChange(page)`. Renders nothing for an empty list. Bind
`onPageChange` to the same URL state as the filters (`setFilter('page', n)`) so
the page survives a reload and a back-link.

## Field

One labelled control on a form: the label (with a `*` for `required`, or
"(optional)"), the control as its single child, then either the server's refusal
for that field or a hint. It hands the child its `id`, `aria-invalid` and
`aria-describedby`, so the error is read out with the control and the border
turns destructive.

```jsx
<Field id="name" label="Name" required error={fieldErrors.name} hint="As it appears on the invoice.">
  <Input value={name} onChange={(e) => setName(e.target.value)} />
</Field>
```

`fieldErrors` comes from a 422's `ApiError.fieldErrors` (`data.md`). Validation
errors go here, under the field where the fix is — never in a toast.

## SettingField

Renders one setting from its *declaration* — type, label, help, permitted range —
rather than from a hardcoded form. Adding a setting on the server makes it appear
here with the right control.

Types: `boolean` (switch), `integer`/`number`, `string`, `url`, `text` (a
multi-line monospace textarea, laid out under the label rather than beside it),
`enum` (select), `string[]` (multi-select toggles when the declaration carries
options, otherwise a one-per-line textarea), `json` (monospace textarea),
`secret`. A declaration's `placeholder` and `max_length` pass through.

**`secret` is the one with a rule.** A stored credential is never sent to the
browser; the field shows whether one is stored. Typing replaces it; left blank it
is kept; the reset button beside it removes it. An untouched secret field must
stay out of the save payload or it will wipe the stored value.

A source badge shows where a value came from — set here, from the environment, or
the built-in default — which is what makes "why is this not what I set?"
answerable.

## SectionCard and DetailList

**`SectionCard`** is one card of a detail page: a small `h2` (optional icon),
something beside it (`aside` — a count, an Edit link), then the body. It is a
named `region`, so a screen reader can jump between cards by title. Extra props
(`id` to scroll to, `tabIndex`) land on the card.

**`DetailList` / `DetailRow`** render label/value metadata as a `<dl>` — label
above value on a phone, a fixed `sm:w-40` label column beside it from `sm` up.
Metadata is not tabular data; do not put it in a table.

```jsx
<SectionCard title="Details" icon={Info}>
  <DetailList>
    <DetailRow label="Owner" icon={User}>{owner.name}</DetailRow>
    <DetailRow label="Created">{formatDateTime(item.created_at)}</DetailRow>
  </DetailList>
</SectionCard>
```

## Disclosure

A form or detail most visits do not need, folded behind one link-styled line
("Request approval", "Add a note"). Open, the line stays as the way to fold it
back; `aria-expanded`/`aria-controls` are wired. Collapsed by default because an
always-open form reads as a step that was skipped — pass `defaultOpen` when the
person has just asked for it.

## Dialogs

Radix `Dialog`. Three shapes:

**`ConfirmDialog`** — a button that asks before it acts, for a decision that
tells someone else the outcome or cannot be quietly undone. The trigger is its
`children`; `title` asks the question, `description` says what actually happens
(including what is *not* lost), `confirmVariant="destructive"` when it destroys
something. It closes *before* calling `onConfirm`, so whatever the page shows
next is not hidden behind it.

```jsx
<ConfirmDialog
  title="Remove this watch?"
  description="Its findings are resolved. The record that they existed is kept."
  confirmLabel="Remove"
  confirmVariant="destructive"
  onConfirm={remove}
>
  <Button variant="ghost" size="icon" aria-label={`Remove ${entry.name}`}><Trash2 className="h-4 w-4" /></Button>
</ConfirmDialog>
```

**`TypedConfirmDialog`** — for the irreversible *and* easy-to-aim-wrong:
destroying a server, deleting a project. The person types the thing's own name
(`expected`) before the destructive button enables, so a destroy means having
looked at what is being destroyed. Reserve it for that; on everyday deletes it
is friction that trains people to type without reading.

**Form dialog** — controlled open state, submit disabled while pending, `Field`
errors under the offending field, a toast on success, the dialog left open on
failure so the entered data is not lost.

## Links

**`BackLink`** — "← Back to assets" at the top of a detail page. It returns to
the list *as it was left* — page, filters, sort — via `lib/listView.js`, which
`useFilters` feeds. Going back from an item on page 6 lands on page 6. `to` is
the list's bare path.

**`ExternalLink`** — a link off the site: new tab, `rel="noopener noreferrer"`,
a small external icon, and "(opens in a new tab)" for screen readers. Never
hand-roll `target="_blank"`.

## ThemeToggle

A ghost icon button that flips light/dark through `ThemeContext`, labelled with
what it will do ("Switch to dark mode"). It lives in the layout shell's header.

## Layout shells

**AppLayout** — sidebar shell. Nav is grouped into labelled sections, because
grouping is itself information: keep "things about us" separate from "reference
data", and never mix a destructive or admin-only route into an everyday group.
Collapses to a `Sheet` on mobile; holds the `ThemeToggle`, global search and the
user menu.

**AuthLayout** — centred single-card shell for sign-in, with no nav, because
there is nothing to navigate to yet.
