import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function SortableHeader({ column, label, sort, order, onSort, className }) {
  const isActive = sort === column;
  const nextOrder = isActive && order === 'desc' ? 'asc' : 'desc';
  const Icon = isActive ? (order === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column, nextOrder)}
        className="inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        <Icon className={cn('h-3 w-3', isActive ? 'opacity-100' : 'opacity-40')} aria-hidden="true" />
      </button>
    </TableHead>
  );
}
