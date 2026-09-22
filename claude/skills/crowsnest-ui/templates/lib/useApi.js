import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';

/**
 * Fetch a resource, exposing loading / error / data explicitly.
 * `deps` controls refetching; `reload` re-runs on demand.
 */
export function useApi(path, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
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

    api
      .get(path, { signal: controller.signal })
      .then((result) => {
        // Ignore a response that a newer request has superseded.
        if (requestId !== latestRequest.current) return;
        setData(result);
        setError(null);
      })
      .catch((caught) => {
        if (controller.signal.aborted || requestId !== latestRequest.current) return;
        setError(caught instanceof ApiError ? caught : new ApiError(caught.message, 0));
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, reloadToken, ...deps]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, error, loading, reload, setData };
}

/** A collection endpoint: `{ items, meta }`. */
export function useCollection(path, deps = [], options) {
  const { data, ...rest } = useApi(path, deps, options);
  return {
    items: data?.items ?? [],
    total: data?.meta?.pagination?.total ?? 0,
    pagination: data?.meta?.pagination ?? null,
    ...rest,
  };
}

/** Run a mutation, exposing `pending` and surfacing the error to the caller. */
export function useMutation(fn) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setPending(false);
      }
    },
    [fn],
  );

  return { mutate, pending, error };
}
