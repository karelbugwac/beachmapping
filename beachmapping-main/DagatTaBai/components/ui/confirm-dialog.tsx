'use client';

import React, { useEffect, useState, useRef } from 'react';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  resolve: (value: boolean) => void;
}

/**
 * Triggers an in-app confirmation modal (replaces native window.confirm).
 * Returns a Promise that resolves to true if confirmed, false otherwise.
 */
export function confirmAction(
  optionsOrMessage: string | ConfirmDialogOptions
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const options: ConfirmDialogOptions =
    typeof optionsOrMessage === 'string'
      ? { message: optionsOrMessage }
      : optionsOrMessage;

  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent('dagattabai:confirm', {
        detail: { ...options, resolve },
      })
    );
  });
}

export function ConfirmDialog() {
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleConfirm = (event: Event) => {
      const detail = (event as CustomEvent<ConfirmDialogState>).detail;
      setDialog(detail);
    };

    window.addEventListener('dagattabai:confirm', handleConfirm);
    return () => window.removeEventListener('dagattabai:confirm', handleConfirm);
  }, []);

  useEffect(() => {
    if (!dialog) return;

    // Auto-focus confirm button for keyboard accessibility
    const timer = setTimeout(() => confirmBtnRef.current?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dialog.resolve(false);
        setDialog(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog]);

  if (!dialog) return null;

  const handleCancel = () => {
    dialog.resolve(false);
    setDialog(null);
  };

  const handleConfirm = () => {
    dialog.resolve(true);
    setDialog(null);
  };

  const isDanger = dialog.danger !== false;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
        <h3
          id="confirm-dialog-title"
          className="text-base font-bold text-slate-900 dark:text-white"
        >
          {dialog.title || 'Are you sure?'}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
          {dialog.message}
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-slate-300 dark:border-neutral-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {dialog.cancelLabel || 'Cancel'}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={`rounded-full px-5 py-2 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#1F3F74] hover:bg-[#183460]'
            }`}
          >
            {dialog.confirmLabel || (isDanger ? 'Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
