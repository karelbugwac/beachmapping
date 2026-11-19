'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ShieldCheck, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { filterFullNameInput, validateFullName } from '@/lib/validation/fullName';

export default function DataSubjectRequestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    requestType: 'access',
    details: '',
    agreeConsent: false,
  });
  const nameValidation = validateFullName(formData.fullName);
  const nameError = nameInputError || nameValidation.error;
  const nameValid = nameValidation.ok && !nameInputError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValidation.ok || nameInputError || !formData.agreeConsent) {
      if (!nameInputError) setNameInputError(nameValidation.error);
      return;
    }
    setFormData((current) => ({ ...current, fullName: nameValidation.value }));
    setSubmitted(true);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <Link
        href="/privacy"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Privacy Policy</span>
      </Link>

      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-teal-100 text-brand-teal-700 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>NPC Compliance Channel</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Data Subject Request Form</h1>
        <p className="text-xs text-slate-600">
          Exercise your statutory rights under the Philippine Data Privacy Act of 2012 (RA 10173).
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Request Form Received</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your request for <span className="font-semibold capitalize">{formData.requestType}</span> has been logged. A compliance officer will contact you at <strong>{formData.email}</strong> within 15 working days as prescribed by the NPC guidelines.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="px-4 py-2 bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-xs font-semibold rounded-md transition-colors inline-block"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="data-request-full-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="data-request-full-name"
                type="text"
                required
                maxLength={80}
                autoComplete="name"
                inputMode="text"
                value={formData.fullName}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  const validation = validateFullName(rawValue);
                  setFormData({ ...formData, fullName: filterFullNameInput(rawValue) });
                  setNameInputError(validation.error);
                }}
                onBlur={() => {
                  const validation = validateFullName(formData.fullName);
                  if (!nameInputError) setNameInputError(validation.error);
                  if (validation.ok && !nameInputError) {
                    setFormData((current) => ({ ...current, fullName: validation.value }));
                  }
                }}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? 'data-request-full-name-error' : undefined}
                placeholder="Juan Dela Cruz"
                className={`w-full px-3 py-2 text-sm border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 ${
                  nameError ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {nameError && (
                <p
                  id="data-request-full-name-error"
                  role="alert"
                  className="mt-1 flex items-center gap-1 text-sm text-red-600"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address Associated with Account <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@example.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Request Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400"
              >
                <option value="access">Access Personal Data (Data Export)</option>
                <option value="correction">Correction / Rectification of Information</option>
                <option value="erasure">Erasure / Deletion of Account & Data</option>
                <option value="objection">Objection to Processing</option>
                <option value="other">Other Inquiry / Clarification</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description of Request <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Please describe the specific records or profile actions you are requesting..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreeConsent}
                  onChange={(e) => setFormData({ ...formData, agreeConsent: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-brand-navy-500 border-slate-300 rounded focus:ring-brand-teal-400"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I certify that I am the authorized data subject making this request. I consent to the verification of my identity solely for processing this statutory request.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!formData.agreeConsent || !nameValid}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-navy-500 hover:bg-brand-navy-600 active:bg-brand-navy-700 disabled:opacity-50 text-white font-semibold text-sm rounded-md transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Submit Data Subject Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
