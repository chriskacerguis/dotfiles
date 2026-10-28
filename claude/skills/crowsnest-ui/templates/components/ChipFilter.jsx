import { cn } from '@/lib/utils';

/**
 * A short set of mutually exclusive filters shown all at once — a catalog's
 * categories or statuses — where a select would hide the choices. `options` are
 * { value, label, count?, icon? }; the "all" choice is value ''.
 */
export function ChipFilter({ label, options, value, onChange, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="group" aria-label={label}>
      {options.map((option) => {
        const active = (value || '') === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
            {option.label}
            {option.count !== undefined ? (
              <>
                {/* A real space, so the chip reads "Monitor 3" rather than "Monitor3". */}{' '}
                <span className={cn('tabular-nums', active ? 'opacity-80' : 'opacity-70')}>{option.count}</span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
