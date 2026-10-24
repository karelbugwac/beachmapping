'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Lock,
  Mail,
  Sun,
  Moon,
  Palette,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { showToast } from '@/components/ui/feedback-toasts';

export default function OwnerAccountSettingsPage() {
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!data.user) throw new Error('Please sign in to manage your account.');
        setEmail(data.user.email || '');
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Could not load account information.', 'error'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      showToast('Owner PIN must be exactly six digits.', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/owner/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update owner PIN.');
      setNewPin('');
      showToast('Owner PIN updated. Use the new PIN next time you sign in.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update owner PIN.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      <Link
        href="/owner/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Owner Dashboard</span>
      </Link>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Building className="w-3.5 h-3.5" />
            <span>Resort Operator Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            Account &amp; Appearance Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize your portal interface theme, official contact information, and 6-digit staff login PIN.
          </p>
        </div>

        {/* 1. THEME SWITCHER SECTION */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-heading">
            <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Portal Appearance &amp; Theme</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your preferred visual style for the beach owner management console and sidebar.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => {
                if (theme === 'dark') toggleTheme();
              }}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                theme === 'light'
                  ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                <Sun className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Light Mode (Default)
                  </span>
                  {theme === 'light' && (
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Clean, bright white sidebar and crisp slate contrast for daytime operations.
                </p>
              </div>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                if (theme === 'light') toggleTheme();
              }}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                theme === 'dark'
                  ? 'bg-sky-950/30 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                <Moon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Dark Mode
                  </span>
                  {theme === 'dark' && (
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Sleek midnight dark background that reduces glare during evening night shifts.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. CREDENTIALS & CONTACT INFO FORM */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-heading">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Staff Credentials &amp; Contact Info</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Signed-in Owner Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  readOnly
                  value={email}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Staff 6-Digit Login PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter a new six-digit PIN"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs tracking-widest font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Used to sign in at <code>/owner/login</code>. Your new PIN is stored as a server-keyed hash.
              </p>
            </div>

            <p className="text-xs text-slate-500">Update your public contact phone and email from <Link href="/owner/beach" className="text-sky-600 underline">Beach Details</Link>.</p>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/20"
              >
                {saving ? <Save className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving PIN...' : 'Update PIN'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
