import { cva } from 'class-variance-authority';

/**
 * Value -> style maps.
 *
 * These live in one module so recolouring a priority or a lifecycle state is a
 * single edit rather than a hunt through pages. Tailwind's content glob covers
 * lib/, so the class strings here survive purging.
 */

export const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

export const priorityBadge = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      priority: {
        critical:
          'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
        high: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-orange-200',
        medium:
          'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
        low: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/60 dark:text-sky-200',
        info: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
        none: 'border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { priority: 'none' },
  },
);

export const severityBadge = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      severity: {
        critical:
          'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
        high: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-orange-200',
        medium:
          'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
        low: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/60 dark:text-sky-200',
        none: 'border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { severity: 'none' },
  },
);

export const matchStatusBadge = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      status: {
        confirmed:
          'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
        potential:
          'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
        unknown: 'border-border bg-muted text-muted-foreground',
        not_affected:
          'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200',
      },
      defaultVariants: { status: 'unknown' },
    },
  },
);

/** Lifecycle states grouped by what they mean operationally. */
export const FINDING_STATUS_GROUPS = {
  open: ['new', 'acknowledged', 'investigating', 'confirmed'],
  in_progress: ['remediation_planned', 'remediation_in_progress'],
  mitigated: ['mitigated', 'patched', 'pending_verification'],
  closed: ['resolved', 'accepted_risk', 'false_positive', 'not_affected', 'suppressed'],
};

const STATUS_TONE = {
  new: 'open',
  acknowledged: 'open',
  investigating: 'open',
  confirmed: 'open',
  remediation_planned: 'progress',
  remediation_in_progress: 'progress',
  mitigated: 'progress',
  patched: 'done',
  pending_verification: 'progress',
  resolved: 'done',
  accepted_risk: 'accepted',
  false_positive: 'dismissed',
  not_affected: 'dismissed',
  suppressed: 'dismissed',
};

export const statusBadge = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        open: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200',
        progress:
          'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/60 dark:text-violet-200',
        done: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200',
        accepted:
          'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/60 dark:text-teal-200',
        dismissed: 'border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'open' },
  },
);

export function statusTone(status) {
  return STATUS_TONE[status] || 'open';
}

export const deliveryStatusBadge = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      status: {
        delivered:
          'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200',
        pending: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200',
        delivering:
          'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200',
        failed:
          'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
        exhausted:
          'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
        cancelled: 'border-border bg-muted text-muted-foreground',
      },
      defaultVariants: { status: 'pending' },
    },
  },
);

export const sourceHealthBadge = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      status: {
        healthy:
          'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200',
        running: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200',
        idle: 'border-border bg-muted text-muted-foreground',
        degraded:
          'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
        failed: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
        disabled: 'border-border bg-muted text-muted-foreground',
      },
      defaultVariants: { status: 'idle' },
    },
  },
);

/** Human labels for the enumerations the API returns. */
export const LABELS = {
  exploit_status: {
    none: 'No known exploit',
    poc: 'Proof of concept',
    functional: 'Functional exploit',
    confirmed_active_exploitation: 'Actively exploited',
  },
  patch_status: {
    patch_available: 'Patch available',
    mitigation_available: 'Mitigation available',
    no_fix: 'No fix available',
    unknown: 'Unknown',
  },
  match_status: {
    confirmed: 'Confirmed affected',
    potential: 'Potentially affected',
    not_affected: 'Not affected',
    unknown: 'Unknown',
  },
  match_method: {
    package: 'Package name and version',
    cpe: 'CPE',
    vendor_product: 'Vendor / product / version',
    operating_system: 'Operating system package',
    alias: 'Administrator-defined alias',
  },
  criticality: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', unknown: 'Unknown' },
};

export function humanize(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/^\w/, (character) => character.toUpperCase());
}

export function labelFor(group, value) {
  return LABELS[group]?.[value] ?? humanize(value);
}
