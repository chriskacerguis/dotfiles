import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';

/**
 * Page position and previous/next controls, for the API's page-numbered lists:
 * `pagination` is the `{ total, page, pages, limit }` block a list response
 * carries. Bind `onPageChange` to the same URL state as the filters (useFilters'
 * `page`), so the page survives a reload.
 */
export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total === 0) return null;

  const { total, page, pages, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <nav className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium tabular-nums text-foreground">{formatNumber(start)}</span>–
        <span className="font-medium tabular-nums text-foreground">{formatNumber(end)}</span> of{' '}
        <span className="font-medium tabular-nums text-foreground">{formatNumber(total)}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
