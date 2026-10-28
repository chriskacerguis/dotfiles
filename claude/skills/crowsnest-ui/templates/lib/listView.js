/**
 * The way back to a list as it was left — its page, filters and sort.
 *
 * A list keeps all of that in its query string (useFilters), so "back to assets"
 * has to carry the query string too, or it lands on page 1 with every filter
 * gone. useFilters records each list's current query string here as it changes;
 * BackLink, and a form sending someone back after a save, ask for it.
 *
 * Per tab (sessionStorage): another tab's browsing is not where this one was. The
 * storage can be unavailable (a private window, blocked site data), so a copy is
 * kept in memory too — it then lasts until a reload, which is no worse than
 * before.
 */
const KEY = 'app:list-views';
const inMemory = {};

function readAll() {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { ...inMemory };
  } catch {
    return { ...inMemory };
  }
}

/** Record the query string a list is showing, e.g. ('/agent/assets', '?page=6'). */
export function rememberListView(pathname, search) {
  inMemory[pathname] = search;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ ...readAll(), [pathname]: search }));
  } catch {
    // The in-memory copy still has it.
  }
}

/** The list at `pathname` as it was last shown in this tab, or just `pathname`. */
export function listViewPath(pathname) {
  return `${pathname}${readAll()[pathname] ?? ''}`;
}

/** For tests: forget every list's view. */
export function forgetListViews() {
  for (const key of Object.keys(inMemory)) delete inMemory[key];
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored to forget.
  }
}
