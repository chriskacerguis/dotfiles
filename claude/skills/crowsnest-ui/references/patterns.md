# Page recipes

The five shapes that cover almost every screen. Each is a skeleton to adapt, not
a component to import.

## List page with filters

The workhorse. Header, a filter bar in a card, a table, pagination.

```jsx
const DEFAULTS = { q: '', status: '', priority: '', sort: '', order: '', page: '' };
const FILTER_KEYS = ['q', 'status', 'priority'];

export default function Findings() {
  useDocumentTitle('Findings');
  const { filters, setFilter, setFilters } = useFilters(DEFAULTS);
  const path = `/api/v1/findings${toQuery(filters)}`;
  const { items, pagination, loading, error, reload } = useCollection(path, [path]);
  const activeCount = FILTER_KEYS.filter((key) => filters[key]).length;
  const clearFilters = () => setFilters(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])));

  return (
    <div>
      <PageHeader title="Findings" description="…" />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeCount} onClear={clearFilters}>
          <SearchField value={filters.q} onSearch={(q) => setFilter('q', q)} className="w-full lg:w-80" />
          <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilter('priority', v)} options={PRIORITY_OPTIONS} />
        </FilterBar>

        {loading && !items.length ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : items.length === 0 ? (
          activeCount ? (
            <EmptyState icon={SearchX} title="No findings match these filters" description="Try widening them, or clear them to see everything."
              action={<Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>} />
          ) : (
            <EmptyState title="No findings yet" description={…} />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader column="created" label="Opened" firstOrder="desc" sort={filters.sort} order={filters.order}
                    onSort={(sort, order) => setFilters({ sort, order })} />
                  …
                </TableRow>
              </TableHeader>
              …
            </Table>
            <Pagination pagination={pagination} onPageChange={(page) => setFilter('page', page)} />
          </>
        )}
      </Card>
    </div>
  );
}
```

Points that matter:

- **`Card` gets `overflow-hidden`** so the table's corners are clipped by the
  card's radius.
- **The filter bar is inside the card, above a `border-b`**, not floating above
  it. It belongs to the table.
- **Two distinct empty states.** "Nothing yet" and "nothing matches" are
  different problems; the second needs a way to clear filters, the first needs a
  way to create something.
- **Everything is in the URL** — filters, sort, page — via `useFilters`, so the
  view is a shareable link, survives a reload, and `BackLink` can return to it.
- **The path is the dependency.** `useCollection(path, [path])`: one string
  that changes exactly when the request should.
- **`loading && !items.length`** shows the skeleton on first load only; a
  re-fetch for a new page keeps the old rows up rather than flashing.
- Use `TableSkeleton` rather than a spinner when the shape of the result is
  already known — it is less jarring than a layout that pops in.
- **Bulk actions** on a selectable table: a bar under the filters that appears
  with the selection, says how many are selected, and reports a partial result
  honestly ("3 changed; 1 refused" with the reason per item). A new list path is
  a new selection — clear it when the path changes.

## Detail page

```jsx
<BackLink to="/findings">Back to findings</BackLink>
<PageHeader title={item.name} description={item.summary} actions={…}>
  <div className="mt-2 flex flex-wrap items-center gap-2">
    <SeverityBadge severity={item.severity} />
    <StatusBadge status={item.status} />
  </div>
</PageHeader>

<div className="grid gap-4 lg:grid-cols-3">
  <div className="space-y-4 lg:col-span-2">{/* the substance */}</div>
  <div className="space-y-4">{/* metadata, related, actions */}</div>
</div>
```

Two-thirds / one-third, collapsing to one column below `lg`. Identifying badges
go in the header's children slot so they sit under the title. Each panel is a
`SectionCard`; metadata inside one is a `DetailList` of `DetailRow`s rather than
a table — it is not tabular data. Occasional actions ("Request approval") fold
into a `Disclosure` rather than sitting open as a form. A sentence about the
item's state ("This request was closed on 3 May") is a `Notice` above the grid.

`BackLink` returns to the list as it was left. `useApi` returns `null` data the
moment the route's id changes, so moving from item 7 to item 8 can never show
7's content under 8's URL.

## Dashboard

```jsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard label="Affecting us" value={n} tone="critical" to="/affecting-us" icon={ShieldAlert} />
  …
</div>
```

Then panels below, usually `lg:grid-cols-2`. Every tile links somewhere. Lead
with the number that answers the question the user actually came with, and put
supporting figures after it — a dashboard that treats every number as equally
important communicates nothing.

## Settings page

Settings render from a declaration, grouped into labelled sections, with a save
bar that appears only when something is dirty.

- Only send changed keys. It avoids clobbering a concurrent edit and is what
  makes an untouched `secret` field safe.
- Show where each value came from (set here / environment / default).
- Validate per-field and show the error under the field, not in a toast.
- Say what a change *does*, in the help text, including anything it triggers
  elsewhere.

## Dialog flows

`ConfirmDialog`, `TypedConfirmDialog` and form dialogs, as in `components.md`.
The consistent part is the aftermath: a toast on success naming what happened,
the dialog staying open on failure with the error shown, and a reload of the
underlying list.

```jsx
async function remove() {
  try {
    await api.del(`/api/v1/watchlist/${entry.id}`);
    toast.success(`Stopped watching ${entry.name}`, {
      description: 'Its findings were resolved. The record that they existed is kept.',
    });
    reload();
  } catch (caught) {
    toast.error('Could not remove the watch', { description: describeError(caught).description });
  }
}
```

In a form, a 422 goes to the fields, anything else to a toast:

```jsx
} catch (caught) {
  if (caught.status === 422) setFieldErrors(caught.fieldErrors);
  else toast.error('Nothing was saved', { description: describeError(caught).description });
}
```

Note the description: it says what happened to the related data. A user deleting
something wants to know what they just lost.

## Tables

- Header cells are `SortableHeader` when the column is sortable.
- The first column usually carries the identifier plus badges plus a truncated
  description, in a `max-w-0` cell — that is the trick that makes `truncate`
  work inside a table and lets the column absorb slack.
- Numeric columns get `tabular-nums`; date columns `whitespace-nowrap`.
- Row actions are a right-aligned `flex gap-0.5` of `ghost`/`icon` buttons, each
  with an `aria-label` naming the row.
- Secondary columns drop out on narrow screens with `hidden md:table-cell`.
- A cell that mixes a number with a badge needs `whitespace-nowrap`, or the text
  becomes an anonymous flex item and breaks mid-phrase when the badge is wide.
