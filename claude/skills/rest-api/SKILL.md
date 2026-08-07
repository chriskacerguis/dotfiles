---
name: rest-api
description: >
  Standards and working reference implementation for building HTTP APIs in
  Node.js/Express — resource-oriented REST, correct HTTP semantics, the
  `{ data }` / `{ error }` envelope, layered routes→controllers→services→models
  architecture, ajv request validation, and a generated-and-committed OpenAPI
  3.1 spec (`docs/openapi.yaml`) that CI proves is never stale. Use this
  WHENEVER adding, changing, reviewing, or documenting any API endpoint so the
  surface stays consistent, DRY, and documented. Triggers: "new endpoint",
  "add a route", "API", "REST", "controller", "openapi", "swagger", "api docs",
  "status code", "pagination", "validate request", "versioning".
---

# REST API Standards

Every HTTP surface is a **REST API**: resource-oriented, JSON in / JSON out, no
server-rendered views. Every API ships an **OpenAPI 3.1 spec that is generated
from the same schemas that validate requests at runtime**, so the docs cannot
drift from the code.

Read [references/http-semantics.md](references/http-semantics.md) when choosing
methods, status codes, URL shapes, pagination, or error payloads. Read
[references/openapi-pipeline.md](references/openapi-pipeline.md) when wiring the
spec generator or its CI gates. The [assets/](assets/) directory is a working,
copy-in implementation of everything below.

## Golden rules

1. **Resources, not actions.** URLs name nouns (`/api/backup-runs`), methods
   supply the verb. No `/getUser`, no `/api/users/create`.
2. **One envelope, always.** Success is `{ "data": ... }`. Failure is
   `{ "error": { "message": ... } }` (plus optional `code`, `details`). A `204`
   has no body. Nothing else is a valid response shape.
3. **Schemas are the source of truth.** Every route declares JSON Schema for its
   params/query/body/responses in `src/schemas/<resource>.js`. That same object
   validates requests at runtime *and* generates the spec. One definition, two
   jobs — this is the DRY rule the whole design rests on.
4. **Never hand-edit `docs/openapi.yaml`.** It is a build artifact. Change the
   schema, run `npm run openapi:generate`, commit the diff.
5. **Layers do one job each.** `routes` wire, `controllers` speak HTTP,
   `services` hold business logic, `models` hold SQL. A layer never reaches past
   its neighbor, and `req`/`res` never appear below the controller.
6. **Errors are thrown, never returned.** Any layer throws a typed error; the
   single error middleware is the only place that formats an HTTP failure.
7. **Trust nothing from the client.** Validate every param, query, and body
   against its schema before the controller runs. Unvalidated input reaching a
   service is a bug.
8. **Parameterized SQL only.** `$1, $2` placeholders. String-interpolated SQL is
   never acceptable, not even for a column sort — allowlist those instead.
9. **No `console.*`.** Structured pino logging: `logger.info({ ctx }, 'msg')`.
10. **Every endpoint is tested.** A supertest case per status code the schema
    claims the route can return.

## Request lifecycle

Wire it in this order, and put each concern in exactly one place:

```
request
  → pino-http            (request logging — never log req/res by hand)
  → express.json()       (body parsing, with a size limit)
  → auth middleware      (identify the caller; attach req.auth)
  → rate limiter         (per-identity once auth is known)
  → validate(contract)   (ajv: params, query, body — coerced + defaulted)
  → controller           (HTTP only: read req, call service, shape res)
      → service          (business logic, authorization decisions, transactions)
          → model        (parameterized SQL)
  → errorHandler         (last middleware; the only formatter of failures)
```

## Layer contracts

**Route** — declarative wiring, no logic. Ten lines, and you can read the whole
resource surface at a glance:

```js
// src/routes/users.js
const { createRouter } = require('../lib/apiRouter');
const schemas = require('../schemas/users');
const users = require('../controllers/users');

const api = createRouter('/api/users', { tag: 'Users' });

api.get('/', schemas.listUsers, users.list);
api.post('/', schemas.createUser, users.create);
api.get('/:id', schemas.getUser, users.get);
api.patch('/:id', schemas.updateUser, users.update);
api.delete('/:id', schemas.deleteUser, users.remove);

module.exports = api;
```

`createRouter` wires `validate(contract)` for you and records the route in the
registry the spec generator reads — a route physically cannot exist without a
schema, and cannot exist without being documented. Routers are mounted in one
place, `src/app.js`, never scattered. See
[references/openapi-pipeline.md](references/openapi-pipeline.md) for the wiring.

**Controller** — translates HTTP to a service call and back. No SQL, no business
rules, no `if (user.role === 'admin')`. Every handler is a named `async`
function wrapped in `try/catch (err) { next(err) }`:

```js
// src/controllers/users.js
const usersService = require('../services/users');

async function list(req, res, next) {
  try {
    const { items, total } = await usersService.listUsers(req.query);
    res.json({ data: items, meta: { total, ...req.query } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const user = await usersService.createUser(req.body, req.auth);
    res.status(201).location(`/api/users/${user.id}`).json({ data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
```

**Service** — the business logic, and the only layer that decides *whether* an
operation is allowed. Pure inputs and outputs; it must be callable from a job or
a CLI script with no HTTP in sight:

```js
// src/services/users.js
const usersModel = require('../models/users');
const { NotFound, Conflict } = require('../lib/errors');

async function getUser(id) {
  const user = await usersModel.findById(id);
  if (!user) throw new NotFound('User not found');
  return user;
}

async function createUser({ email, name }) {
  if (await usersModel.findByEmail(email)) {
    throw new Conflict('A user with that email already exists');
  }
  return usersModel.insert({ email, name });
}
```

**Model** — parameterized SQL and nothing else. No validation, no business
rules, no throwing HTTP errors. Returns rows or `undefined`:

```js
// src/models/users.js
const db = require('../db');

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}
```

## Staying DRY

The failure mode of an API codebase is the same shape repeated in six places.
Kill each one at its source:

| Repetition | Where it belongs instead |
|---|---|
| `res.json({ data })` / error shapes | The envelope is applied in the controller and the error middleware — nowhere else. Response schemas describe the payload *inside* the envelope; the generator wraps them. |
| Identical `try/catch` in every handler | Keep it — it is three lines and explicit — or wrap once with an `asyncHandler`. Never mix both styles in one project. |
| Same field shape in five schemas | Define `userResponse`, `pagination`, `uuidParam` once and reference the object. The generator emits shared objects into `components/schemas` and `$ref`s them. |
| `limit`/`offset` query blocks | One `paginationQuery` schema object, spread into every list contract. |
| `if (!row) return res.status(404)` | One `NotFound` throw in the service. |
| Repeated auth/role checks in controllers | Middleware for *authentication*, service for *authorization*. |
| Hand-written docs alongside code | Generated from the schema. If you are typing YAML, you are doing it wrong. |
| Env vars read via `process.env` in modules | `src/config/index.js` only. |

Rule of thumb: **if changing one API behavior means editing more than one layer
per concern, the abstraction is in the wrong place.**

## Schemas: the one definition

A contract per route, colocated by resource. Reuse aggressively:

```js
// src/schemas/users.js
const { paginationQuery, uuidParam, errors } = require('./common');

const userResponse = {
  type: 'object',
  required: ['id', 'email', 'name', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const listUsers = {
  operationId: 'listUsers',
  summary: 'List users',
  tags: ['Users'],
  query: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...paginationQuery.properties,
      email: { type: 'string', format: 'email' },
    },
  },
  responses: {
    200: { type: 'array', items: userResponse },
    ...errors(400, 401),
  },
};

const createUser = {
  operationId: 'createUser',
  summary: 'Create a user',
  tags: ['Users'],
  body: {
    type: 'object',
    required: ['email', 'name'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string', minLength: 1, maxLength: 200 },
    },
  },
  responses: {
    201: userResponse,
    ...errors(400, 401, 409),
  },
};

module.exports = { userResponse, listUsers, createUser };
```

Rules:

- `additionalProperties: false` on every body and query object. Unknown fields
  are a `400`, not a silent no-op.
- Declare **every** status the route can return — `400`, `401`, `403`, `404`,
  `409`, `422`, `429`, `500` — not just the happy path. Shared error responses
  come from `components/responses`.
- Constrain strings (`minLength`/`maxLength`/`pattern`/`format`) and integers
  (`minimum`/`maximum`). An unbounded `limit` is a denial-of-service.
- Give every route a stable `operationId` — client generators key off it.

## CI gates (non-negotiable)

Three checks keep the docs honest. All three fail the build:

1. **Freshness** — `npm run openapi:generate && git diff --exit-code docs/openapi.yaml`
2. **Coverage** — a contract test comparing **express's own route table** against
   the spec, both directions. An undocumented endpoint is a red build; so is a
   documented endpoint that no longer exists. Checking the spec against the
   registry it was generated from proves nothing — compare against what express
   actually serves.
3. **Validity** — lint the emitted document (`redocly lint` or `spectral lint`).

Serve the spec at `GET /api/openapi.yaml` and render a reference UI outside
production.

## Checklist for any endpoint change

- [ ] URL is a resource noun; the method carries the verb
- [ ] Correct status code, including `201` + `Location` on create and `204` on delete
- [ ] Schema declares params/query/body and **every** response status
- [ ] `validate()` is wired in the route
- [ ] Controller has no business logic; service has no `req`/`res`; model has no rules
- [ ] Errors thrown as typed errors, formatted only by the error middleware
- [ ] SQL is parameterized; list endpoints are bounded and paginated
- [ ] Nothing sensitive logged or returned (tokens, hashes, PII)
- [ ] Tests cover happy path plus each declared error status
- [ ] `npm run openapi:generate` run, `docs/openapi.yaml` committed in the same change
