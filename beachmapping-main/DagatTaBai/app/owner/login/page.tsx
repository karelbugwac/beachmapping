'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  Edit2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function OwnerLoginPage() {
  const router = useRouter();

  // Step 1: email, Step 2: pin & certification
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Step 2 PIN state
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [certified, setCertified] = useState(false);
  const [certifyError, setCertifyError] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);

  // Floating toast message state (Centered, solid green/red, white text, 5s duration, NO "x")
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-dismiss floating toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Focus on first pin input when moving to step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Email validation helper
  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!trimmed.includes('@')) {
      setEmailError('Email address is missing "@".');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address (e.g., owner@example.com).');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleProceedToPin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!validateEmail(email)) {
      return;
    }
    setStep(2);
    setPinError('');
    setCertifyError('');
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (!cleaned) {
      const next = [...pinDigits];
      next[index] = '';
      setPinDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const next = [...pinDigits];
      chars.forEach((c, i) => {
        next[i] = c;
      });
      setPinDigits(next);
      const nextFocus = Math.min(chars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const next = [...pinDigits];
    next[index] = cleaned[0];
    setPinDigits(next);

    if (cleaned[0] && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...pinDigits];
    pasted.split('').forEach((c, i) => {
      next[i] = c;
    });
    setPinDigits(next);
    const nextFocus = Math.min(pasted.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  const pin = pinDigits.join('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setCertifyError('');

    if (pin.length !== 6) {
      setPinError('Please enter all 6 digits of your security PIN.');
      setToast({ type: 'error', message: 'Please enter all 6 digits of your security PIN.' });
      return;
    }

    if (!certified) {
      setCertifyError('You must certify that you are the authorized owner or caretaker.');
      setToast({ type: 'error', message: 'Please check the certification box to proceed.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          pin,
          portal: 'owner',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid 6-digit PIN. Please check your credentials.');
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: pin,
      });

      if (signInError) {
        throw new Error(signInError.message || 'Could not establish owner session.');
      }

      // Success floating toast (Center aligned, green background, white text, 5s duration, NO "x")
      setToast({
        type: 'success',
        message: 'Login successful! Redirecting to Beach Owner Dashboard...',
      });

      setTimeout(() => {
        router.push(data.redirect || '/owner/dashboard');
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setPinError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-4 py-8 bg-[#f8fafc] dark:bg-black transition-colors duration-200 font-sans">
      
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

      {/* Top Brand Logo */}
      <div className="w-full flex items-center justify-center pt-4 sm:pt-6">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="Dagat Ta Bai"
              width={38}
              height={38}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <div>
            <span className="font-sans font-extrabold text-xl tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-none block">
              Dagat Ta Bai
            </span>
            <span className="text-[10.5px] font-semibold text-slate-500 dark:text-neutral-400 tracking-wider uppercase block mt-0.5">
              Beach Owner Portal
            </span>
          </div>
        </div>
      </div>

      {/* Central Login Card */}
      <div className="w-full max-w-md my-auto py-6">
        <div className="bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-neutral-800 p-8 sm:p-10 rounded-2xl shadow-xl space-y-6">
          
          {/* Header Title & Subtitle */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              Beach Owner Login
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              {step === 1
                ? 'Enter your registered establishment email address to begin.'
                : 'Enter your 6-digit security PIN to access your resort dashboard.'}
            </p>
          </div>

          {/* ── STEP 1: Application Email ── */}
          {step === 1 && (
            <form onSubmit={handleProceedToPin} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="owner-email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Application Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="owner-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailTouched) validateEmail(e.target.value);
                    }}
                    onBlur={() => {
                      setEmailTouched(true);
                      validateEmail(email);
                    }}
                    placeholder="resort.owner@example.com"
                    className={`w-full rounded-full border bg-white dark:bg-[#132035] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                      emailError
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20'
                    }`}
                  />
                </div>

                {/* Red Error Text Below Field When Invalid */}
                {emailError && (
                  <p className="text-[11px] text-red-500 font-medium pl-2 pt-0.5 animate-in fade-in duration-200">
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1F3F74] hover:bg-[#183460] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ── STEP 2: 6-Digit PIN & Certification ── */}
          {step === 2 && (
            <form onSubmit={handleLogin} className="space-y-6" noValidate>
              
              {/* Email Badge with Change Option */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#132035] border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
                  <span className="truncate text-slate-700 dark:text-slate-200 font-medium">
                    {email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setPinError('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline flex-shrink-0 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              {/* 6-Digit PIN Inputs with Show/Hide Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    6-Digit Security PIN <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#1F3F74] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                  </button>
                </div>

                <div className="flex justify-center items-center gap-2 sm:gap-2.5">
                  {pinDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      required
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      onPaste={handleDigitPaste}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all focus:outline-none ${
                        digit
                          ? 'border-[#1F3F74] ring-2 ring-[#1F3F74]/20 bg-blue-50/20 text-[#1F3F74] dark:text-[#4987BA] dark:bg-blue-950/20'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#132035] text-slate-900 dark:text-white focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20'
                      }`}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="text-[11px] text-red-500 font-medium text-center pt-1 animate-in fade-in duration-200">
                    {pinError}
                  </p>
                )}
              </div>

              {/* ── Certification Checkbox ── */}
              <div className="space-y-1 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={certified}
                    onChange={(e) => {
                      setCertified(e.target.checked);
                      if (e.target.checked) setCertifyError('');
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#1F3F74] focus:ring-[#1F3F74] mt-0.5 cursor-pointer accent-[#1F3F74]"
                  />
                  <span className="text-[11.5px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    I certify that I am the authorized owner or caretaker of this registered establishment.
                  </span>
                </label>
                {certifyError && (
                  <p className="text-[11px] text-red-500 font-medium pl-6 pt-0.5 animate-in fade-in duration-200">
                    {certifyError}
                  </p>
                )}
              </div>

              {/* Login Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1F3F74] hover:bg-[#183460] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm tracking-wide rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Bottom Footer Copyright */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 pb-2">
        <p>© 2026 Dagat Ta Bai. All rights reserved.</p>
      </div>

    </div>
  );
}
