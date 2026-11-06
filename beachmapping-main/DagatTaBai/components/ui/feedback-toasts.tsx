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
      className="fixed left-1/2 top-20 z-[9999] flex w-auto max-w-[90vw] -translate-x-1/2 flex-col items-center gap-2 pointer-events-none sm:max-w-md"
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
            className={`pointer-events-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium leading-snug shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 sm:max-w-sm sm:px-4 ${
              isSuccess
                ? 'border-emerald-700 bg-emerald-600 text-white shadow-emerald-950/20'
                : 'border-red-700 bg-red-600 text-white shadow-red-950/25'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{formattedMsg}</span>
          </div>
        );
      })}
    </div>
  );
}
