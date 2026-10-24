'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const username = 'Administrator';
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    // Clear any existing session when visiting login page
    const clearSession = async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    };
    
    clearSession();
    passwordInputRef.current?.focus();
  }, []);

  const pin = adminPassword;

  const loginWithPin = async (nextPin: string) => {
    if (submittingRef.current || nextPin.length !== 6) return;
    submittingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          pin: nextPin,
          portal: 'admin',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid Admin PIN.');
      }

      showToast('Administrator signed in successfully.');
      // Force redirect
      window.location.replace('/admin/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      showToast(msg, 'error');
      submittingRef.current = false;
      setLoading(false);
      setAdminPassword('');
      passwordInputRef.current?.focus();
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      showToast('Please enter all 6 digits of your Administrator password.', 'error');
      return;
    }
    await loginWithPin(pin);
  };

  const handlePinChange = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 6);
    setAdminPassword(next);
    if (next.length === 6) {
      void loginWithPin(next);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-sans">
      <div className="w-full max-w-md bg-white dark:bg-black border border-slate-200 dark:border-black p-8 sm:p-10 rounded-2xl shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-sky-600 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Portal
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto dark:text-gray-300">
            Enter your Administrator password to access the management console.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-6">
          {/* Fixed Username Field */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-white">
              Username
            </label>
            <input
              type="text"
              value={username}
              disabled
              suppressHydrationWarning
              className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed dark:bg-gray-900 dark:border-black dark:text-gray-400"
            />
          </div>

          {/* Admin password */}
          <div className="space-y-3">
            <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              ref={passwordInputRef}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              required
              value={adminPassword}
              onChange={(e) => handlePinChange(e.target.value)}
              suppressHydrationWarning
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600 dark:bg-gray-900 dark:border-black dark:text-white dark:focus:ring-sky-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
