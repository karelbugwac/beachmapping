'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { showToast } from '@/components/ui/feedback-toasts';
import { validateSafeText } from '@/lib/validation/safe-text';
import { notifyRealtimeSync, useRealtimeSync } from '@/lib/realtime-sync';
import { getApplicationNotesDisplay } from '@/lib/utils/application-review-notes';
import {
  ChevronLeft,
  Camera,
  FileText,
  AlertCircle,
  Loader2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palmtree,
  IdCard,
} from 'lucide-react';

interface ApplicationData {
  id: string;
  applicantfullname?: string;
  applicant_name?: string;
  applicantemail: string;
  businessname: string;
  beachname: string;
  contactphone?: string;
  contact_info?: string;
  businesspermitpath?: string;
  business_permit_url?: string | null;
  proofofownershippath?: string;
  proof_of_ownership_url?: string | null;
  ownership_proof_path?: string;
  valididpath?: string | null;
  valid_id_url?: string | null;
  liveselfiepath?: string;
  live_selfie_url?: string | null;
  livenessstatus?: 'passed' | 'failed' | 'flagged' | 'pending';
  livenesscheckedat?: string | null;
  livenessattempts?: number;
  livenesssnapshotpath?: string | null;
  liveness_snapshot_url?: string | null;
  livenessflaggedreasons?: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionreason?: string;
  accountstatus?: 'active' | 'under_review' | 'suspended' | null;
  account_status_reason?: string | null;
  createdat: string;
}

export default function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const previewDialogRef = useRef<HTMLDivElement | null>(null);
  const previewTriggerRef = useRef<HTMLElement | null>(null);

  const openDocument = (path?: string | null, label = 'Document') => {
    if (!path) {
      setDocumentMessage(`No uploaded ${label.toLowerCase()} available.`);
      return;
    }

    const normalized = path.trim();
    const isRemote = /^https?:\/\//i.test(normalized);
    const isLocalPath = /^\/?(uploads|files|storage|permits|titles|public|images)\//i.test(normalized);

    if (isRemote || isLocalPath) {
      previewTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setZoomLevel(1);
      setPreviewDocument({ url: normalized, title: label });
      setDocumentMessage(null);
      return;
    }

    setDocumentMessage(`${label} is not linked to a viewable file.`);
  };

  useEffect(() => {
    if (!previewDocument) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      previewDialogRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPreviewDocument(null);
        requestAnimationFrame(() => previewTriggerRef.current?.focus());
        return;
      }
      if (event.key !== 'Tab') return;
      const items = previewDialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], iframe');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewDocument]);

  useEffect(() => {
    if (!previewDocument) previewTriggerRef.current?.focus();
  }, [previewDocument]);

  const notesDisplay = application
    ? getApplicationNotesDisplay(status, application.rejectionreason)
    : null;

  const fetchDetail = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${resolvedParams.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.application) {
        setApplication(data.application);
        setStatus(data.application.status || 'pending');
        if (!silent) {
          setAdminNotes(
            data.application.status === 'pending' ? '' : data.application.rejectionreason || ''
          );
        }
      }
    } catch (err) {
      console.error('Failed to load application detail:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail(false);
  }, [resolvedParams.id]);

  useRealtimeSync(() => {
    void fetchDetail(true);
  });

  const handleApprove = async () => {
    if (!application) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/applications/${resolvedParams.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve application');

      setStatus('approved');
      notifyRealtimeSync('all');
      showToast(`Approved! 6-digit PIN emailed to ${application.applicantemail}.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    const reason = adminNotes.trim();
    if (!reason) {
      showToast('Add a rejection reason in Notes before rejecting.', 'error');
      return;
    }
    const validation = validateSafeText(reason, { max: 500 });
    if (!validation.ok) {
      setNotesError(validation.error);
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/applications/${resolvedParams.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionreason: validation.value,
          note: validation.value,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject application');

      setStatus('rejected');
      setApplication((current) =>
        current ? { ...current, rejectionreason: reason } : current
      );
      notifyRealtimeSync('applications');
      showToast('Application rejected.', 'error');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Rejection failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-navy-500 dark:text-brand-teal-300" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-16 max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-brand-navy-700 mx-auto" />
        <h1 className="text-lg font-extrabold text-brand-navy-500 dark:text-white">Application Not Found</h1>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-navy-500 text-white rounded-full text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-navy-500 dark:text-neutral-400 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Applications</span>
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-brand-teal-100 dark:bg-brand-teal-700 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center flex-shrink-0">
              <Palmtree className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-brand-navy-500 dark:text-white truncate">
                  {application.beachname}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                    status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-brand-sun-50 text-brand-navy-700 dark:bg-brand-navy-900/60 dark:text-brand-sun-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'approved'
                        ? 'bg-emerald-500'
                        : status === 'rejected'
                          ? 'bg-rose-500'
                          : 'bg-brand-sun-500'
                    }`}
                  />
                  <span>{status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                {application.businessname}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800">
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Applicant
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                {application.applicantfullname || application.applicant_name || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Email
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block truncate">
                {application.applicantemail}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Account status
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block capitalize">
                {application.accountstatus?.replaceAll('_', ' ') || 'No linked account'}
              </span>
              {application.accountstatus === 'under_review' && application.account_status_reason && (
                <span className="mt-1 block text-slate-500 dark:text-neutral-400">
                  Internal note: {application.account_status_reason}
                </span>
              )}
              {application.accountstatus === 'suspended' && application.account_status_reason && (
                <span className="mt-1 block text-rose-600 dark:text-rose-300">
                  Reason: {application.account_status_reason}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Phone
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                {application.contactphone || application.contact_info || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Submitted
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                {new Date(application.createdat).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Documents
            </span>

            {documentMessage && (
              <div className="rounded-2xl border border-brand-sun-200 bg-brand-sun-50 px-3.5 py-2 text-xs text-brand-navy-700 dark:border-brand-navy-800 dark:bg-brand-navy-900/40 dark:text-brand-sun-300">
                {documentMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  openDocument(
                    application.business_permit_url || application.businesspermitpath,
                    "Mayor's Business Permit"
                  )
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-brand-teal-500 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-700/60 text-brand-teal-600 dark:text-brand-teal-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    Permit
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-brand-teal-600 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  openDocument(
                    application.proof_of_ownership_url ||
                      application.proofofownershippath ||
                      application.ownership_proof_path,
                    'Proof of Ownership'
                  )
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-brand-teal-600 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-700/20 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    Ownership
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-brand-teal-700 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  openDocument(
                    application.liveness_snapshot_url || application.live_selfie_url || application.liveselfiepath || '/logo.png',
                    'Live verification snapshot'
                  )
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-brand-sun-500 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-sun-50 dark:bg-brand-navy-900/60 text-brand-navy-700 dark:text-brand-sun-400 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    Live snapshot
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 text-brand-navy-700 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  openDocument(
                    application.valid_id_url || application.valididpath,
                    'Valid ID'
                  )
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-brand-navy-500 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-900/60 text-brand-navy-600 dark:text-brand-teal-300 flex items-center justify-center flex-shrink-0">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    Valid ID
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-brand-navy-600 flex-shrink-0" />
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/40 p-3.5 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Liveness</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  application.livenessstatus === 'passed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : application.livenessstatus === 'flagged'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {application.livenessstatus || 'pending'}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Attempts: {application.livenessattempts || 0}
                </span>
              </div>
                {status === 'pending' && application.livenessstatus !== 'passed' && (
                  <p className="text-rose-700 dark:text-rose-300">
                    Live verification must pass before this application can be approved.
                  </p>
                )}
              {application.livenessflaggedreasons?.length ? (
                <p className="text-amber-800 dark:text-amber-300">
                  Flags: {application.livenessflaggedreasons.join(', ')}
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No review flags.</p>
              )}
              {application.livenesscheckedat && (
                <p className="text-slate-500 dark:text-slate-400">
                  Checked {new Date(application.livenesscheckedat).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {notesDisplay?.kind === 'input' && (
            <div className="space-y-1.5">
              <label
                htmlFor="application-rejection-reason"
                className="block text-xs font-semibold text-slate-700 dark:text-neutral-300"
              >
                Rejection reason <span className="text-rose-700 dark:text-rose-300">(required for rejection)</span>
              </label>
              <textarea
                id="application-rejection-reason"
                rows={3}
                value={adminNotes}
                maxLength={500}
                onChange={(e) => {
                  setAdminNotes(e.target.value);
                  const validation = validateSafeText(e.target.value, { max: 500 });
                  setNotesError(validation.ok ? '' : validation.error);
                }}
                disabled={status !== 'pending'}
                placeholder="Explain what needs to be corrected if rejecting."
                className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-black dark:text-white"
              />
              {notesError && <p role="alert" className="text-xs text-rose-600">{notesError}</p>}
              <p className="text-right text-[10px] text-slate-400">{adminNotes.length}/500</p>
            </div>
          )}

          {notesDisplay?.kind === 'reason' && (
            <div className="border-l-2 border-rose-600 bg-rose-50 px-4 py-3 dark:border-rose-400 dark:bg-rose-950/30">
              <h2 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                Rejection reason
              </h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-rose-800 dark:text-rose-300">
                {notesDisplay.reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(status === 'pending' || status === 'approved') && (
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-black/30 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
            {status === 'pending' && (
              <button
                type="button"
                disabled={submitting || !adminNotes.trim() || Boolean(notesError)}
                onClick={handleReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full transition-colors shadow-xs cursor-pointer"
              >
                Reject
              </button>
            )}

            <button
              type="button"
              disabled={submitting || (status === 'pending' && application.livenessstatus !== 'passed')}
              title={status === 'pending' && application.livenessstatus !== 'passed'
                ? 'Live verification must pass before approval.'
                : undefined}
              onClick={handleApprove}
              className="px-5 py-2 bg-brand-navy-500 hover:bg-brand-navy-600 active:bg-brand-navy-700 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{status === 'approved' ? 'Resend PIN' : 'Approve'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewDocument(null);
          }}
        >
          <div ref={previewDialogRef} role="dialog" aria-modal="true" aria-labelledby="application-document-title" className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-neutral-800">
              <h3 id="application-document-title" className="text-sm font-extrabold text-brand-navy-500 dark:text-white">
                {previewDocument.title}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 rounded-full px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    className="p-1 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 w-11 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                    className="p-1 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                    title="Reset zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-black/60 flex justify-center items-start">
              {previewDocument.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDocument.url}
                  className="border-0 bg-white rounded-2xl shadow-lg w-full max-w-4xl min-h-[800px]"
                  title={`Preview ${previewDocument.title}`}
                />
              ) : (
                <img
                  src={previewDocument.url}
                  alt={previewDocument.title}
                  className="max-w-full object-contain bg-white rounded-2xl shadow-lg transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              )}
            </div>
            <div className="flex flex-shrink-0 justify-end border-t border-slate-200 px-6 py-3 dark:border-neutral-800">
              <button type="button" onClick={() => setPreviewDocument(null)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
