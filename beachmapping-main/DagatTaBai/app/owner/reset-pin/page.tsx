'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerResetPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(pin)) {
      setError('Please enter a new 6-digit numeric PIN.');
      return;
    }
    if (pin !== confirmPin) {
      setError('The PINs do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/owner/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      router.replace('/owner/login');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-neutral-950">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="text-2xl font-semibold text-brand-navy-900 dark:text-white">Create a new PIN</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
          Your administrator reset your owner PIN. Choose a new 6-digit PIN to continue.
        </p>
        <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-neutral-200">
          New PIN
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="[0-9]{6}"
            maxLength={6}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center tracking-[0.5em] outline-none focus:border-brand-teal-500 focus:ring-2 focus:ring-brand-teal-500/20 dark:border-neutral-700 dark:bg-neutral-950"
            required
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-neutral-200">
          Confirm new PIN
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="[0-9]{6}"
            maxLength={6}
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center tracking-[0.5em] outline-none focus:border-brand-teal-500 focus:ring-2 focus:ring-brand-teal-500/20 dark:border-neutral-700 dark:bg-neutral-950"
            required
          />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || pin.length !== 6 || confirmPin.length !== 6}
          className="mt-6 w-full rounded-full bg-brand-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save new PIN'}
        </button>
      </form>
    </main>
  );
}
