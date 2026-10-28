import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toQuery } from '@/lib/api';
import { rememberListView } from '@/lib/listView';

/**
 * Filters live in the URL, so a filtered view is a shareable link and survives a
 * reload. Changing any filter returns to the first page. An empty value removes
 * the parameter; every other value — including `all`, which can be a real view of a
 * console list — is kept (FilterSelect maps its own "any" choice to empty).
 *
 * The view is remembered as it changes (lib/listView), so a page that sends
 * someone back to this list — a detail page's BackLink, a form after saving —
 * returns them to the page and filters they left, not page 1.
 */
export function useFilters(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname, search } = useLocation();

  useEffect(() => {
    rememberListView(pathname, search);
  }, [pathname, search]);

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
          if (value === undefined || value === null || value === '') next.delete(key);
          else next.set(key, String(value));
          // Any filter change returns to the first page.
          if (key !== 'page') next.delete('page');
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
            if (value === undefined || value === null || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          next.delete('page');
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
    () => [...searchParams.keys()].filter((key) => !['page', 'limit', 'sort', 'order'].includes(key)).length,
    [searchParams],
  );

  return { filters, setFilter, setFilters, clear, queryString, activeCount };
}
