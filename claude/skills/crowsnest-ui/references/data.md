# Data, errors and feedback

The UI conventions only hold together if fetching is uniform. One client, one
envelope, one error type.

## The client

`lib/api.js` is the single network module — components never call `fetch`. It
owns the base URL, the response envelope, CSRF, error mapping, token refresh and
session expiry.

The server contract it assumes: `{ data: … }` on success, `{ error: { message,
code, details } }` on failure, no body on `204`, and `{ data, meta }` for a
paginated collection.

```js
export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  del: (path, options) => request('DELETE', path, undefined, options),
};
```

`request` unwraps `data`, returns `{ items, meta }` when `meta` is present,
returns `null` for a 204, and otherwise throws an `ApiError` carrying `status`,
`code` and `details`, with `isUnauthorized` / `isForbidden` / `isNotFound`
getters. Typed errors are what let `ErrorState` distinguish 401 from 403 from a
real fault.

## CSRF

The CSRF cookie is readable on purpose — the client reads it and echoes it in an
`x-csrf-token` header on every state-changing request. It is a double-submit
cookie, so readability is the mechanism, not a leak.

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

## Hooks

`useApi(path, deps, { enabled })` returns `{ data, error, loading, reload,
setData }`. It aborts in-flight requests on unmount and ignores responses
superseded by a newer request — without that, fast filter changes race and the
slowest response wins.

`useCollection` wraps it for paginated endpoints, returning `{ items, total,
pagination, … }`.

`useFilters(defaults)` keeps filter state in the URL and resets pagination on any
filter change.

Pages own fetching; components take data and callbacks as props. A presentational
component that fetches cannot be reused or tested in isolation.

## Toasts

`ToastContext` exposes `toast.success/error/warning/info(title, { description })`.

Toasts are for the result of an action the user just took. They are not for
reporting the state of a page — that is `ErrorState`'s job — and not for
validation errors, which belong under the offending field where the fix is.

Write the description as the consequence, not a restatement: "Its findings were
resolved. The record that they existed is kept" tells the user what they just
did.

A partial success is a `warning`, not a `success`. If three of four inventories
synchronised, say so and name the one that did not.

## Formatting

`lib/format.js`: `formatDate`, `formatDateTime`, `formatRelative`,
`formatNumber`, `formatDuration`, `truncate`, `ageInDays`, plus domain
formatters.

All of them return an em dash for null rather than "null", "NaN" or an empty
cell. A dash reads as "not applicable"; a blank cell reads as a bug.
