---
name: frontend-design
description: Use for any frontend UI implementation - orchestrates tailwind-ui, shadcn, and radix-ui in the correct order
---

# Frontend Design

## When to Use

- Building React UI components
- Implementing pages, layouts, or features with Tailwind CSS
- Any visual/interactive frontend work

## Process

### Step 1: Classify the Component Type

| Type | Primary Skill | Examples |
|------|---------------|----------|
| Layout/Structure | tailwind-ui | Heroes, sections, grids, page shells |
| Interactive | shadcn | Buttons, dialogs, forms, tables |
| Primitive (no shadcn match) | radix-ui | Custom compound components |

### Step 2: Layout Structure First

**Invoke `tailwind-ui`** for structural patterns.

```
Use the Skill tool with skill: "tailwind-ui"
```

Use for:
- Page layouts, containers, responsive grids
- Section patterns (hero, features, CTA, footer)
- Dark mode foundations
- Decorative elements and polish

### Step 3: Interactive Components

**Invoke `shadcn`** for component implementation.

```
Use the Skill tool with skill: "shadcn"
```

Use for:
- Form controls (Button, Input, Select, Checkbox, Switch)
- Overlays (Dialog, Popover, DropdownMenu, Sheet, Tooltip)
- Data display (Table, Card, Badge, Avatar, Separator)
- Navigation (Tabs, Breadcrumb, Pagination, NavigationMenu)
- Feedback (Alert, Toast, Progress, Skeleton)

Install missing components:
```bash
npx shadcn@latest add <component>
```

### Step 4: Radix Fallback

**Only if shadcn lacks the component**, invoke `radix-ui`.

```
Use the Skill tool with skill: "radix-ui"
```

Use for:
- Components shadcn doesn't wrap
- Custom compound component patterns
- Lower-level accessibility primitives

## Decision Tree

```
Need UI component?
├─ Is it layout/structure/decorative?
│   └─ tailwind-ui
├─ Is it interactive?
│   ├─ Does shadcn have it? → shadcn
│   └─ No shadcn match? → radix-ui
└─ Combining layout + interactive?
    └─ tailwind-ui for structure, shadcn for components inside
```

## Quality Checklist

Before completing any frontend work:

- [ ] **Dark mode**: `dark:` variants applied consistently
- [ ] **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- [ ] **Accessible**: Proper ARIA attributes, focus states, semantic HTML
- [ ] **Consistent**: Matches existing design system and patterns
- [ ] **Polish**: Focus rings, hover states, transitions applied

## Anti-Patterns

**Don't:**
- Write Tailwind UI patterns from scratch (657 templates exist)
- Skip shadcn and implement buttons/dialogs manually
- Use raw Radix when shadcn has a styled version
- Forget dark mode variants
- Ignore mobile responsiveness
