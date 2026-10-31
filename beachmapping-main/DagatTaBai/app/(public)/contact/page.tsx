'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  // Auto-dismiss floating error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const validate = () => {
    const errors: { name?: string; email?: string; message?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Please enter your full legal name.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errors.email = "Please enter a valid email address with an '@' and domain.";
    }

    if (!formData.message.trim()) {
      errors.message = 'Please provide details for your message.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setErrorMessage('Please fill out the necessary fields before submitting.');
      return;
    }

    setErrorMessage('');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Floating Error Alert (5s Duration, Solid Red, No Close Button) ── */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full shadow-xl shadow-red-950/25 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-center">
            {errorMessage}
          </span>
        </div>
      )}

      {/* ── Page Header (Clean Scale, Underline Only on Click/Hover for FAQ Link) ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-8 text-center space-y-2">
        <ScrollReveal direction="up" duration={650}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight">
            Contact &amp; Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mt-2">
            Have questions, suggestions, or need to report inaccurate beach info? Reach out below, or browse our{' '}
            <Link
              href="/faq"
              className="font-bold text-[#1F3F74] dark:text-[#4987BA] no-underline hover:underline active:underline transition-all cursor-pointer"
            >
              Frequently Asked Questions (FAQs)
            </Link>
            .
          </p>
        </ScrollReveal>
      </div>

      {/* ── Clean, Centered, Well-Spaced Form Layout (Frameless, NO Containers) ── */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {submitted ? (
          /* Frameless Confirmation View with Bold Circle Checkmark */
          <div className="py-16 sm:py-24 text-center space-y-5 max-w-md mx-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full border-[3px] border-[#1F3F74] dark:border-[#4987BA] text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Message Sent Successfully
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Thank you for reaching out! Our team will review your message and reply to your email within 1 to 2 business days.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                  });
                  setFieldErrors({});
                }}
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-7 pt-2">
            
            {/* Full Legal Name & Email Address (Properly Spaced) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              
              {/* Full Legal Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                  }}
                  className={`w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-full text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs ${
                    fieldErrors.name
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 dark:border-neutral-800 focus:border-[#1F3F74] dark:focus:border-[#4987BA]'
                  }`}
                  placeholder="Patrick James D. Leswe"
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium pl-4">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  className={`w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-full text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs ${
                    fieldErrors.email
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 dark:border-neutral-800 focus:border-[#1F3F74] dark:focus:border-[#4987BA]'
                  }`}
                  placeholder="owner@resort.com"
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-600 font-medium pl-4">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

            </div>

            {/* Subject Line (Proper Spacing) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Subject Line
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] dark:focus:border-[#4987BA] transition-all shadow-2xs"
                placeholder="Brief summary of your question or report"
              />
            </div>

            {/* Message Details (Proper Spacing) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Message Details <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: undefined });
                }}
                className={`w-full px-5 py-3.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-2xl text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs ${
                  fieldErrors.message
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-slate-200 dark:border-neutral-800 focus:border-[#1F3F74] dark:focus:border-[#4987BA]'
                }`}
                placeholder="Please describe your message, question, or specific beach feedback in detail..."
              />
              {fieldErrors.message && (
                <p className="text-[11px] text-red-600 font-medium pl-4">
                  {fieldErrors.message}
                </p>
              )}
            </div>

            {/* Submit Button in Dive Blue (#1F3F74) - Oblong, No Arrow */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Send Message
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}