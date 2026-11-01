'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const username = 'Administrator';
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    // Clear any existing non-admin session when visiting login page
    const clearSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const email = session.user.email?.toLowerCase() || '';
          if (!['official.dagattabai@gmail.com', 'admin@dagattabai.ph'].includes(email)) {
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error('Error clearing non-admin session:', error);
      }
    };

    void clearSession();
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

      // Also establish the client-side Supabase session directly
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: data.email || 'official.dagattabai@gmail.com',
          password: nextPin,
        });
      } catch (clientAuthErr) {
        console.warn('Client-side session sync notice:', clientAuthErr);
      }

      showToast('Administrator signed in successfully.');
      // Force redirect to admin dashboard
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
      showToast('Please enter all 6 digits of your Administrator PIN.', 'error');
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#1F3F74]/10 dark:bg-[#4987BA]/20 border border-[#1F3F74]/20 flex items-center justify-center mx-auto text-[#1F3F74] dark:text-[#4987BA] shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
            Barangay Admin Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs mx-auto">
            Barangay Binongkalan, Catmon • Enter your 6-digit administrator PIN to access the console.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-6">
          {/* Fixed Username Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              disabled
              suppressHydrationWarning
              className="w-full px-4 py-3 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-full text-sm font-semibold text-slate-600 dark:text-neutral-400 cursor-not-allowed"
            />
          </div>

          {/* Admin PIN */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              6-Digit Security PIN
            </label>
            <div className="relative">
              <input
                id="admin-password"
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                required
                value={adminPassword}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="Enter 6-digit PIN"
                suppressHydrationWarning
                className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-full text-sm font-bold text-slate-900 dark:text-white placeholder:italic placeholder:font-normal placeholder:text-slate-400 tracking-[0.25em] text-center focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full py-3 bg-[#1F3F74] hover:bg-[#18325c] dark:bg-[#4987BA] dark:hover:bg-[#3a72a1] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying PIN...</span>
              </>
            ) : (
              <span>Sign In to Console</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
