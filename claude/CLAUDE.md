# Global Claude Code Instructions

## Skills

My skills live in `~/.claude/skills/` (real source: `~/.dotfiles/claude/skills/`). They carry
the depth this file only summarizes. **Invoke the relevant skill with the Skill tool *before*
writing code in its domain**, not after — and don't reconstruct a skill's contents from memory.

### Precedence: this file wins on stack and conventions

These skills are **generic technique references**, not my house style. They were written
stack-agnostically and their examples routinely use things I do not use: TypeScript,
Sequelize/Prisma/Mongoose, `winston`, `console.log`, `npm`-installed UI components. When that
happens:

- Take the **technique** from the skill (the algorithm, the threat model, the query plan, the
  protocol, the component pattern).
- Take the **conventions** from this file (plain JavaScript, `pg` with parameterized SQL and no
  ORM, the shared pino logger, the `{ data }` / `{ error: { message } }` envelope, the layer
  boundaries, colocated Vitest tests).
- Translate as you copy. Never paste a skill snippet in verbatim if it violates a rule below.

### Skill layout

Each skill's `SKILL.md` is an index — short, with a "Quick Start" and a table of deeper docs.
The substance is in the subdirectories, so don't stop at `SKILL.md`:

- `references/` — the detailed guides. **Load the specific reference the task needs.**
- `templates/` and `scripts/` — working, copy-in implementations. Prefer adapting these over
  writing an equivalent from scratch.
- `assets/` — `tailwind-ui` and `shadcn` only; large template/component libraries to search
  before hand-writing markup.

### Routing table

**Backend / HTTP**

| Skill | Reach for it when… |
|---|---|
| `rest-api-design` | Designing or reviewing an endpoint: resource modeling, URL shape, method choice, status codes, response shape. The default starting point for new API surface. |
| `nodejs-express-server` | Wiring the Express app itself: middleware order, routers, request lifecycle, error middleware, graceful shutdown. |
| `api-reference-documentation` | Anything touching `docs/openapi.yaml` — spec structure, schema authoring, examples, describing auth. |
| `api-pagination` | Any endpoint returning a collection. Offset/limit vs cursor vs keyset, and the query cost of each. |
| `api-versioning-strategy` | A breaking change, a deprecation, or a decision about how versions are carried. |
| `api-response-optimization` | Slow responses or fat payloads: caching headers, compression, field selection, N+1 elimination. |
| `real-time-features` | A feature needs to push to the client. **Start here** — it picks the transport (WebSocket vs SSE vs polling). |
| `websocket-implementation` | WebSockets are already the chosen transport: connection lifecycle, message routing, auth on upgrade, scaling across instances. |

**Security**

| Skill | Reach for it when… |
|---|---|
| `api-security-hardening` | A broad "is this endpoint safe" pass: CORS, headers, input validation, middleware stack. The umbrella; the ones below go deeper. |
| `api-authentication` | Implementing or changing how a caller proves identity — JWT, OAuth 2.0, API keys, login/refresh flows. |
| `session-management` | Session and token *lifecycle*: storage, refresh, rotation, logout, CSRF. |
| `api-rate-limiting` | Rate-limiting an HTTP surface: algorithm choice, per-key limits, tiers, `429` + `Retry-After`. |
| `rate-limiting-implementation` | Throttling something that isn't an HTTP endpoint — job queues, DB pools, outbound third-party calls, backpressure. |
| `sql-injection-prevention` | Writing or reviewing any query, especially dynamic `ORDER BY` / filters / search. |
| `xss-prevention` | Rendering user-generated content, or setting up CSP. |
| `security-audit-logging` | An audit trail is needed for compliance or forensics. **Note:** its examples use `winston` — use the shared pino logger instead. |

**Database**

| Skill | Reach for it when… |
|---|---|
| `sql-query-optimization` | A query is slow: `EXPLAIN ANALYZE`, index design, join strategy, rewriting. |

**Frontend**

| Skill | Reach for it when… |
|---|---|
| `crowsnest-ui` | **The house design system — invoke this first for anything visual, and it decides how the result looks.** Tokens, dark mode, `cn()`/`cva` conventions, the shared component set, page recipes, and an ordered path for migrating an existing app onto it. The standard every app converges on. |
| `shadcn` | **Raw material, not a style authority.** A primitive the house set doesn't have yet — calendar, combobox, command palette, data table, popover, sheet. Copy it in, then adapt it to the conventions above. |
| `tailwind-ui` | **Raw material for pages the house system doesn't cover**, which in practice means public-facing ones: marketing, pricing, hero sections, checkout. Its application-UI half largely duplicates `crowsnest-ui`, and where they disagree the house system wins. |
| `react-component-architecture` | Structuring components and hooks: composition, prop design, state placement, splitting an overgrown component. |

**Performance / diagnostics**

| Skill | Reach for it when… |
|---|---|
| `memory-leak-detection` | Memory *grows over time*, OOM kills, container restarts. Diagnosis: heap snapshots, retainer paths. |
| `memory-optimization` | Steady-state footprint is too high and you want it smaller. |

### Overlapping skills — tie-breakers

Several skills cover adjacent ground. Pick by the distinctions above rather than invoking both:

- Rate limiting → `api-rate-limiting` for HTTP surfaces; `rate-limiting-implementation` for
  internal resources and backpressure.
- Real time → `real-time-features` to choose the transport; `websocket-implementation` once
  WebSockets are chosen.
- Memory → `memory-leak-detection` when usage climbs; `memory-optimization` when it's flat but
  too large.
- API security → `api-security-hardening` for the sweep, then the specific skill for the
  mechanism you're actually building.
- Frontend → `crowsnest-ui` always, and alone for anything internal. Add `shadcn` only for a
  primitive it lacks, `tailwind-ui` only for a public-facing page shape. Neither overrides it.

---

## Core Stack

- **Runtime:** Node.js (plain JavaScript — no TypeScript)
- **Backend:** Express.js — **pure REST API only** (JSON in, JSON out; no server-rendered views or templates)
- **Frontend:** React with reusable components, bundled with Vite
- **Routing:** `react-router-dom`
- **Database:** PostgreSQL
- **UI:** Tailwind CSS utility classes, Radix UI primitives, `lucide-react` icons
- **Logging:** pino + pino-http
- **Tests:** Vitest (+ `supertest` for the API, `@testing-library/react` for the UI)

The backend and frontend are cleanly separated: the Express app exposes a REST API, and the
React SPA (in `frontend/`) is a standalone client that consumes it over HTTP. The two share no
code.

---

## JavaScript Style

- Use `const`/`let` — never `var`
- Use `async/await` — never raw `.then()` chains
- Use destructuring, template literals, and optional chaining where they improve clarity
- Prefer named functions over anonymous arrow functions for top-level handlers and middleware
- Use `camelCase` for variables and functions, `PascalCase` for classes, `SCREAMING_SNAKE_CASE` for constants
- Always handle errors explicitly — never swallow exceptions silently

---

## Project Structure

The backend lives at the repo root (`src/`); the React SPA is a nested `frontend/` package with
its own `package.json`. The root `package.json` runs and tests the backend and delegates to the
frontend via `frontend:*` scripts. Tests are **colocated** next to source (`Foo.test.js(x)`).

```
project-root/
├── src/                    # Express REST API — no views, JSON only
│   ├── app.js              # Express app setup (no server.listen here)
│   ├── server.js           # Entry point — binds port, starts server
│   ├── instrument.js       # Observability init (e.g. Sentry), imported first
│   ├── config/
│   │   └── index.js        # All env/config loaded from process.env
│   ├── db/
│   │   ├── index.js        # pg Pool setup and export
│   │   └── migrations/     # SQL migration files (numbered, sequential)
│   ├── middleware/         # Auth, error handling, validation, rate limiting
│   ├── schemas/            # JSON Schema per resource — validates requests AND generates the spec
│   ├── routes/             # One file per resource/domain
│   ├── controllers/        # Route handler logic, one per resource
│   ├── services/           # Business logic, decoupled from HTTP layer
│   ├── models/             # Data access / query functions (no ORM)
│   ├── cache/              # Redis / caching helpers
│   ├── jobs/               # Scheduled / background jobs (node-cron runner)
│   ├── storage/            # File / object storage (e.g. S3) adapters
│   ├── lib/                # Shared internal libraries (apiRouter, errors, openapi)
│   ├── utils/              # Pure helper functions
│   └── logger.js           # Shared pino instance
├── frontend/               # React SPA — consumes the REST API
│   ├── src/
│   │   ├── main.jsx        # App entry — mounts <App> into #root
│   │   ├── App.jsx         # Root component + react-router routes
│   │   ├── instrument.js   # Frontend observability init
│   │   ├── index.css       # Tailwind entry
│   │   ├── components/     # Reusable, presentational components (+ colocated tests)
│   │   ├── layouts/        # Route-level shells (AdminLayout, AuthLayout, …)
│   │   ├── pages/          # Route views, grouped by domain (admin/, auth/, …)
│   │   ├── contexts/       # React context providers (Auth, Toast, …)
│   │   └── lib/            # api.js client, cn(), formatters, variant maps
│   ├── index.html          # Vite entry HTML
│   ├── vite.config.js
│   ├── vitest.config.js
│   └── package.json
├── docs/
│   └── openapi.yaml        # Generated OpenAPI 3.1 spec — never hand-edited, committed
├── public/                 # Static assets + built SPA served by Express
├── scripts/                # Migrations, admin tooling, codegen
├── tests/                  # Backend integration tests (supertest)
├── vitest.config.js        # Backend test config
├── .env.example
├── .gitignore
└── package.json            # Backend deps + start/dev/test + frontend:* scripts
```

---

## Backend / REST API

→ **Skills:** `rest-api-design` for endpoint shape, `nodejs-express-server` for app wiring,
`api-reference-documentation` for the spec, plus `api-pagination` / `api-versioning-strategy` /
`api-response-optimization` as the work touches them. The rules below are **mine and are not
negotiable by a skill** — the skills supply technique inside these constraints.

- Every HTTP surface is resource-oriented REST. URLs name nouns; methods carry the verb.
- One envelope, always: `{ data: ... }` on success, `{ error: { message } }` on failure,
  no body on `204`.
- Layers do one job each: `routes` wire → `controllers` speak HTTP → `services` hold
  business logic → `models` hold parameterized SQL. `req`/`res` never appear below the
  controller.
- Routers are mounted in exactly one place, `src/app.js`. The error middleware is always
  registered last and is the only thing that formats a failure.
- Errors are **thrown** as typed errors from any layer, never returned.
- **Every project ships an OpenAPI 3.1 spec generated from the same JSON Schemas that
  validate requests at runtime.** This is not optional and does not need to be asked for.
  Never hand-edit `docs/openapi.yaml` — change the schema and regenerate. CI fails on
  drift, on an undocumented route, and on an invalid spec.

---

## PostgreSQL

- Use the `pg` package with a shared connection pool
- Never use an ORM (no Sequelize, Prisma, etc.)
- All queries use parameterized placeholders (`$1`, `$2`, …) — never string interpolation,
  not even for a column sort (allowlist those instead)
- Schema managed with sequential numbered SQL migration files

```js
// src/db/index.js
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({ connectionString: config.databaseUrl });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

---

## Logging

- Use `pino` for all application logging — never `console.log`, `console.error`, or similar
- Use `pino-http` for automatic request/response logging via Express middleware
- A single shared logger instance is created in `src/logger.js` and imported everywhere

```js
// src/logger.js
const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.logLevel,
  ...(config.nodeEnv === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});

module.exports = logger;
```

**Usage rules:**

- Import the shared logger — never instantiate a new pino instance per-file
- Use structured logging — pass context as the first object argument, message second:
  ```js
  logger.info({ userId: user.id }, 'User created');
  logger.error({ err }, 'Failed to process payment');
  ```
- Use appropriate levels: `trace` → `debug` → `info` → `warn` → `error` → `fatal`
- `info` is the default production level; `debug`/`trace` are for development only
- In development, use `pino-pretty` for human-readable output (never in production)
- Request logging is handled automatically by `pino-http` — do not manually log req/res
- Never log sensitive fields (passwords, tokens, PII) — use `redact` in the pino config if needed

---

## Frontend (React)

The frontend is a standalone React SPA in `frontend/`, bundled with Vite and routed with
`react-router-dom`. It talks to the backend exclusively over the REST API — no shared code with
the server, no server-rendered HTML.

### Look and feel

→ **Invoke `crowsnest-ui` first for anything visual.** It holds the house design system —
tokens, dark mode, the shared components, the page recipes — and it is what makes every app
look like the same product. It decides how the result looks.

`shadcn` and `tailwind-ui` are sources of raw material underneath it, not style authorities:
reach for `shadcn` when the house set has no primitive for what you need, and `tailwind-ui`
for public-facing page shapes the house system doesn't cover. Whatever they emit gets
translated into the conventions above before it lands. Pair either with
`react-component-architecture` when the question is how to decompose, not how to style.

Project-level deltas when adopting those skills here:

- **Plain JSX, no TypeScript.** `react-component-architecture` and several others show `.tsx`
  with type annotations. Take the pattern, drop the types, write `.jsx`.
- **Icons:** `lucide-react` components.
- **Where `shadcn` components land:** `frontend/src/components/ui/`, as `.jsx`. They're copied
  in and owned by the project — edit them freely rather than wrapping around them. Everything
  else stays in `components/` per the structure above.
- **Class composition:** the skills emit literal class strings; compose them with `cn()` and
  express variants with `class-variance-authority` (below).
- **Dark mode and responsiveness are part of "done"** — `crowsnest-ui` closes with a
  checklist that applies to every component.

### Components

- Build the UI from small, **reusable components** — one thing rendered well, composed into
  pages. If markup appears twice, extract a component.
- Use **function components with hooks** — never class components.
- `components/` holds reusable, presentational pieces (buttons, cards, tables, form fields).
  They take data and callbacks via props and hold no fetching or route logic.
- `layouts/` holds route-level shells (nav, sidebar, page chrome) that wrap routed pages.
- `pages/` holds route views, grouped by domain (`admin/`, `auth/`, …); pages own data fetching
  and compose components + layouts.
- `contexts/` holds cross-cutting React context providers (auth, toasts, etc.).

### Styling mechanics

- Style with Tailwind utility classes applied directly in JSX via `className`.
- Compose conditional classes with the `cn()` helper (`clsx` + `tailwind-merge`), never string
  concatenation:
  ```js
  // frontend/src/lib/utils.js
  import clsx from 'clsx';
  import { twMerge } from 'tailwind-merge';

  export function cn(...inputs) {
    return twMerge(clsx(inputs));
  }
  ```
- Express component style variants with `class-variance-authority` (`cva`). Keep value→variant
  mappings (the skill's status palette, role badges, etc.) in dedicated modules in `lib/`, not
  inline ternaries scattered across pages — recoloring a state happens in one place. Make sure
  Tailwind's `content` globs cover those modules so the classes survive purging.
- No custom CSS unless unavoidable; class order stays layout-first:
  `display → position → sizing → spacing → typography → color → border → effects`.

### Data fetching

- All network access goes through the single **`lib/api.js`** client — never call `fetch`
  inline in a component. It owns the base URL, JSON parsing, CSRF handling, and error mapping,
  and exposes an `api` object (`api.get`, `api.post`, …) plus an `ApiError` class.
- Responses use the standard envelope: unwrap `{ data }` on success; throw a typed `ApiError`
  carrying the status and `{ error: { message } }` on failure.
- Consume the client from components via hooks (`useEffect`/`useState` or a context provider),
  handling `loading` / `error` / `data` states explicitly.

```js
// frontend/src/lib/api.js (shape)
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(payload?.error?.message ?? `Request failed: ${res.status}`, res.status);
  }
  return payload.data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
```

### Build & tooling

- Bundle with Vite; the dev server proxies API routes to the Express backend.
- Production build is emitted into the backend's `public/` and served by Express.
- Frontend config comes from Vite env vars (`import.meta.env.VITE_*`) — never hardcoded.
- Tests are colocated (`Component.test.jsx`) and run with Vitest + `@testing-library/react`.

---

## Environment & Config

- All config loaded from environment variables — never hardcoded
- Always provide a `.env.example` with all required keys documented
- **Backend:** config is centralized in `src/config/index.js` — other modules import
  from there, not directly from `process.env`
- **Frontend:** config comes from Vite env vars (`import.meta.env.VITE_*`), documented in
  `frontend/.env.example`

```js
// src/config/index.js
module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};
```

---

## Testing

- Use **Vitest** for both backend and frontend.
- **Backend:** unit-test services/models/utils in isolation; test the HTTP layer end-to-end with
  `supertest` against the Express app. Backend integration tests live in `tests/`. Every
  endpoint gets a case per status code its schema claims it can return.
- **Frontend:** test components and hooks with `@testing-library/react`; assert on behavior and
  rendered output, not implementation details.
- **Colocate** unit tests next to the code they cover (`foo.js` → `foo.test.js`).
- Run everything with the root `npm test` (backend then frontend).

---

## General Principles

- **Use the skills:** consult the routing table at the top of this file and invoke the matching skill *before* writing the code, not after. Load the `references/` file the task needs; adapt `templates/` instead of writing from scratch. Skills supply technique; this file supplies the stack and conventions, and wins on any conflict.
- **Modularity first:** Every piece of logic should be independently replaceable. If changing one thing requires changing three files in unrelated layers, the structure is wrong.
- **Fix forward:** Don't hack around problems. Identify the root cause and fix it correctly.
- **No magic:** Avoid frameworks, libraries, or patterns that obscure what is actually happening.
- **Explicit over implicit:** Prefer clear, readable code over clever one-liners.
- **Small surface area:** Keep modules focused. A file that does two things should probably be two files.
- **Standard HTTP semantics:** Use correct status codes, consistent response shapes (`{ data: ... }` for success, `{ error: { message } }` for failures).
- **Always document the API:** `docs/openapi.yaml` is generated from the route validation schemas and committed. CI fails on drift or on an undocumented route — the docs can never go stale.
- **No console.log anywhere:** Use the shared pino logger for all output — `console.*` calls are never acceptable in application code.
- **conventional commits:** Use conventional commits for any git commit messages
