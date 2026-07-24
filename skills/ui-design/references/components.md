# Component recipes — copy-paste

Plain **HTML + Tailwind**. The classes are identical in any engine — adapt the
dynamic bits (`{{ }}`, loops, conditionals) to EJS / JSX / Pug / Blade. Swap
`bg-indigo-600` etc. only if you've changed the accent token.

---

## Page skeleton & headers

Body + nav + footer: see the skeleton in SKILL.md. Content goes in the standard
container:

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><!-- content --></div>
```

App page header (back arrow + accent icon + title):

```html
<div class="flex items-center gap-3 mb-8">
  <a href="/back" class="text-sm text-gray-400 hover:text-indigo-600" title="Back"><i class="fa-solid fa-arrow-left"></i></a>
  <h1 class="text-2xl font-semibold text-gray-900"><i class="fa-solid fa-box mr-2 text-indigo-600"></i> Page Title</h1>
</div>
```

Centered landing header:

```html
<div class="text-center mb-10">
  <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Title</h1>
  <p class="mt-3 text-lg text-gray-500">Subtitle / lede.</p>
</div>
```

---

## Cards

Static:

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">…</div>
```

Interactive / clickable (whole-card link via absolute overlay):

```html
<article class="relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer">
  <a href="/thing/1" class="absolute inset-0 rounded-xl" aria-label="View details"></a>
  <!-- inner interactive links need `relative z-10` to sit above the overlay -->
</article>
```

Section card with header + body:

```html
<div class="bg-white rounded-xl ring-1 ring-gray-200 shadow-sm">
  <div class="px-6 py-4 border-b border-gray-100">
    <h2 class="text-base font-semibold text-gray-800"><i class="fa-regular fa-comments mr-2 text-gray-400"></i> Section</h2>
  </div>
  <div class="px-6 py-5">…</div>
</div>
```

KPI / stat card (render several inside a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`):

```html
<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
  <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Label</p>
  <p class="mt-2 text-2xl font-bold text-gray-900">42</p>
  <p class="mt-1 text-xs text-gray-400">hint / delta</p>
</div>
```

---

## Buttons

```html
<!-- Primary -->
<button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">
  <i class="fa-solid fa-floppy-disk"></i> Save
</button>

<!-- Secondary -->
<a href="/cancel" class="inline-flex items-center gap-2 rounded-lg ring-1 ring-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</a>

<!-- Danger -->
<button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
  <i class="fa-solid fa-trash"></i> Delete
</button>

<!-- Small table-action, secondary -->
<a class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"><i class="fa-solid fa-pen"></i> Edit</a>

<!-- Small table-action, danger -->
<button class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"><i class="fa-solid fa-trash"></i> Delete</button>

<!-- Full-width (auth / modals): add -->  flex w-full justify-center py-3
```

Links: `text-indigo-600 hover:text-indigo-800 hover:underline` (or just
`hover:underline` inside tables).

---

## Badges & pills

Base + a status triple (see SKILL.md palette):

```html
<span class="inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-0.5 bg-green-100 text-green-700">Approved</span>
```

With leading dot:

```html
<span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
  <span class="h-1.5 w-1.5 rounded-full bg-yellow-500"></span> Pending
</span>
```

Ring style (good on colored/tinted backgrounds, tables, cards) with icon:

```html
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 bg-green-100 text-green-700 ring-green-200">
  <i class="fa-solid fa-circle-check fa-2xs"></i> Approved
</span>
```

Tiny boolean flag pill: `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium` with `bg-green-100 text-green-700` (on) / `bg-gray-100 text-gray-400` (off).

---

## Chips & segmented control

Filter chip:

```html
<!-- base -->    inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ring-1 transition-colors cursor-pointer
<!-- active -->  bg-indigo-600 text-white ring-indigo-600
<!-- idle -->    bg-white text-gray-600 ring-gray-200 hover:ring-indigo-400 hover:text-indigo-600
```

Chip with count badge: append
`<span class="ml-1 px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-semibold">12</span>`.

Segmented pill control (single-select track):

```html
<div class="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-sm shadow-sm">
  <a href="?range=7d"  class="px-3 py-1.5 rounded-md font-medium transition-colors bg-indigo-600 text-white">7d</a>
  <a href="?range=30d" class="px-3 py-1.5 rounded-md font-medium transition-colors text-gray-600 hover:bg-gray-100">30d</a>
</div>
```

---

## Tables

```html
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 text-sm">
  <thead class="bg-gray-50">
    <tr>
      <th class="px-4 py-3 text-left  text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-gray-100 bg-white">
    <!-- empty state -->
    <tr><td colspan="2" class="px-4 py-10 text-center text-sm text-gray-400"><i class="fa-solid fa-inbox mr-2"></i>No rows found.</td></tr>
    <!-- data row -->
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-4 py-3"><a href="/r/1" class="font-medium text-indigo-600 hover:underline">Item</a></td>
      <td class="px-4 py-3 text-right"><!-- action buttons --></td>
    </tr>
  </tbody>
</table>
</div>
```

Monospace cell (serials/codes/IDs): add `font-mono text-xs text-gray-700`.

---

## Forms

Reusable class strings (define once per view / as constants):

```
input:  block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none
label:  block text-sm font-medium text-gray-700 mb-1
select: appearance-none cursor-pointer block w-full rounded-lg border border-gray-300 bg-white pl-3 pr-10 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none
```

Layout:

```html
<form action="/save" method="POST" novalidate>
  <!-- include your framework's CSRF token here -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
      <input id="name" name="name" type="text" required maxlength="200" placeholder="e.g. …"
             class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none" />
    </div>
  </div>

  <div class="flex items-center gap-3 mt-8 pt-5 border-t border-gray-100">
    <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"><i class="fa-solid fa-floppy-disk"></i> Save</button>
    <a href="/cancel" class="inline-flex items-center gap-2 rounded-lg ring-1 ring-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</a>
  </div>
</form>
```

Native `<select>` has no consistent cross-browser chevron — overlay one and hide
the native arrow with `appearance-none` (already in the select class) + `pr-10`:

```html
<div class="relative">
  <select class="appearance-none cursor-pointer block w-full rounded-lg border border-gray-300 bg-white pl-3 pr-10 py-2 text-sm shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none">
    <option>Open</option><option>Closed</option>
  </select>
  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
  </div>
</div>
```

Validation error block:

```html
<div class="flex items-start gap-3 rounded-lg bg-red-50 ring-1 ring-red-200 px-4 py-3 mb-6" role="alert">
  <i class="fa-solid fa-triangle-exclamation text-red-500 mt-0.5"></i>
  <ul class="text-sm text-red-700 space-y-0.5"><li>Message.</li></ul>
</div>
```

Styled file input:

```html
<input type="file" name="attachment" multiple
  class="text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
```

---

## Feedback & misc

Flash / alert banner (tone = success/error/warning/info):

```html
<div class="rounded-md border p-4 bg-green-50 border-green-200 text-green-800">
  <p class="text-sm font-medium">Saved successfully.</p>
</div>
```

Full-width system alert bar (top of page):

```html
<div class="bg-red-600 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
    <i class="fa-solid fa-triangle-exclamation flex-shrink-0 text-lg"></i>
    <p class="text-sm font-semibold">Scheduled maintenance tonight at 9pm.</p>
  </div>
</div>
```

Empty state:

```html
<div class="flex flex-col items-center justify-center py-20 text-gray-400">
  <i class="fa-solid fa-box-open text-5xl mb-4"></i>
  <p class="text-lg">No entries found.</p>
</div>
```

Avatar (initials):

```html
<span class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">AB</span>
```

Tabs (underline):

```html
<div class="mb-6 border-b border-gray-200">
  <nav class="-mb-px flex gap-6 text-sm font-medium">
    <a href="#" class="border-b-2 pb-3 border-indigo-600 text-indigo-600">Active</a>
    <a href="#" class="border-b-2 pb-3 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700">Other</a>
  </nav>
</div>
```

Pagination (prev / "Page X of Y" / next):

```html
<div class="mt-6 flex items-center justify-between text-sm">
  <a href="?page=1" class="px-3 py-1.5 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50">Previous</a>
  <span class="text-gray-500">Page 2 of 5</span>
  <a href="?page=3" class="px-3 py-1.5 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50">Next</a>
  <!-- at a bound, render a disabled span: px-3 py-1.5 rounded-lg border border-gray-200 text-gray-300 pointer-events-none -->
</div>
```

Timeline (vertical):

```html
<ol class="relative border-l border-gray-200 ml-2">
  <li class="mb-5 last:mb-0 ml-5">
    <span class="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white bg-indigo-500"></span>
    <div class="text-sm font-medium text-gray-900">Event</div>
    <p class="mt-0.5 text-xs text-gray-500">timestamp · by author</p>
  </li>
</ol>
```

Dropdown menu (paired with `assets/app.js`):

```html
<div class="relative" data-menu>
  <button type="button" data-menu-button aria-haspopup="true" aria-expanded="false"
    class="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    Menu
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
  </button>
  <div data-menu-panel class="hidden absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-20">
    <a href="#" class="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><i class="fa-solid fa-gear w-4 text-center text-gray-400"></i> Item</a>
  </div>
</div>
```

Confirm before a destructive action (paired with `assets/app.js`):

```html
<button type="submit" data-confirm="Delete this item? This cannot be undone."
  class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
  <i class="fa-solid fa-trash"></i> Delete
</button>
```
