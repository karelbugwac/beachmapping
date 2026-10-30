'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type ToastKind = 'success' | 'error';
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastEventDetail = { kind: ToastKind; message: string };

export function showToast(message: string, kind: ToastKind = 'success') {
  window.dispatchEvent(new CustomEvent<ToastEventDetail>('dagattabai:toast', {
    detail: { kind, message },
  }));
}

export function FeedbackToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timers = new Map<number, ReturnType<typeof setTimeout>>();

    const handleToast = (event: Event) => {
      const { kind, message } = (event as CustomEvent<ToastEventDetail>).detail;
      const id = ++nextId;
      setToasts((current) => [...current, { id, kind, message }]);
      timers.set(id, setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        timers.delete(id);
      }, 5000));
    };

    window.addEventListener('dagattabai:toast', handleToast);
    return () => {
      window.removeEventListener('dagattabai:toast', handleToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  const dismiss = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex w-[min(26rem,calc(100vw-2rem))] flex-col items-center gap-2 pointer-events-none" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = toast.kind === 'success' ? CheckCircle2 : AlertCircle;
        const colors = toast.kind === 'success'
          ? 'border-emerald-200 bg-white text-emerald-950 shadow-lg dark:bg-neutral-900 dark:border-emerald-800 dark:text-emerald-100'
          : 'border-red-600 bg-red-600 text-white shadow-xl shadow-red-950/25';
        const iconColor = toast.kind === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-white';
        const formattedMsg = toast.message
          ? toast.message.charAt(0).toUpperCase() + toast.message.slice(1)
          : '';

        return (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-full px-5 py-3 shadow-lg ${colors} animate-in fade-in slide-in-from-top-4 duration-300 w-full`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
            <p className="min-w-0 flex-1 text-xs sm:text-sm font-semibold">{formattedMsg}</p>
            {toast.kind !== 'error' && (
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-mr-1 rounded-full p-1 text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
