'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Building2,
  User,
  MapPin,
  Lock,
  Clock,
  Sparkles,
  X,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

interface FilePreviewState {
  file: File;
  url: string;
  isImage: boolean;
  name: string;
  size: string;
}

export default function BeachOwnerApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    applicant_full_name: '',
    applicant_email: '',
    business_name: '',
    beach_name: '',
    beach_location: 'Barangay Binongkalan, Catmon, Cebu',
    contact_info: '',
    agreeToTerms: false,
  });

  // Files and Live Previews
  const [permitPreview, setPermitPreview] = useState<FilePreviewState | null>(null);
  const [ownershipPreview, setOwnershipPreview] = useState<FilePreviewState | null>(null);

  // Input refs for file replacement
  const permitInputRef = useRef<HTMLInputElement>(null);
  const ownershipInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (permitPreview?.url) URL.revokeObjectURL(permitPreview.url);
      if (ownershipPreview?.url) URL.revokeObjectURL(ownershipPreview.url);
    };
  }, [permitPreview, ownershipPreview]);

  // Handle File Uploads with live preview
  const handleFileSelection = (file: File | null, type: 'permit' | 'ownership') => {
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be 10MB or less.', 'error');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const url = isImage ? URL.createObjectURL(file) : '';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;

    const previewData: FilePreviewState = {
      file,
      url,
      isImage,
      name: file.name,
      size: sizeStr,
    };

    if (type === 'permit') {
      if (permitPreview?.url) URL.revokeObjectURL(permitPreview.url);
      setPermitPreview(previewData);
    } else {
      if (ownershipPreview?.url) URL.revokeObjectURL(ownershipPreview.url);
      setOwnershipPreview(previewData);
    }
  };

  const removeFile = (type: 'permit' | 'ownership') => {
    if (type === 'permit') {
      if (permitPreview?.url) URL.revokeObjectURL(permitPreview.url);
      setPermitPreview(null);
      if (permitInputRef.current) permitInputRef.current.value = '';
    } else {
      if (ownershipPreview?.url) URL.revokeObjectURL(ownershipPreview.url);
      setOwnershipPreview(null);
      if (ownershipInputRef.current) ownershipInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!permitPreview?.file) {
      showToast('Please upload your Mayor’s or Business Permit.', 'error');
      return;
    }

    if (!ownershipPreview?.file) {
      showToast('Please upload your Proof of Ownership or Lease document.', 'error');
      return;
    }

    if (!formData.agreeToTerms) {
      showToast('Please certify the documents and agree to the Privacy Policy & Terms.', 'error');
      return;
    }

    setLoading(true);

    try {
      const applicationData = new FormData();
      applicationData.set('applicant_full_name', formData.applicant_full_name);
      applicationData.set('applicant_email', formData.applicant_email.trim().toLowerCase());
      applicationData.set('business_name', formData.business_name);
      applicationData.set('beach_name', formData.beach_name);
      applicationData.set('beach_location', formData.beach_location);
      applicationData.set('contact_phone', formData.contact_info);
      applicationData.set('agreeToTerms', String(formData.agreeToTerms));
      applicationData.set('business_permit', permitPreview.file);
      applicationData.set('proof_of_ownership', ownershipPreview.file);

      const res = await fetch('/api/applications', {
        method: 'POST',
        body: applicationData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application. Please try again.');
      }

      showToast('Your owner application was submitted successfully! We are reviewing it now.');
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during submission';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Building2 className="w-3.5 h-3.5" />
          <span>Official Resort Partner Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
          Apply as a Beach Owner
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Submit your resort information and official business permits to list your destination on Dagat Ta Bai. Once approved, you will receive your temporary staff PIN via email to access your Owner Dashboard.
        </p>
      </div>

      {/* ── Master 2-Column Bento Layout ─────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {submitted ? (
          /* Success Confirmation Card */
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#121215] p-8 sm:p-12 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-md text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Application Received!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you! Your application for <strong className="text-slate-900 dark:text-white">{formData.beach_name}</strong> has been securely logged with status{' '}
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                  Pending Verification
                </span>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 text-xs text-slate-600 dark:text-slate-400 text-left space-y-3 max-w-lg mx-auto">
              <div className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>What happens next?</span>
              </div>
              <ul className="space-y-2 list-disc pl-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>Our administrative team will review your business permit and ownership documents within <strong>24–48 hours</strong>.</li>
                <li>Upon approval, a 6-digit staff PIN and login instructions will be emailed to <strong className="text-slate-900 dark:text-white">{formData.applicant_email}</strong>.</li>
                <li>You can then log in to the <strong>Owner Portal</strong> to update cottage photos, 360° virtual tours, and live amenity prices.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Return to Homepage
              </Link>
              <Link
                href="/weather"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-full bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all"
              >
                View Live Beach Weather
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── LEFT COLUMN (40% / 5 cols): Integrated Requirements & Guide ── */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Requirements Checklist Card */}
              <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] uppercase tracking-wider mb-1">
                    <FileCheck className="w-4 h-4" />
                    <span>Application Requirements</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    What You Need to Prepare
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Prepare these required items before submitting your application.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      num: '1',
                      title: 'Applicant Information',
                      desc: 'Full legal name, active email address for staff PIN delivery, and a working mobile phone number.',
                      icon: User,
                    },
                    {
                      num: '2',
                      title: 'Resort & Beach Details',
                      desc: 'Official registered business name and location in Barangay Binongkalan, Catmon, Cebu.',
                      icon: MapPin,
                    },
                    {
                      num: '3',
                      title: 'Mayor’s / Business Permit',
                      desc: 'Current municipal business permit (LGU Catmon or provincial) in PDF, PNG, or JPEG format (max 10MB).',
                      icon: FileText,
                    },
                    {
                      num: '4',
                      title: 'Proof of Ownership or Lease',
                      desc: 'Official Land Title, Deed of Absolute Sale, or valid Notarized Lease Contract for the property.',
                      icon: ShieldCheck,
                    },
                  ].map((req, i) => (
                    <div key={i} className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800/80">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {req.num}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{req.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {req.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Timeline & Privacy Card */}
              <div className="bg-[#1F3F74] dark:bg-[#14284b] text-white rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <h4 className="text-sm font-bold tracking-wide uppercase text-blue-100">
                    Verification Timeline
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs text-blue-100/90 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-1.5 flex-shrink-0" />
                    <span><strong>24 to 48 Hours:</strong> Administrative review of submitted permits and tax records.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-1.5 flex-shrink-0" />
                    <span><strong>PIN Dispatch:</strong> A secure 6-digit staff PIN is issued directly to your email upon approval.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-1.5 flex-shrink-0" />
                    <span><strong>Full Listing Control:</strong> Add your cottages, 360° virtual tour, day-use rates, and amenities.</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/15 flex items-center gap-2 text-[11px] text-blue-200/80">
                  <Lock className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                  <span>Encrypted cloud storage with strict Row Level Security (RA 10173 compliant).</span>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN (60% / 7 cols): Application Form ── */}
            <div className="lg:col-span-7 bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSubmit} className="space-y-7">
                
                {/* ── Section 1: Applicant Information ─────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-neutral-800">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#1F3F74] dark:text-[#4987BA] font-extrabold text-xs flex items-center justify-center">
                      1
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Applicant Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Legal Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.applicant_full_name}
                        onChange={(e) => setFormData({ ...formData, applicant_full_name: e.target.value })}
                        placeholder="e.g. Juan Dela Cruz"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Address (For PIN Delivery) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.applicant_email}
                        onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
                        placeholder="owner@resort.com"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Contact Mobile Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contact_info}
                        onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        placeholder="+63 917 123 4567"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Beach Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.beach_location}
                        onChange={(e) => setFormData({ ...formData, beach_location: e.target.value })}
                        placeholder="Barangay, municipality, province"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Beach & Resort Details ────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-neutral-800">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#1F3F74] dark:text-[#4987BA] font-extrabold text-xs flex items-center justify-center">
                      2
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Beach &amp; Resort Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Registered Business Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Registered Business / Corporation Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        placeholder="e.g. Rañola Beach Resort Inc."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      />
                    </div>

                    {/* Beach Display Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Beach / Resort Listing Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.beach_name}
                        onChange={(e) => setFormData({ ...formData, beach_name: e.target.value })}
                        placeholder="e.g. Rañola Beach"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Verification Documents with Live Preview ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#1F3F74] dark:text-[#4987BA] font-extrabold text-xs flex items-center justify-center">
                        3
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Verification Documents
                      </h2>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">PDF, PNG, or JPG (Max 10MB)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Document 1: Mayor's / Business Permit */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Mayor&apos;s / Business Permit <span className="text-red-500">*</span>
                      </label>

                      {permitPreview ? (
                        /* Live Instant Preview Card (No click needed!) */
                        <div className="relative rounded-2xl border-2 border-emerald-400/80 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 flex flex-col justify-between space-y-2.5 transition-all">
                          <button
                            type="button"
                            onClick={() => removeFile('permit')}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shadow-xs transition-colors"
                            title="Remove document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {permitPreview.isImage ? (
                            /* Instant Image Preview */
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 flex items-center justify-center relative">
                              <img
                                src={permitPreview.url}
                                alt="Permit Preview"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                                Image Preview
                              </div>
                            </div>
                          ) : (
                            /* Instant PDF Document Preview */
                            <div className="w-full h-32 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                PDF
                              </div>
                              <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                                {permitPreview.name}
                              </span>
                              <span className="text-[10px] text-slate-400">PDF Document</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                                {permitPreview.name}
                              </div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Attached ({permitPreview.size})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => permitInputRef.current?.click()}
                              className="text-[11px] font-bold text-[#1F3F74] dark:text-sky-300 hover:underline flex-shrink-0"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Empty Upload Dropzone */
                        <div
                          onClick={() => permitInputRef.current?.click()}
                          className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-neutral-700 hover:border-[#1F3F74] dark:hover:border-[#4987BA] p-5 text-center bg-slate-50 dark:bg-neutral-900/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800 dark:text-white">
                              Upload Business Permit
                            </span>
                            <span className="text-[10px] text-slate-400">Click or drag file here</span>
                          </div>
                        </div>
                      )}

                      <input
                        ref={permitInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => handleFileSelection(e.target.files?.[0] || null, 'permit')}
                      />
                    </div>

                    {/* Document 2: Proof of Ownership / Lease */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Proof of Ownership / Lease <span className="text-red-500">*</span>
                      </label>

                      {ownershipPreview ? (
                        /* Live Instant Preview Card (No click needed!) */
                        <div className="relative rounded-2xl border-2 border-emerald-400/80 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 flex flex-col justify-between space-y-2.5 transition-all">
                          <button
                            type="button"
                            onClick={() => removeFile('ownership')}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shadow-xs transition-colors"
                            title="Remove document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {ownershipPreview.isImage ? (
                            /* Instant Image Preview */
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 flex items-center justify-center relative">
                              <img
                                src={ownershipPreview.url}
                                alt="Ownership Proof Preview"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                                Image Preview
                              </div>
                            </div>
                          ) : (
                            /* Instant PDF Document Preview */
                            <div className="w-full h-32 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                PDF
                              </div>
                              <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                                {ownershipPreview.name}
                              </span>
                              <span className="text-[10px] text-slate-400">PDF Document</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                                {ownershipPreview.name}
                              </div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Attached ({ownershipPreview.size})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => ownershipInputRef.current?.click()}
                              className="text-[11px] font-bold text-[#1F3F74] dark:text-sky-300 hover:underline flex-shrink-0"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Empty Upload Dropzone */
                        <div
                          onClick={() => ownershipInputRef.current?.click()}
                          className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-neutral-700 hover:border-[#1F3F74] dark:hover:border-[#4987BA] p-5 text-center bg-slate-50 dark:bg-neutral-900/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800 dark:text-white">
                              Upload Land Title / Lease
                            </span>
                            <span className="text-[10px] text-slate-400">Click or drag file here</span>
                          </div>
                        </div>
                      )}

                      <input
                        ref={ownershipInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => handleFileSelection(e.target.files?.[0] || null, 'ownership')}
                      />
                    </div>

                  </div>
                </div>

                {/* ── Section 4: Data Privacy Act Consent & Certification ── */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-[#1F3F74] border-slate-300 focus:ring-[#1F3F74] cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      I certify under penalty of law that all submitted information and uploaded documents are authentic and legally valid. I have read and agree to the{' '}
                      <Link href="/privacy" target="_blank" className="text-[#1F3F74] dark:text-[#4987BA] font-bold underline hover:opacity-80">
                        Privacy Policy (RA 10173)
                      </Link>{' '}
                      and{' '}
                      <Link href="/terms" target="_blank" className="text-[#1F3F74] dark:text-[#4987BA] font-bold underline hover:opacity-80">
                        Terms of Service
                      </Link>
                      .
                    </span>
                  </label>
                </div>

                {/* ── Submit Button in Dive Blue (#1F3F74) ────── */}
                <button
                  type="submit"
                  disabled={loading || !formData.agreeToTerms}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Submitting Application...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 stroke-[2]" />
                      <span>Submit Owner Application</span>
                    </>
                  )}
                </button>

              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
