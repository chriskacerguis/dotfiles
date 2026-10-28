/**
 * The single network client.
 *
 * Owns the base URL, the response envelope, CSRF handling and error mapping.
 * Components never call fetch directly — they call `api.get`/`api.post` and
 * handle `ApiError`.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? null;
    this.details = details ?? null;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** Per-field validation messages from a 422, keyed by field name. */
  get fieldErrors() {
    return this.details?.fields ?? {};
  }
}

/**
 * The CSRF cookie is readable on purpose: this is a double-submit cookie, so
 * the client echoes it back in a header. Rename it to match the server.
 */
function readCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Who to tell when a session turns out to be over.
 *
 * A 401 that survives a refresh attempt is not an error the page can
 * meaningfully report — the analyst has been signed out, and showing them
 * "Something went wrong: Authentication required" on the screen they were
 * working on is both useless and alarming. The auth provider subscribes here
 * and clears the session, which sends them to sign in again.
 *
 * Kept as a subscription rather than an import so this module stays free of
 * React and the router.
 */
let sessionExpiredListener = null;

export function onSessionExpired(listener) {
  sessionExpiredListener = listener;
  return () => {
    if (sessionExpiredListener === listener) sessionExpiredListener = null;
  };
}

function notifySessionExpired() {
  sessionExpiredListener?.();
}

let refreshInFlight = null;

async function attemptRefresh() {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'x-csrf-token': readCsrfToken() ?? '' },
    });
    return response.ok;
  } catch {
    // The network failed, so the session could not be renewed — the caller
    // treats that exactly like a refused refresh.
    return false;
  } finally {
    refreshInFlight = null;
  }
}

function refreshSession() {
  // Collapse concurrent 401s into a single refresh attempt.
  if (!refreshInFlight) refreshInFlight = attemptRefresh();
  return refreshInFlight;
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

async function request(method, path, body, { retryOnUnauthorized = true, signal } = {}) {
  const hasBody = body !== undefined && body !== null;
  const headers = { accept: 'application/json' };
  // A FormData body sets its own multipart boundary; naming a content type here
  // would break it.
  if (hasBody && !isFormData(body)) headers['content-type'] = 'application/json';
  if (!['GET', 'HEAD'].includes(method)) {
    const csrf = readCsrfToken();
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'same-origin',
    headers,
    body: hasBody ? (isFormData(body) ? body : JSON.stringify(body)) : undefined,
    signal,
  });

  if (response.status === 204) return null;

  let payload;
  try {
    payload = await response.json();
  } catch (caught) {
    if (caught?.name === 'AbortError') throw caught;
    // Every success the API sends is a JSON envelope, so an unreadable one is a
    // fault (a proxy's error page, a truncated body) — never an empty result.
    if (response.ok) throw new ApiError('The server sent a response that could not be read.', response.status);
    payload = {};
  }

  if (!response.ok) {
    // The auth endpoints answer 401 as a normal part of their job — `/auth/me`
    // is how the app asks whether anyone is signed in — so they are excluded
    // from both the replay and the sign-out below.
    if (response.status === 401 && !path.startsWith('/api/v1/auth/')) {
      // An expired access token is recoverable: rotate and replay once.
      if (retryOnUnauthorized) {
        const refreshed = await refreshSession();
        if (refreshed) return request(method, path, body, { retryOnUnauthorized: false, signal });
      }
      // The refresh failed, or was already spent on this request. The session
      // is genuinely over rather than merely stale.
      notifySessionExpired();
    }
    throw new ApiError(
      payload?.error?.message ?? `The request failed with status ${response.status}.`,
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    );
  }

  // A list carries `pagination` (or, in older APIs, `meta.pagination`) beside its
  // data; anything else the server says about the set travels in `meta`.
  if (payload && (payload.pagination || payload.meta)) {
    return {
      items: payload.data,
      pagination: payload.pagination ?? payload.meta?.pagination ?? null,
      meta: payload.meta ?? null,
    };
  }
  return payload.data;
}

/** Build a query string, dropping empty values and expanding arrays. */
export function toQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * Every item of a paginated list, fetched page by page — for a view that shows
 * the whole set at once, like an A–Z index. `maxPages` is a ceiling, not a
 * target: it stops a runaway loop if a server ever miscounts.
 */
export async function fetchAllPages(path, { limit = 100, maxPages = 50, signal } = {}) {
  const separator = path.includes('?') ? '&' : '?';
  const items = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await request('GET', `${path}${separator}limit=${limit}&page=${page}`, undefined, { signal });
    items.push(...result.items);
    if (!result.pagination || page >= result.pagination.pages) break;
  }
  return items;
}

export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  del: (path, options) => request('DELETE', path, undefined, options),
};
