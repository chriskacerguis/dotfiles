import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * A column header that sorts the table by its column. Clicking an inactive
 * column sorts it in `firstOrder` — the direction a person reads that column in
 * first (newest, soonest, A–Z); clicking the active one flips it.
 *
 * `aria-sort` is on the header cell, where assistive technology reads it — on
 * the button it would describe nothing.
 */
export function SortableHeader({ column, label, sort, order, onSort, firstOrder = 'desc', align = 'left', className }) {
  const isActive = sort === column;
  const nextOrder = isActive ? (order === 'desc' ? 'asc' : 'desc') : firstOrder;
  const Icon = isActive ? (order === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <TableHead className={className} aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(column, nextOrder)}
        className={cn(
          'inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          align === 'right' && 'flex-row-reverse',
          isActive && 'text-foreground'
        )}
      >
        {label}
        <Icon className={cn('h-3 w-3', isActive ? 'opacity-100' : 'opacity-40')} aria-hidden="true" />
      </button>
    </TableHead>
  );
}
