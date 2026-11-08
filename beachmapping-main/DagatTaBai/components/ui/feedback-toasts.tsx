'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'destructive';
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastEventDetail = { kind: ToastKind; message: string };

export function showToast(message: string, kind: ToastKind = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>('dagattabai:toast', {
      detail: { kind, message },
    })
  );
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
      
      // Auto-dismiss after exactly 5 seconds
      timers.set(
        id,
        setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
          timers.delete(id);
        }, 5000)
      );
    };

    window.addEventListener('dagattabai:toast', handleToast);
    return () => {
      window.removeEventListener('dagattabai:toast', handleToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="fixed left-1/2 top-5 z-[9999] flex w-auto max-w-[90vw] -translate-x-1/2 flex-col items-center gap-2 pointer-events-none sm:max-w-md"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.kind === 'success';
        const isDestructive = toast.kind === 'destructive';
        const Icon = isDestructive ? Trash2 : isSuccess ? CheckCircle2 : AlertCircle;
        const formattedMsg = toast.message
          ? toast.message.charAt(0).toUpperCase() + toast.message.slice(1)
          : '';

        return (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border px-4 py-1.5 sm:px-5 sm:py-2 text-center text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-3 duration-200 ${
              isDestructive
                ? 'border-rose-700 bg-rose-600 text-white shadow-rose-950/25'
                : isSuccess
                ? 'border-emerald-700 bg-emerald-600 text-white shadow-emerald-950/20'
                : 'border-red-700 bg-red-600 text-white shadow-red-950/25'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{formattedMsg}</span>
          </div>
        );
      })}
    </div>
  );
}
