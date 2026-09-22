import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Debounced free-text search bound to a URL filter. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, placeholder = 'Any', className }) {
  return (
    <div className={cn('min-w-[9rem]', className)}>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FilterBar({ children, activeCount = 0, onClear, className }) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3 border-b p-4', className)}>
      {children}
      {activeCount > 0 && onClear ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="mb-0.5">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear {activeCount} {activeCount === 1 ? 'filter' : 'filters'}
        </Button>
      ) : null}
    </div>
  );
}
