'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Mail,
  Loader2,
  Send,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/feedback-toasts';

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();

  const [adminEmail, setAdminEmail] = useState('official.dagattabai@gmail.com');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setAdminEmail(session.user.email);
        }
      } catch (err) {
        console.warn('Failed to load session:', err);
      }
    };

    void loadSession();
  }, []);

  const handleRequestPasswordReset = async () => {
    if (!adminEmail) {
      showToast('Admin email not detected.', 'error');
      return;
    }

    setSendingReset(true);
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(adminEmail, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setResetSent(true);
      showToast(`Reset link sent to ${adminEmail}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset link.';
      showToast(msg, 'error');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
          Settings
        </h1>
      </div>

      {/* Appearance & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Appearance */}
        <section className="rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#1F3F74] dark:text-white">
              Appearance
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Interface theme
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-[#1F3F74] ring-2 ring-[#1F3F74]/15 bg-sky-50/40 dark:bg-sky-950/20'
                  : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 bg-white dark:bg-neutral-950'
              }`}
            >
              <div className="h-16 w-full rounded-lg bg-slate-100 border border-slate-200 p-2 flex gap-1.5 overflow-hidden mb-2.5">
                <div className="w-6 h-full bg-white rounded border border-slate-200 flex flex-col gap-1 p-1">
                  <div className="w-full h-1 bg-[#1F3F74] rounded-full" />
                  <div className="w-full h-1 bg-slate-200 rounded-full" />
                </div>
                <div className="flex-1 flex flex-col gap-1 p-0.5">
                  <div className="w-1/2 h-1.5 bg-slate-300 rounded-full" />
                  <div className="w-full h-4 bg-white rounded border border-slate-200" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Light
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    theme === 'light'
                      ? 'border-[#1F3F74] bg-[#1F3F74]'
                      : 'border-slate-300 dark:border-neutral-700'
                  }`}
                >
                  {theme === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-[#4987BA] ring-2 ring-[#4987BA]/20 bg-neutral-900'
                  : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 bg-white dark:bg-neutral-950'
              }`}
            >
              <div className="h-16 w-full rounded-lg bg-black border border-neutral-800 p-2 flex gap-1.5 overflow-hidden mb-2.5">
                <div className="w-6 h-full bg-neutral-900 rounded border border-neutral-800 flex flex-col gap-1 p-1">
                  <div className="w-full h-1 bg-[#4987BA] rounded-full" />
                  <div className="w-full h-1 bg-neutral-800 rounded-full" />
                </div>
                <div className="flex-1 flex flex-col gap-1 p-0.5">
                  <div className="w-1/2 h-1.5 bg-neutral-700 rounded-full" />
                  <div className="w-full h-4 bg-neutral-900 rounded border border-neutral-800" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Dark
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    theme === 'dark'
                      ? 'border-[#4987BA] bg-[#4987BA]'
                      : 'border-slate-300 dark:border-neutral-700'
                  }`}
                >
                  {theme === 'dark' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Card 2: Security & Password Reset */}
        <section className="rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#1F3F74] dark:text-white">
              Security
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Admin account email and password reset
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={adminEmail}
                readOnly
                disabled
                className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 text-slate-700 dark:text-neutral-300 text-xs font-semibold cursor-not-allowed"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleRequestPasswordReset}
              disabled={sendingReset || resetSent}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3F74] hover:bg-[#18325c] dark:bg-[#4987BA] dark:hover:bg-[#3a72a1] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              {sendingReset ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : resetSent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reset Link Sent</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Password Reset Link</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
