'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  X,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { getSafeInternalRedirect } from '@/lib/utils/safe-redirect';

function UserLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailConfirmed = searchParams.get('confirmed') === '1';
  const authError = searchParams.get('error');
  const prefilledEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [suspendedAccount, setSuspendedAccount] = useState<{ reason: string | null; reason_type: string | null; suspended_until: string | null } | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  useEffect(() => {
    if (emailConfirmed) {
      showToast('Email confirmed. You can now sign in.');
      router.replace('/login', { scroll: false });
    }
    if (authError) {
      if (authError === 'rate_limited') {
        const retryParam = Number(searchParams.get('retryAfter') || 0);
        const retrySecs = Number.isFinite(retryParam) && retryParam > 0 ? retryParam : 15 * 60;
        setLockoutSeconds(retrySecs);
        const mins = Math.ceil(retrySecs / 60);
        const waitText = retrySecs >= 60 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${retrySecs} seconds`;
        const msg = `Too many failed login attempts. Please wait ${waitText} before trying again.`;
        setLoginErrorMessage(msg);
        router.replace('/login', { scroll: false });
        return;
      }

      const errorMessages: Record<string, string> = {
        google_auth_failed: 'Google sign in failed. Please check your credentials.',
        code_exchange_failed: 'Authentication session exchange failed.',
        no_auth_code: 'No authorization code returned from provider.',
        oauth_redirect_failed: 'Could not connect to Google sign-in.',
        oauth_processing_error: 'Error completing account authentication.',
      };
      showToast(errorMessages[authError] || `Sign-in error: ${authError}`, 'error');
      router.replace('/login', { scroll: false });
    }
  }, [emailConfirmed, authError, router, searchParams]);

  // ── Validation ──────────────────────────────────────────────
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!emailValid) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!password) {
      showToast('Please enter your password.', 'error');
      return;
    }

    if (lockoutSeconds > 0) {
      return;
    }

    setLoginErrorMessage(null);
    setLoading(true);
    setSuspendedAccount(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.code === 'ACCOUNT_SUSPENDED') {
        setSuspendedAccount({ reason: data.reason || null, reason_type: data.reason_type || null, suspended_until: data.suspended_until || null });
        return;
      }
      if (res.status === 429) {
        const retrySecs = typeof data.retryAfterSeconds === 'number' && data.retryAfterSeconds > 0
          ? data.retryAfterSeconds
          : 15 * 60;
        setLockoutSeconds(retrySecs);
        const msg = data.error || 'Too many failed login attempts. Please wait before trying again.';
        setLoginErrorMessage(msg);
        return;
      }
      if (!res.ok || data.error) {
        const msg = data.error || 'Invalid email or password.';
        setLoginErrorMessage(msg);
        return;
      }

      showToast('Successfully logged in!');
      window.dispatchEvent(new CustomEvent('dtb_login_completed', {
        detail: { userId: data.user.id },
      }));
      const redirectUrl = getSafeInternalRedirect(searchParams.get('redirect'), '/home');
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      setLoginErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (lockoutSeconds > 0) {
      return;
    }
    const params = new URLSearchParams();
    if (email.trim()) {
      params.set('email', email.trim());
    }
    params.set('redirect', getSafeInternalRedirect(searchParams.get('redirect'), '/home'));
    window.location.href = `/api/auth/google?${params.toString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-4 py-8 bg-white dark:bg-black transition-colors duration-200">
      {/* ── Floating Rate Limit / Login Error Message ────── */}
      {(lockoutSeconds > 0 || loginErrorMessage) && (
        <div
          role="alert"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)] flex items-start gap-2.5 rounded-2xl border border-red-200 bg-white/95 backdrop-blur-md px-4 py-3 text-xs text-red-700 shadow-xl shadow-red-950/10 animate-in fade-in slide-in-from-top-3 duration-200 dark:border-red-900/60 dark:bg-[#1a0f12]/95 dark:text-red-300 dark:shadow-black/40"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1 space-y-0.5 leading-relaxed">
            <p className="font-semibold">
              {lockoutSeconds > 0
                ? 'Too many failed login attempts'
                : 'Sign-in failed'}
            </p>
            <p>
              {lockoutSeconds > 0
                ? `Please wait ${Math.floor(lockoutSeconds / 60) > 0 ? `${Math.floor(lockoutSeconds / 60)}m ${lockoutSeconds % 60}s` : `${lockoutSeconds}s`} before trying again.`
                : loginErrorMessage}
            </p>
          </div>
          {lockoutSeconds <= 0 && (
            <button
              type="button"
              onClick={() => setLoginErrorMessage(null)}
              aria-label="Dismiss message"
              className="rounded-full p-1 text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-200 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {/* ── Top Navigation (Left-aligned) ─────────────────── */}
      <div className="w-full px-4 sm:px-8 md:px-12 flex items-center justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-display font-medium text-slate-500 hover:text-brand-navy-500 dark:text-neutral-400 dark:hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* ── Main Seamless Form Area (No Box Container) ─────── */}
      <div className="w-full max-w-sm sm:max-w-md my-auto py-4">
        
        {/* Header: Logo + Welcome back + Subheader */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-9">
          <Link href="/" className="inline-block transition-transform hover:scale-105 mb-3.5">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Dagat Ta Bai Logo"
                width={64}
                height={64}
                style={{ width: 'auto', height: 'auto' }}
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-brand-navy-500 dark:text-brand-teal-300">
            Welcome back
          </h1>
          <p className="text-xs font-display text-slate-500 dark:text-neutral-400 mt-1 font-normal leading-relaxed max-w-xs mx-auto">
            Sign in to discover, rate, and share your favorite coastal destinations in Catmon.
          </p>
        </div>

        {/* ── Form (Credentials First) ────────────────────── */}
        <form onSubmit={handleEmailLogin} className="space-y-5">
          {/* Email Category (Standard Sentence Case label, oblong field) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-display font-semibold text-slate-700 dark:text-neutral-300 ml-1">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className={`w-full px-5 py-3.5 text-sm bg-white dark:bg-neutral-900 border rounded-full text-slate-900 dark:text-white caret-brand-navy-500 dark:caret-brand-teal-600 placeholder:text-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F3F74]/30 focus:ring-1 transition-all duration-200 ${
                  touched.email && !emailValid && email
                    ? 'border-red-400 dark:border-red-600 focus:ring-red-500/20'
                    : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74]/30 dark:focus:ring-[#4987BA]/30'
                }`}
              />
              {touched.email && email && !emailValid && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            {touched.email && email && !emailValid && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 ml-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Please enter a valid email address
              </p>
            )}
          </div>

          {/* Password Category (Standard Sentence Case label, oblong field) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="block text-xs font-display font-semibold text-slate-700 dark:text-neutral-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-display font-semibold text-brand-navy-500 dark:text-brand-teal-300 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className={`w-full pl-5 pr-12 py-3.5 text-sm bg-white dark:bg-neutral-900 border rounded-full text-slate-900 dark:text-white caret-brand-navy-500 dark:caret-brand-teal-600 placeholder:text-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F3F74]/30 focus:ring-1 transition-all duration-200 ${
                  touched.password && !password
                    ? 'border-red-400 dark:border-red-600 focus:ring-red-500/20'
                    : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74]/30 dark:focus:ring-[#4987BA]/30'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {touched.password && !password && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded-full text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Primary Submit Button: Oblong rounded-full, Luxury Resort Font Style, Kept Navy Color */}
          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="group relative w-full py-3.5 mt-2 bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-navy-500 dark:hover:bg-brand-navy-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display uppercase tracking-[0.14em] font-medium text-xs sm:text-sm rounded-full transition-all duration-200 shadow-md hover:shadow-lg shadow-brand-navy-500/25 flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Signing in...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {suspendedAccount && (
          <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            <p className="font-bold">Your account is suspended.</p>
            {suspendedAccount.reason_type && <p className="mt-1 font-semibold">{suspendedAccount.reason_type}</p>}
            {suspendedAccount.reason && <p className="mt-1 whitespace-pre-wrap">{suspendedAccount.reason}</p>}
            <p className="mt-1">
              This suspension is in effect {suspendedAccount.suspended_until ? `until ${new Date(suspendedAccount.suspended_until).toLocaleDateString()}` : 'until further notice'}.
            </p>
            <Link href="/contact" className="mt-2 inline-block font-semibold underline">Contact us</Link>
          </div>
        )}

        {/* ── Standard Divider: Clean lowercase/sentence case, no all-caps ─ */}
        <div className="relative flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#1F3F74]/15 dark:bg-[#4987BA]/20" />
          <span className="text-xs text-slate-400 dark:text-neutral-500 font-display font-normal select-none">
            or continue with
          </span>
          <div className="flex-1 h-px bg-[#1F3F74]/15 dark:bg-[#4987BA]/20" />
        </div>

        {/* ── Google OAuth Button (Oblong rounded-full) ────── */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || lockoutSeconds > 0}
          className="w-full py-3.5 px-5 bg-white dark:bg-neutral-900 border border-[#1F3F74]/40 dark:border-[#4987BA]/40 hover:bg-white dark:hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-slate-700 dark:text-neutral-200 text-xs sm:text-sm font-display font-medium tracking-wide transition-all duration-200 flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FCC255"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* ── Link to Register (Line above completely removed) ── */}
        <p className="text-center text-sm font-display text-slate-600 dark:text-neutral-400 pt-5">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-brand-navy-500 dark:text-brand-teal-300 font-bold hover:underline transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>

      {/* Empty bottom anchor */}
      <div className="w-full max-w-sm sm:max-w-md" />
    </div>
  );
}

export default function UserLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black" />}>
      <UserLoginForm />
    </Suspense>
  );
}
