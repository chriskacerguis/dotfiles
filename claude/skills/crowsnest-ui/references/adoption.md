# Moving an existing app onto this system

The failure mode here is a half-migration: two styling systems fighting, an app
that looks worse than when you started, and a branch nobody wants to merge. The
order below exists to prevent that. Each step leaves the app working and looking
better than before, so it can be stopped at any point.

Do one step, build, look at it in both themes, commit. Then the next.

## Step 0 — Audit first

Before changing anything, find out what you are dealing with. Report this to the
user before starting work; it is usually the moment they discover the job is
bigger or smaller than they thought.

```bash
# How much styling is off-system?
grep -rEo '(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]+' src --include=*.jsx | sort | uniq -c | sort -rn | head -30

# Inline value->style decisions that belong in variants.js
grep -rn "className={.*?\s*?.*:" src --include=*.jsx | grep -E "(text|bg|border)-" | head -20

# Class strings built by concatenation instead of cn()
grep -rn 'className={`' src --include=*.jsx | head -20

# Direct fetch calls that should go through lib/api.js
grep -rn "fetch(" src --include=*.jsx | head -20

# Data views with no empty or error handling
grep -rLn "EmptyState\|ErrorState" src/pages/*.jsx
```

What the numbers mean: a lot of `slate`/`gray` on chrome is the easy case — those
map onto tokens mechanically. A lot of *semantic* colour inline (red for errors,
green for success, scattered) means the real work is building the `variants.js`
maps.

Also check what is already there: a component library already in use (MUI,
Chakra, Bootstrap) makes this a rewrite rather than a migration, and that is a
decision for the user, not an assumption to make.

## Step 1 — Tokens and Tailwind config

Add the CSS variables, the `darkMode: ['class', '[data-theme="dark"]']` config,
the extended `colors`, and the `content` glob covering `lib/`.

Nothing changes visually yet — existing raw classes still work. This is purely
additive, which is what makes it safe to do first.

## Step 2 — `cn()` and the class-composition habit

Add `lib/utils.js`. Convert template-literal class strings to `cn()` as you
touch files; do not sweep the whole codebase for this alone.

## Step 3 — Chrome onto tokens

Replace the structural colours. This is mechanical and gives the biggest visual
return:

| Was | Becomes |
|---|---|
| `bg-white`, `bg-slate-50` | `bg-background` or `bg-card` |
| `text-slate-900`, `text-black` | `text-foreground` |
| `text-slate-500/600` | `text-muted-foreground` |
| `border-slate-200/300` | `border` (bare) |
| `bg-slate-100` (inert) | `bg-muted` |
| `bg-blue-600` (primary action) | `bg-primary text-primary-foreground` |
| `hover:bg-slate-100` | `hover:bg-accent hover:text-accent-foreground` |

After this step the app is dark-mode-capable for the first time. Turn dark mode
on and look at every page — this is where you find the hardcoded white panel.

## Step 4 — Dark mode for real

Add `public/theme.js` + the `<script>` tag, and `ThemeContext` with a toggle in
the nav. Both must use the same `localStorage` key.

Then walk the app in dark mode. What you are hunting: hardcoded backgrounds,
images with baked-in white, shadows that vanish, and meaning-colours with no
`dark:` pair.

## Step 5 — `variants.js`

Collect every inline value→style decision into `cva` maps. This is the step that
stops future drift, and it is usually the one that most improves consistency,
because apps accumulate three different reds for the same idea.

## Step 6 — Primitives

Copy in `ui/` and replace hand-rolled buttons, inputs, cards and tables. Do it
one component at a time. `Button` first — it is the highest-traffic and the most
inconsistently hand-rolled.

## Step 7 — Shared components and the three states

`PageHeader`, `StateViews`, `StatCard`, `FilterBar`, `SortableHeader`,
`Pagination`. Then go through every data view and give it real loading, error and
empty states.

This step usually reveals actual bugs — views that render a blank table on error,
or spin forever on a failed request.

## Step 8 — The data layer

Only if the app's API matches the `{ data }` / `{ error: { message } }` envelope.
If it does not, either adapt `api.js` to the app's envelope (fine — keep the
`ApiError` shape) or leave this step out. Do not reshape a working backend to
match a UI convention.

Session expiry handling (`references/data.md`) is worth doing even if the rest of
this step is skipped; it fixes a real user-facing failure.

## What not to do

- **Do not mix systems in one view.** Half-tokenised pages look worse than
  untouched ones. Finish a page or leave it.
- **Do not change behaviour while restyling.** Keep the diff about appearance so
  a reviewer can trust it.
- **Do not port the domain vocabulary.** "Findings", "KEV", "Affects us" are
  Crow's Nest's words. Take the structure, use the app's own language.
- **Do not fabricate a design review.** If you cannot see the app running, say
  which pages you changed and that they need a look, rather than asserting they
  look right.

## Per-app judgement

Not every app wants every part:

- A single-page tool needs the tokens and primitives, not `AppLayout`
- An app with no auth skips session expiry entirely
- A public marketing page probably wants only the token palette
- An internal admin tool wants the whole thing

Ask what the app is before deciding how much to apply.
