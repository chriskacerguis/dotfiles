# Setting the system up in a project

Everything here assumes plain JavaScript and JSX — no TypeScript — a Vite build,
and `react-router-dom` for routing.

## Dependencies

```bash
npm install react react-dom react-router-dom \
  clsx tailwind-merge class-variance-authority \
  lucide-react \
  @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-select \
  @radix-ui/react-dropdown-menu @radix-ui/react-switch @radix-ui/react-tabs \
  @radix-ui/react-tooltip @radix-ui/react-label @radix-ui/react-separator

npm install -D tailwindcss postcss autoprefixer vite @vitejs/plugin-react \
  vitest @testing-library/react @testing-library/jest-dom jsdom
```

Only install the Radix packages whose primitives the app actually uses. The
`ui/` components are copied in and owned by the project — edit them freely
rather than wrapping around them.

## File layout

```
frontend/
├── index.html              # loads /theme.js before the app
├── public/
│   └── theme.js            # pre-paint theme application
├── tailwind.config.js
├── vite.config.js
├── vitest.config.js
└── src/
    ├── main.jsx
    ├── App.jsx             # routes
    ├── index.css           # tokens + base layer
    ├── components/         # reusable, presentational (+ colocated tests)
    │   └── ui/             # the primitives: button, card, table, dialog, …
    ├── layouts/            # route-level shells
    ├── pages/              # route views, grouped by domain
    ├── contexts/           # Theme, Auth, Toast
    └── lib/                # api.js, useApi.js, utils.js, variants.js, format.js
```

The split that matters: `components/` take data and callbacks as props and hold
no fetching or routing logic; `pages/` own data fetching and compose components;
`layouts/` hold the chrome that wraps routed pages.

## Tailwind config

`darkMode` keys off a `data-theme` attribute rather than a class, because the
pre-paint script sets exactly one attribute and nothing else has to agree on a
class name. The `content` glob **must** include `lib/` — the `cva` maps live
there, and without it their classes are purged and badges render unstyled in
production only.

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
```

The full file, including the Radix accordion keyframes, is in
`templates/tailwind.config.js`.

## The token stylesheet

`templates/index.css` is the whole thing. Three parts worth knowing about:

1. **`:root` and `:root[data-theme='dark']`** define every token. This is the
   only place colour is decided for chrome.
2. **`* { @apply border-border }`** means a bare `border` class is already the
   right colour. That is why components say `className="border"` and nothing
   more.
3. **A global `:focus-visible` ring.** Deliberate: these are tools people use at
   speed, and keyboard focus must never be ambiguous. Do not remove it
   per-component.

Scrollbar styling and a `text-balance` utility round it out.

## Dark mode without the flash

The theme must be on the `<html>` element before first paint, or the page renders
light and then snaps to dark. That cannot be done from React — the app has not
mounted yet.

Put this in `public/theme.js` (Vite copies `public/` to the build root):

```js
(function () {
  try {
    var stored = localStorage.getItem('APP_NAME-theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (err) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
```

And reference it from `index.html` inside `<head>`:

```html
<script src="/theme.js"></script>
```

**Use a file, not an inline `<script>`.** An inline script needs either
`'unsafe-inline'` in the Content-Security-Policy or a hash kept in sync with the
code by hand; both are worse than one tiny same-origin request. A file is covered
by `script-src 'self'` for free.

`ThemeContext` (in `templates/contexts/ThemeContext.jsx`) then owns the toggle at
runtime and writes the same `localStorage` key. Both must agree on that key.

## Vitest

```js
// vitest.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
```

```js
// vitest.setup.js
import '@testing-library/jest-dom/vitest';
```

Tests are colocated next to the component (`Foo.jsx` → `Foo.test.jsx`) and assert
behaviour and rendered output, never implementation details.

## The `@` alias

Every import in this system uses `@/` for `src/`. Set it in both `vite.config.js`
and `vitest.config.js` or tests resolve differently from the build.
