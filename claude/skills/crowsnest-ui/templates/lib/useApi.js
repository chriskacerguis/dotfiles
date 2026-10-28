import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';

/**
 * Fetch a resource, exposing loading / error / data explicitly.
 * `deps` controls refetching; `reload` re-runs on demand.
 *
 * `data` belongs to the path it was fetched for. When the path changes (item
 * 7 → item 8 on the same route) it is null until the new resource arrives, so
 * a page can never show — or act on — the previous resource under the new URL.
 * A reload of the same path keeps showing what it has.
 *
 * `fetcher` is what loads the path — `api.get` by default, or `fetchAllPages` for
 * a view that shows a whole paginated list at once. It is called as
 * `fetcher(path, { signal })` and must be a stable (module-level) function.
 */
export function useApi(path, deps = [], { enabled = true, fetcher = api.get } = {}) {
  const [stored, setStored] = useState({ path: null, value: null });
  const data = stored.path === path ? stored.value : null;
  const setData = useCallback(
    (next) =>
      setStored((previous) => {
        const current = previous.path === path ? previous.value : null;
        return { path, value: typeof next === 'function' ? next(current) : next };
      }),
    [path],
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  // The path whose latest request has answered, either way. Until the current
  // path's has, the hook is loading — including the render that first sees the
  // new path, before the effect below has started its request.
  const [settledPath, setSettledPath] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const latestRequest = useRef(0);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return undefined;
    }

    const requestId = (latestRequest.current += 1);
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await fetcher(path, { signal: controller.signal });
        // Ignore a response that a newer request has superseded.
        if (requestId !== latestRequest.current) return;
        setStored({ path, value: result });
        setError(null);
        setSettledPath(path);
      } catch (caught) {
        if (controller.signal.aborted || requestId !== latestRequest.current) return;
        setError(caught instanceof ApiError ? caught : new ApiError(caught.message, 0));
        setSettledPath(path);
      } finally {
        if (requestId === latestRequest.current) setLoading(false);
      }
    }
    load();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, reloadToken, ...deps]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const awaitingPath = enabled && Boolean(path) && settledPath !== path;

  return { data, error, loading: loading || awaitingPath, reload, setData };
}

/** A paginated list endpoint: `{ data, pagination }`, unwrapped by lib/api.js. */
export function useCollection(path, deps = [], options) {
  const { data, ...rest } = useApi(path, deps, options);
  return {
    items: data?.items ?? [],
    total: data?.pagination?.total ?? 0,
    pagination: data?.pagination ?? null,
    meta: data?.meta ?? null,
    ...rest,
  };
}
