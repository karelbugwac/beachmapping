'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Auto-dismiss floating error banner after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send recovery email';
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

      {/* ── Top Navigation (Left-aligned, hidden when email sent) ── */}
      <div className="w-full px-4 sm:px-8 md:px-12 flex items-center justify-start">
        {!sent ? (
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
        {sent ? (
          /* ── Sent / Success View (Header, Logo & Subtitle completely removed) ── */
          <div className="py-4 text-center space-y-5">
            {/* Standard Blue Checkmark Icon: Blue border outside, transparent inside, blue check */}
            <div className="w-16 h-16 rounded-full border-2 border-[#1F3F74] dark:border-[#4987BA] bg-transparent text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
                Recovery Email Sent
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed max-w-sm mx-auto">
                Please check your email for the password reset instructions by SupaBase Auth. If you cannot find the email in your inbox, please check your spam folder.
              </p>
            </div>

            {/* Single Clean Oblong Button */}
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3.5 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] text-white font-bold text-sm rounded-full transition-all duration-200 shadow-md hover:shadow-lg shadow-[#1F3F74]/25 cursor-pointer"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* ── Initial Form View ── */
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
                Reset Password
              </h1>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-normal leading-relaxed max-w-xs mx-auto">
                Enter your email and we&apos;ll send you instructions to reset your account password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 ml-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    className={`w-full px-5 py-3.5 text-sm bg-white dark:bg-[#121212] border rounded-full text-slate-900 dark:text-white caret-[#1F3F74] dark:caret-[#4987BA] placeholder:text-transparent focus:outline-none focus:ring-2 transition-all duration-200 ${
                      touched && !emailValid && email
                        ? 'border-red-400 dark:border-red-600 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-neutral-800 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]'
                    }`}
                  />
                  {touched && email && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {emailValid ? (
                        <CheckCircle2 className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BUTTON: #1F3F74 Oblong rounded-full, no arrow */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full py-3.5 mt-2 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] disabled:opacity-50 text-white font-bold text-sm rounded-full transition-all duration-200 shadow-md hover:shadow-lg shadow-[#1F3F74]/25 flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
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
