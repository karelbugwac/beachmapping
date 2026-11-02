'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/feedback-toasts';
import {
  ChevronLeft,
  Camera,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Building,
  Phone,
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const openDocument = (path?: string, label = 'document') => {
    if (!path) {
      setDocumentMessage(`No uploaded ${label} is available yet.`);
      return;
    }

    const normalized = path.trim();
    const isRemote = /^https?:\/\//i.test(normalized);
    const isLocalPath = /^\/?(uploads|files|storage|permits|titles|public|images)\//i.test(normalized);

    if (isRemote || isLocalPath) {
      setPreviewDocument({ url: normalized, title: label });
      setDocumentMessage(null);
      return;
    }

    setDocumentMessage(`The ${label} is not yet linked to a viewable file in storage.`);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
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
        setLoading(false);
      }
    };

    fetchDetail();
  }, [resolvedParams.id]);

  const handleApprove = async () => {
    if (!application) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      setStatus('approved');
      const successMessage = status === 'approved'
        ? `A new randomized 6-digit PIN was generated and emailed to ${application.applicant_email}.`
        : `Application approved. A randomized 6-digit PIN was generated and emailed to ${application.applicant_email}.`;
      setActionSuccess(successMessage);
      showToast(successMessage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      setStatus('rejected');
      setActionSuccess('Application marked as rejected with recorded administrator notes.');
      showToast('Application rejected.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-600 mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-lg font-bold text-slate-800">Application Not Found</h1>
        <p className="text-xs text-slate-500 dark:text-gray-300">
          The requested application ID does not exist or may have been deleted.
        </p>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold"
        >

          <span>Back to Applications</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-white dark:hover:text-gray-300 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Applications</span>
      </Link>

      <div className="bg-white dark:bg-black p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-black shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
              Review Application: {application.beach_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-300">
              Submitted on {new Date(application.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'approved'
                  ? 'bg-emerald-600 text-white font-bold'
                  : status === 'rejected'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-yellow-500 text-white font-bold'
                }`}
            >
              Status: {status}
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 text-center dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300">
            <p className="font-bold">{actionSuccess}</p>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 text-center dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
            <p className="font-bold">{actionError}</p>
          </div>
        )}

        {/* Applicant Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 dark:bg-gray-900 dark:border-black dark:text-gray-300">
          <div>
            <span className="text-slate-400 font-medium block dark:text-gray-400">Applicant Name</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {application.applicant_full_name || application.applicant_name || 'Not provided'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block dark:text-gray-400">Applicant Email</span>
            <span className="font-bold text-slate-900 dark:text-white">{application.applicant_email}</span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block dark:text-gray-400">Business / Resort Name</span>
            <span className="font-semibold text-slate-900 dark:text-white">{application.business_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block dark:text-gray-400">Contact Phone</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {application.contact_phone || application.contact_info || 'Not provided'}
            </span>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Legal Ownership &amp; Business Verification Documents
          </h2>

          {documentMessage && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {documentMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-xs dark:bg-black dark:border-black">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate dark:text-white">Mayor&apos;s Business Permit</h3>
                  <p className="text-[11px] text-slate-500">Verified municipality stamp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDocument(application.business_permit_url || application.business_permit_path, 'business permit')}
                className="p-2 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                title="Preview permit document"
                aria-label="Preview Mayor's Business Permit"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-xs dark:bg-black dark:border-black">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate dark:text-white">Proof of Ownership / Lease</h3>
                  <p className="text-[11px] text-slate-500">Land title &amp; contract</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDocument(application.proof_of_ownership_url || application.proof_of_ownership_path || application.ownership_proof_path, 'ownership proof')}
                className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                title="Preview ownership proof"
                aria-label="Preview Proof of Ownership Document"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-xs dark:bg-black dark:border-black">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center flex-shrink-0 dark:bg-yellow-950/40 dark:text-yellow-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate dark:text-white">Live Selfie / ID Photo</h3>
                  <p className="text-[11px] text-slate-500">Proprietor identity check</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDocument(application.live_selfie_url || application.live_selfie_path || '/images/logo.png', 'proprietor selfie verification')}
                className="p-2 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 cursor-pointer"
                title="Preview proprietor selfie"
                aria-label="Preview Proprietor Live Selfie Document"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Administrator Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-white">
            Administrator Review Notes / Decision Reason
          </label>
          <textarea
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            disabled={status !== 'pending'}
            placeholder="Add review notes, reasons for decision, or document validation details..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-gray-900 dark:border-black dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
          />
        </div>

        {/* Action Buttons */}
        {(status === 'pending' || status === 'approved') && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
            {status === 'pending' && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleReject}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full transition-colors shadow-sm cursor-pointer"
              >
                <span>Reject</span>
              </button>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={handleApprove}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-full transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Approve</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 dark:bg-black/95">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col dark:bg-gray-900 dark:border dark:border-gray-700">
            {/* Fixed Header with Zoom Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{previewDocument.title}</h3>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-12 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
                    title="Reset zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-md transition-colors dark:text-gray-400 dark:hover:text-white"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Scrollable Document Area */}
            <div className="flex-1 overflow-auto p-8 bg-slate-100 dark:bg-gray-800">
              <div className="flex justify-center">
                {previewDocument.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDocument.url}
                    className="border-0 bg-white shadow-lg dark:bg-gray-900 dark:border dark:border-gray-700"
                    style={{ width: '100%', maxWidth: '800px', minHeight: '1000px' }}
                    title={`Preview ${previewDocument.title}`}
                  />
                ) : (
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.title}
                    className="max-w-full object-contain bg-white shadow-lg dark:bg-gray-900 dark:border dark:border-gray-700 transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
