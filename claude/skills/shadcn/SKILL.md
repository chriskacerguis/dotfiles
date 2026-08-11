---
name: shadcn
description: Use for React component implementation with shadcn/ui - accessible, customizable components
---

# shadcn/ui Components

## Overview

shadcn/ui provides beautifully designed, accessible components that you copy into your project. Components are not installed from npm - they're copied to your codebase for full customization.

## Installation

### Add a Component

```bash
npx shadcn@latest add <component>

# Examples:
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
```

### Multiple Components

```bash
npx shadcn@latest add button card dialog
```

## Available Components

### Form Controls
- `button` - Buttons with variants (default, destructive, outline, secondary, ghost, link)
- `input` - Text input with consistent styling
- `textarea` - Multi-line text input
- `select` - Native select with custom styling
- `checkbox` - Checkbox with label support
- `radio-group` - Radio button groups
- `switch` - Toggle switches
- `slider` - Range slider
- `form` - Form with react-hook-form + zod validation

### Overlays & Modals
- `dialog` - Modal dialogs
- `alert-dialog` - Confirmation dialogs
- `sheet` - Slide-out panels (top, right, bottom, left)
- `popover` - Floating content triggered by a button
- `tooltip` - Hover tooltips
- `dropdown-menu` - Accessible dropdown menus
- `context-menu` - Right-click context menus
- `menubar` - Horizontal menu bar
- `command` - Command palette (cmdk)

### Data Display
- `table` - Styled tables
- `card` - Container with header, content, footer
- `badge` - Small status indicators
- `avatar` - User avatars with fallback
- `separator` - Visual divider
- `aspect-ratio` - Maintain aspect ratios
- `scroll-area` - Custom scrollbars
- `collapsible` - Expandable sections
- `accordion` - Multiple collapsible sections
- `hover-card` - Preview cards on hover

### Navigation
- `tabs` - Tabbed interfaces
- `navigation-menu` - Complex navigation with submenus
- `breadcrumb` - Breadcrumb trails
- `pagination` - Page navigation

### Feedback
- `alert` - Static alert messages
- `toast` / `sonner` - Toast notifications
- `progress` - Progress bars
- `skeleton` - Loading placeholders

### Layout
- `resizable` - Resizable panels
- `carousel` - Image/content carousels

## Usage Patterns

### Basic Button

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Menu</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description text</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Form with Validation

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({
  email: z.string().email(),
})

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

## Customization

Components live in `components/ui/`. Modify directly:

- Change default variants in the component file
- Add new variants to the `cva` definitions
- Adjust Tailwind classes for styling
- Extend with additional props

## Theming

shadcn uses CSS variables for theming. Modify in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```
