import { useId } from 'react';
import { Database, RotateCcw, Sparkles, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * One setting, rendered from its catalog declaration.
 *
 * The control is chosen by the declared type rather than hardcoded per key, so
 * adding a setting on the server is enough to make it appear here correctly.
 */

const SOURCE_META = {
  database: {
    icon: Database,
    label: 'Set here',
    hint: 'Saved on this page.',
    className: 'text-primary',
  },
  environment: {
    icon: Terminal,
    label: 'From environment',
    hint: 'Coming from an environment variable. Saving a value here will take precedence over it.',
    className: 'text-amber-600 dark:text-amber-400',
  },
  default: {
    icon: Sparkles,
    label: 'Default',
    hint: 'Never saved — this is the built-in default.',
    className: 'text-muted-foreground',
  },
};

function SourceBadge({ source, envVar }) {
  const meta = SOURCE_META[source] ?? SOURCE_META.default;
  const Icon = meta.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex shrink-0 items-center gap-1 text-xs', meta.className)}>
          <Icon className="h-3 w-3" aria-hidden="true" />
          {meta.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {meta.hint}
        {envVar ? <span className="mt-1 block font-mono opacity-80">${envVar}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

/** `value` is the working (possibly edited) value; `setting` carries the metadata. */
export function SettingField({ setting, value, onChange, onReset, dirty, error }) {
  const id = useId();
  const disabled = setting.read_only;
  // Multi-line text needs the width, so its control goes under the label.
  const wide = setting.type === 'text';

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors sm:p-4',
        dirty && 'border-primary/50 bg-primary/[0.03]',
        error && 'border-destructive/60 bg-destructive/[0.04]',
      )}
    >
      <div className={cn('flex flex-col gap-3', !wide && 'sm:flex-row sm:items-start sm:justify-between')}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor={id} className={cn('text-sm', disabled && 'text-muted-foreground')}>
              {setting.label}
            </Label>
            <SourceBadge source={dirty ? 'database' : setting.source} envVar={setting.env_var} />
          </div>

          {setting.help ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{setting.help}</p> : null}
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">{setting.key}</p>

          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>

        <div className={cn('flex shrink-0 items-start gap-2', !wide && 'sm:w-72')}>
          <div className="min-w-0 flex-1">
            <Control id={id} setting={setting} value={value} onChange={onChange} disabled={disabled} />
          </div>
          {setting.source === 'database' && !disabled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onReset(setting)}
                  aria-label={setting.type === 'secret' ? `Remove the stored ${setting.label}` : `Reset ${setting.label} to its default`}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{setting.type === 'secret' ? 'Remove the stored credential' : 'Reset to the built-in default'}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Control({ id, setting, value, onChange, disabled }) {
  switch (setting.type) {
    case 'boolean':
      return (
        <div className="flex h-9 items-center gap-2">
          <Switch id={id} checked={value === true} onCheckedChange={onChange} disabled={disabled} />
          <span className="text-sm text-muted-foreground">{value ? 'On' : 'Off'}</span>
        </div>
      );

    case 'enum':
      return (
        <Select value={String(value ?? '')} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(setting.options ?? []).map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'integer':
    case 'number':
      return (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          min={setting.min ?? undefined}
          max={setting.max ?? undefined}
          step={setting.step ?? (setting.type === 'integer' ? 1 : 'any')}
          disabled={disabled}
          className="text-right tabular-nums"
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === '') return onChange('');
            const parsed = setting.type === 'integer' ? Number.parseInt(raw, 10) : Number.parseFloat(raw);
            return onChange(Number.isFinite(parsed) ? parsed : raw);
          }}
        />
      );

    case 'string[]':
      // A fixed option set is a multi-select, not free text: the server would
      // reject anything else, so the UI should not let it be typed.
      if (Array.isArray(setting.options)) {
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2 rounded-md border p-3">
            {setting.options.map((option) => (
              <div key={option.value} className="flex items-center justify-between gap-3">
                <Label htmlFor={`${id}-${option.value}`} className="font-normal">
                  {option.label}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{option.value}</span>
                </Label>
                <Switch
                  id={`${id}-${option.value}`}
                  disabled={disabled}
                  checked={selected.includes(option.value)}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? // Keep the catalog's order rather than click order, so
                          // the stored value does not churn between saves.
                          setting.options
                            .map((entry) => entry.value)
                            .filter((entry) => entry === option.value || selected.includes(entry))
                        : selected.filter((entry) => entry !== option.value),
                    )
                  }
                />
              </div>
            ))}
          </div>
        );
      }

      return (
        <Textarea
          id={id}
          rows={2}
          disabled={disabled}
          placeholder="One per line"
          value={Array.isArray(value) ? value.join('\n') : (value ?? '')}
          onChange={(event) =>
            onChange(
              event.target.value
                .split('\n')
                .map((entry) => entry.trim())
                .filter(Boolean),
            )
          }
          className="font-mono text-xs"
        />
      );

    case 'json':
      return (
        <Textarea
          id={id}
          rows={Math.min(18, String(value ?? '').split('\n').length + 1)}
          disabled={disabled}
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs"
          spellCheck={false}
        />
      );

    case 'secret':
      // A stored credential is never sent to the browser, so there is nothing
      // to show — only whether one exists. Typing replaces it; left blank it is
      // kept; the reset button beside it removes it.
      return (
        <div className="space-y-1.5">
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            disabled={disabled}
            value={value ?? ''}
            placeholder={setting.configured ? '••••••••  (stored — type to replace)' : 'Not set'}
            onChange={(event) => onChange(event.target.value)}
          />
          {setting.configured ? (
            <p className="text-xs text-muted-foreground">
              A credential is stored. Leave this blank to keep it, or type a new one to replace it.
            </p>
          ) : null}
        </div>
      );

    case 'text':
      return (
        <Textarea
          id={id}
          rows={6}
          disabled={disabled}
          placeholder={setting.placeholder ?? undefined}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs"
        />
      );

    case 'url':
      return (
        <Input id={id} type="url" inputMode="url" value={value ?? ''} placeholder={setting.placeholder ?? undefined} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      );

    case 'string':
    default:
      return (
        <Input
          id={id}
          value={value ?? ''}
          placeholder={setting.placeholder ?? undefined}
          maxLength={setting.max_length ?? undefined}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

export { SourceBadge };
