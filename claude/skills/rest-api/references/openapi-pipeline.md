# The OpenAPI pipeline

`docs/openapi.yaml` is **generated from the schemas that already validate
requests at runtime**. That single fact is what makes the documentation
trustworthy: a wrong schema breaks tests, so a wrong schema cannot survive long
enough to produce wrong docs.

Comments lie. Runtime schemas don't. Nothing in this pipeline reads JSDoc,
decorators, or annotations.

```
src/schemas/*.js          ← the one definition (JSON Schema per route)
      │
      ├── validate(contract) ──→ enforces every request at runtime (ajv)
      │
      └── src/lib/openapi.js ──→ bin/generate-openapi.js ──→ docs/openapi.yaml
                                                                  │
                                            committed, diffed in review,
                                            served at GET /api/openapi.yaml
```

## Install

```bash
npm i ajv ajv-formats yaml
```

```jsonc
// package.json
"scripts": {
  "openapi:generate": "node bin/generate-openapi.js",
  "openapi:check":    "npm run openapi:generate && git diff --exit-code docs/openapi.yaml",
  "openapi:lint":     "npx @redocly/cli lint docs/openapi.yaml",
  "test":             "vitest run && npm run frontend:test"
}
```

## Files

Copy these from [../assets/](../assets/) — they work together as one unit:

| Asset | Destination | Role |
|---|---|---|
| `errors.js` | `src/lib/errors.js` | Typed errors any layer may throw |
| `errorHandler.js` | `src/middleware/errorHandler.js` | The only formatter of failures |
| `validate.js` | `src/middleware/validate.js` | ajv enforcement of a contract |
| `schemas-common.js` | `src/schemas/common.js` | Shared shapes: pagination, uuid, `errors()` |
| `apiRouter.js` | `src/lib/apiRouter.js` | Router, route registry, mount introspection |
| `openapi.js` | `src/lib/openapi.js` | Registry + schemas → OpenAPI 3.1 |
| `spec.js` | `src/lib/spec.js` | *This* project's document — title, servers, tags, security |
| `generate-openapi.js` | `bin/generate-openapi.js` | Writes `docs/openapi.yaml` |
| `openapi.contract.test.js` | `tests/openapi.contract.test.js` | Coverage + freshness + rigour gates |

The generator and the contract test both build the document through
`src/lib/spec.js`, so "what gets written" and "what gets checked" cannot be two
different things. Verified against Express 4.22 and 5.2.

## Wiring

**Routes** declare their own mount prefix, so it is written once:

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

`createRouter` wires `validate(contract)` for you — a route physically cannot
exist without a schema, and the registry it fills is what the generator reads.

```js
// src/routes/index.js — the one list of mounted routers
module.exports = [
  require('./users'),
  require('./orders'),
];
```

```js
// src/app.js
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const errorHandler = require('./middleware/errorHandler');
const { NotFound } = require('./lib/errors');

const app = express();

app.disable('x-powered-by');
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));

for (const { basePath, router } of require('./routes')) {
  app.use(basePath, router);
}

app.get('/api/openapi.yaml', (req, res) =>
  res.type('text/yaml').sendFile(require('node:path').join(__dirname, '..', 'docs', 'openapi.yaml'))
);

app.use((req, res, next) => next(new NotFound(`No route for ${req.method} ${req.path}`)));
app.use(errorHandler); // always last

module.exports = app;
```

**Named schemas** — anything reused across routes gets a name so the generator
emits it once under `components/schemas` and `$ref`s it everywhere. Matching is
by **object identity**, so export and reuse the object; never copy its shape.

```js
// src/schemas/index.js
const users = require('./users');
const common = require('./common');

// name → the exact schema object used in the contracts
const namedSchemas = {
  User: users.userResponse,
  PaginationMeta: common.paginationMeta,
};

module.exports = { namedSchemas, users, common };
```

## The contract object

One object per route, consumed by both `validate()` and the generator:

```js
{
  operationId: 'listUsers',        // required, unique, stable — clients key off it
  summary: 'List users',           // required, one line
  description: 'Longer prose.',    // optional
  tags: ['Users'],                 // set automatically by createRouter's `tag`
  deprecated: true,                // optional
  public: true,                    // optional — opts the operation out of global security

  params: { /* JSON Schema object; must declare every :param in the path */ },
  query:  { /* JSON Schema object, additionalProperties: false */ },
  body:   { /* JSON Schema object, additionalProperties: false */ },
  meta:   { /* optional schema for the envelope's `meta` key */ },

  responses: {
    200: userResponse,             // payload INSIDE the envelope — wrapped automatically
    201: response(userResponse, 'The created user'),  // explicit description
    204: null,                     // no body
    ...errors(400, 401, 404),      // shared component responses
  },
}
```

What the generator does for you, so no contract repeats it:

- Wraps every success payload in `{ data: ... }` (plus `meta` if declared).
- Emits the shared `{ error: { message, code?, details? } }` schema and one
  reusable response component per error status.
- Adds the `Location` response header to every `201`.
- Converts `/:id` to `/{id}` and turns `params`/`query` properties into
  parameter objects.
- Appends the envelope note to the spec description.

## Runtime behaviour of `validate()`

- **Coerces** path and query values from strings to their declared types; does
  **not** coerce the JSON body (`{"limit": "10"}` must fail, not silently pass).
- **Applies `default`** from the schema, so a controller reads `req.query.limit`
  and gets `50` without a fallback expression anywhere in the code.
- **Rejects** with `400 VALIDATION_ERROR` and a `details` array of
  `{ field, message }`.
- **Rejects** a non-JSON `Content-Type` with `415` when a body is declared.
- Replaces `req.query` outright (Express 5 exposes it through a getter, so
  mutating the returned object is not reliable).

## The contract test

Four coverage assertions, and the direction of each matters:

| Assertion | Catches |
|---|---|
| mounted ⊆ registry | A route added with a bare `router.get(...)`, bypassing `createRouter` — so unvalidated *and* undocumented |
| registry ⊆ mounted | A contract declared for a route that was never wired up |
| mounted ⊆ spec | An endpoint express serves that the docs never mention |
| spec ⊆ mounted | Documentation for an endpoint that no longer exists |

"Mounted" comes from **express's own route table** (`listMountedRoutes`), not
from the registry the spec is generated from. Comparing the spec against its own
source would pass vacuously and prove nothing.

Then freshness (the built YAML must equal the committed bytes) and rigour (unique
`operationId`, at least one 4xx per operation, a schema on every request body, a
bounded `limit` on every collection).

> **Module identity.** The registry is mutable module state, and Vite's ESM
> transform does not share a module graph with the CJS `require` inside
> `spec.js`. A test that does `import apiRouter from '../src/lib/apiRouter.js'`
> gets a *second, empty* registry and every coverage assertion passes for the
> wrong reason. The test uses `createRequire(import.meta.url)` to pin all four
> imports to Node's CJS loader. If you touch those imports, break a route on
> purpose and confirm the test actually goes red.

## CI

```yaml
- run: npm ci
- run: npm run openapi:check   # freshness — fails on an uncommitted diff
- run: npm run openapi:lint    # validity
- run: npm test                # coverage + rigour contract tests
```

## Troubleshooting

| Symptom | Cause |
|---|---|
| A shape is inlined instead of `$ref`'d | The contract uses a *copy* of the schema. Import and reuse the exported object, and register it in `namedSchemas`. |
| `Path parameter ":id" is not declared` | The contract is missing `params`. Add it — this error is the point. |
| Freshness test fails on every run | Something non-deterministic is in the spec (a timestamp, `Date.now()`, an unsorted map). The generator sorts routes; keep everything else static. |
| A new route is missing from the docs | It was added with a bare `express.Router()` instead of `createRouter`. The coverage test catches this. |
| `additionalProperties` rejects a legitimate field | Add it to the schema. Loosening to `true` hides typos and drops fields from the docs. |
