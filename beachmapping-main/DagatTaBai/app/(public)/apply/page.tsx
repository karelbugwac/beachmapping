'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import LiveVerification from '@/components/applications/verification';
import IdCapture, { type IdCaptureHandle } from '@/components/applications/idcapture';
import { prepareImageForUpload } from '@/lib/utils/image-compression';
import { formatImageSize } from '@/lib/utils/image-upload-config';
import { detectImageMime, validateImageFile } from '@/lib/utils/image-validation';
import { BEACH_ADDRESS_MESSAGES, DEFAULT_BEACH_ADDRESS } from '@/lib/constants/location';
import { validateBeachAddress } from '@/lib/validation/beachAddress';
import {
  FULL_NAME_MESSAGES,
  validateFullName,
} from '@/lib/validation/fullName';
import { useAuthSession } from '@/lib/client/session';
import {
  getAccountApplicationName,
  getApplicationNamePrefill,
} from '@/lib/utils/application-name-prefill';
import { PENDING_APPLICATION_MESSAGE } from '@/lib/validation/application-submission';
import { notifyRealtimeSync } from '@/lib/realtime-sync';

interface FilePreviewState {
  file: File;
  url: string;
  isImage: boolean;
  name: string;
  size: string;
  compressionSummary?: string;
}

export default function BeachOwnerApplicationPage() {
  const router = useRouter();
  const authSession = useAuthSession();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(false);
  const [pendingApplicationCheck, setPendingApplicationCheck] = useState<'checking' | 'done' | 'error'>('checking');
  const [pendingEmailError, setPendingEmailError] = useState<string | null>(null);

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
    applicantfullname: '',
    applicantemail: '',
    businessname: '',
    beachname: '',
    beachlocation: DEFAULT_BEACH_ADDRESS,
    contact_info: '',
    agreeToTerms: false,
  });
  const hasSavedDraft = Boolean(
    formData.applicantfullname ||
    formData.applicantemail ||
    formData.businessname ||
    formData.beachname ||
    formData.contact_info
  );

  // Track if user attempted to proceed (for immediate visual field feedback)
  const [attemptedStep2, setAttemptedStep2] = useState(false);
  const [attemptedStep3, setAttemptedStep3] = useState(false);
  const [attemptedStep4, setAttemptedStep4] = useState(false);
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [fullNameInputError, setFullNameInputError] = useState<string | null>(null);
  const [addressTouched, setAddressTouched] = useState(false);
  const nameWasEditedRef = useRef(false);
  const formWasEditedRef = useRef(false);
  const [draftReadyFor, setDraftReadyFor] = useState('');
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [revisionVersion, setRevisionVersion] = useState<string | null>(null);
  const [applicationLoadError, setApplicationLoadError] = useState('');
  const draftKey = authSession.loaded
    ? `owner-application-draft:${authSession.user?.id || 'anonymous'}`
    : '';
  const accountName = getAccountApplicationName({
    profileName: authSession.user?.account_full_name,
  });

  // Files and Live Previews
  const [permitPreview, setPermitPreview] = useState<FilePreviewState | null>(null);
  const [ownershipPreview, setOwnershipPreview] = useState<FilePreviewState | null>(null);
  const [idPreview, setIdPreview] = useState<FilePreviewState | null>(null);

  const [livenessNonce, setLivenessNonce] = useState<string | null>(null);

  // Input refs for file replacement
  const permitInputRef = useRef<HTMLInputElement>(null);
  const ownershipInputRef = useRef<HTMLInputElement>(null);
  const idCaptureRef = useRef<IdCaptureHandle>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const addressDefaultFocusHandledRef = useRef(false);

  useEffect(() => {
    if (!authSession.loaded) return;
    const draftKey = `owner-application-draft:${authSession.user?.id || 'anonymous'}`;
    let active = true;
    const applicationId = new URLSearchParams(window.location.search).get('applicationId');
    if (applicationId) {
      if (!authSession.user?.id) {
        void Promise.resolve().then(() => {
          if (active) setApplicationLoadError('Sign in to continue your application.');
        });
        return () => { active = false; };
      }
      fetch(`/api/applications/status?edit=true&applicationId=${encodeURIComponent(applicationId)}`, { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Could not load your application.');
          if (!active || !data.application) return;
          const application = data.application;
          setFormData((current) => ({
            ...current,
            applicantfullname: application.applicantfullname || '',
            applicantemail: application.applicantemail || '',
            businessname: application.businessname || '',
            beachname: application.beachname || '',
            beachlocation: application.beachlocation || DEFAULT_BEACH_ADDRESS,
            contact_info: String(application.contactphone || '').replace(/^\+?63\s*/, '').replace(/\D/g, '').slice(-10),
            agreeToTerms: false,
          }));
          setRevisionId(application.id);
          setRevisionVersion(application.statusupdatedat);
          setCurrentStep(2);
          nameWasEditedRef.current = true;
          setDraftReadyFor(draftKey);
        })
        .catch((error: unknown) => {
          if (active) setApplicationLoadError(error instanceof Error ? error.message : 'Could not load your application.');
        });
      return () => { active = false; };
    }

    let restoredDraft = false;
    try {
      const saved = window.localStorage.getItem(draftKey);
      if (saved && !formWasEditedRef.current) {
        const draft = JSON.parse(saved) as {
          formData?: Partial<typeof formData>;
          currentStep?: number;
        };
        if (draft.formData) {
          restoredDraft = true;
          void Promise.resolve().then(() => {
            if (!active) return;
            setFormData((current) => ({ ...current, ...draft.formData }));
            if (typeof draft.currentStep === 'number' && draft.currentStep >= 1 && draft.currentStep <= 4) {
              setCurrentStep(draft.currentStep);
            }
            setDraftReadyFor(draftKey);
          });
        }
      }
    } catch (error) {
      console.error('Could not restore the owner application draft:', error);
    }

    if (restoredDraft) {
      return () => { active = false; };
    }

    if (!nameWasEditedRef.current) {
      const prefilledName = getApplicationNamePrefill({
        profileName: authSession.user?.account_full_name,
        currentValue: '',
        dirty: nameWasEditedRef.current,
        hasSavedDraft: false,
      });
      if (prefilledName) {
        void Promise.resolve().then(() => {
          if (!active) return;
          setFormData((current) => ({ ...current, applicantfullname: prefilledName }));
          setDraftReadyFor(draftKey);
        });
        return () => { active = false; };
      }
    }
    void Promise.resolve().then(() => {
      if (active) setDraftReadyFor(draftKey);
    });
    return () => { active = false; };
  }, [authSession.loaded, authSession.user?.id, authSession.user?.account_full_name]);

  useEffect(() => {
    if (!authSession.loaded) return;
    let active = true;
    const applicationId = new URLSearchParams(window.location.search).get('applicationId');
    if (!authSession.user?.id || applicationId) {
      void Promise.resolve().then(() => {
        if (active) setPendingApplicationCheck('done');
      });
      return () => { active = false; };
    }

    void Promise.resolve().then(async () => {
      if (!active) return;
      setPendingApplication(false);
      setPendingApplicationCheck('checking');
      try {
        const response = await fetch('/api/applications/status?pending=true', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not check your application status.');
        if (active) setPendingApplication(Boolean(data.application));
      } catch (error: unknown) {
        console.error('Could not check for a pending owner application:', error);
        if (active) setPendingApplicationCheck('error');
      } finally {
        if (active) setPendingApplicationCheck((current) => current === 'checking' ? 'done' : current);
      }
    });
    return () => { active = false; };
  }, [authSession.loaded, authSession.user?.id]);

  useEffect(() => {
    if (!authSession.loaded || !draftKey || draftReadyFor !== draftKey) return;
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ formData, currentStep }));
    } catch (error) {
      console.error('Could not save the owner application draft:', error);
    }
  }, [authSession.loaded, draftKey, draftReadyFor, formData, currentStep]);

  // ── STEP VALIDATION HELPERS ──────────────────────────────────
  const isStep2Valid = () => {
    const nameValid = validateFullName(formData.applicantfullname).ok && !fullNameInputError;
    const emailVal = formData.applicantemail.trim();
    const mobileVal = formData.contact_info.trim();
    const addressValid = validateBeachAddress(formData.beachlocation).ok;

    if (!nameValid) return false;
    if (!emailVal || !emailVal.includes('@')) return false;
    const emailParts = emailVal.split('@');
    if (!emailParts[1] || !emailParts[1].includes('.')) return false;
    if (!mobileVal || mobileVal.length !== 10) return false;
    if (!addressValid) return false;

    return true;
  };

  const isStep3Valid = () => {
    const businessVal = formData.businessname.trim();
    const beachVal = formData.beachname.trim();
    return Boolean(businessVal && beachVal);
  };

  // ── INLINE VALIDATION ERROR CHECKERS ─────────────────────────
  const getFullNameError = () => {
    return fullNameInputError || (
      attemptedStep2 || fullNameTouched
        ? validateFullName(formData.applicantfullname).error
        : null
    );
  };

  const getEmailError = () => {
    if (pendingEmailError) return pendingEmailError;
    const val = formData.applicantemail.trim();
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
    if (!attemptedStep2 && !addressTouched) return null;
    return validateBeachAddress(formData.beachlocation).error;
  };

  const addressValidation = validateBeachAddress(formData.beachlocation);
  const addressWarning = addressValidation.ok ? addressValidation.warning : null;

  const getBusinessNameError = () => {
    if (attemptedStep3 && !formData.businessname.trim()) {
      return 'Please enter your registered business name.';
    }
    return null;
  };

  const getBeachNameError = () => {
    if (attemptedStep3 && !formData.beachname.trim()) {
      return 'Please enter your beach / resort name.';
    }
    return null;
  };

  // Cleanup object URLs and camera on unmount
  useEffect(() => {
    return () => {
      if (permitPreview?.url) URL.revokeObjectURL(permitPreview.url);
      if (ownershipPreview?.url) URL.revokeObjectURL(ownershipPreview.url);
      if (idPreview?.url) URL.revokeObjectURL(idPreview.url);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [permitPreview, ownershipPreview, idPreview]);

  // Handle File Uploads with live preview
  const handleFileSelection = async (file: File | null, type: 'permit' | 'ownership' | 'id') => {
    if (!file) return;

    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      triggerError('Each document must be smaller than 10 MB.');
      return;
    }

    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isPdf = file.type === 'application/pdf' &&
      new TextDecoder().decode(header.subarray(0, 5)) === '%PDF-';
    const isImage = detectImageMime(header) !== null;
    if (!isPdf && !isImage) {
      triggerError('Documents must be PDF, JPG, PNG, or WebP files.');
      return;
    }
    if (isImage) {
      try {
        await validateImageFile(file, 'resort');
      } catch (error: unknown) {
        triggerError(error instanceof Error ? error.message : 'Only JPG, PNG, or WebP files are allowed.');
        return;
      }
    }

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
    } else if (type === 'ownership') {
      if (ownershipPreview?.url) URL.revokeObjectURL(ownershipPreview.url);
      setOwnershipPreview(previewData);
    } else {
      if (idPreview?.url) URL.revokeObjectURL(idPreview.url);
      setIdPreview(previewData);
    }
  };

  const removeFile = (type: 'permit' | 'ownership' | 'id') => {
    if (type === 'permit') {
      if (permitPreview?.url) URL.revokeObjectURL(permitPreview.url);
      setPermitPreview(null);
      if (permitInputRef.current) permitInputRef.current.value = '';
    } else if (type === 'ownership') {
      if (ownershipPreview?.url) URL.revokeObjectURL(ownershipPreview.url);
      setOwnershipPreview(null);
      if (ownershipInputRef.current) ownershipInputRef.current.value = '';
    } else {
      if (idPreview?.url) URL.revokeObjectURL(idPreview.url);
      setIdPreview(null);
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
      if (!isStep2Valid()) {
        triggerError('Please fill out the necessary fields before proceeding.');
        return;
      }

      setCurrentStep(3);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (currentStep === 3) {
      setAttemptedStep3(true);
      if (!isStep3Valid()) {
        triggerError('Please fill out the necessary fields before proceeding.');
        return;
      }

      setCurrentStep(4);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 4) setLivenessNonce(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingApplication) {
      triggerError(PENDING_APPLICATION_MESSAGE);
      return;
    }
    if (pendingApplicationCheck === 'checking') {
      triggerError('Please wait while we check your application status.');
      return;
    }
    setAttemptedStep4(true);
    setAttemptedStep2(true);

    const nameValidation = validateFullName(formData.applicantfullname);
    if (!fullNameInputError) setFullNameInputError(nameValidation.error);
    if (!nameValidation.ok || fullNameInputError) {
      triggerError(fullNameInputError || nameValidation.error || FULL_NAME_MESSAGES.required);
      return;
    }

    const addressValidation = validateBeachAddress(formData.beachlocation);
    if (!addressValidation.ok) {
      setAddressTouched(true);
      setCurrentStep(2);
      triggerError(addressValidation.error);
      return;
    }

    if (!permitPreview?.file || !ownershipPreview?.file || !idPreview?.file || !livenessNonce || !formData.agreeToTerms) {
      triggerError('Please fill out the necessary fields before proceeding.');
      return;
    }

    setLoading(true);

    try {
      const applicationData = new FormData();
      applicationData.set('applicantfullname', nameValidation.value);
      applicationData.set('applicantemail', formData.applicantemail.trim().toLowerCase());
      applicationData.set('businessname', formData.businessname);
      applicationData.set('beachname', formData.beachname);
      applicationData.set('beachlocation', addressValidation.value);
      applicationData.set('contactphone', `+63 ${formData.contact_info}`);
      applicationData.set('agreeToTerms', String(formData.agreeToTerms));
      applicationData.set('liveness_nonce', livenessNonce);
      if (revisionId && revisionVersion) {
        applicationData.set('applicationid', revisionId);
        applicationData.set('expected_status_updated_at', revisionVersion);
      }
      const prepareDocument = async (
        preview: FilePreviewState,
        setPreview: React.Dispatch<React.SetStateAction<FilePreviewState | null>>
      ) => {
        if (!preview.isImage || preview.compressionSummary) return preview.file;
        const prepared = await prepareImageForUpload(preview.file, 'resort');
        setPreview((current) => current ? {
          ...current,
          file: prepared.file,
          compressionSummary: `${formatImageSize(prepared.originalSize)} → ${formatImageSize(prepared.compressedSize)}`,
        } : null);
        return prepared.file;
      };
      const [permitFile, ownershipFile, idFile] = await Promise.all([
        prepareDocument(permitPreview, setPermitPreview),
        prepareDocument(ownershipPreview, setOwnershipPreview),
        prepareDocument(idPreview, setIdPreview),
      ]);
      applicationData.set('business_permit', permitFile);
      applicationData.set('proof_of_ownership', ownershipFile);
      applicationData.set('valid_id', idFile);

      const res = await fetch('/api/applications', {
        method: 'POST',
        body: applicationData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.error === PENDING_APPLICATION_MESSAGE) {
          setPendingEmailError(PENDING_APPLICATION_MESSAGE);
          setCurrentStep(2);
          setAttemptedStep2(true);
          window.scrollTo({ top: 120, behavior: 'smooth' });
          return;
        }
        throw new Error(data.error || 'Failed to submit application. Please try again.');
      }

      // Smoothly switch to confirmation view without showing any floating message
      notifyRealtimeSync('applications');
      if (authSession.user) {
        const draftKey = `owner-application-draft:${authSession.user.id}`;
        window.localStorage.removeItem(draftKey);
        router.push('/apply/status');
        return;
      }
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
    <div
      className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200"
      onChangeCapture={() => { formWasEditedRef.current = true; }}
    >
      
      {/* ── FLOATING RED ERROR BANNER (5s Duration, Solid Red, White Text & Icon, No "X") ── */}
      {floatingError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2.5 px-6 py-3 bg-red-600 text-white rounded-full shadow-xl shadow-red-950/25 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          <span className="font-display text-[11px] sm:text-xs font-semibold tracking-wide text-center">
            {floatingError}
          </span>
        </div>
      )}

      {/* ── Page Header (Hidden when submitted, with generous spacing to the stepper) ── */}
      {!submitted && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 sm:pb-12 text-center">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-brand-navy-500 dark:text-brand-teal-300 tracking-tight leading-tight">
            Apply as a Beach Owner
          </h1>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {applicationLoadError && (
          <div className="font-display mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300" role="alert">
            {applicationLoadError}
          </div>
        )}
        {pendingApplication && (
          <div className="font-display mb-6 rounded-2xl border border-brand-teal-200 bg-brand-teal-50 px-5 py-4 text-sm text-brand-teal-900 dark:border-brand-teal-800 dark:bg-brand-teal-950/30 dark:text-brand-teal-100" role="status">
            <p>{PENDING_APPLICATION_MESSAGE}</p>
            <Link href="/apply/status" className="font-display mt-2 inline-flex font-semibold underline underline-offset-2">
              View your application status
            </Link>
          </div>
        )}
        {submitted ? (
          /* ── Post-Submission Confirmation Screen (Frameless, Bold Circle & Checkmark, Stops at 'review updates') ── */
          <div className="py-16 sm:py-24 text-center space-y-6 max-w-lg mx-auto animate-in fade-in duration-300">
            {/* Bold Blue Checkmark Circle (Matching reset-password style) */}
            <div className="w-16 h-16 rounded-full border-[3px] border-brand-navy-500 dark:border-brand-teal-600 bg-transparent text-brand-navy-500 dark:text-brand-teal-300 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-brand-navy-500 dark:text-brand-teal-300 tracking-tight">
                Application Submitted Successfully!
              </h2>
              <p className="font-display text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your beach owner application is successfully filed under the status{' '}
                <span className="font-display px-2.5 py-0.5 rounded-full bg-brand-sun-100 dark:bg-brand-navy-900/60 text-brand-navy-700 dark:text-brand-sun-300 font-display text-xs font-bold uppercase tracking-wide">
                  Pending Review
                </span>
                . Please check your email within 1 to 3 business days for review updates.
              </p>
            </div>

            <div className="pt-3 flex justify-center">
              <Link
                href="/"
                className="font-display inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-brand-navy-500 hover:bg-brand-navy-600 text-white text-[11px] sm:text-xs font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
                    className="h-full bg-[#F4BF3E] rounded-full transition-all duration-300"
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
                        className="flex flex-col items-center cursor-pointer"
                        onClick={() => {
                          if (s.num > currentStep) {
                            if (currentStep === 2 && !isStep2Valid()) {
                              setAttemptedStep2(true);
                              triggerError('Please fill out the necessary fields before proceeding.');
                              return;
                            }
                            if (currentStep === 3 && !isStep3Valid()) {
                              setAttemptedStep3(true);
                              triggerError('Please fill out the necessary fields before proceeding.');
                              return;
                            }
                          }
                          if (isCompleted || s.num <= currentStep) {
                            setCurrentStep(s.num);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }
                        }}
                      >
                        {/* Circle wrapper (48px high, vertical center at 24px matches top-6) */}
                        <div className="h-12 flex items-center justify-center">
                          <div
                            className={`transition-all duration-300 flex items-center justify-center font-bold text-[11px] sm:text-xs rounded-full font-display ${
                              isActive
                                ? 'w-11 h-11 sm:w-12 sm:h-12 bg-[#F4BF3E] text-black ring-4 ring-[#F4BF3E]/40 dark:ring-[#F4BF3E]/30 shadow-md scale-105'
                                : isCompleted
                                ? 'w-9 h-9 sm:w-10 sm:h-10 bg-[#F4BF3E] text-black shadow-xs'
                                : 'w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 dark:bg-neutral-800 text-slate-400 border border-slate-200 dark:border-neutral-700'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] text-black" />
                            ) : (
                              <span className="text-black">{s.num}</span>
                            )}
                          </div>
                        </div>

                        {/* Step Labels - dive blue #124168 for completed/active, never black! */}
                        <div className="font-display text-center mt-2 w-full px-1">
                          <span
                            className={`block font-display text-[11px] sm:text-xs font-bold leading-tight ${
                              isActive || isCompleted
                                ? 'text-brand-navy-500 dark:text-brand-teal-300'
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
                  <div className="border-b border-[#1F3F74]/25 dark:border-[#4987BA]/40 pb-3 mb-6 sm:mb-8">
                    <h2 className="font-display font-display text-lg sm:text-xl font-bold text-brand-navy-500 dark:text-brand-teal-300">
                      Application Requirements
                    </h2>
                    <p className="font-display font-display text-[11px] sm:text-xs text-slate-500 dark:text-white mt-1">
                      Please make sure you have the following information and documents ready:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        num: '1',
                        title: 'Mayor’s / Business Permit',
                        desc: 'A valid business permit issued by LGU Catmon for Binongkalan, Catmon in PNG or JPG format (up to 2MB).',
                      },
                      {
                        num: '2',
                        title: 'Proof of Ownership or Lease',
                        desc: 'Land Title, Deed of Sale, or notarized lease contract authorizing beach resort operations.',
                      },
                      {
                        num: '3',
                        title: 'Valid ID Verification',
                        desc: 'A government-issued ID (passport, driver’s license, UMID, or PhilSys) matching the applicant’s legal name to verify ownership.',
                      },
                      {
                        num: '4',
                        title: 'Contact Person Information',
                        desc: 'Full legal name, active mobile number, and email address for application status updates.',
                      },
                      {
                        num: '5',
                        title: 'Resort & Business Details',
                        desc: 'Registered business name and official resort name in Barangay Binongkalan.',
                      },
                    ].map((req, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200/80 dark:border-neutral-800 shadow-2xs"
                      >
                        <span className="font-display text-base font-bold text-brand-navy-500 dark:text-brand-teal-300 leading-none pt-0.5 flex-shrink-0">
                          {req.num}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="font-display text-[11px] sm:text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">
                            {req.title}
                          </h3>
                          <p className="font-display text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
                      className="font-display inline-flex items-center justify-center px-12 py-3.5 rounded-full bg-[#F4BF3E] hover:bg-[#e0a92e] text-black font-medium text-[11px] sm:text-xs shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <span className="font-display">Proceed</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: PERSONAL INFORMATION (Single Column / Stacked with Inline Red Error Text) ── */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#1F3F74]/25 dark:border-[#4987BA]/40 pb-3 mb-6 sm:mb-8">
                    <h2 className="font-display font-display text-lg sm:text-xl font-bold text-brand-navy-500 dark:text-brand-teal-300">
                      Personal Information
                    </h2>
                    <p className="font-display font-display text-[11px] sm:text-xs text-slate-500 dark:text-white mt-1">
                      Fill in the required details to continue with your registration.
                    </p>
                  </div>

                  {/* Stacked single column layout */}
                  <div className="space-y-4 max-w-xl mx-auto">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="application-full-name" className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300 mb-1.5">
                        Full Legal Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="application-full-name"
                        type="text"
                        required
                        maxLength={80}
                        autoComplete="name"
                        inputMode="text"
                        value={formData.applicantfullname}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          nameWasEditedRef.current = true;
                          const validation = validateFullName(rawValue);
                          setFormData({
                            ...formData,
                            applicantfullname: rawValue,
                          });
                          setFullNameInputError(validation.error);
                          setFullNameTouched(true);
                        }}
                        onBlur={() => {
                          setFullNameTouched(true);
                          const validation = validateFullName(formData.applicantfullname);
                          if (!fullNameInputError) setFullNameInputError(validation.error);
                          if (validation.ok && !fullNameInputError) {
                            setFormData((current) => ({
                              ...current,
                              applicantfullname: validation.value,
                            }));
                          }
                        }}
                        aria-invalid={Boolean(getFullNameError())}
                        aria-describedby={getFullNameError() ? 'application-full-name-error' : undefined}
                        placeholder="Ana B. Juan"
                        className={`font-display w-full px-5 py-3 text-[11px] sm:text-xs bg-white dark:bg-neutral-900 border rounded-full caret-brand-navy-500 dark:caret-brand-teal-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F3F74]/30 focus:ring-1 text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getFullNameError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74]/30 dark:focus:ring-[#4987BA]/30'
                        }`}
                      />
                      {getFullNameError() && (
                        <p
                          id="application-full-name-error"
                          role="alert"
                          className="font-display mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200"
                        >
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getFullNameError()}</span>
                        </p>
                      )}
                      {accountName && formData.applicantfullname === accountName && (
                        <p className="font-display mt-1.5 ml-4 text-[11px] text-slate-500 dark:text-neutral-400">
                          We filled this in from your account. Please use your full legal name exactly as it appears on your valid ID. You can edit it.
                        </p>
                      )}
                      {accountName && formData.applicantfullname !== accountName && (
                        <button
                          type="button"
                          onClick={() => {
                            nameWasEditedRef.current = true;
                            setFormData((current) => ({ ...current, applicantfullname: accountName }));
                            const validation = validateFullName(accountName);
                            setFullNameInputError(validation.error);
                            setFullNameTouched(true);
                          }}
                          className="font-display mt-1.5 ml-4 text-sm font-semibold text-brand-navy-500 underline decoration-transparent underline-offset-2 hover:decoration-current dark:text-brand-teal-300"
                        >
                          Use my account name
                        </button>
                      )}
                    </div>

                    {/* Email with real-time inline red error text */}
                    <div>
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.applicantemail}
                        onChange={(e) => {
                          setFormData({ ...formData, applicantemail: e.target.value });
                          setPendingEmailError(null);
                        }}
                        aria-invalid={Boolean(getEmailError())}
                        placeholder="owner@gmail.com"
                        className={`font-display w-full px-5 py-3 text-[11px] sm:text-xs bg-white dark:bg-neutral-900 border rounded-full caret-brand-navy-500 dark:caret-brand-teal-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F3F74]/30 focus:ring-1 text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getEmailError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74]/30 dark:focus:ring-[#4987BA]/30'
                        }`}
                      />
                      {getEmailError() && (
                        <p className="font-display mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getEmailError()}</span>
                        </p>
                      )}
                    </div>

                    {/* Contact Mobile with Built-in +63 Prefix & inline red error text */}
                    <div>
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300 mb-1.5">
                        Mobile Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div
                        className={`flex items-center w-full bg-white dark:bg-neutral-900 border rounded-full overflow-hidden focus-within:ring-1 focus-within:ring-[#1F3F74]/30 focus-within:border-[#1F3F74] dark:focus-within:border-[#4987BA] shadow-2xs transition-all ${
                          getMobileError()
                            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
                            : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40'
                        }`}
                      >
                        <span className="font-display px-4 py-3 bg-brand-navy-50 dark:bg-brand-navy-900/70 text-brand-navy-500 dark:text-brand-teal-300 font-bold text-[11px] sm:text-xs border-r border-brand-navy-200 dark:border-brand-navy-700 select-none">
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
                          className="font-display w-full px-4 py-3 text-[11px] sm:text-xs bg-transparent placeholder:italic placeholder:text-slate-400 font-normal text-slate-900 dark:text-white caret-brand-navy-500 dark:caret-brand-teal-600 focus-visible:outline-none"
                        />
                      </div>
                      {getMobileError() && (
                        <p className="font-display mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getMobileError()}</span>
                        </p>
                      )}
                    </div>

                    {/* Beach Resort Address */}
                    <div>
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300 mb-1.5">
                        Beach Resort Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={addressInputRef}
                        id="beach-address"
                        type="text"
                        required
                        autoComplete="street-address"
                        maxLength={150}
                        value={formData.beachlocation}
                        onFocus={() => {
                          if (addressDefaultFocusHandledRef.current) return;
                          addressDefaultFocusHandledRef.current = true;
                          if (formData.beachlocation === DEFAULT_BEACH_ADDRESS) {
                            addressInputRef.current?.setSelectionRange(0, 0);
                          }
                        }}
                        onBlur={() => setAddressTouched(true)}
                        onChange={(e) => setFormData((current) => ({ ...current, beachlocation: e.target.value }))}
                        placeholder={BEACH_ADDRESS_MESSAGES.placeholder}
                        aria-invalid={Boolean(getAddressError())}
                        aria-describedby={`beach-address-help${getAddressError() ? ' beach-address-error' : addressWarning ? ' beach-address-warning' : ''}`}
                        className={`font-display w-full px-5 py-3 text-[11px] sm:text-xs bg-white dark:bg-neutral-900 border rounded-full caret-brand-navy-500 dark:caret-brand-teal-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F3F74]/30 focus:ring-1 text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getAddressError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74]/30 dark:focus:ring-[#4987BA]/30'
                        }`}
                      />
                      {getAddressError() && (
                        <p id="beach-address-error" role="alert" className="font-display mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getAddressError()}</span>
                        </p>
                      )}
                      <p id="beach-address-help" className="font-display mt-1.5 ml-4 text-xs text-slate-500 dark:text-slate-400">
                        {BEACH_ADDRESS_MESSAGES.helper}
                      </p>
                      {addressWarning && (
                        <p id="beach-address-warning" className="font-display mt-1.5 ml-4 text-xs text-amber-700 dark:text-amber-300">
                          {addressWarning}
                        </p>
                      )}
                      {formData.beachlocation !== DEFAULT_BEACH_ADDRESS && (
                        <button
                          type="button"
                          onClick={() => setFormData((current) => ({ ...current, beachlocation: DEFAULT_BEACH_ADDRESS }))}
                          className="font-display mt-1.5 ml-4 text-sm text-brand-navy-500 hover:underline dark:text-brand-teal-300"
                        >
                          Reset to default
                        </button>
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
                      disabled={
                        !validateFullName(formData.applicantfullname).ok ||
                        Boolean(fullNameInputError)
                      }
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F4BF3E] hover:bg-[#e0a92e] text-black shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
                  <div className="border-b border-[#1F3F74]/25 dark:border-[#4987BA]/40 pb-3 mb-6 sm:mb-8">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-brand-navy-500 dark:text-brand-teal-300">
                      Establishment Details
                    </h2>
                    <p className="font-display text-[11px] sm:text-xs text-slate-500 dark:text-white mt-1">
                      Enter your registered business name and public resort name.
                    </p>
                  </div>

                  {/* Stacked single column layout */}
                  <div className="space-y-4 max-w-xl mx-auto">
                    {/* Registered Business Name */}
                    <div>
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300 mb-1.5">
                        Registered Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.businessname}
                        onChange={(e) => setFormData({ ...formData, businessname: e.target.value })}
                        placeholder="Rañola Beach Resort Inc."
                        className={`font-display w-full px-5 py-3 text-[11px] sm:text-xs bg-white dark:bg-neutral-900 border rounded-full caret-brand-navy-500 dark:caret-brand-teal-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F3F74]/30 focus:ring-1 text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getBusinessNameError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74]/30 dark:focus:ring-[#4987BA]/30'
                        }`}
                      />
                      {getBusinessNameError() && (
                        <p className="font-display mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{getBusinessNameError()}</span>
                        </p>
                      )}
                    </div>

                    {/* Beach / Resort Name (Stacked at bottom) */}
                    <div>
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300 mb-1.5">
                        Beach / Resort Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.beachname}
                        onChange={(e) => setFormData({ ...formData, beachname: e.target.value })}
                        placeholder="Rañola Beach"
                        className={`font-display w-full px-5 py-3 text-[11px] sm:text-xs bg-white dark:bg-neutral-900 border rounded-full caret-brand-navy-500 dark:caret-brand-teal-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F3F74]/30 focus:ring-1 text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 font-normal shadow-2xs transition-all ${
                          getBeachNameError()
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:border-[#1F3F74] dark:focus:border-[#4987BA] focus:ring-[#1F3F74]/30 dark:focus:ring-[#4987BA]/30'
                        }`}
                      />
                      {getBeachNameError() && (
                        <p className="font-display mt-1.5 ml-4 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200">
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
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F4BF3E] hover:bg-[#e0a92e] text-black shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
                  <div className="border-b border-[#1F3F74]/25 dark:border-[#4987BA]/40 pb-3 mb-6 sm:mb-8">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-brand-navy-500 dark:text-brand-teal-300">
                      Permits &amp; Verification
                    </h2>
                    <p className="font-display text-[11px] sm:text-xs text-slate-500 dark:text-white mt-1">
                      Upload your required permits and complete your live selfie verification.
                    </p>
                  </div>

                  {/* Upload Dropzones Side-by-Side (Enhanced Standard UI) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Document 1: Mayor's / Business Permit */}
                    <div className="space-y-1.5">
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">
                        Mayor&apos;s / Business Permit <span className="text-red-500">*</span>
                      </label>

                      {permitPreview ? (
                        /* Blue Outline Preview Card */
                        <div className="relative rounded-2xl border-2 border-brand-navy-500 dark:border-brand-teal-600 bg-white dark:bg-neutral-900 p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs transition-all">
                          <button
                            type="button"
                            onClick={() => removeFile('permit')}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {permitPreview.isImage ? (
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-center">
                              <img
                                src={permitPreview.url}
                                alt="Permit Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <div className="font-display w-10 h-10 rounded-lg bg-brand-navy-100 text-brand-navy-500 flex items-center justify-center font-bold text-xs">
                                PDF
                              </div>
                              <span className="font-display text-xs font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                                {permitPreview.name}
                              </span>
                              <span className="font-display text-[10px] text-slate-400">PDF Document</span>
                            </div>
                          )}

                          <div className="font-display flex items-center justify-between text-xs pt-1">
                            <div className="min-w-0 pr-2">
                              <div className="font-display font-bold text-slate-900 dark:text-white truncate text-[11px]">
                                {permitPreview.name}
                              </div>
                              <div className="font-display text-[10px] text-brand-navy-500 dark:text-brand-teal-300 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-brand-navy-500 dark:text-brand-teal-300" />
                                <span className="font-display">Attached ({permitPreview.compressionSummary || permitPreview.size})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => permitInputRef.current?.click()}
                              className="font-display text-[11px] font-bold text-brand-navy-500 dark:text-brand-teal-300 hover:underline flex-shrink-0 cursor-pointer"
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
                              : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 hover:border-[#1F3F74] dark:hover:border-[#4987BA] bg-white/50 dark:bg-neutral-900/40 hover:bg-brand-navy-50/20'
                          }`}
                        >
                          <div className="font-display w-11 h-11 rounded-full bg-brand-navy-50 dark:bg-brand-navy-900/70 text-brand-navy-500 dark:text-brand-teal-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-display block text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-white">
                              Click to upload or drag &amp; drop
                            </span>
                            <span className="font-display block text-[11px] text-slate-400">PNG or JPG (max. 2MB)</span>
                          </div>
                        </div>
                      )}

                      {attemptedStep4 && !permitPreview && (
                        <p className="font-display mt-1 ml-2 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-display">Please upload your Mayor’s / Business Permit.</span>
                        </p>
                      )}

                      <input
                        ref={permitInputRef}
                        type="file"
                        disabled={loading}
                        accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileSelection(e.target.files?.[0] || null, 'permit')}
                      />
                    </div>

                    {/* Document 2: Proof of Ownership / Lease */}
                    <div className="space-y-1.5">
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">
                        Proof of Ownership / Lease <span className="text-red-500">*</span>
                      </label>

                      {ownershipPreview ? (
                        /* Blue Outline Preview Card */
                        <div className="relative rounded-2xl border-2 border-brand-navy-500 dark:border-brand-teal-600 bg-white dark:bg-neutral-900 p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs transition-all">
                          <button
                            type="button"
                            onClick={() => removeFile('ownership')}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {ownershipPreview.isImage ? (
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-center">
                              <img
                                src={ownershipPreview.url}
                                alt="Ownership Proof Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <div className="font-display w-10 h-10 rounded-lg bg-brand-navy-100 text-brand-navy-500 flex items-center justify-center font-bold text-xs">
                                PDF
                              </div>
                              <span className="font-display text-xs font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                                {ownershipPreview.name}
                              </span>
                              <span className="font-display text-[10px] text-slate-400">PDF Document</span>
                            </div>
                          )}

                          <div className="font-display flex items-center justify-between text-xs pt-1">
                            <div className="min-w-0 pr-2">
                              <div className="font-display font-bold text-slate-900 dark:text-white truncate text-[11px]">
                                {ownershipPreview.name}
                              </div>
                              <div className="font-display text-[10px] text-brand-navy-500 dark:text-brand-teal-300 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-brand-navy-500 dark:text-brand-teal-300" />
                                <span className="font-display">Attached ({ownershipPreview.compressionSummary || ownershipPreview.size})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => ownershipInputRef.current?.click()}
                              className="font-display text-[11px] font-bold text-brand-navy-500 dark:text-brand-teal-300 hover:underline flex-shrink-0 cursor-pointer"
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
                              : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 hover:border-[#1F3F74] dark:hover:border-[#4987BA] bg-white/50 dark:bg-neutral-900/40 hover:bg-brand-navy-50/20'
                          }`}
                        >
                          <div className="font-display w-11 h-11 rounded-full bg-brand-navy-50 dark:bg-brand-navy-900/70 text-brand-navy-500 dark:text-brand-teal-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-display block text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-white">
                              Click to upload or drag &amp; drop
                            </span>
                            <span className="font-display block text-[11px] text-slate-400">PNG or JPG (max. 2MB)</span>
                          </div>
                        </div>
                      )}

                      {attemptedStep4 && !ownershipPreview && (
                        <p className="font-display mt-1 ml-2 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-display">Please upload your Proof of Ownership or Lease.</span>
                        </p>
                      )}

                      <input
                        ref={ownershipInputRef}
                        type="file"
                        disabled={loading}
                        accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileSelection(e.target.files?.[0] || null, 'ownership')}
                      />
                    </div>

                    {/* Document 3: Valid ID */}
                    <div className="space-y-1.5">
                      <label className="font-display block font-display text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300">
                        Valid ID <span className="text-red-500">*</span>
                      </label>

                      {idPreview ? (
                        /* Blue Outline Preview Card */
                        <div className="relative rounded-2xl border-2 border-brand-navy-500 dark:border-brand-teal-600 bg-white dark:bg-neutral-900 p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs transition-all">
                          <button
                            type="button"
                            onClick={() => removeFile('id')}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-neutral-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {idPreview.isImage ? (
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-center">
                              <img
                                src={idPreview.url}
                                alt="ID Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <div className="font-display w-10 h-10 rounded-lg bg-brand-navy-100 text-brand-navy-500 flex items-center justify-center font-bold text-xs">
                                PDF
                              </div>
                              <span className="font-display text-xs font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                                {idPreview.name}
                              </span>
                              <span className="font-display text-[10px] text-slate-400">PDF Document</span>
                            </div>
                          )}

                          <div className="font-display flex items-center justify-between text-xs pt-1">
                            <div className="min-w-0 pr-2">
                              <div className="font-display font-bold text-slate-900 dark:text-white truncate text-[11px]">
                                {idPreview.name}
                              </div>
                              <div className="font-display text-[10px] text-brand-navy-500 dark:text-brand-teal-300 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-brand-navy-500 dark:text-brand-teal-300" />
                                <span className="font-display">Attached ({idPreview.compressionSummary || idPreview.size})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => idCaptureRef.current?.open()}
                              className="font-display text-[11px] font-bold text-brand-navy-500 dark:text-brand-teal-300 hover:underline flex-shrink-0 cursor-pointer"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <IdCapture
                        ref={idCaptureRef}
                        hasPreview={Boolean(idPreview)}
                        disabled={loading}
                        invalid={Boolean(attemptedStep4 && !idPreview)}
                        onCapture={(file) => {
                          void handleFileSelection(file, 'id');
                        }}
                      />

                      {attemptedStep4 && !idPreview && (
                        <p className="font-display mt-1 ml-2 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-display">Please capture your Valid ID.</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <LiveVerification onVerified={setLivenessNonce} />
                  {/* ── Frameless Legal Certification Checkbox ── */}
                  <div className="pt-1 px-1">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={formData.agreeToTerms}
                        onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded accent-[#1F3F74] dark:accent-[#4987BA] border-[#1F3F74]/40 dark:border-[#4987BA]/40 focus:ring-[#1F3F74]/30 dark:[color-scheme:dark] cursor-pointer"
                      />
                      <span className="font-display text-xs text-slate-700 dark:text-white leading-relaxed">
                        I certify under penalty of law that all submitted information and uploaded permits are authentic,
                        and I have read and accept the{' '}
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="font-display text-brand-navy-500 dark:text-brand-teal-300 font-bold underline hover:opacity-80"
                        >
                          Privacy Policy (RA 10173)
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="font-display text-brand-navy-500 dark:text-brand-teal-300 font-bold underline hover:opacity-80"
                        >
                          Terms of Service
                        </Link>
                        .
                      </span>
                    </label>

                    {attemptedStep4 && !formData.agreeToTerms && (
                      <p className="font-display mt-1.5 ml-7 text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-display">You must certify your documents and accept the terms of service.</span>
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
                      disabled={
                        loading ||
                        pendingApplication ||
                        pendingApplicationCheck === 'checking' ||
                        !livenessNonce ||
                        !validateFullName(formData.applicantfullname).ok ||
                        Boolean(fullNameInputError)
                      }
                      className="font-display inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#F4BF3E] hover:bg-[#e0a92e] text-black font-medium text-[11px] sm:text-xs shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span className="font-display">Submitting Application...</span>
                        </div>
                      ) : (
                        <span className="font-display">Submit Owner Application</span>
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
