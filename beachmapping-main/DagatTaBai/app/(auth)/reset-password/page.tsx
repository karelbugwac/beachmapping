'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  // Auto-dismiss floating error banner after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // ── Validation ──────────────────────────────────────────────
  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 6,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
    }),
    [password],
  );
  const passwordValid =
    passwordChecks.minLength && passwordChecks.hasLetter && passwordChecks.hasNumber;
  const confirmValid = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });

    if (!passwordValid) return;
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-4 py-8 bg-[#f8fafc] dark:bg-black transition-colors duration-200">
      {/* ── Floating Error Banner (Centered, solid red, white text & icon, 5s duration, no "x") ── */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-red-600 text-white rounded-full shadow-xl shadow-red-950/25 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            {errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1)}
          </span>
        </div>
      )}

      {/* ── Top Navigation (Left-aligned, hidden when password updated) ── */}
      <div className="w-full px-4 sm:px-8 md:px-12 flex items-center justify-start">
        {!success ? (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#1F3F74] dark:text-neutral-400 dark:hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Sign In</span>
          </Link>
        ) : (
          <div className="h-6" />
        )}
      </div>

      {/* ── Main Seamless Area (No Container / No Card Box) ── */}
      <div className="w-full max-w-sm sm:max-w-md my-auto py-6">
        {success ? (
          /* ── Success View (Header, Logo & Subtitle completely removed) ── */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#1F3F74] dark:border-[#4987BA] bg-transparent text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
              Password Updated!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
              Redirecting you to the sign-in page...
            </p>
          </div>
        ) : (
          <>
            {/* Header: Logo + Title */}
            <div className="flex flex-col items-center text-center mb-8 sm:mb-9">
              <Link href="/" className="inline-block transition-transform hover:scale-105 mb-3.5">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <Image
                    src="/images/logo.png"
                    alt="Dagat Ta Bai Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
                Set New Password
              </h1>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-normal leading-relaxed max-w-xs mx-auto">
                Create a secure new password for your Dagat Ta Bai account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password (Oblong rounded-full) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 ml-1">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  className={`w-full pl-5 pr-12 py-3.5 text-sm bg-white dark:bg-[#121212] border rounded-full text-slate-900 dark:text-white caret-[#1F3F74] dark:caret-[#4987BA] placeholder:text-transparent focus:outline-none focus:ring-2 transition-all duration-200 ${
                    touched.password && !passwordValid && password
                      ? 'border-red-400 dark:border-red-600 focus:ring-red-500/20'
                      : 'border-slate-300 dark:border-neutral-800 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {touched.password && password && (
                    passwordValid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-full text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password checklist (Clean & borderless) */}
              {touched.password && password && !passwordValid && (
                <div className="mt-1.5 px-3 py-1.5 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                    Password must have:
                  </p>
                  {[
                    { check: passwordChecks.minLength, label: 'At least 6 characters' },
                    { check: passwordChecks.hasLetter, label: 'At least one letter' },
                    { check: passwordChecks.hasNumber, label: 'At least one number' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.check ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-neutral-600 flex-shrink-0" />
                      )}
                      <span
                        className={`text-[11px] ${
                          item.check ? 'text-[#1F3F74] dark:text-[#4987BA] font-medium' : 'text-slate-500 dark:text-neutral-400'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password (Oblong rounded-full) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider ml-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                  className={`w-full pl-5 pr-12 py-3.5 text-sm bg-white dark:bg-[#121212] border rounded-full text-slate-900 dark:text-white caret-[#1F3F74] dark:caret-[#4987BA] placeholder:text-transparent focus:outline-none focus:ring-2 transition-all duration-200 ${
                    touched.confirm && !confirmValid && confirmPassword
                      ? 'border-red-400 dark:border-red-600 focus:ring-red-500/20'
                      : 'border-slate-300 dark:border-neutral-800 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {touched.confirm && confirmPassword && (
                    confirmValid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="p-1 rounded-full text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {touched.confirm && confirmPassword && !confirmValid && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 ml-2">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Passwords do not match
                </p>
              )}
            </div>

            {/* BUTTON: #1F3F74 Oblong rounded-full, no arrow */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 mt-2 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] disabled:opacity-50 text-white font-bold text-sm rounded-full transition-all duration-200 shadow-md hover:shadow-lg shadow-[#1F3F74]/25 flex items-center justify-center cursor-pointer"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-neutral-400 pt-5">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-[#1F3F74] dark:text-[#4987BA] font-bold hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
      </div>

      {/* Empty bottom anchor */}
      <div className="w-full max-w-sm sm:max-w-md" />
    </div>
  );
}
