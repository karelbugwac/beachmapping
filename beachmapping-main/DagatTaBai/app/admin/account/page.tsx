'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Mail,
  UserPlus,
  Loader2,
  Trash2,
  Shield,
  Send,
  Users,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/feedback-toasts';

interface AdminAccountItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();

  const [adminEmail, setAdminEmail] = useState('official.dagattabai@gmail.com');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Admin List State
  const [admins, setAdmins] = useState<AdminAccountItem[]>([
    {
      id: 'adm-1',
      full_name: 'Administrator',
      email: 'official.dagattabai@gmail.com',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  ]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Add Another Admin Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');

  // Fetch logged in session and administrator accounts
  useEffect(() => {
    const loadSessionAndAdmins = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setAdminEmail(session.user.email);
        }

        const res = await fetch('/api/admin/account', { cache: 'no-store' });
        const data = await res.json();
        if (data?.admins && Array.isArray(data.admins) && data.admins.length > 0) {
          setAdmins(data.admins);
        }
      } catch (err) {
        console.warn('Failed to load admins list:', err);
      } finally {
        setLoadingAdmins(false);
      }
    };

    void loadSessionAndAdmins();
  }, []);

  // 1. Password Reset Link Request (Powered by Supabase Auth)
  const handleRequestPasswordReset = async () => {
    if (!adminEmail) {
      showToast('Admin email not detected. Please re-authenticate.', 'error');
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
      showToast(`Password reset link sent to ${adminEmail}. Check your inbox!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset link.';
      showToast(msg, 'error');
    } finally {
      setSendingReset(false);
    }
  };

  // 2. Add Another Admin Submission
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      setAddAdminError('Administrator full name and email are required.');
      return;
    }

    if (!newAdminEmail.includes('@')) {
      setAddAdminError('Please enter a valid email address (must include "@").');
      return;
    }

    setAddingAdmin(true);
    setAddAdminError('');

    try {
      const res = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-admin',
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          role: newAdminRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add administrator.');
      }

      const item: AdminAccountItem = {
        id: `adm-${Date.now()}`,
        full_name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        role: newAdminRole,
        created_at: new Date().toISOString(),
      };

      setAdmins((prev) => [...prev, item]);
      setShowAddForm(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminRole('admin');

      showToast(`Administrator added! Access notification sent to ${item.email}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add administrator.';
      setAddAdminError(msg);
      showToast(msg, 'error');
    } finally {
      setAddingAdmin(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 px-4 sm:px-6 font-sans">
      {/* ── Page Header (Frameless, Dive Blue) ── */}
      <div className="pb-6 border-b border-slate-200 dark:border-neutral-800">
        <h1 className="text-2xl sm:text-3xl font-black text-[#1F3F74] dark:text-[#4987BA] tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">
          Manage interface theme display, master administrative credentials, and delegated system administrators.
        </p>
      </div>

      {/* ── SECTION 1: APPEARANCE & DISPLAY (Visual Preview Cards) ── */}
      <div className="space-y-5 pb-10 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            Appearance &amp; Display
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Select your preferred interface theme.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group ${
              theme === 'light'
                ? 'border-[#1F3F74] ring-2 ring-[#1F3F74]/20 bg-blue-50/20'
                : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-950'
            }`}
          >
            {/* Miniature Light Mockup */}
            <div className="h-24 w-full rounded-xl bg-slate-100 border border-slate-200 p-2 flex gap-2 overflow-hidden mb-3">
              <div className="w-8 h-full bg-white rounded-lg border border-slate-200 flex flex-col gap-1 p-1">
                <div className="w-full h-1.5 bg-[#1F3F74] rounded-full" />
                <div className="w-full h-1 bg-slate-200 rounded-full" />
                <div className="w-full h-1 bg-slate-200 rounded-full" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5 p-1">
                <div className="w-1/2 h-2 bg-slate-300 rounded-full" />
                <div className="w-full h-5 bg-white rounded-md border border-slate-200" />
                <div className="w-3/4 h-3 bg-white rounded-md border border-slate-200" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Light Mode
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Crisp daylight appearance
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  theme === 'light'
                    ? 'border-[#1F3F74] bg-[#1F3F74] text-white'
                    : 'border-slate-300 dark:border-neutral-700'
                }`}
              >
                {theme === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>

          {/* Deep Black Dark Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group ${
              theme === 'dark'
                ? 'border-[#4987BA] ring-2 ring-[#4987BA]/20 bg-neutral-900'
                : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-950'
            }`}
          >
            {/* Miniature Dark Mockup */}
            <div className="h-24 w-full rounded-xl bg-black border border-neutral-800 p-2 flex gap-2 overflow-hidden mb-3">
              <div className="w-8 h-full bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col gap-1 p-1">
                <div className="w-full h-1.5 bg-[#4987BA] rounded-full" />
                <div className="w-full h-1 bg-neutral-800 rounded-full" />
                <div className="w-full h-1 bg-neutral-800 rounded-full" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5 p-1">
                <div className="w-1/2 h-2 bg-neutral-700 rounded-full" />
                <div className="w-full h-5 bg-neutral-900 rounded-md border border-neutral-800" />
                <div className="w-3/4 h-3 bg-neutral-900 rounded-md border border-neutral-800" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Dark Mode
                </span>
                <span className="text-[11px] text-neutral-400">
                  Pure black high-contrast theme
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  theme === 'dark'
                    ? 'border-[#4987BA] bg-[#4987BA] text-white'
                    : 'border-slate-300 dark:border-neutral-700'
                }`}
              >
                {theme === 'dark' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── SECTION 2: ADMINISTRATIVE SECURITY & RESET LINK (Frameless) ── */}
      <div className="space-y-5 pb-10 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
            Security &amp; Password Reset
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Manage your master administrator login credentials via official security links.
          </p>
        </div>

        <div className="space-y-4 max-w-xl">
          {/* Read-Only Verified Administrator Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              Verified Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={adminEmail}
                readOnly
                disabled
                className="w-full pl-11 pr-28 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 text-xs font-semibold cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1F3F74] text-white text-[10px] font-bold shadow-2xs">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>
          </div>

          {/* Password Reset Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRequestPasswordReset}
              disabled={sendingReset || resetSent}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#18325c] dark:bg-[#4987BA] dark:hover:bg-[#3a72a1] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              {sendingReset ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Security Link...</span>
                </>
              ) : resetSent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reset Link Dispatched</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Password Reset Link to Admin Email</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-2">
              Dispatches an encrypted password reset link directly to your verified inbox via Supabase Authentication.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: SYSTEM ADMINISTRATORS (ADD ANOTHER ADMIN) ── */}
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
              System Administrators
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Delegated personnel authorized to manage resort applications, review beach listings, and supervise portal security.
            </p>
          </div>

          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#18325c] dark:bg-[#4987BA] dark:hover:bg-[#3a72a1] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Another Admin</span>
            </button>
          )}
        </div>

        {/* Add Another Admin Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddAdmin}
            className="p-6 rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">
                Add Administrator
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddAdminError('');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. admin.santos@gmail.com"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Role
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                >
                  <option value="admin">Barangay Admin</option>
                  <option value="beach_manager">Municipal Coordinator</option>
                </select>
              </div>
            </div>

            {addAdminError && (
              <p className="text-xs text-red-500 font-semibold">{addAdminError}</p>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                disabled={addingAdmin}
                className="px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#18325c] dark:bg-[#4987BA] dark:hover:bg-[#3a72a1] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {addingAdmin ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding Administrator...</span>
                  </>
                ) : (
                  <span>Grant Admin Access</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* List of Active Administrators */}
        <div className="space-y-3">
          {admins.map((adm) => (
            <div
              key={adm.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1F3F74] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {adm.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {adm.full_name}
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] text-white flex-shrink-0"
                      title="Verified Administrator"
                    >
                      <svg
                        className="w-2 h-2"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2.5 6 5 8.5 9.5 3.5" />
                      </svg>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-400 block mt-0.5">
                    {adm.email} • <span className="capitalize">{adm.role.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Active Administrator
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
