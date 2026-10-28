import { useEffect } from 'react';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'App';

/** "<page> — <site>" in the browser tab, or just the site while `title` is empty. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
