# HTTP semantics reference

The decisions that make an API predictable. Consult this when adding an endpoint
or reviewing one.

## Resource naming

| Rule | Good | Bad |
|---|---|---|
| Plural nouns for collections | `/api/users` | `/api/user`, `/api/getUsers` |
| Kebab-case multi-word paths | `/api/backup-runs` | `/api/backupRuns`, `/api/backup_runs` |
| Nest only to express ownership | `/api/clients/:id/vaults` | `/api/vaults-for-client/:id` |
| Stop nesting at one level | `/api/vaults/:id/snapshots` | `/api/clients/:c/vaults/:v/snapshots/:s/files` |
| Sub-resource for a projection | `/api/users/:id/permissions` | `/api/users/:id?include=permissions` |
| No file extensions, no trailing slash | `/api/users` | `/api/users.json`, `/api/users/` |
| camelCase JSON fields | `createdAt` | `created_at` (map it in the model) |

When an operation genuinely is not CRUD, model the *result* as a resource
(`POST /api/backup-runs` starts a run) or use a clearly-marked action
sub-resource (`POST /api/clients/:id/actions/rekey`). Do not scatter verbs into
collection paths.

## Methods

| Method | Purpose | Safe | Idempotent | Body |
|---|---|---|---|---|
| `GET` | Read a resource or collection | yes | yes | never |
| `POST` | Create, or trigger a non-idempotent action | no | no | yes |
| `PUT` | Full replace at a known URL | no | yes | yes |
| `PATCH` | Partial update | no | no* | yes |
| `DELETE` | Remove | no | yes | rarely |

\* Make `PATCH` idempotent in practice — same body twice yields the same state.

`GET` must never mutate. If a read needs a body-sized filter payload, keep it a
`GET` with query params, or accept `POST /api/<resource>/search` and document it
as a query operation.

## Status codes

**Success**

| Code | Use |
|---|---|
| `200 OK` | Successful read, update, or action returning a body |
| `201 Created` | Resource created. **Always** set `Location` to the new URL and return the resource |
| `202 Accepted` | Work queued; return a status URL to poll |
| `204 No Content` | Delete, or an update with nothing to return. No body — not `{}` |

**Client errors**

| Code | Use | Not this |
|---|---|---|
| `400 Bad Request` | Malformed syntax, unparseable JSON, schema violation | using it for everything |
| `401 Unauthorized` | Missing/invalid/expired credentials. Include `WWW-Authenticate` | using it when the caller *is* known |
| `403 Forbidden` | Authenticated but not permitted. Re-authenticating won't help | leaking that a hidden resource exists |
| `404 Not Found` | Resource does not exist, or the caller may not know it does | for a failed validation |
| `405 Method Not Allowed` | Path exists, method does not. Include `Allow` | `404` |
| `409 Conflict` | Uniqueness violation, state conflict, edit collision | `400` |
| `410 Gone` | Deliberately removed and won't come back | |
| `412 / 428` | Precondition failed / precondition required (`If-Match` on updates) | |
| `413 / 414` | Payload or URI too large | |
| `415 Unsupported Media Type` | Wrong `Content-Type` | `400` |
| `422 Unprocessable Content` | Syntactically valid, semantically wrong (business rule) | overlapping with `400` |
| `429 Too Many Requests` | Rate limited. **Always** include `Retry-After` | silently dropping |

Pick one convention for `400` vs `422` and hold it project-wide: **`400` for
schema/shape failures, `422` for business-rule failures.** Document it once.

**Server errors**

`500` for an unhandled fault (log it, never leak the stack or SQL to the
client), `502`/`503`/`504` for upstream failures — with `Retry-After` on `503`.

**Never** return `200` with an error inside the body.

## Error payload

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "email", "message": "must match format \"email\"" }
    ]
  }
}
```

- `message` — human-readable, safe to display, stable enough to not be parsed.
- `code` — optional `SCREAMING_SNAKE_CASE` machine-readable discriminator. Add
  it once clients need to branch; it is part of your contract from then on.
- `details` — optional array, used for field-level validation failures.

Never include stack traces, SQL, driver messages, or internal hostnames.
`5xx` messages are generic; the specifics go to the logger with a request id
the caller can quote back.

## Pagination

Default to offset pagination; switch to cursor pagination for large or
frequently-mutating collections (offset pages drift and skip rows under
concurrent writes).

```
GET /api/users?limit=50&offset=100
```

```json
{
  "data": [ ... ],
  "meta": { "total": 1284, "limit": 50, "offset": 100 }
}
```

Cursor form:

```
GET /api/backup-runs?limit=50&cursor=eyJpZCI6IjAxSC4uLiJ9
```

```json
{ "data": [ ... ], "meta": { "limit": 50, "nextCursor": "eyJpZCI6...", "hasMore": true } }
```

Rules: **every** collection endpoint is paginated from day one — retrofitting is
a breaking change. `limit` has a schema `default` and a hard `maximum` (50/100
is typical). Ordering must be deterministic and total (`ORDER BY created_at
DESC, id DESC`) or pages will repeat rows. Treat cursors as opaque.

## Filtering, sorting, sparse fields

```
GET /api/users?status=active&createdAfter=2026-01-01&sort=-createdAt&fields=id,email
```

- Filters are flat query params named after fields; ranges use
  `<field>After` / `<field>Before` or `min<Field>` / `max<Field>`.
- `sort` takes a comma-separated list, `-` prefix for descending.
  **Allowlist sortable columns** and map them to SQL identifiers — never
  interpolate a client string into `ORDER BY`.
- `fields` is a comma-separated allowlist too. Skip it entirely until a client
  needs it.
- Every filter appears in the query schema with `additionalProperties: false`,
  so a typo'd filter is a `400` instead of a silently unfiltered full scan.

## Auth

- Bearer tokens in `Authorization: Bearer <token>`, or `httpOnly`/`Secure`/
  `SameSite` cookies for a first-party browser SPA. Never accept credentials in
  a query string — they land in logs and referrers.
- Cookie-authenticated state-changing routes need CSRF protection.
- API keys are hashed at rest (never stored or logged in plaintext), shown to
  the user exactly once, and independently revocable.
- Authentication is middleware and produces `req.auth`. Authorization is a
  service decision — the layer that knows the resource decides who may touch it.
- Return `404` rather than `403` when the existence of a resource is itself
  privileged.
- Describe the scheme once in `components/securitySchemes` and reference it per
  operation; mark public routes explicitly.

## Idempotency

Retries are inevitable. `PUT` and `DELETE` are naturally idempotent. For unsafe
`POST`s that create or move money/state, accept an `Idempotency-Key` header,
store the key with the response, and replay the stored response on a repeat.
Document the key's retention window.

Use `ETag` + `If-Match` on updates to prevent lost writes; respond `412` on
mismatch, and `428` if you require the header and it is absent.

## Versioning

Prefix the path: `/api/v1/...`. Add a version only for a genuinely breaking
change, and prefer avoiding one:

- **Non-breaking (no new version):** adding an endpoint, adding an optional
  request field, adding a response field, adding an enum value clients treat as
  opaque.
- **Breaking (new version):** removing or renaming a field, tightening
  validation, changing a type or a status code, changing default behavior.

Deprecate before removing: set the `Deprecation` and `Sunset` response headers,
mark the operation `deprecated: true` in the spec, and give clients a window.

## Headers and transport

- `Content-Type: application/json; charset=utf-8` on every JSON response.
- Reject bodies whose `Content-Type` is not JSON with `415`; cap body size on
  `express.json({ limit: '1mb' })`.
- Timestamps are ISO 8601 UTC (`2026-08-07T14:03:00Z`). Money is integer minor
  units or a string decimal — never a float. IDs are strings (UUID/ULID) in
  JSON, even when they are integers in the database.
- `null` means "known to be empty"; omit a field only when it is genuinely
  absent. Be consistent — pick one and encode it in the schema.
- CORS is explicit-allowlist, never `*` on a credentialed API.
- Set `Cache-Control: no-store` on anything authenticated unless you have
  deliberately designed the caching.
- Compression on, HTTPS only, HSTS in production.

## Rate limiting

Limit per authenticated identity (fall back to IP for anonymous routes), and
return the state so clients can behave:

```
RateLimit-Limit: 100
RateLimit-Remaining: 12
RateLimit-Reset: 30
Retry-After: 30      (on 429)
```

Give expensive endpoints their own tighter bucket. Document the `429` response
in every rate-limited operation's schema.
