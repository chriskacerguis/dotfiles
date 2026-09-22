# Page recipes

The five shapes that cover almost every screen. Each is a skeleton to adapt, not
a component to import.

## List page with filters

The workhorse. Header, a filter bar in a card, a table, pagination.

```jsx
export default function Findings() {
  const { filters, setFilter, reset } = useFilters({ status: '', priority: '' });
  const { items, total, loading, error, reload } = useCollection(
    `/api/v1/findings${toQuery(filters)}`,
    [filters],
  );

  return (
    <div>
      <PageHeader title="Findings" description="…" />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b p-4">
          <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} className="w-full sm:w-72" />
          <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilter('priority', v)} options={PRIORITIES} />
          {dirty ? <Button variant="ghost" size="sm" onClick={reset}>Clear</Button> : null}
        </div>

        {loading ? <TableSkeleton /> : error ? <ErrorState error={error} onRetry={reload} /> : items.length === 0 ? (
          <EmptyState title={dirty ? 'Nothing matches those filters' : 'No findings yet'} description={…} />
        ) : (
          <Table>…</Table>
        )}
      </Card>

      <Pagination total={total} …  />
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
- **Filters go in the URL** via `useFilters`, so the view is shareable.
- Use `TableSkeleton` rather than a spinner when the shape of the result is
  already known — it is less jarring than a layout that pops in.

## Detail page

```jsx
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
go in the header's children slot so they sit under the title. Metadata panels use
a `<dl>` with a `Row` helper rather than a table — it is not tabular data.

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

Confirm-destructive and form-submit, as in `components.md`. The consistent part
is the aftermath: a toast on success naming what happened, the dialog staying
open on failure with the error shown, and a reload of the underlying list.

```jsx
try {
  await api.del(`/api/v1/watchlist/${entry.id}`);
  toast.success(`Stopped watching ${entry.name}`, {
    description: 'Its findings were resolved. The record that they existed is kept.',
  });
  reload();
} catch (caught) {
  toast.error('Could not remove the watch', { description: caught.message });
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
