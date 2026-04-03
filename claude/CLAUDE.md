# Global Claude Code Instructions

## Core Stack

- **Runtime:** Node.js (plain JavaScript — no TypeScript)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **UI:** Tailwind CSS / Tailwind UI components and design patterns
- **Logging:** pino + pino-http

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

Every project follows this layout:

```
project-root/
├── src/
│   ├── app.js              # Express app setup (no server.listen here)
│   ├── server.js           # Entry point — binds port, starts server
│   ├── config/
│   │   └── index.js        # All env/config loaded from process.env
│   ├── db/
│   │   ├── index.js        # pg Pool setup and export
│   │   └── migrations/     # SQL migration files (numbered, sequential)
│   ├── middleware/
│   │   └── *.js            # Auth, error handling, validation, logging, etc.
│   ├── routes/
│   │   └── *.js            # One file per resource/domain
│   ├── controllers/
│   │   └── *.js            # Route handler logic, one per resource
│   ├── services/
│   │   └── *.js            # Business logic, decoupled from HTTP layer
│   ├── models/
│   │   └── *.js            # Data access / query functions (no ORM)
│   ├── utils/
│   │   └── *.js            # Pure helper functions
│   └── logger.js           # Shared pino instance
├── public/                 # Static assets (if applicable)
├── views/                  # Templates (if applicable)
├── tests/
├── .env.example
├── .gitignore
└── package.json
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

## Tailwind UI / Frontend

- Use Tailwind CSS utility classes — no custom CSS unless absolutely unavoidable
- Follow Tailwind UI component patterns: consistent spacing, color, and typography scales
- Use semantic HTML with Tailwind utility classes applied directly
- Component-level class groupings should follow Tailwind UI's layout-first order:
  `display → position → sizing → spacing → typography → color → border → effects`
- Prefer Tailwind UI's headless patterns for interactive components
- Dark mode support via Tailwind's `dark:` variant where relevant

---

## Environment & Config

- All config loaded from environment variables — never hardcoded
- Always provide a `.env.example` with all required keys documented
- Config is centralized in `src/config/index.js` — other modules import from there, not directly from `process.env`

---

## General Principles

- **Modularity first:** Every piece of logic should be independently replaceable. If changing one thing requires changing three files in unrelated layers, the structure is wrong.
- **Fix forward:** Don't hack around problems. Identify the root cause and fix it correctly.
- **No magic:** Avoid frameworks, libraries, or patterns that obscure what is actually happening.
- **Explicit over implicit:** Prefer clear, readable code over clever one-liners.
- **Small surface area:** Keep modules focused. A file that does two things should probably be two files.
- **Standard HTTP semantics:** Use correct status codes, consistent response shapes (`{ data: ... }` for success, `{ error: { message } }` for failures).
- **No console.log anywhere:** Use the shared pino logger for all output — `console.*` calls are never acceptable in application code.
- **conventional commits:** Use conventional commits for any git commit messages