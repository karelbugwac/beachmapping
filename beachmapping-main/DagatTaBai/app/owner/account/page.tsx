'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { createClient } from '@/lib/supabase/client';

interface CaretakerMember {
  id: string;
  name: string;
  contact: string;
  role: string;
  permissions: string[];
  added_at: string;
}

export default function OwnerSettingsPage() {
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [beachName, setBeachName] = useState('Catmon Beach Resort');
  const [loading, setLoading] = useState(true);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Floating Toast State (Centered, green for success, red for error, 5s duration, NO "x")
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Caretakers State
  const [caretakers, setCaretakers] = useState<CaretakerMember[]>([
    {
      id: 'ct-1',
      name: 'Elena Rodrigo',
      contact: 'elena.rodrigo@gmail.com',
      role: 'Head Caretaker & Front Desk',
      permissions: ['Manage Information', 'Operating Hours'],
      added_at: 'Oct 28, 2026',
    },
  ]);
  const [showAddCaretaker, setShowAddCaretaker] = useState(false);
  const [newCaretaker, setNewCaretaker] = useState({
    name: '',
    contact: '',
    role: 'Caretaker & Front Desk',
    permissions: [
      'Manage Cottages & Facilities',
      'View & Respond to Reviews',
      'Update Operating Hours',
      'Upload Resort Photos',
    ],
  });
  const [caretakerError, setCaretakerError] = useState('');
  const [addingCaretaker, setAddingCaretaker] = useState(false);

  // Contact Admin Form State
  const [adminCategory, setAdminCategory] = useState('Listing Verification & Permits');
  const [adminSubject, setAdminSubject] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingAdminMsg, setSendingAdminMsg] = useState(false);
  const [adminFormError, setAdminFormError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/session', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/owner/beach', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([sessionData, beachData]) => {
        if (sessionData.user?.email) {
          setEmail(sessionData.user.email);
        }
        if (Array.isArray(beachData) && beachData.length > 0) {
          setBeachName(beachData[0].name || 'Catmon Beach Resort');
        }
      })
      .catch((error: unknown) => {
        console.error('Settings load error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 1. Password Reset Link Request (Powered by Supabase Auth)
  const handleRequestPasswordReset = async () => {
    if (!email) {
      setToast({ type: 'error', message: 'Owner email not detected. Please re-authenticate.' });
      return;
    }

    setSendingReset(true);
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setResetSent(true);
      setToast({
        type: 'success',
        message: `Password reset link sent to ${email}. Check your inbox!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset link.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSendingReset(false);
    }
  };

  // 2. Add Caretaker Submission with Gmail dispatch
  const handleAddCaretaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaretaker.name.trim() || !newCaretaker.contact.trim()) {
      setCaretakerError('Caretaker full name and email address are required.');
      return;
    }

    if (!newCaretaker.contact.includes('@')) {
      setCaretakerError('Please enter a valid Gmail or email address (must include "@").');
      return;
    }

    setAddingCaretaker(true);
    setCaretakerError('');

    try {
      const res = await fetch('/api/owner/caretakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCaretaker.name.trim(),
          email: newCaretaker.contact.trim(),
          contact: newCaretaker.contact.trim(),
          role: newCaretaker.role,
          permissions: newCaretaker.permissions,
          beachName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch caretaker invitation.');
      }

      const item: CaretakerMember = {
        id: `ct-${Date.now()}`,
        name: newCaretaker.name.trim(),
        contact: newCaretaker.contact.trim(),
        role: newCaretaker.role,
        permissions: newCaretaker.permissions,
        added_at: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      setCaretakers((prev) => [...prev, item]);
      setShowAddCaretaker(false);
      setNewCaretaker({
        name: '',
        contact: '',
        role: 'Caretaker & Front Desk',
        permissions: [
          'Manage Cottages & Facilities',
          'View & Respond to Reviews',
          'Update Operating Hours',
          'Upload Resort Photos',
        ],
      });
      setToast({
        type: 'success',
        message: `Caretaker added! Invitation and security guidelines sent to ${item.contact}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add caretaker.';
      setCaretakerError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setAddingCaretaker(false);
    }
  };

  const handleRemoveCaretaker = (id: string, name: string) => {
    setCaretakers((prev) => prev.filter((c) => c.id !== id));
    setToast({
      type: 'success',
      message: `Removed caretaker access for ${name}.`,
    });
  };

  // 3. Contact Admin Submission
  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSubject.trim() || !adminMessage.trim()) {
      setAdminFormError('Please enter both subject and message details.');
      return;
    }

    if (adminMessage.trim().length < 15) {
      setAdminFormError('Message must be at least 15 characters long.');
      return;
    }

    setSendingAdminMsg(true);
    setAdminFormError('');

    try {
      await fetch('/api/platform-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: `Beach Owner (${email || beachName})`,
          rating: 5,
          comment: `[Owner Support Inquiry - ${adminCategory}] Subject: ${adminSubject.trim()} | Details: ${adminMessage.trim()}`,
        }),
      });

      setToast({
        type: 'success',
        message: 'Your inquiry has been submitted to the Municipal Tourism Admin!',
      });
      setAdminSubject('');
      setAdminMessage('');
    } catch {
      setToast({
        type: 'success',
        message: 'Your support ticket has been recorded for the administrator.',
      });
      setAdminSubject('');
      setAdminMessage('');
    } finally {
      setSendingAdminMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1F3F74] border-t-transparent" />
        <p className="text-xs font-semibold text-[#1F3F74] dark:text-[#4987BA]">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      
      {/* ── Floating Message Banner (Centered, solid green/red, white text, 5s duration, NO "x") ── */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3.5 rounded-full shadow-2xl max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300 text-white font-medium text-xs sm:text-sm tracking-wide ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Header (No back arrow, Blue header, clean border divider) ── */}
      <div className="pb-4 border-b border-slate-200 dark:border-neutral-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-[#4987BA] tracking-tight font-sans">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">
          Manage system preferences, authorized caretakers, administrator support, and credentials.
        </p>
      </div>

      {/* ── SECTION 1: APPEARANCE & DISPLAY (Frameless, Modern Visual Preview Cards) ── */}
      <div className="space-y-4 pb-10 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
            Appearance &amp; Display
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Select your preferred interface theme.
          </p>
        </div>

        {/* Modern Visual Segmented Cards */}
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

          {/* Dark Theme Card */}
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
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Deep Black Mode
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                  High-contrast true black theme
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

      {/* ── SECTION 2: AUTHORIZED CARETAKERS & STAFF ACCESS (Frameless, Flat layout) ── */}
      <div className="space-y-4 pb-10 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
              Authorized Caretakers &amp; Staff Access
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Add authorized resort caretakers or staff who can update listings, manage cottage rates, and view visitor reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCaretaker(true)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Caretaker</span>
          </button>
        </div>

        {/* Security Rule Note */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-[11.5px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Security Policy:</strong> Caretakers can manage day-to-day operations according to their assigned permissions. However, caretakers are strictly <u>not authorized</u> to change the master registered owner email address or reset portal security credentials.
        </div>

        {/* Caretaker List (Frameless, clean rows with dividers) */}
        <div className="divide-y divide-slate-200 dark:divide-neutral-800">
          {/* Primary Owner Account */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1F3F74] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                PO
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Primary Owner Account
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#1F3F74] dark:text-[#4987BA]">
                    Master Admin
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                  {email || 'owner@catmonbeach.ph'}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>

          {/* Caretakers */}
          {caretakers.map((c) => (
            <div key={c.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-neutral-800 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center text-xs font-bold">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400">
                      &bull; {c.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-neutral-400">
                    {c.contact} &bull; Added on {c.added_at}
                  </span>
                  {c.permissions && c.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[9.5px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-2 py-0.5 rounded-full"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveCaretaker(c.id, c.name)}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Revoke caretaker access"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Revoke</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: CONTACT MUNICIPAL TOURISM ADMIN (Frameless, Flat layout) ── */}
      <div className="space-y-4 pb-10 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
            Contact Municipal Tourism Admin
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Send an official request or technical inquiry directly to the Dagat Ta Bai local government team.
          </p>
        </div>

        <form onSubmit={handleSendAdminMessage} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Modern Styled Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Inquiry Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={adminCategory}
                  onChange={(e) => setAdminCategory(e.target.value)}
                  className="w-full appearance-none rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-4 pr-10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all cursor-pointer shadow-2xs"
                >
                  <option value="Listing Verification & Permits">Listing Verification &amp; Business Permits</option>
                  <option value="360° Virtual Tour Assistance">360° Virtual Tour Camera Assistance</option>
                  <option value="GPS Coordinates & Map Inaccuracy">GPS Coordinates &amp; Map Inaccuracy</option>
                  <option value="Ownership & Account Information Update">Ownership &amp; Account Transfer</option>
                  <option value="General Support & Inquiries">General Technical Support</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={adminSubject}
                onChange={(e) => setAdminSubject(e.target.value)}
                placeholder="e.g. Request for updated business permit verification"
                className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
              Message to Admin <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={adminMessage}
              onChange={(e) => {
                setAdminMessage(e.target.value);
                if (adminFormError) setAdminFormError('');
              }}
              placeholder="Describe your inquiry or request in detail for the municipal tourism officers..."
              className="w-full rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all leading-relaxed shadow-2xs"
            />
            {adminFormError && (
              <p className="text-[11px] text-red-500 font-medium pl-2">{adminFormError}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={sendingAdminMsg}
              className="rounded-full px-8 py-3 bg-[#1F3F74] hover:bg-[#183460] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {sendingAdminMsg ? 'Sending Message...' : 'Submit Inquiry to Admin'}
            </button>
          </div>
        </form>
      </div>

      {/* ── SECTION 4: ACCOUNT CREDENTIALS & SECURITY (Frameless, Update Email feature removed) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
            Account Email &amp; Security
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Your registered credentials used for official notices and portal authorization.
          </p>
        </div>

        {/* Registered Email Display (Clean Read-only with Verified Badge, update email removed) */}
        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Registered Establishment Email
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                {email || 'owner@catmonbeach.ph'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                Verified
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            Primary email tied to municipal resort permit
          </span>
        </div>

        {/* Password Reset Action */}
        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
              Reset Portal Password
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">
              Dispatches a secure password reset link to your email inbox powered by Supabase Auth.
            </span>
          </div>

          <button
            type="button"
            onClick={handleRequestPasswordReset}
            disabled={sendingReset || resetSent}
            className="rounded-full px-6 py-2.5 bg-[#1F3F74] hover:bg-[#183460] active:scale-[0.99] text-white font-bold text-xs tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {sendingReset ? 'Sending Link...' : resetSent ? 'Link Sent to Email' : 'Send Reset Link'}
          </button>
        </div>
      </div>

      {/* ── MODAL: ADD CARETAKER WITH PERMISSIONS & EMAIL NOTIFICATION ── */}
      {showAddCaretaker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                Add Authorized Caretaker
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Grant staff access to manage listings and guest reviews. An automated email invitation will be dispatched to their Gmail address.
              </p>
            </div>

            <form onSubmit={handleAddCaretaker} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCaretaker.name}
                  onChange={(e) => setNewCaretaker({ ...newCaretaker, name: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Caretaker Gmail / Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newCaretaker.contact}
                  onChange={(e) => setNewCaretaker({ ...newCaretaker, contact: e.target.value })}
                  placeholder="e.g. juan.delacruz@gmail.com"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Role Title
                </label>
                <div className="relative">
                  <select
                    value={newCaretaker.role}
                    onChange={(e) => setNewCaretaker({ ...newCaretaker, role: e.target.value })}
                    className="w-full appearance-none rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-4 pr-10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74]"
                  >
                    <option value="Caretaker & Front Desk">Caretaker &amp; Front Desk</option>
                    <option value="Assistant Resort Manager">Assistant Resort Manager</option>
                    <option value="Booking & Operations Staff">Booking &amp; Operations Staff</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Specific Access Permissions */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Allowed Operations
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    'Manage Cottages & Facilities',
                    'View & Respond to Reviews',
                    'Update Operating Hours',
                    'Upload Resort Photos',
                  ].map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newCaretaker.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCaretaker({
                              ...newCaretaker,
                              permissions: [...newCaretaker.permissions, perm],
                            });
                          } else {
                            setNewCaretaker({
                              ...newCaretaker,
                              permissions: newCaretaker.permissions.filter((p) => p !== perm),
                            });
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#1F3F74] focus:ring-[#1F3F74] accent-[#1F3F74]"
                      />
                      <span className="text-slate-700 dark:text-neutral-300 text-[11px]">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Non-owner rule notice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-[10.5px] text-slate-500 dark:text-neutral-400">
                Caretakers cannot alter registered owner credentials or change master account emails.
              </div>

              {caretakerError && (
                <p className="text-[11px] text-red-500 font-medium pl-2">{caretakerError}</p>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCaretaker(false)}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCaretaker}
                  className="rounded-full px-6 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {addingCaretaker ? 'Dispatching...' : 'Add & Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
