import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listViewPath } from '@/lib/listView';

/**
 * The way back to the list a detail page came from — at the page and filters it
 * was left on (lib/listView), so going back from an item on page 6 lands on
 * page 6. `to` is the list's own path.
 */
export function BackLink({ to, children }) {
  return (
    <Link
      to={listViewPath(to)}
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
