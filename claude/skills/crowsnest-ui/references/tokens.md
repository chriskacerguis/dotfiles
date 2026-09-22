# Colour, type and spacing

## The tokens

Every token is an HSL triplet in a CSS variable, consumed through Tailwind as
`bg-card`, `text-muted-foreground`, `border-border` and so on. Light values are
on `:root`, dark on `:root[data-theme='dark']`.

| Token | Light | Dark | Use for |
|---|---|---|---|
| `background` | `0 0% 100%` | `222 47% 8%` | The page itself |
| `foreground` | `222 47% 11%` | `210 40% 96%` | Body text |
| `card` | `0 0% 100%` | `222 44% 11%` | Raised surfaces — panels, tiles, tables |
| `card-foreground` | `222 47% 11%` | `210 40% 96%` | Text on a card |
| `popover` | `0 0% 100%` | `222 44% 11%` | Menus, dialogs, tooltips |
| `popover-foreground` | `222 47% 11%` | `210 40% 96%` | Text in those |
| `primary` | `201 96% 32%` | `199 89% 55%` | The one accent: primary buttons, links, focus |
| `primary-foreground` | `0 0% 100%` | `222 47% 8%` | Text on primary |
| `secondary` | `210 40% 96%` | `217 33% 18%` | Quiet filled surfaces |
| `muted` | `210 40% 96%` | `217 33% 16%` | Inert backgrounds — table headers, disabled |
| `muted-foreground` | `215 16% 47%` | `215 20% 65%` | Secondary text, hints, captions |
| `accent` | `210 40% 94%` | `217 33% 20%` | Hover on ghost/outline controls |
| `destructive` | `0 72% 45%` | `0 63% 50%` | Destructive actions and hard failures |
| `border` | `214 32% 88%` | `217 33% 20%` | Every border and divider |
| `input` | `214 32% 88%` | `217 33% 22%` | Form control borders |
| `ring` | `201 96% 32%` | `199 89% 55%` | Focus ring — matches primary |
| `--radius` | `0.5rem` | same | Corner radius; `md`/`sm` derive from it |

Note the dark primary is *lighter and more saturated* than the light one. A
colour that reads as a confident accent on white becomes muddy on near-black;
the pair is tuned so the accent carries equal weight in both themes. Any new
token needs the same treatment — do not reuse one value for both.

### Rebranding

Change `--primary` and `--ring` together, in both blocks. That is the entire
brand hook. Everything else is neutral by design, which is what lets the
meaning-colours below stay legible.

## Colours that carry meaning

These are the deliberate exception to "never use raw palette colours". A
severity, a status, a priority *means* something, and that meaning must survive
recolouring the brand. They live as `cva` maps in `lib/variants.js`.

The shape is always: light tint + saturated text in light mode, translucent dark
tint + pale text in dark mode.

```
critical   border-red-300     bg-red-50     text-red-800
           dark:border-red-900/60  dark:bg-red-950/60  dark:text-red-200
high       border-orange-300  bg-orange-50  text-orange-800
           dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-orange-200
medium     border-amber-300   bg-amber-50   text-amber-800
           dark:border-amber-900/60  dark:bg-amber-950/60  dark:text-amber-200
low        border-sky-300     bg-sky-50     text-sky-800
           dark:border-sky-900/60  dark:bg-sky-950/60  dark:text-sky-200
good       border-emerald-300 bg-emerald-50 text-emerald-800
           dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200
neutral    border-border      bg-muted      text-muted-foreground
```

The `/60` opacity in dark mode matters: a solid `red-950` on a near-black page
looks like a hole. The translucent version sits on the surface instead.

**Escalation reads red → orange → amber → sky.** Not a rainbow — the top three
are adjacent warm hues so the eye reads them as one scale, and the coolest step
is clearly "not urgent". Never encode meaning by hue alone; the label is always
present in text too, because a meaningful proportion of users cannot
discriminate red from green.

For a "this is fine" state use emerald, and reserve `destructive` for actions
that destroy something rather than for states that happen to be bad.

## Type

| Use | Classes |
|---|---|
| Page title | `text-xl font-semibold tracking-tight sm:text-2xl` |
| Section heading | `text-sm font-medium` |
| Eyebrow / stat label | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |
| Body | inherited `text-sm` from the table/card context |
| Secondary text | `text-sm text-muted-foreground` |
| Hint / caption | `text-xs text-muted-foreground` |
| Stat value | `text-2xl font-semibold tabular-nums` |
| Identifier, version, key | `font-mono text-xs` or `text-sm` |

Two habits worth keeping: **`tabular-nums` on every figure** that appears in a
column or a tile, so digits align between rows; and **`font-mono` for anything
the user might copy** — a CVE id, an environment variable name, a hash.

## Spacing

The system is deliberately small. Learn these and you rarely need to think:

- **Page**: `mb-5` under the header; sections separated by `space-y-4`
- **Card padding**: `p-4`
- **Table cell padding**: from the `Table` primitive, not per-cell
- **Inline gaps**: `gap-1.5` inside a badge or button, `gap-2` between controls,
  `gap-3` between groups
- **Stacked content**: `mt-1` for a caption under a value, `mt-2` for a related
  block, `space-y-2` inside a panel

Borders are one pixel and always `border-border` (a bare `border` class). The
elevation vocabulary is one step: `shadow-sm` on cards and nothing else. Depth
comes from the border and the `card` surface, not from shadows.
