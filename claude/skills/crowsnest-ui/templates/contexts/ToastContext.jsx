import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONES = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950 dark:text-emerald-100',
  error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950 dark:text-red-100',
  warning: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-100',
  info: 'border-border bg-card text-card-foreground',
};

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, { variant = 'info', description = null, duration = 6000 } = {}) => {
      const id = (nextId += 1);
      setToasts((current) => [...current, { id, message, description, variant }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, options) => push(message, { ...options, variant: 'success' }),
      error: (message, options) => push(message, { ...options, variant: 'error' }),
      warning: (message, options) => push(message, { ...options, variant: 'warning' }),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant] ?? Info;
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg animate-fade-in',
                TONES[toast.variant],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
                {toast.description ? <p className="mt-0.5 text-xs opacity-80">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
