'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

export default function BeachOwnerApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicant_full_name: '',
    applicant_email: '',
    business_name: '',
    beach_name: '',
    beach_location: '',
    contact_info: '',
    business_permit_file: null as File | null,
    proof_of_ownership_file: null as File | null,
    agreeToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      showToast('Please agree to the Privacy Policy and Terms of Use.', 'error');
      return;
    }

    setLoading(true);

    try {
      const applicationData = new FormData();
      applicationData.set('applicant_full_name', formData.applicant_full_name);
      applicationData.set('applicant_email', formData.applicant_email);
      applicationData.set('business_name', formData.business_name);
      applicationData.set('beach_name', formData.beach_name);
      applicationData.set('beach_location', formData.beach_location);
      applicationData.set('contact_phone', formData.contact_info);
      applicationData.set('agreeToTerms', String(formData.agreeToTerms));
      applicationData.set('business_permit', formData.business_permit_file as File);
      applicationData.set('proof_of_ownership', formData.proof_of_ownership_file as File);

      const res = await fetch('/api/applications', {
        method: 'POST',
        body: applicationData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application. Please try again.');
      }

      showToast('Your owner application was submitted successfully. It is now pending review.');
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Apply as a Beach Owner</h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Submit your resort information and official business permits. Once approved by our administrator, you will receive your temporary staff PIN via email to access your Owner Dashboard.
        </p>
        <Link href="/owner-requirements" className="inline-block text-sm font-semibold text-sky-700 underline">
          View application requirements
        </Link>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your application for <strong>{formData.beach_name}</strong> has been received with status <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase">Pending</span>.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5">
              <p className="font-semibold text-slate-800">What happens next?</p>
              <p>1. Our administrator will verify your business permit and legal ownership proof.</p>
              <p>2. Upon approval, a 6-digit staff PIN and login instructions will be emailed to <strong>{formData.applicant_email}</strong>.</p>
              <p>3. You can log in via the Owner Portal to manage your beach listing.</p>
            </div>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-sky-600 text-white font-medium text-sm rounded-md hover:bg-sky-700 transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Contact info */}
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                1. Applicant Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.applicant_full_name}
                    onChange={(e) => setFormData({ ...formData, applicant_full_name: e.target.value })}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beach Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={240}
                    value={formData.beach_location}
                    onChange={(e) => setFormData({ ...formData, beach_location: e.target.value })}
                    placeholder="Barangay, municipality, province"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (For PIN Delivery) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.applicant_email}
                    onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
                    placeholder="owner@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_info}
                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                    placeholder="+63 917 123 4567"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Beach / Business Info */}
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                2. Beach & Resort Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Business / Resort Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="e.g. Majestique Coastal Resort Inc."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beach Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.beach_name}
                    onChange={(e) => setFormData({ ...formData, beach_name: e.target.value })}
                    placeholder="e.g. Majestique Beach"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Document Uploads */}
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                3. Verification Documents (Private Storage)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center space-y-2 bg-slate-50">
                  <FileText className="w-8 h-8 text-sky-600 mx-auto" />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Mayor&apos;s / Business Permit</span>
                    <span className="text-[11px] text-slate-500">PDF, PNG, or JPG (Max 10MB)</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    required
                    onChange={(e) => setFormData({ ...formData, business_permit_file: e.target.files?.[0] || null })}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                  />
                </div>

                <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center space-y-2 bg-slate-50">
                  <FileText className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Proof of Ownership / Lease</span>
                    <span className="text-[11px] text-slate-500">Land Title or Notarized Lease Contract</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    required
                    onChange={(e) => setFormData({ ...formData, proof_of_ownership_file: e.target.files?.[0] || null })}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Documents are stored securely in an encrypted, private storage bucket with strict admin-only Row Level Security access.
              </p>
            </div>

            {/* Section 4: RA 10173 Consent */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I certify that all information and documents submitted are accurate and legally authentic. I have read and agree to the{' '}
                  <Link href="/privacy" target="_blank" className="text-sky-600 font-semibold underline">
                    Privacy Policy (RA 10173)
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" target="_blank" className="text-sky-600 font-semibold underline">
                    Terms of Use
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.agreeToTerms}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-sm rounded-md transition-colors shadow-sm"
            >
              {loading ? (
                <span>Submitting Application...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Submit Owner Application</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
