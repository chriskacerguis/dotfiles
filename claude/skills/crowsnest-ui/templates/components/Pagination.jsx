import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';

export function Pagination({ total, limit, offset, onChange }) {
  const currentLimit = Number(limit) || 50;
  const currentOffset = Number(offset) || 0;
  const start = total === 0 ? 0 : currentOffset + 1;
  const end = Math.min(currentOffset + currentLimit, total);
  const hasPrevious = currentOffset > 0;
  const hasNext = end < total;

  if (total === 0) return null;

  return (
    <nav className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{formatNumber(start)}</span>–
        <span className="font-medium text-foreground">{formatNumber(end)}</span> of{' '}
        <span className="font-medium text-foreground">{formatNumber(total)}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          onClick={() => onChange(Math.max(0, currentOffset - currentLimit))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onChange(currentOffset + currentLimit)}>
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
