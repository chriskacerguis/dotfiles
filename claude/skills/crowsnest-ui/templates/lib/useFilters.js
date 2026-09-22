import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toQuery } from '@/lib/api';

/**
 * Filters live in the URL, so a filtered view is a shareable link — which is
 * how one analyst hands a query to another.
 */
export function useFilters(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const current = { ...defaults };
    for (const [key, value] of searchParams.entries()) current[key] = value;
    return current;
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value === undefined || value === null || value === '' || value === 'all') next.delete(key);
          else next.set(key, String(value));
          // Any filter change returns to the first page.
          if (key !== 'offset') next.delete('offset');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (values) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(values)) {
            if (value === undefined || value === null || value === '' || value === 'all') next.delete(key);
            else next.set(key, String(value));
          }
          next.delete('offset');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clear = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

  const queryString = useMemo(() => toQuery(filters), [filters]);
  const activeCount = useMemo(
    () => [...searchParams.keys()].filter((key) => !['offset', 'limit', 'sort', 'order'].includes(key)).length,
    [searchParams],
  );

  return { filters, setFilter, setFilters, clear, queryString, activeCount };
}
