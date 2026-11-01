'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type ToastKind = 'success' | 'error';
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
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex w-auto max-w-[90vw] sm:max-w-md flex-col items-center gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.kind === 'success';
        const Icon = isSuccess ? CheckCircle2 : AlertCircle;
        const formattedMsg = toast.message
          ? toast.message.charAt(0).toUpperCase() + toast.message.slice(1)
          : '';

        return (
          <div
            key={toast.id}
            role={isSuccess ? 'status' : 'alert'}
            className={`pointer-events-auto flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 shadow-2xl text-white font-medium text-xs sm:text-sm tracking-wide animate-in fade-in slide-in-from-top-4 duration-300 ${
              isSuccess
                ? 'bg-emerald-600 shadow-emerald-950/20'
                : 'bg-red-600 shadow-red-950/25'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 text-white" />
            <span className="text-center">{formattedMsg}</span>
          </div>
        );
      })}
    </div>
  );
}
