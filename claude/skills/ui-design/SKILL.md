---
name: ui-design
description: >
  A portable, engine-agnostic UI/UX design system built on Tailwind CSS —
  design tokens plus copy-paste class recipes for cards, buttons, badges/pills,
  chips, tables, forms, tabs, pagination, empty states, avatars, timelines, and
  a CSP-safe vanilla-JS interaction layer (confirm modal, dropdown menus,
  double-submit guard). Works with any template engine or framework (EJS, Pug,
  React/JSX, Blade, plain HTML). Use this WHENEVER building or styling any
  user-facing page, view, or component so the result matches the standard look
  and feel. Triggers: "new page", "build a form", "add a table", "status badge",
  "button", "card", "modal", "style this", "make it look good", "UI", "layout",
  "design system".
---

# Portable UI/UX Design System

A clean, professional Tailwind-based design language extracted from a production
web app. This skill is **engine-agnostic**: the tokens and class recipes are
plain Tailwind and drop into any template engine or framework. The one bundled
runtime asset ([assets/app.js](assets/app.js)) is dependency-free vanilla JS.

Match this system whenever you build UI. Reach for the tokens below before
inventing colors, radii, or shadows.

## Golden rules

1. **Utility-first, (almost) no custom CSS.** Style with Tailwind classes in the
   markup. Avoid `<style>` blocks and inline `style=` attributes — they break
   under a strict Content-Security-Policy and are purged/ignored. The only
   hand-written CSS you should need is one brand-color rule (see tokens).
2. **One accent color.** `indigo-600` is the primary accent for buttons, links,
   active states, focus rings, and avatars. Don't scatter additional brand hues.
3. **Neutral gray scale for everything else.** `gray-50` page background, white
   surfaces, `gray-200`/`gray-300` borders, `gray-900`→`gray-400` text ramp.
4. **Semantic colors are reserved for status**, not decoration: green = success,
   yellow/amber = warning/pending, red = danger/error, blue = info/new.
5. **CSP-safe interactivity only.** No inline `onclick` or inline `<script>`.
   Copy [assets/app.js](assets/app.js) into your static JS and drive behavior
   with its `data-*` hooks (`data-confirm`, `data-menu`, `data-disable-on-submit`,
   `data-file-names`). It uses event delegation, so it works for markup rendered
   anywhere, any time.
6. **Accessible by default:** semantic HTML, `aria-*` on menus/comboboxes/dialogs,
   a visible `focus:ring-2 focus:ring-indigo-500` on interactive controls, and
   `<span class="text-red-500">*</span>` to mark required fields.
7. **Responsive by default:** `sm:`/`lg:` breakpoints, `flex-wrap`, and wrap wide
   tables in `overflow-x-auto`.

## Design tokens

| Token | Value | Notes |
|-------|-------|-------|
| Page background | `bg-gray-50` | on `<body>`; content sits on white surfaces |
| Surface / card | `bg-white` | |
| Primary accent | `indigo-600` → hover `indigo-700` → active `indigo-800` | buttons, links, active tabs/chips, focus rings, avatars |
| Accent tints | `indigo-50` / `indigo-100` (backgrounds), `indigo-700` (text on tint) | avatars, icon chips, "current" markers |
| Brand color (optional) | pick one deep hue, e.g. `#324274` (hover `#1e2a4a`) | only for the top-nav wordmark/links; the **one** allowed custom-CSS rule |
| Text | `text-gray-900` headings · `text-gray-700` body · `text-gray-500`/`400` muted · `text-gray-300` em-dash placeholders | |
| Borders | `border-gray-200` (dividers/cards) · `border-gray-300` (inputs) | some components use `ring-1 ring-gray-200` instead |
| Radius | `rounded-lg` (buttons, inputs) · `rounded-xl` (cards) · `rounded-2xl` (auth/hero card) · `rounded-full` (pills, avatars) | |
| Shadow | `shadow-sm` default · `shadow-md` card hover · `shadow-lg`/`xl` popovers & modals | |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | standard page width + responsive gutters |
| Page padding | `py-8` app pages · `py-12` centered/landing pages | |
| Icons | an icon font/set (this system uses Font Awesome `fa-solid`/`fa-regular`) | tiny sizes `fa-2xs`/`fa-xs` inside pills |
| Transitions | `transition-colors` (most) · `transition-all duration-200` (cards) | |
| Type scale | `text-2xl`/`3xl font-bold` page titles · `text-base font-semibold` section heads · `text-sm` body · `text-xs` meta/labels | |

### Semantic status palette

Each status color is a triple `[pill-bg, pill-text, accent-dot]`. Reuse this map
rather than picking colors ad hoc. Keep the map in **one** place in your app
(a shared module / constants file) so views can't drift — and if your build
tree-shakes CSS (Tailwind's `content` scan), make sure that file is scanned.

| Meaning | bg | text | dot |
|---------|----|----|----|
| success / approved / open | `bg-green-100` | `text-green-700` | `bg-green-500` |
| info / new | `bg-blue-100` | `text-blue-700` | `bg-blue-500` |
| warning / pending | `bg-yellow-100` | `text-yellow-800` | `bg-yellow-500` |
| attention | `bg-orange-100` | `text-orange-700` | `bg-orange-500` |
| danger / rejected | `bg-red-100` | `text-red-700` | `bg-red-500` |
| accent | `bg-purple-100` | `text-purple-700` | `bg-purple-500` |
| neutral / muted | `bg-gray-100` | `text-gray-600` | `bg-gray-400` |

Flash/alert banners use the light-tint form: `bg-{c}-50 border-{c}-200 text-{c}-800`
for success/error(red)/warning(yellow)/info(blue).

## Layout & page skeleton

Structure every page as **sticky top nav → content in the standard container →
sticky-bottom footer**. Body is a flex column so the footer hugs the bottom:

```html
<body class="bg-gray-50 min-h-screen flex flex-col">
  <nav class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16"><!-- brand · links · account menu --></div>
    </div>
  </nav>

  <div class="flex-1">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><!-- page content --></div>
  </div>

  <footer class="border-t border-gray-200 bg-white mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <p class="text-center text-sm text-gray-400">Footer text</p>
    </div>
  </footer>
</body>
```

Page headers come in two flavors — a left-aligned app header (optional back
arrow + `indigo-600` icon + `text-2xl font-semibold` title) and a centered
landing header (`text-3xl/4xl font-bold tracking-tight` + `text-lg text-gray-500`
lede). Both are in [references/components.md](references/components.md).

## Components

Full copy-paste recipes (plain HTML + Tailwind) live in
[references/components.md](references/components.md) — **load it when building
UI**. Quick reference:

- **Card:** `bg-white rounded-xl border border-gray-200 shadow-sm`; interactive
  adds `hover:shadow-md hover:border-indigo-300 transition-all duration-200`.
- **Primary button:** `inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors`.
- **Secondary:** swap accent for `ring-1 ring-gray-300 bg-white text-gray-700 hover:bg-gray-50`. **Danger:** `bg-red-600 … hover:bg-red-700`.
- **Pill:** `inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-0.5` + a status triple; add a leading `<span class="h-1.5 w-1.5 rounded-full bg-…-500">` dot when useful.
- **Chip (filter/toggle):** `rounded-full ring-1` — active `bg-indigo-600 text-white ring-indigo-600`, idle `bg-white text-gray-600 ring-gray-200 hover:ring-indigo-400`.
- **Table:** `overflow-x-auto` → `min-w-full divide-y divide-gray-200 text-sm`; `thead` `bg-gray-50`, `th` `px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide`; rows `hover:bg-gray-50`.
- **Input:** `block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none`; label `block text-sm font-medium text-gray-700 mb-1`.
- **Tabs:** underline — `border-b-2 pb-3`, active `border-indigo-600 text-indigo-600`, idle `border-transparent text-gray-500 hover:border-gray-300`.
- **Empty state:** centered `py-20 text-gray-400` column, large icon (`text-5xl mb-4`), message.
- **Avatar:** initials in `flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700`.

## Interactive behavior (bundled, portable)

[assets/app.js](assets/app.js) is dependency-free vanilla JS. Copy it into your
project's static assets (e.g. `public/js/app.js`) and load it once per page:
`<script src="/js/app.js" defer></script>`. It provides, via event delegation:

- **`data-confirm="message"`** on any link/button/form → opens a styled confirm
  modal instead of navigating/submitting. Replaces `window.confirm`. Use it for
  every destructive action.
- **`data-menu`** wrapping a `data-menu-button` + hidden `data-menu-panel` →
  accessible dropdown (click-outside / Escape to close).
- **`data-disable-on-submit`** on a form → prevents double-submit (optional
  `data-submitting-text` on the button to swap its label).
- **`data-file-names="targetId"`** on a file input → mirrors chosen filenames.

The modal's Tailwind classes live inside `app.js`. If your build purges CSS via a
`content` scan, **add your JS glob** (e.g. `./public/js/**/*.js`) so those classes
survive. Keep page-specific JS in separate files loaded with `defer`.

## Adopting into a new project

1. Install & configure Tailwind (v3+). Ensure the build's `content` globs cover
   your templates **and** any JS/constants file that emits class names.
2. Load an icon set (Font Awesome or similar) if you want the icons in the recipes.
3. Set `<body class="bg-gray-50 min-h-screen flex flex-col">` and drop in the
   page skeleton above.
4. Copy [assets/app.js](assets/app.js) into your static JS and load it with `defer`.
5. Put the semantic status palette in one shared module and reference it from
   views — never hardcode status colors per page.
6. Build UI from [references/components.md](references/components.md). Adapt the
   plain-HTML recipes to your engine (EJS/JSX/Pug/Blade) — the classes are identical.
