import { cva } from 'class-variance-authority';

/**
 * Value -> style maps: one per concept, so recolouring a state is one edit here
 * rather than a hunt through pages. Tailwind's content glob covers lib/, so the
 * class strings below survive purging — which is also why every one is written
 * out in full rather than assembled.
 *
 * Colour encodes *meaning*, and only these meanings, on the house escalation
 * palette:
 *
 *   critical  red      — something is wrong or refused
 *   high      orange   — needs attention soon
 *   medium    amber    — waiting, in flux, or partly there
 *   low       sky      — fine, but in motion
 *   good      emerald  — done, healthy, approved
 *   active    blue     — being worked
 *   progress  violet   — in progress, a step past active
 *   neutral   muted    — inert, ended, unknown
 *
 * A value never relies on its colour alone: every badge also says it in words.
 */

// The tone classes, defined once. A light tint with saturated text in light mode;
// a translucent dark tint with pale text in dark mode, so it sits on the surface
// rather than punching a hole in it.
export const TONES = {
  critical: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200',
  high: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-orange-200',
  medium: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200',
  low: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/60 dark:text-sky-200',
  good: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200',
  active: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200',
  progress: 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/60 dark:text-violet-200',
  neutral: 'border-border bg-muted text-muted-foreground',
};

// One shape for every badge; only the tone varies.
export const badge = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: { tone: TONES },
    defaultVariants: { tone: 'neutral' },
  },
);

/**
 * The words for a value with no label of its own. A slug ('waiting_for_customer',
 * 'shutting-down') becomes sentence case, the house style for UI text. A value
 * that is already words — stored as it is shown, 'Ready to Deploy' — is left
 * exactly as it is, since re-casing it would disagree with the form that set it.
 */
export function humanize(value) {
  if (value === null || value === undefined || value === '') return '—';
  const text = String(value);
  if (!/[_-]/.test(text) && text !== text.toLowerCase()) return text;
  const words = text.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A concept: which tone each value takes, the words it is shown with, and the
 * tone for a value the map does not know (a state added on the server before
 * the UI learned of it renders neutrally, labelled in its own words).
 */
function concept({ tones, labels = {}, fallback = 'neutral' }) {
  return {
    tone: (value) => tones[value] ?? fallback,
    label: (value) => labels[value] ?? humanize(value),
    values: Object.keys(tones),
  };
}

// ── Examples: replace these with the app's own concepts ──────────────────────
//
// Each is a few lines: the tone per value, and labels only where the slug does
// not already read right. `values` doubles as the option list for a filter.

// Ordered most to least urgent; `normal` is the default and deliberately quiet.
export const PRIORITY_ORDER = ['urgent', 'high', 'normal', 'low'];

export const priority = concept({
  tones: { urgent: 'critical', high: 'high', normal: 'neutral', low: 'low' },
});

// A request's lifecycle. Worded apart from anything else that could be
// "pending", so a badge never reads ambiguously beside another.
export const requestStatus = concept({
  tones: { pending: 'medium', approved: 'good', rejected: 'critical', cancelled: 'neutral' },
  labels: { pending: 'Awaiting approval' },
});

// A background integration's health.
export const health = concept({
  tones: { healthy: 'good', running: 'active', degraded: 'medium', failed: 'critical', disabled: 'neutral' },
});
