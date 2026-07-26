# Global Claude Code Instructions

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
│   ├── lib/                # Shared internal libraries
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

**Routing registration pattern** — routes are mounted in `app.js`, never scattered:

```js
// src/app.js
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));

app.use(require('./middleware/errorHandler'));

module.exports = app;
```

---

## Express Patterns

### Routes

Thin — delegate immediately to the controller:

```js
// src/routes/users.js
const router = require('express').Router();
const usersController = require('../controllers/users');

router.get('/', usersController.list);
router.get('/:id', usersController.get);
router.post('/', usersController.create);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.remove);

module.exports = router;
```

### Controllers

Handle HTTP concerns only (req/res). All business logic lives in services:

```js
// src/controllers/users.js
const usersService = require('../services/users');

async function list(req, res, next) {
  try {
    const users = await usersService.listUsers(req.query);
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
```

### Services

Contain business logic. Call models for data access. No `req`/`res` references:

```js
// src/services/users.js
const usersModel = require('../models/users');

async function listUsers(filters = {}) {
  return usersModel.findAll(filters);
}

module.exports = { listUsers };
```

### Models

Raw SQL queries only via `pg`. No ORM:

```js
// src/models/users.js
const db = require('../db');

async function findAll({ limit = 50, offset = 0 } = {}) {
  const { rows } = await db.query(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return rows;
}

module.exports = { findAll };
```

### Error Handling

Centralized error middleware — always the last middleware registered:

```js
// src/middleware/errorHandler.js
const logger = require('../logger');

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (status >= 500) {
    logger.error({ err }, 'Unhandled server error');
  }

  res.status(status).json({ error: { message } });
}

module.exports = errorHandler;
```

Throw errors from any layer using a consistent shape:

```js
const err = new Error('User not found');
err.status = 404;
throw err;
```

---

## API Documentation (OpenAPI)

Every project **must** have an OpenAPI 3.1 spec, and it must always be current — this is not
optional and does not need to be asked for.

The spec is **generated from the request/response schemas the API already validates against**, so
it cannot drift from the code. It is not hand-written prose, and it is not scraped out of
JSDoc/decorator comments — comments lie, runtime schemas don't.

### The pipeline

1. **Schemas are the source of truth.** Each route declares plain **JSON Schema** objects for its
   params, query, body, and responses in `src/schemas/<resource>.js`.
2. **The same schemas enforce requests at runtime** via the `validate` middleware (ajv). If a
   schema is wrong, tests fail — which is what keeps the docs honest.
3. **`npm run openapi:generate`** walks the route table + schemas and writes `docs/openapi.yaml`.
4. The generated spec **is committed**, so API changes show up as a reviewable diff in the PR.

```js
// src/schemas/users.js
const userResponse = {
  type: 'object',
  required: ['id', 'email', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const listUsers = {
  summary: 'List users',
  query: {
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
  },
  responses: {
    200: { type: 'array', items: userResponse },
  },
};

module.exports = { userResponse, listUsers };
```

```js
// src/routes/users.js
const router = require('express').Router();
const validate = require('../middleware/validate');
const schemas = require('../schemas/users');
const usersController = require('../controllers/users');

router.get('/', validate(schemas.listUsers), usersController.list);

module.exports = router;
```

### Rules

- Response schemas describe the **payload inside the envelope** — the generator wraps them in
  `{ data: ... }` for success and the shared `{ error: { message } }` for failures automatically.
- Declare every response an endpoint can actually return (`400`, `401`, `403`, `404`, `409`, `500`),
  not just the happy path. Common error responses come from shared components.
- Reuse schema objects rather than redefining shapes per route; the generator emits them once
  under `components/schemas` and `$ref`s them.
- **CI enforces freshness:** re-run the generator and fail if `docs/openapi.yaml` has a diff
  (`npm run openapi:generate && git diff --exit-code docs/openapi.yaml`). Also lint the spec for
  validity.
- **CI enforces coverage:** a contract test asserts every route registered on the Express app
  appears in the spec — an undocumented endpoint is a failing build, not a TODO.
- Serve the spec from the API (`GET /api/openapi.yaml`) and expose a rendered reference outside
  production.
- Never hand-edit `docs/openapi.yaml` — change the schema and regenerate.

---

## PostgreSQL

- Use the `pg` package with a shared connection pool
- Never use an ORM (no Sequelize, Prisma, etc.)
- All queries use parameterized placeholders (`$1`, `$2`, …) — never string interpolation
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

```js
// src/config/index.js
module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
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

Add `logLevel` to config:

```js
// src/config/index.js (updated)
module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};
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
- Build interactive primitives (dialogs, dropdowns, tabs, selects) on **Radix UI**; use
  `lucide-react` for icons.

### Styling (Tailwind + `cn` + variants)

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
  mappings (status colors, role badges, etc.) in dedicated modules in `lib/`, not inline ternaries
  scattered across pages — recoloring a state happens in one place.
- No custom CSS unless unavoidable; class order stays layout-first:
  `display → position → sizing → spacing → typography → color → border → effects`.
- Dark mode via Tailwind's `dark:` variant where relevant.

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

---

## Testing

- Use **Vitest** for both backend and frontend.
- **Backend:** unit-test services/models/utils in isolation; test the HTTP layer end-to-end with
  `supertest` against the Express app. Backend integration tests live in `tests/`.
- **Frontend:** test components and hooks with `@testing-library/react`; assert on behavior and
  rendered output, not implementation details.
- **Colocate** unit tests next to the code they cover (`foo.js` → `foo.test.js`).
- Run everything with the root `npm test` (backend then frontend).

---

## General Principles

- **Modularity first:** Every piece of logic should be independently replaceable. If changing one thing requires changing three files in unrelated layers, the structure is wrong.
- **Fix forward:** Don't hack around problems. Identify the root cause and fix it correctly.
- **No magic:** Avoid frameworks, libraries, or patterns that obscure what is actually happening.
- **Explicit over implicit:** Prefer clear, readable code over clever one-liners.
- **Small surface area:** Keep modules focused. A file that does two things should probably be two files.
- **Standard HTTP semantics:** Use correct status codes, consistent response shapes (`{ data: ... }` for success, `{ error: { message } }` for failures).
- **Always document the API:** `docs/openapi.yaml` is generated from the route validation schemas and committed. CI fails on drift or on an undocumented route — the docs can never go stale.
- **No console.log anywhere:** Use the shared pino logger for all output — `console.*` calls are never acceptable in application code.
- **conventional commits:** Use conventional commits for any git commit messages