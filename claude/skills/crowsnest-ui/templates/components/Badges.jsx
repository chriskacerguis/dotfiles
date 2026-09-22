import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  priorityBadge,
  severityBadge,
  matchStatusBadge,
  statusBadge,
  statusTone,
  deliveryStatusBadge,
  sourceHealthBadge,
  labelFor,
  humanize,
} from '@/lib/variants';

/** Organizational priority — the number that decides what gets worked first. */
export function PriorityBadge({ priority, className }) {
  if (!priority) return <span className="text-muted-foreground">—</span>;
  return <span className={cn(priorityBadge({ priority }), className)}>{humanize(priority)}</span>;
}

/** CVSS-derived severity of the vulnerability itself, independent of us. */
export function SeverityBadge({ severity, className }) {
  if (!severity) return <span className="text-muted-foreground">—</span>;
  return <span className={cn(severityBadge({ severity }), className)}>{humanize(severity)}</span>;
}

export function MatchStatusBadge({ status, className }) {
  return <span className={cn(matchStatusBadge({ status }), className)}>{labelFor('match_status', status)}</span>;
}

export function FindingStatusBadge({ status, className }) {
  return <span className={cn(statusBadge({ tone: statusTone(status) }), className)}>{humanize(status)}</span>;
}

export function DeliveryStatusBadge({ status, className }) {
  return <span className={cn(deliveryStatusBadge({ status }), className)}>{humanize(status)}</span>;
}

export function SourceHealthBadge({ status, className }) {
  return <span className={cn(sourceHealthBadge({ status }), className)}>{humanize(status)}</span>;
}

/** KEV membership: the single strongest exploitation signal available. */
export function KevBadge({ kev, ransomware, className }) {
  if (!kev) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800',
        'dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
        className,
      )}
      title={
        ransomware
          ? 'In the CISA Known Exploited Vulnerabilities catalog, with known ransomware campaign use'
          : 'In the CISA Known Exploited Vulnerabilities catalog'
      }
    >
      <ShieldAlert className="h-3 w-3" aria-hidden="true" />
      KEV
      {ransomware ? <span className="ml-0.5">· ransomware</span> : null}
    </span>
  );
}

const EXPLOIT_ICONS = {
  none: ShieldCheck,
  poc: Bug,
  functional: Target,
  confirmed_active_exploitation: ShieldX,
};

const EXPLOIT_TONES = {
  none: 'border-border bg-muted text-muted-foreground',
  poc: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
  functional:
    'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-orange-200',
  confirmed_active_exploitation:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
};

export function ExploitBadge({ status, className }) {
  if (!status || status === 'none') return null;
  const Icon = EXPLOIT_ICONS[status] ?? Bug;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        EXPLOIT_TONES[status],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {labelFor('exploit_status', status)}
    </span>
  );
}

const PATCH_ICONS = {
  patch_available: CheckCircle2,
  mitigation_available: AlertTriangle,
  no_fix: ShieldX,
  unknown: HelpCircle,
};

const PATCH_TONES = {
  patch_available:
    'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200',
  mitigation_available:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
  no_fix: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
  unknown: 'border-border bg-muted text-muted-foreground',
};

export function PatchBadge({ status, className }) {
  const key = status || 'unknown';
  const Icon = PATCH_ICONS[key] ?? HelpCircle;
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', PATCH_TONES[key], className)}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {labelFor('patch_status', key)}
    </span>
  );
}

export function InternetFacingBadge({ value, className }) {
  if (value !== true) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800',
        'dark:border-purple-900/60 dark:bg-purple-950/60 dark:text-purple-200',
        className,
      )}
    >
      Internet-facing
    </span>
  );
}

/**
 * The verdict that matters most on any vulnerability screen: does this affect
 * us? Rendered large and unambiguous, in the requirement's own words.
 */
export function OrganizationAffected({ affected, count, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2',
        affected
          ? 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/50'
          : 'border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/50',
        className,
      )}
    >
      {affected ? (
        <ShieldAlert className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
      ) : (
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            'text-sm font-semibold',
            affected ? 'text-red-900 dark:text-red-100' : 'text-emerald-900 dark:text-emerald-100',
          )}
        >
          Organization affected: {affected ? 'YES' : 'NO'}
        </p>
        <p
          className={cn(
            'text-xs',
            affected ? 'text-red-800/80 dark:text-red-200/80' : 'text-emerald-800/80 dark:text-emerald-200/80',
          )}
        >
          {affected
            ? `${count} open ${count === 1 ? 'finding' : 'findings'} against the asset inventory`
            : 'No asset in the inventory matches this vulnerability, so no finding and no alert was created'}
        </p>
      </div>
    </div>
  );
}
