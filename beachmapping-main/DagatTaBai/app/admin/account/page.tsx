'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Lock, Mail } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

export default function AdminAccountPage() {
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      showToast('Administrator PIN must be exactly six digits.', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update administrator PIN.');
      setNewPin('');
      showToast('Administrator PIN updated. Use the new PIN next time you sign in.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update administrator PIN.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-white dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="bg-white dark:bg-black p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-black shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Administrator Account Settings</h1>
          <p className="text-xs text-slate-500 dark:text-gray-300 mt-0.5">
            Manage your master administrator credentials and email notifications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">Admin Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                readOnly
                value="official.dagattabai@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-600 dark:bg-gray-900 dark:border-black dark:text-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">
              New 6-Digit Admin PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 digits"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-900 dark:border-black dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-colors shadow-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Update Admin PIN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
