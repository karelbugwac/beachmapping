'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const username = 'Administrator';
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
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
    // Focus first PIN input on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  }, []);

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
        throw new Error(data.error || 'Invalid 6-digit Administrator PIN.');
      }

      // Establish client-side Supabase session
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: data.email || 'official.dagattabai@gmail.com',
          password: nextPin,
        });
      } catch (clientAuthErr) {
        console.warn('Client-side session sync notice:', clientAuthErr);
      }

      showToast('Login successful! Redirecting to Admin Dashboard...', 'success');

      setTimeout(() => {
        window.location.replace('/admin/dashboard');
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      showToast(msg, 'error');
      submittingRef.current = false;
      setLoading(false);
      setPinDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      showToast('Please enter all 6 digits of your security PIN.', 'error');
      return;
    }
    await loginWithPin(pin);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[#f8fafc] dark:bg-black transition-colors duration-200 font-sans">
      {/* ── Top Page Loader Line Indicator ── */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-[#1F3F74] dark:bg-[#4987BA] z-[400] animate-pulse overflow-hidden">
          <div className="h-full bg-sky-400 w-1/2 animate-[progress_1s_ease-in-out_infinite]" />
        </div>
      )}

      {/* ── Main Seamless Form Area (NO Box Container / Frameless Layout) ── */}
      <div className="w-full max-w-sm sm:max-w-md py-6">
        {/* Header: Dagat Ta Bai Logo + Admin Portal */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="inline-block transition-transform hover:scale-105 mb-4">
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
            Admin Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs mx-auto mt-1 leading-relaxed">
            Enter your 6-digit PIN to access administrative features.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* 6-Digit PIN Fields with Separate Squares for Numbers */}
          <div className="space-y-3">
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
                      : 'border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20'
                  }`}
                />
              ))}
            </div>

            {/* Hide/Show PIN Button aligned center below the squares */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1F3F74] dark:text-neutral-400 dark:hover:text-[#4987BA] transition-colors cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
              </button>
            </div>
          </div>

          {/* Login Button: Oblong, renamed to "Login", NO button loading spinner */}
          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full py-3.5 bg-[#1F3F74] hover:bg-[#183460] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide rounded-full transition-all shadow-md flex items-center justify-center cursor-pointer"
          >
            <span>Login</span>
          </button>
        </form>
      </div>
    </div>
  );
}
