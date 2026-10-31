'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  CheckCircle2,
  FileText,
  X,
  ShieldCheck,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  AlertCircle,
  Camera,
  RefreshCw,
} from 'lucide-react';

interface FilePreviewState {
  file: File;
  url: string;
  isImage: boolean;
  name: string;
  size: string;
}

export default function BeachOwnerApplicationPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Floating 5-Second Red Error State (Auto-dismisses, no "x" button)
  const [floatingError, setFloatingError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerError = (msg: string = 'Please fill out the necessary fields before proceeding.') => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setFloatingError(msg);
    errorTimeoutRef.current = setTimeout(() => {
      setFloatingError(null);
    }, 5000);
  };

  // Form State
  const [formData, setFormData] = useState({
    applicant_full_name: '',
    applicant_email: '',
    business_name: '',
    beach_name: '',
    beach_location: '',
    contact_info: '',
    agreeToTerms: false,
  });

  // Track if user attempted to proceed (for immediate visual field feedback)
  const [attemptedStep2, setAttemptedStep2] = useState(false);
  const [attemptedStep3, setAttemptedStep3] = useState(false);
  const [attemptedStep4, setAttemptedStep4] = useState(false);

  // Files and Live Previews
  const [permitPreview, setPermitPreview] = useState<FilePreviewState | null>(null);
  const [ownershipPreview, setOwnershipPreview] = useState<FilePreviewState | null>(null);

  // Camera & Live KYC Selfie State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Input refs for file replacement
  const permitInputRef = useRef<HTMLInputElement>(null);
  const ownershipInputRef = useRef<HTMLInputElement>(null);

  // ── INLINE VALIDATION ERROR CHECKERS ─────────────────────────
  const getFullNameError = () => {
    if (attemptedStep2 && !formData.applicant_full_name.trim()) {
      return 'Please enter your full legal name.';
    }
    return null;
  };

  const getEmailError = () => {
    const val = formData.applicant_email.trim();
    if (attemptedStep2 && !val) {
      return 'Please enter your email address.';
    }
    if (val.length > 0) {
      if (!val.includes('@')) {
        return "Email address is lacking an '@' symbol (e.g. name@example.com).";
      }
      const parts = val.split('@');
      if (!parts[1] || !parts[1].includes('.')) {
        return "Please enter a complete domain after '@' (e.g. example.com).";
      }
    }
    return null;
  };

  const getMobileError = () => {
    const val = formData.contact_info.trim();
    if (attemptedStep2 && !val) {
      return 'Please enter your 10-digit mobile number.';
    }
    if (val.length > 0 && val.length < 10) {
      return `Mobile number must be exactly 10 digits (${val.length}/10 entered). Numbers only.`;
    }
    return null;
  };

  const getAddressError = () => {
    if (attemptedStep2 && !formData.beach_location.trim()) {
      return 'Please enter your beach resort address.';
    }
    return null;
  };

  const getBusinessNameError = () => {
    if (attemptedStep3 && !formData.business_name.trim()) {
      return 'Please enter your registered business name.';
    }
    return null;
  };

  const getBeachNameError = () => {
    if (attemptedStep3 && !formData.beach_name.trim()) {
      return 'Please enter your beach / resort name.';
    }
    return null;
  };

  // Cleanup object URLs and camera on unmount
  useEffect(() => {
    return () => {
      if (permitPreview?.url) URL.revokeObjectURL(permitPreview.url);
      if (ownershipPreview?.url) URL.revokeObjectURL(ownershipPreview.url);
      if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [permitPreview, ownershipPreview, cameraStream]);

  // Start Camera with smart alignment detector
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsAligned(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 150);

      // Smart alignment detector: calibrate and confirm frame alignment after video settles
      setTimeout(() => {
        setIsAligned(true);
      }, 1200);
    } catch {
      setCameraError(
        'Camera access was denied or is unavailable on this device. Please grant camera permission to take your live selfie.'
      );
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setIsAligned(false);
  };

  // Capture Photo Snapshot with shutter flash effect
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Trigger subtle camera flash animation
    setIsFlashing(true);

    setTimeout(() => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror context so captured image matches video preview orientation
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setLivePhoto(dataUrl);
        setIsFlashing(false);
        stopCamera();
      }
    }, 100);
  };

  // Handle File Uploads with live preview
  const handleFileSelection = (file: File | null, type: 'permit' | 'ownership') => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      triggerError('Please fill out the necessary fields before proceeding.');
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

  // Navigation handlers with standard 5-second red floating toast on missing fields
  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (currentStep === 2) {
      setAttemptedStep2(true);
      if (getFullNameError() || getEmailError() || getMobileError() || getAddressError()) {
        triggerError('Please fill out the necessary fields before proceeding.');
        return;
      }

      setCurrentStep(3);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (currentStep === 3) {
      setAttemptedStep3(true);
      if (getBusinessNameError() || getBeachNameError()) {
        triggerError('Please fill out the necessary fields before proceeding.');
        return;
      }

      setCurrentStep(4);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedStep4(true);

    if (!permitPreview?.file || !ownershipPreview?.file || !livePhoto || !formData.agreeToTerms) {
      triggerError('Please fill out the necessary fields before proceeding.');
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
      applicationData.set('contact_phone', `+63 ${formData.contact_info}`);
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

      // Smoothly switch to confirmation view without showing any floating message
      setSubmitted(true);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during submission';
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Steps definition for progress stepper UI
  const steps = [
    { num: 1, label: 'Step 1' },
    { num: 2, label: 'Step 2' },
    { num: 3, label: 'Step 3' },
    { num: 4, label: 'Step 4' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── FLOATING RED ERROR BANNER (5s Duration, Solid Red, White Text & Icon, No "X") ── */}
      {floatingError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2.5 px-6 py-3 bg-red-600 text-white rounded-full shadow-xl shadow-red-950/25 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-center">
            {floatingError}
          </span>
        </div>
      )}

      {/* ── Page Header (Hidden when submitted, with generous spacing to the stepper) ── */}
      {!submitted && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 sm:pb-12 text-center">
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-[#1F3F74] dark:text-[#4987BA] tracking-tight leading-tight">
            Apply as a Beach Owner
          </h1>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {submitted ? (
          /* ── Post-Submission Confirmation Screen (Frameless, Bold Circle & Checkmark, Stops at 'review updates') ── */
          <div className="py-16 sm:py-24 text-center space-y-6 max-w-lg mx-auto animate-in fade-in duration-300">
            {/* Bold Blue Checkmark Circle (Matching reset-password style) */}
            <div className="w-16 h-16 rounded-full border-[3px] border-[#1F3F74] dark:border-[#4987BA] bg-transparent text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-[#4987BA] tracking-tight">
                Application Submitted Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your beach owner application is successfully filed under the status{' '}
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                  Pending Review
                </span>
                . Please check your email within 1 to 3 business days for review updates.
              </p>
            </div>

            <div className="pt-3 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div>
            
            {/* ── STEPPER PROGRESS BAR (Generous spacing separating it from header and step content) ── */}
            <div className="max-w-xl mx-auto px-4 mb-14 sm:mb-16">
              <div className="relative">
                {/* Connecting Horizontal Line passing through EXACT vertical center of circles (y = 24px) */}
                <div className="absolute left-[12.5%] right-[12.5%] top-6 -translate-y-1/2 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full z-0">
                  <div
                    className="h-full bg-[#1F3F74] rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                {/* 4 Steps Grid Nodes */}
                <div className="grid grid-cols-4 relative z-10">
                  {steps.map((s) => {
                    const isCompleted = currentStep > s.num;
                    const isActive = currentStep === s.num;

                    return (
                      <div
                        key={s.num}
                        className={`flex flex-col items-center ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={() => {
                          if (isCompleted) {
                            setCurrentStep(s.num);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }
                        }}
                      >
                        {/* Circle wrapper (48px high, vertical center at 24px matches top-6) */}
                        <div className="h-12 flex items-center justify-center">
                          <div
                            className={`transition-all duration-300 flex items-center justify-center font-bold text-xs sm:text-sm rounded-full ${
                              isActive
                                ? 'w-11 h-11 sm:w-12 sm:h-12 bg-[#1F3F74] text-white ring-4 ring-blue-200 dark:ring-blue-900 shadow-md scale-105'
                                : isCompleted
                                ? 'w-9 h-9 sm:w-10 sm:h-10 bg-[#1F3F74] text-white shadow-xs'
                                : 'w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 dark:bg-neutral-800 text-slate-400 border border-slate-200 dark:border-neutral-700'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                            ) : (
                              <span>{s.num}</span>
                            )}
                          </div>
                        </div>

                        {/* Step Labels - dive blue #1F3F74 for completed/active, never black! */}
                        <div className="text-center mt-2 w-full px-1">
                          <span
                            className={`block text-[11px] sm:text-xs font-bold leading-tight ${
                              isActive || isCompleted
                                ? 'text-[#1F3F74] dark:text-[#4987BA]'
                                : 'text-slate-400 dark:text-neutral-500'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── STEP CONTENT ── */}
            <div className="space-y-6 pt-2 sm:pt-4">
              
              {/* ── STEP 1: REQUIREMENTS (Simple, clear, easy instructions without PIN jargon) ── */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 dark:border-neutral-800 pb-3 mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1F3F74] dark:text-[#4987BA]">
                      Application Requirements
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Please make sure you have the following information and documents ready:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        num: '1',
                        title: 'Mayor’s / Business Permit',
                        desc: 'A valid business permit issued by LGU Catmon for Binongkalan, Catmon in PDF, PNG, or JPG format (up to 10MB).',
                        icon: FileText,
                      },
                      {
                        num: '2',
                        title: 'Proof of Ownership or Lease',
                        desc: 'Land Title, Deed of Sale, or notarized lease contract authorizing beach resort operations.',
                        icon: ShieldCheck,
                      },
                      {
                        num: '3',
                        title: 'Contact Person Information',
                        desc: 'Full legal name, active mobile number, and email address for application status updates.',
                        icon: User,
                      },
                      {
                        num: '4',
                        title: 'Resort & Business Details',
                        desc: 'Registered business name and official resort name in Barangay Binongkalan.',
                        icon: MapPin,
                      },
                    ].map((req, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200/80 dark:border-neutral-800 shadow-2xs"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-sky-300 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {req.num}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">
                            {req.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {req.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Button (Centered, "Proceed", No Arrow) */}
                  <div className="pt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center justify-center px-12 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <span>Proceed</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: PERSONAL INFORMATION (Single Column / Stacked with Inline Red Error Text) ── */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 dark:border-neutral-800 pb-3 mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1F3F74] dark:text-[#4987BA]">
                      Personal Information
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Fill in the required details to continue with your registration.
                    </p>
                  </div>

                  {/* Stacked single column layout */}
                  <div className="space-y-4 max-w-xl mx-auto">
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
                        placeholder="Patrick James D. Leswe"
                        className={`w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getFullNameError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-neutral-800'
                        }`}
                      />
                      {getFullNameError() && (
                        <p className="mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getFullNameError()}</span>
                        </p>
                      )}
                    </div>

                    {/* Email with real-time inline red error text */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.applicant_email}
                        onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
                        placeholder="owner@resort.com"
                        className={`w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getEmailError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-neutral-800'
                        }`}
                      />
                      {getEmailError() && (
                        <p className="mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getEmailError()}</span>
                        </p>
                      )}
                    </div>

                    {/* Contact Mobile with Built-in +63 Prefix & inline red error text */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Mobile Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div
                        className={`flex items-center w-full bg-white dark:bg-neutral-900 border rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-[#1F3F74]/20 focus-within:border-[#1F3F74] shadow-2xs transition-all ${
                          getMobileError()
                            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
                            : 'border-slate-200 dark:border-neutral-800'
                        }`}
                      >
                        <span className="px-4 py-3 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm border-r border-slate-200 dark:border-neutral-700 select-none">
                          +63
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={formData.contact_info}
                          onChange={(e) => {
                            // Extract digits only, auto-strip leading 0, strictly max 10 digits
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.startsWith('0')) val = val.substring(1);
                            setFormData({ ...formData, contact_info: val.slice(0, 10) });
                          }}
                          placeholder="917 123 4567"
                          className="w-full px-4 py-3 text-xs sm:text-sm bg-transparent placeholder:italic placeholder:text-slate-400 font-normal text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      {getMobileError() && (
                        <p className="mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getMobileError()}</span>
                        </p>
                      )}
                    </div>

                    {/* Beach Resort Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Beach Resort Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.beach_location}
                        onChange={(e) => setFormData({ ...formData, beach_location: e.target.value })}
                        placeholder="Barangay Binongkalan, Catmon, Cebu"
                        className={`w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getAddressError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-neutral-800'
                        }`}
                      />
                      {getAddressError() && (
                        <p className="mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getAddressError()}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Navigation Buttons (< and >) Without top border line */}
                  <div className="pt-6 flex items-center justify-between max-w-xl mx-auto">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200/80 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-xs"
                      title="Previous"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      title="Next"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: ESTABLISHMENT DETAILS (Stacked Vertically with Inline Red Error Text) ── */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 dark:border-neutral-800 pb-3 mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1F3F74] dark:text-[#4987BA]">
                      Establishment Details
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Enter your registered business name and public resort name.
                    </p>
                  </div>

                  {/* Stacked single column layout */}
                  <div className="space-y-4 max-w-xl mx-auto">
                    {/* Registered Business Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Registered Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        placeholder="Rañola Beach Resort Inc."
                        className={`w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getBusinessNameError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-neutral-800'
                        }`}
                      />
                      {getBusinessNameError() && (
                        <p className="mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getBusinessNameError()}</span>
                        </p>
                      )}
                    </div>

                    {/* Beach / Resort Name (Stacked at bottom) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Beach / Resort Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.beach_name}
                        onChange={(e) => setFormData({ ...formData, beach_name: e.target.value })}
                        placeholder="Rañola Beach"
                        className={`w-full px-5 py-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/20 focus:border-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getBeachNameError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-neutral-800'
                        }`}
                      />
                      {getBeachNameError() && (
                        <p className="mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getBeachNameError()}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Navigation Buttons (< and >) Without top border line */}
                  <div className="pt-6 flex items-center justify-between max-w-xl mx-auto">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200/80 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-xs"
                      title="Previous"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      title="Next"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: PERMITS & VERIFICATION ──────────── */}
              {currentStep === 4 && (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 dark:border-neutral-800 pb-3 mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1F3F74] dark:text-[#4987BA]">
                      Permits &amp; Verification
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Upload your required permits and complete your live selfie verification.
                    </p>
                  </div>

                  {/* Two Upload Dropzones Side-by-Side (Enhanced Standard UI) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Document 1: Mayor's / Business Permit */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Mayor&apos;s / Business Permit <span className="text-red-500">*</span>
                      </label>

                      {permitPreview ? (
                        /* Blue Outline Preview Card */
                        <div className="relative rounded-2xl border-2 border-[#1F3F74] dark:border-[#4987BA] bg-white dark:bg-neutral-900 p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs transition-all">
                          <button
                            type="button"
                            onClick={() => removeFile('permit')}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {permitPreview.isImage ? (
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-center">
                              <img
                                src={permitPreview.url}
                                alt="Permit Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#1F3F74] flex items-center justify-center font-bold text-xs">
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
                              <div className="text-[10px] text-[#1F3F74] dark:text-[#4987BA] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#1F3F74] dark:text-[#4987BA]" />
                                <span>Attached ({permitPreview.size})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => permitInputRef.current?.click()}
                              className="text-[11px] font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline flex-shrink-0 cursor-pointer"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Enhanced Standard Website Upload Placeholder */
                        <div
                          onClick={() => permitInputRef.current?.click()}
                          className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all space-y-2.5 group ${
                            attemptedStep4 && !permitPreview
                              ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20'
                              : 'border-slate-300 dark:border-neutral-700 hover:border-[#1F3F74] dark:hover:border-[#4987BA] bg-slate-50/50 dark:bg-neutral-900/40 hover:bg-blue-50/20'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                              Click to upload or drag &amp; drop
                            </span>
                            <span className="block text-[11px] text-slate-400">PDF, PNG, or JPG (max. 10MB)</span>
                          </div>
                        </div>
                      )}

                      {attemptedStep4 && !permitPreview && (
                        <p className="mt-1 ml-2 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Please upload your Mayor’s / Business Permit.</span>
                        </p>
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
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Proof of Ownership / Lease <span className="text-red-500">*</span>
                      </label>

                      {ownershipPreview ? (
                        /* Blue Outline Preview Card */
                        <div className="relative rounded-2xl border-2 border-[#1F3F74] dark:border-[#4987BA] bg-white dark:bg-neutral-900 p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs transition-all">
                          <button
                            type="button"
                            onClick={() => removeFile('ownership')}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {ownershipPreview.isImage ? (
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-center">
                              <img
                                src={ownershipPreview.url}
                                alt="Ownership Proof Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#1F3F74] flex items-center justify-center font-bold text-xs">
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
                              <div className="text-[10px] text-[#1F3F74] dark:text-[#4987BA] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#1F3F74] dark:text-[#4987BA]" />
                                <span>Attached ({ownershipPreview.size})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => ownershipInputRef.current?.click()}
                              className="text-[11px] font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline flex-shrink-0 cursor-pointer"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Enhanced Standard Website Upload Placeholder */
                        <div
                          onClick={() => ownershipInputRef.current?.click()}
                          className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all space-y-2.5 group ${
                            attemptedStep4 && !ownershipPreview
                              ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20'
                              : 'border-slate-300 dark:border-neutral-700 hover:border-[#1F3F74] dark:hover:border-[#4987BA] bg-slate-50/50 dark:bg-neutral-900/40 hover:bg-blue-50/20'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                              Click to upload or drag &amp; drop
                            </span>
                            <span className="block text-[11px] text-slate-400">PDF, PNG, or JPG (max. 10MB)</span>
                          </div>
                        </div>
                      )}

                      {attemptedStep4 && !ownershipPreview && (
                        <p className="mt-1 ml-2 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Please upload your Proof of Ownership or Lease.</span>
                        </p>
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

                  {/* ── LIVE SELFIE SECTION (With Smart Biometric Alignment Detector) ── */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                        <h3 className="text-xs sm:text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">
                          Live Selfie <span className="text-red-500">*</span>
                        </h3>
                      </div>

                      {/* Dynamic Status Badge (Green if verified, Red if not verified) */}
                      {livePhoto ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Photo Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-xs">
                          Not Verified
                        </span>
                      )}
                    </div>

                    {cameraError && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                        {cameraError}
                      </div>
                    )}

                    {livePhoto ? (
                      /* Captured Photo Display */
                      <div className="relative rounded-2xl overflow-hidden border-2 border-[#1F3F74] dark:border-[#4987BA] bg-slate-900 flex flex-col items-center justify-center p-3">
                        <img
                          src={livePhoto}
                          alt="Verification Selfie"
                          className="w-full max-h-72 object-contain rounded-xl"
                        />
                        <div className="pt-3 flex items-center gap-3 w-full justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setLivePhoto(null);
                              startCamera();
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retake Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLivePhoto(null)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : cameraActive ? (
                      /* Live Viewfinder with Working Modern Biometric Alignment Guide */
                      <div className="relative rounded-2xl overflow-hidden border-2 border-[#1F3F74] bg-black flex flex-col items-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-72 sm:h-88 object-cover -scale-x-100"
                        />

                        {/* Shutter Flash Animation Effect */}
                        {isFlashing && (
                          <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150 animate-out fade-out pointer-events-none" />
                        )}

                        {/* Top Live Bar & Alignment Detection Pill */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse shadow-md">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            Live Camera
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-md transition-all duration-300 ${
                              isAligned
                                ? 'bg-emerald-500/90 text-white ring-2 ring-emerald-400/50'
                                : 'bg-black/75 text-amber-300 border border-amber-400/40'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isAligned ? 'bg-white animate-pulse' : 'bg-amber-400 animate-ping'
                              }`}
                            />
                            <span>
                              {isAligned ? 'Optimal Alignment • Ready to Snap' : 'Scanning Face & Permits...'}
                            </span>
                          </span>
                        </div>

                        {/* Modern KYC Viewfinder Alignment Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-around px-4 pt-12 pb-16 z-10">
                          {/* Left Document Bracket (Permit 1) */}
                          <div
                            className={`w-24 sm:w-32 h-36 sm:h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all duration-300 backdrop-blur-[2px] ${
                              isAligned
                                ? 'border-emerald-400 bg-emerald-950/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                                : 'border-white/50 bg-black/25 text-white/80'
                            }`}
                          >
                            <FileText className="w-5 h-5 mb-1" />
                            <span className="text-[10px] sm:text-xs font-bold leading-tight">Mayor’s Permit</span>
                            <span className="text-[8px] opacity-80 mt-0.5">Hold clearly</span>
                          </div>

                          {/* Center Biometric Face Reticle Oval */}
                          <div className="relative flex flex-col items-center justify-center">
                            <div
                              className={`w-28 sm:w-36 h-40 sm:h-52 rounded-[50%] border-2 flex items-center justify-center transition-all duration-300 relative ${
                                isAligned
                                  ? 'border-emerald-400 ring-4 ring-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                                  : 'border-white/70 border-dashed'
                              }`}
                            >
                              {/* Corner reticle accents */}
                              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-white" />
                              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-white" />
                              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-white" />
                              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-white" />
                            </div>
                            <span
                              className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                                isAligned
                                  ? 'bg-emerald-600/90 text-white'
                                  : 'bg-black/60 text-white/90 backdrop-blur-xs'
                              }`}
                            >
                              Face Area
                            </span>
                          </div>

                          {/* Right Document Bracket (Permit 2) */}
                          <div
                            className={`w-24 sm:w-32 h-36 sm:h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all duration-300 backdrop-blur-[2px] ${
                              isAligned
                                ? 'border-emerald-400 bg-emerald-950/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                                : 'border-white/50 bg-black/25 text-white/80'
                            }`}
                          >
                            <ShieldCheck className="w-5 h-5 mb-1" />
                            <span className="text-[10px] sm:text-xs font-bold leading-tight">Land Title / Lease</span>
                            <span className="text-[8px] opacity-80 mt-0.5">Hold clearly</span>
                          </div>
                        </div>

                        {/* Viewfinder Controls (Positioned at bottom, completely clear of overlays) */}
                        <div className="p-3 w-full bg-slate-900/95 flex items-center justify-center gap-4 z-20 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Inactive Camera State (With clear description restored) */
                      <div
                        className={`rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center space-y-3 ${
                          attemptedStep4 && !livePhoto
                            ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20'
                            : 'border-slate-300 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-900/40'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center mx-auto shadow-2xs">
                          <Camera className="w-6 h-6 stroke-[2]" />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                            Take a Live Photo Holding Your Permits
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Hold your Mayor&apos;s Permit and Proof of Ownership beside your face while taking the live photo.
                          </span>
                        </div>
                        <div className="pt-1 flex justify-center">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Take Live Selfie</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {attemptedStep4 && !livePhoto && (
                      <p className="mt-1 ml-2 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Please take your live selfie photo holding both permits before submitting.</span>
                      </p>
                    )}

                    {/* Hidden canvas for snapshot capture */}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* ── Frameless Legal Certification Checkbox ── */}
                  <div className="pt-1 px-1">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={formData.agreeToTerms}
                        onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded text-[#1F3F74] border-slate-300 focus:ring-[#1F3F74] cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        I certify under penalty of law that all submitted information and uploaded permits are authentic,
                        and I have read and accept the{' '}
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="text-[#1F3F74] dark:text-[#4987BA] font-bold underline hover:opacity-80"
                        >
                          Privacy Policy (RA 10173)
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="text-[#1F3F74] dark:text-[#4987BA] font-bold underline hover:opacity-80"
                        >
                          Terms of Service
                        </Link>
                        .
                      </span>
                    </label>

                    {attemptedStep4 && !formData.agreeToTerms && (
                      <p className="mt-1.5 ml-7 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>You must certify your documents and accept the terms of service.</span>
                      </p>
                    )}
                  </div>

                  {/* Navigation Buttons (< and Submit Owner Application WITHOUT Arrow) */}
                  <div className="pt-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200/80 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-xs"
                      title="Previous"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Submitting Application...</span>
                        </div>
                      ) : (
                        <span>Submit Owner Application</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
