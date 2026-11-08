'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { showToast } from '@/components/ui/feedback-toasts';
import { notifyRealtimeSync, useRealtimeSync } from '@/lib/realtime-sync';
import {
  ChevronLeft,
  Camera,
  FileText,
  AlertCircle,
  Loader2,
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palmtree,
} from 'lucide-react';

interface ApplicationData {
  id: string;
  applicant_full_name?: string;
  applicant_name?: string;
  applicant_email: string;
  business_name: string;
  beach_name: string;
  contact_phone?: string;
  contact_info?: string;
  business_permit_path?: string;
  business_permit_url?: string | null;
  proof_of_ownership_path?: string;
  proof_of_ownership_url?: string | null;
  ownership_proof_path?: string;
  live_selfie_path?: string;
  live_selfie_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
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
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const openDocument = (path?: string | null, label = 'Document') => {
    if (!path) {
      setDocumentMessage(`No uploaded ${label.toLowerCase()} available.`);
      return;
    }

    const normalized = path.trim();
    const isRemote = /^https?:\/\//i.test(normalized);
    const isLocalPath = /^\/?(uploads|files|storage|permits|titles|public|images)\//i.test(normalized);

    if (isRemote || isLocalPath) {
      setZoomLevel(1);
      setPreviewDocument({ url: normalized, title: label });
      setDocumentMessage(null);
      return;
    }

    setDocumentMessage(`${label} is not linked to a viewable file.`);
  };

  const fetchDetail = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${resolvedParams.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.application) {
        setApplication(data.application);
        setStatus(data.application.status || 'pending');
        if (data.application.rejection_reason) {
          setAdminNotes(data.application.rejection_reason);
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
          applicant_email: application.applicant_email,
          applicant_name: application.applicant_full_name || application.applicant_name || 'Beach Owner',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve application');

      setStatus('approved');
      notifyRealtimeSync('all');
      showToast(`Approved! 6-digit PIN emailed to ${application.applicant_email}.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/applications/${resolvedParams.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          applicant_email: application.applicant_email,
          applicant_name: application.applicant_full_name || application.applicant_name || 'Beach Owner',
          rejection_reason: adminNotes || 'Incomplete business permits or permit mismatch.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject application');

      setStatus('rejected');
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
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1F3F74] dark:text-[#4987BA]" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-16 max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-lg font-extrabold text-[#1F3F74] dark:text-white">Application Not Found</h1>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F3F74] text-white rounded-full text-xs font-bold"
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
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1F3F74] dark:text-neutral-400 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Applications</span>
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center flex-shrink-0">
              <Palmtree className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-[#1F3F74] dark:text-white truncate">
                  {application.beach_name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                    status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'approved'
                        ? 'bg-emerald-500'
                        : status === 'rejected'
                          ? 'bg-rose-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  <span>{status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                {application.business_name}
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
                {application.applicant_full_name || application.applicant_name || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Email
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block truncate">
                {application.applicant_email}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Phone
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                {application.contact_phone || application.contact_info || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                Submitted
              </span>
              <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                {new Date(application.created_at).toLocaleDateString(undefined, {
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
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                {documentMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  openDocument(
                    application.business_permit_url || application.business_permit_path,
                    "Mayor's Business Permit"
                  )
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-sky-500 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    Permit
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-sky-600 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  openDocument(
                    application.proof_of_ownership_url ||
                      application.proof_of_ownership_path ||
                      application.ownership_proof_path,
                    'Proof of Ownership'
                  )
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-emerald-500 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    Ownership
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  openDocument(
                    application.live_selfie_url || application.live_selfie_path || '/images/logo.png',
                    'ID / Selfie'
                  )
                }
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-yellow-500 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    ID Photo
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Notes
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={status !== 'pending'}
              placeholder="Optional notes or rejection reason..."
              className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-sky-500 disabled:bg-slate-50 dark:disabled:bg-neutral-800/50 disabled:text-slate-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        {(status === 'pending' || status === 'approved') && (
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-black/30 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
            {status === 'pending' && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-xs cursor-pointer"
              >
                Reject
              </button>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={handleApprove}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{status === 'approved' ? 'Resend PIN' : 'Approve'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col border border-slate-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
              <h3 className="text-sm font-extrabold text-[#1F3F74] dark:text-white">
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
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
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
          </div>
        </div>
      )}
    </div>
  );
}
