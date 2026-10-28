# Data, errors and feedback

The UI conventions only hold together if fetching is uniform. One client, one
envelope, one error type.

## The client

`lib/api.js` is the single network module — components never call `fetch`. It
owns the base URL, the response envelope, CSRF, error mapping, token refresh and
session expiry.

The server contract it assumes: `{ data: … }` on success, `{ error: { message,
code, details } }` on failure, no body on `204`, and `{ data, pagination, meta }`
for a list — `pagination` being `{ total, page, pages, limit }`, `meta` anything
else the server says about the set (counts per view, the options a filter can
offer). An older API that nests it as `meta.pagination` is read too.

```js
export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  del: (path, options) => request('DELETE', path, undefined, options),
};
```

`request`:

- unwraps `data`; returns `{ items, pagination, meta }` for a list; returns
  `null` for a 204;
- sends a `FormData` body as multipart (no `content-type` of its own, so the
  boundary survives) and anything else as JSON;
- treats a 2xx whose body is not JSON as a fault — a proxy's error page or a
  truncated body is never an empty result;
- otherwise throws an `ApiError` carrying `status`, `code` and `details`, with
  `isUnauthorized` / `isForbidden` / `isNotFound` getters and `fieldErrors` —
  the 422's `details.fields`, keyed by field name, ready for `Field`.

Typed errors are what let `ErrorState` distinguish 401 from 403 from a real
fault. `toQuery(params)` builds a query string, dropping empty values.

`fetchAllPages(path)` walks a paginated list page by page for a view that shows
the whole set at once (an A–Z index, an export). It has a page ceiling so a
miscounting server cannot loop it forever.

## Errors, in words

`lib/errors.js` exports `describeError(error)` → `{ kind, icon, title,
description }`, by what actually happened: `unauthorized`, `forbidden`,
`notFound`, `unreachable` (no status — the request never reached the server),
`failed`. `ErrorState` renders it; use it for a failed action's toast too, so a
403 reads the same everywhere:

```js
} catch (caught) {
  toast.error('Nothing was changed', { description: describeError(caught).description });
}
```

The API's own message wins whenever it is specific, because it is written for
the reader. The server's generic 5xx sentence is replaced with what the person
can do about it.

## CSRF

The CSRF cookie is readable on purpose — the client reads it and echoes it in an
`x-csrf-token` header on every state-changing request. It is a double-submit
cookie, so readability is the mechanism, not a leak.

An API that checks `Sec-Fetch-Site` instead (same-origin writes only) needs
nothing from the client: drop `readCsrfToken` and the header.

## Session expiry

This is the part most easily got wrong, and it is worth getting right because
the failure is so user-hostile.

A 401 gets **one** refresh-and-replay: an expired access token is recoverable and
the user should never notice. Concurrent 401s collapse into a single refresh so a
page with six panels does not fire six refreshes.

If the refresh fails, the session is genuinely over. The client then **notifies a
listener** rather than merely throwing:

```js
let sessionExpiredListener = null;
export function onSessionExpired(listener) { … }   // returns an unsubscribe
```

`AuthContext` subscribes and clears the user. That is the whole fix: the route
guard re-renders, sees nobody signed in, and redirects to sign-in with the
current location so the user returns to where they were. The sign-in page says
*why* they are there.

Two details that prevent lies:

- **Auth endpoints are excluded.** `GET /auth/me` answering 401 is how the app
  asks "is anyone signed in?" — treating that as an expiry would fire on every
  cold load.
- **Only a session that was live can expire.** Telling someone who never signed
  in that their session expired is simply false.

The subscription is a function, not an import, so the network client stays free
of React and the router.

Without this, a 401 mid-session surfaces as an error panel on the page the user
was working on, with a retry button that cannot possibly work.

**With server-side sessions** (an OIDC sign-in and a session cookie, no refresh
token) there is nothing to refresh, and redirecting would unload the page and
lose what the person was typing. The better shape there: the listener returns a
promise; `AuthContext` opens sign-in in a separate window and resolves `true`
when the same person is back; the held request is sent once more. Every call that
meets a 401 meanwhile waits on the same sign-in. Replaying is safe only because
the server checks access before doing anything — say so in the code.

## Hooks

`useApi(path, deps, { enabled, fetcher })` returns `{ data, error, loading,
reload, setData }`.

- It aborts in-flight requests on unmount and ignores responses superseded by a
  newer request — without that, fast filter changes race and the slowest
  response wins.
- **`data` belongs to the path it was fetched for.** When the path changes (item
  7 → item 8 on the same route) `data` is `null` and `loading` is true until the
  new resource arrives, so a page can never show — or act on — the previous
  resource under the new URL. A `reload` of the same path keeps showing what it
  has.
- `fetcher` replaces `api.get` — e.g. `fetchAllPages`. It must be a stable,
  module-level function.

`useCollection(path, deps)` wraps it for lists: `{ items, total, pagination,
meta, loading, error, reload }`.

`useFilters(defaults)` keeps filter state in the URL: `{ filters, setFilter,
setFilters, clear, queryString, activeCount }`. Any filter change returns to page 1; an empty
value removes the parameter. It also records the list's query string in
`lib/listView.js` (per tab, in `sessionStorage` with an in-memory fallback), so
`BackLink` — or a form sending someone back after a save, via
`listViewPath('/things')` — returns them to the page and filters they left.

`useDebouncedValue(value, delay = 300)` — the value once it has stopped
changing; `SearchField` is built on it.

`useDocumentTitle(title)` — "Title — Site" in the browser tab. Every routed page
calls it, so history and tabs are readable.

Pages own fetching; components take data and callbacks as props. A presentational
component that fetches cannot be reused or tested in isolation.

## Toasts

`ToastContext` exposes `toast.success/error/warning/info(title, { description })`.
Each toast's auto-dismiss timer is cleared when the provider unmounts.

Toasts are for the result of an action the user just took. They are not for
reporting the state of a page — that is `ErrorState`'s or a `Notice`'s job — and
not for validation errors, which belong under the offending field where the fix
is.

Write the description as the consequence, not a restatement: "Its findings were
resolved. The record that they existed is kept" tells the user what they just
did.

A partial success is a `warning` (or an `error` naming what was refused), not a
`success`. If three of four items changed, say so and name the one that did not.

## Formatting

`lib/format.js`: `formatDate`, `formatDateTime`, `formatRelative`,
`formatNumber`, `formatDuration`, `truncate`, `ageInDays`, plus domain
formatters.

All of them return an em dash for null rather than "null", "NaN" or an empty
cell. A dash reads as "not applicable"; a blank cell reads as a bug.
