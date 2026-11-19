'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Eye,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Palmtree,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { filterAdminSearchInput, SAFE_TEXT_MESSAGES, validateSafeText } from '@/lib/validation/safe-text';

interface ApplicationItem {
  id: string;
  applicant_full_name: string;
  applicant_name?: string;
  applicant_email: string;
  business_name: string;
  beach_name: string;
  beach_location?: string | null;
  contact_phone?: string;
  contact_info?: string;
  business_permit_path?: string;
  business_permit_url?: string | null;
  proof_of_ownership_path?: string;
  proof_of_ownership_url?: string | null;
  ownership_proof_path?: string;
  live_selfie_path?: string;
  live_selfie_url?: string | null;
  applicant_profile_image_url?: string | null;
  documents?: {
    permit: ApplicationDocumentAsset;
    ownership: ApplicationDocumentAsset;
    id_photo: ApplicationDocumentAsset;
  };
  status: 'draft' | 'pending' | 'under_review' | 'needs_changes' | 'approved' | 'rejected';
  status_updated_at: string;
  status_note?: string | null;
  account_status?: 'active' | 'under_review' | 'suspended' | null;
  account_status_reason?: string | null;
  rejection_reason?: string;
  created_at: string;
}

interface ApplicationDocumentAsset {
  thumbnail_url: string | null;
  full_url: string | null;
  download_url: string | null;
  file_type: 'image' | 'pdf' | 'unknown' | null;
}

interface ApplicationDocument {
  id: 'permit' | 'ownership' | 'id_photo';
  title: string;
  asset: ApplicationDocumentAsset;
}

interface PreviewDocument {
  id: ApplicationDocument['id'];
  url: string;
  downloadUrl: string;
  fileType: NonNullable<ApplicationDocumentAsset['file_type']>;
  title: string;
}

interface ApplicationHistoryItem {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  changed_by_name: string;
  created_at: string;
}

function getApplicationDocuments(application: ApplicationItem): ApplicationDocument[] {
  return [
    { id: 'permit', title: 'Permit', asset: application.documents?.permit || emptyDocumentAsset() },
    { id: 'ownership', title: 'Ownership', asset: application.documents?.ownership || emptyDocumentAsset() },
    { id: 'id_photo', title: 'ID photo', asset: application.documents?.id_photo || emptyDocumentAsset() },
  ];
}

function emptyDocumentAsset(): ApplicationDocumentAsset {
  return { thumbnail_url: null, full_url: null, download_url: null, file_type: null };
}

function toPreviewDocument(document: ApplicationDocument): PreviewDocument | null {
  if (!document.asset.full_url || !document.asset.file_type) return null;
  return {
    id: document.id,
    url: document.asset.full_url,
    downloadUrl: document.asset.download_url || document.asset.full_url,
    fileType: document.asset.file_type,
    title: document.title,
  };
}

function getAdjacentDocument(application: ApplicationItem, currentId: ApplicationDocument['id'], direction: -1 | 1) {
  const available = getApplicationDocuments(application).filter((item) => item.asset.full_url && item.asset.file_type);
  if (available.length < 2) return null;
  const currentIndex = available.findIndex((item) => item.id === currentId);
  if (currentIndex < 0) return null;
  return available[(currentIndex + direction + available.length) % available.length];
}

function ApplicationDocumentRow({
  document,
  loading,
  onOpen,
}: {
  document: ApplicationDocument;
  loading: boolean;
  onOpen: (document: ApplicationDocument) => void;
}) {
  const [previewState, setPreviewState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const hasImagePreview = document.asset.file_type === 'image' && Boolean(document.asset.thumbnail_url);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-left dark:border-neutral-800 dark:bg-neutral-900">
      {document.asset.full_url ? (
        <button
          type="button"
          onClick={() => {
            if (hasImagePreview && previewState === 'error') {
              setPreviewState('loading');
              setRetryKey((current) => current + 1);
            }
            else onOpen(document);
          }}
          aria-label={hasImagePreview && previewState === 'error' ? `Retry ${document.title} preview` : `View full ${document.title}`}
          className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600 dark:border-neutral-700 dark:bg-neutral-800"
        >
          {hasImagePreview ? (
            <>
              {previewState === 'loading' && <span className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-neutral-700" aria-label="Loading preview" />}
              {previewState === 'error' ? (
                <span className="flex h-full flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-slate-500">
                  Couldn&apos;t load preview
                  <span className="underline">Retry</span>
                </span>
              ) : (
                <img
                  key={retryKey}
                  src={document.asset.thumbnail_url || ''}
                  alt={`${document.title} thumbnail`}
                  loading="lazy"
                  onLoad={() => setPreviewState('loaded')}
                  onError={() => setPreviewState('error')}
                  className={`h-full w-full object-cover ${previewState === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                />
              )}
            </>
          ) : (
            <>
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-brand-teal-700 dark:text-brand-teal-300">
                <FileText className="h-5 w-5" aria-hidden="true" />
                <span className="text-[9px] font-extrabold uppercase">
                  {document.asset.file_type === 'pdf' ? 'PDF' : 'File'}
                </span>
              </span>
              {document.asset.file_type === 'pdf' && (
                <>
                  <iframe
                    src={`${document.asset.full_url}#page=1&toolbar=0&navpanes=0`}
                    title={`${document.title} first-page preview`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full border-0"
                  />
                  <span className="absolute bottom-1 right-1 z-10 rounded bg-white/90 px-1 text-[9px] font-extrabold text-brand-teal-800">PDF</span>
                  <FileText className="absolute left-1 top-1 z-10 h-3.5 w-3.5 text-brand-teal-800" aria-hidden="true" />
                </>
              )}
            </>
          )}
        </button>
      ) : (
        loading
          ? <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800" aria-label="Loading document preview" />
          : <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 dark:border-neutral-700 dark:bg-neutral-800">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">{document.title}</p>
        {loading && !document.asset.full_url ? (
          <span className="mt-1 block h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-neutral-700" aria-label="Loading document" />
        ) : document.asset.full_url ? (
          <button type="button" onClick={() => onOpen(document)} className="mt-1 text-[11px] font-semibold text-brand-teal-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600 dark:text-brand-teal-300">
            View full
          </button>
        ) : (
          <p className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">Not uploaded</p>
        )}
      </div>
    </div>
  );
}

function ApplicantAvatar({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || '?';

  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={`${name}'s profile`}
      onError={() => setFailed(true)}
      className="h-12 w-12 flex-shrink-0 rounded-full border border-slate-200 object-cover dark:border-neutral-700"
    />
  ) : (
    <div aria-label={`${name}'s initials`} className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-teal-100 text-sm font-extrabold text-brand-teal-700 dark:bg-brand-teal-700 dark:text-brand-teal-100">
      {initials}
    </div>
  );
}

function isApplicationStatus(value: string): value is ApplicationItem['status'] {
  return ['draft', 'pending', 'under_review', 'needs_changes', 'approved', 'rejected'].includes(value);
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationItem['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  // Modal state when "View" is clicked
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [applicationHistory, setApplicationHistory] = useState<ApplicationHistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [initialNotes, setInitialNotes] = useState('');
  const viewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previewTriggerRef = useRef<HTMLElement | null>(null);
  const detailsDialogRef = useRef<HTMLDivElement | null>(null);
  const previewDialogRef = useRef<HTMLDivElement | null>(null);
  const closeDetailsRef = useRef<() => void>(() => {});
  const selectedApplicationId = selectedApp?.id;

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load applications.');
      if (!Array.isArray(data?.applications)) throw new Error('The applications response was invalid.');
      setApplications(data.applications);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
    showToast('Applications refreshed.');
  };

  useEffect(() => {
    void Promise.resolve().then(fetchApplications);
  }, []);

  useEffect(() => {
    if (!selectedApplicationId) return;
    let active = true;
    void fetch(`/api/admin/applications/${selectedApplicationId}/history`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load application history.');
        if (active) setApplicationHistory(Array.isArray(data.history) ? data.history : []);
      })
      .catch((error: unknown) => {
        if (active) setHistoryError(error instanceof Error ? error.message : 'Could not load application history.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedApplicationId]);

  useEffect(() => {
    if (!selectedApp) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      const dialog = previewDocument ? previewDialogRef.current : detailsDialogRef.current;
      dialog?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (previewDocument) {
          setPreviewDocument(null);
        } else {
          closeDetailsRef.current();
        }
        return;
      }
      if (previewDocument && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const next = selectedApp
          ? getAdjacentDocument(selectedApp, previewDocument.id, event.key === 'ArrowRight' ? 1 : -1)
          : null;
        const nextPreview = next ? toPreviewDocument(next) : null;
        if (nextPreview) {
          event.preventDefault();
          setPreviewDocument(nextPreview);
        }
        return;
      }
      if (event.key === 'Tab') {
        const dialog = previewDocument ? previewDialogRef.current : detailsDialogRef.current;
        const items = dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]');
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedApp, previewDocument]);

  useEffect(() => {
    if (!selectedApp && !previewDocument) viewTriggerRef.current?.focus();
    else if (selectedApp && !previewDocument) previewTriggerRef.current?.focus();
  }, [selectedApp, previewDocument]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchLower === '' ||
        (app.applicant_full_name || '').toLowerCase().includes(searchLower) ||
        (app.applicant_email || '').toLowerCase().includes(searchLower) ||
        (app.beach_name || '').toLowerCase().includes(searchLower) ||
        (app.business_name || '').toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchQuery]);

  // Open View Modal & load signed document URLs
  const closeDetails = useCallback(() => {
    if (selectedApp && (selectedApp.status === 'pending' || selectedApp.status === 'under_review') && adminNotes !== initialNotes) {
      if (!window.confirm('Discard changes?')) return;
    }
    setSelectedApp(null);
    setPreviewDocument(null);
  }, [selectedApp, adminNotes, initialNotes]);
  useEffect(() => {
    closeDetailsRef.current = closeDetails;
  }, [closeDetails]);

  const handleOpenView = async (app: ApplicationItem, trigger: HTMLButtonElement) => {
    viewTriggerRef.current = trigger;
    setSelectedApp(app);
    const initialNote = app.status_note || app.rejection_reason || '';
    setAdminNotes(initialNote);
    setInitialNotes(initialNote);
    setDocumentMessage(null);
    setApplicationHistory(null);
    setHistoryError('');
    setHistoryLoading(true);
    setLoadingDetail(true);

    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.application) throw new Error('Could not load application documents.');
      setSelectedApp(data.application);
      const detailNote = data.application.status_note || data.application.rejection_reason || '';
      setAdminNotes(detailNote);
      setInitialNotes(detailNote);
    } catch {
      setDocumentMessage('Could not load document previews. Please close and try again.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDocument = (item: ApplicationDocument) => {
    const preview = toPreviewDocument(item);
    if (!preview) return;
    previewTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setZoomLevel(1);
    setPreviewDocument(preview);
    setDocumentMessage(null);
  };

  const navigateDocument = (direction: -1 | 1) => {
    if (!selectedApp || !previewDocument) return;
    const adjacent = getAdjacentDocument(selectedApp, previewDocument.id, direction);
    const nextPreview = adjacent ? toPreviewDocument(adjacent) : null;
    if (nextPreview) {
      setZoomLevel(1);
      setPreviewDocument(nextPreview);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setSubmitting(true);
    try {
      const isResend = selectedApp.status === 'approved';
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isResend ? 'resend_pin' : 'approve',
          expected_status_updated_at: selectedApp.status_updated_at,
          note: adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve application');

      if (!isResend) {
        const updated = data.application;
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApp.id ? { ...a, ...updated } : a))
        );
        setSelectedApp((prev) => (prev ? { ...prev, ...updated } : null));
      }
      showToast(isResend ? 'A new PIN was emailed to the applicant.' : 'Application approved and PIN emailed.', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (action: 'start_review' | 'request_changes' | 'reject') => {
    if (!selectedApp) return;
    const requiresNote = action !== 'start_review';
    const validation = validateSafeText(adminNotes, { min: requiresNote ? 1 : 0, max: 500 });
    if (!validation.ok) {
      setNotesError(validation.error);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          expected_status_updated_at: selectedApp.status_updated_at,
          note: validation.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update application status.');
      const updated = data.application;

      setApplications((prev) =>
        prev.map((a) => a.id === selectedApp.id ? { ...a, ...updated } : a)
      );
      setSelectedApp((prev) => prev ? { ...prev, ...updated } : null);
      setAdminNotes(updated.status_note || '');
      setNotesError('');
      showToast(
        action === 'start_review' ? 'Application moved to review.' :
          action === 'request_changes' ? 'Changes requested from applicant.' : 'Application rejected.',
        action === 'reject' ? 'error' : 'success'
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Rejection failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasMultipleDocuments = selectedApp
    ? getApplicationDocuments(selectedApp).filter((item) => item.asset.full_url && item.asset.file_type).length > 1
    : false;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Frameless Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-brand-navy-500 dark:text-white">
            Owner Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Review permits and manage beach owner applications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-brand-navy-500 dark:hover:border-brand-teal-600 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh applications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-teal-600' : 'text-slate-500 dark:text-neutral-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-3xl bg-white dark:bg-neutral-900 border text-left shadow-xs transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-brand-navy-500 dark:border-brand-teal-600 ring-2 ring-brand-teal-400/15'
              : 'border-slate-200 dark:border-neutral-800 hover:border-brand-navy-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Total
            </span>
            <FileText className="w-4 h-4 text-brand-navy-500 dark:text-brand-teal-300" strokeWidth={2.2} />
          </div>
          <div className="mt-3 text-3xl font-black text-brand-navy-500 dark:text-white leading-none">
            {loading ? '...' : stats.total}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-5 rounded-3xl bg-white dark:bg-neutral-900 border text-left shadow-xs transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'border-brand-sun-500 ring-2 ring-brand-teal-400/15'
              : 'border-slate-200 dark:border-neutral-800 hover:border-brand-sun-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Pending
            </span>
            <Clock className="w-4 h-4 text-brand-navy-700" strokeWidth={2.2} />
          </div>
          <div className="mt-3 text-3xl font-black text-brand-navy-700 dark:text-brand-sun-400 leading-none">
            {loading ? '...' : stats.pending}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
          className={`p-5 rounded-3xl bg-white dark:bg-neutral-900 border text-left shadow-xs transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'border-brand-teal-600 ring-2 ring-brand-teal-400/15'
              : 'border-slate-200 dark:border-neutral-800 hover:border-brand-teal-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
            {loading ? '...' : stats.approved}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
          className={`p-5 rounded-3xl bg-white dark:bg-neutral-900 border text-left shadow-xs transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'border-rose-500 ring-2 ring-rose-500/15'
              : 'border-slate-200 dark:border-neutral-800 hover:border-rose-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Rejected
            </span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2.2} />
          </div>
          <div className="mt-3 text-3xl font-black text-rose-600 dark:text-rose-400 leading-none">
            {loading ? '...' : stats.rejected}
          </div>
        </button>
      </div>

      {/* Search Bar and Filter Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search applicant or beach..."
            value={searchQuery}
            maxLength={60}
            onChange={(e) => {
              const filtered = filterAdminSearchInput(e.target.value);
              setSearchQuery(filtered.value);
              setSearchError(filtered.rejected ? SAFE_TEXT_MESSAGES.invalid : '');
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 dark:focus:ring-brand-teal-400 placeholder:text-slate-400 shadow-2xs"
          />
          {searchError && <p role="alert" className="mt-1 px-4 text-xs text-rose-600">{searchError}</p>}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-48">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value === 'all' || isApplicationStatus(value) ? value : 'all');
              }}
              aria-label="Filter applications by status"
              className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-800 dark:text-white text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 dark:focus:ring-brand-teal-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="draft">In progress</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under review</option>
              <option value="needs_changes">Needs changes</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {loading && applications.length === 0 ? (
          <div className="py-20 text-center">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-brand-navy-500 dark:text-brand-teal-300" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <FileText className="w-9 h-9 mx-auto text-slate-300 dark:text-neutral-700" />
            {loadError ? (
              <>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Could not load applications</p>
                <p className="text-xs">{loadError}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-brand-navy-500 dark:text-brand-teal-300">No applications found</p>
                <p className="text-xs">Existing beach listings are managed separately.</p>
                <Link
                  href="/admin/beaches"
                  className="inline-flex mt-2 text-xs font-bold text-brand-teal-700 dark:text-brand-teal-300 hover:underline"
                >
                  View beach listings
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-black/40 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-4 px-6">Applicant</th>
                  <th className="py-4 px-6 whitespace-nowrap">Beach</th>
                  <th className="py-4 px-6 whitespace-nowrap">Application Status</th>
                  <th className="py-4 px-6 whitespace-nowrap">Date</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80 text-slate-700 dark:text-neutral-300">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-teal-100 dark:bg-brand-teal-700/80 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {app.applicant_full_name ? app.applicant_full_name.charAt(0) : 'A'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                            {app.applicant_full_name}
                          </span>
                          <span className="text-slate-400 text-xs dark:text-neutral-400 block truncate">
                            {app.applicant_email}
                          </span>
                          {app.account_status ? (
                            <span
                              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                app.account_status === 'suspended'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                  : app.account_status === 'under_review'
                                    ? 'bg-brand-sun-50 text-brand-navy-700 dark:bg-brand-navy-900/50 dark:text-brand-sun-300'
                                    : 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-900/40 dark:text-brand-teal-300'
                              }`}
                              title={app.account_status_reason || undefined}
                            >
                              Account: {app.account_status.replaceAll('_', ' ')}
                            </span>
                          ) : (
                            <span className="mt-1 block text-[10px] text-slate-400">No linked account</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold text-sm text-brand-navy-500 dark:text-brand-teal-300 block">
                        {app.beach_name}
                      </span>
                      <span className="text-slate-400 text-xs dark:text-neutral-400 block">
                        {app.business_name}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          app.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : app.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              : 'bg-brand-sun-50 text-brand-navy-700 dark:bg-brand-navy-900/50 dark:text-brand-sun-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            app.status === 'approved'
                              ? 'bg-emerald-500'
                              : app.status === 'rejected'
                                ? 'bg-rose-500'
                                : 'bg-brand-sun-500'
                          }`}
                        />
                        <span>{app.status.replaceAll('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap text-slate-500 dark:text-neutral-400 font-medium">
                      {new Date(app.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(event) => void handleOpenView(app, event.currentTarget)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-navy-500 hover:bg-brand-navy-600 text-white dark:bg-brand-teal-600 dark:hover:bg-brand-teal-600 rounded-full font-bold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* APPLICATION DETAILS MODAL (Opened when clicking "View")                   */}
      {/* ========================================================================= */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !previewDocument) closeDetailsRef.current();
          }}
        >
          <div
            ref={detailsDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-view-title"
            className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:flex-row dark:border-neutral-800 dark:bg-neutral-900"
          >
            <aside className="flex w-full flex-shrink-0 flex-col gap-5 overflow-y-auto bg-brand-teal-700 p-6 text-white md:w-72">
              <div className="flex flex-col items-center text-center">
                <ApplicantAvatar
                  key={selectedApp.applicant_profile_image_url || 'no-profile-image'}
                  imageUrl={selectedApp.applicant_profile_image_url}
                  name={selectedApp.applicant_full_name || selectedApp.applicant_name || 'Applicant'}
                />
                <h3 className="mt-3 break-words text-base font-extrabold">
                  {selectedApp.applicant_full_name || selectedApp.applicant_name || 'Not provided'}
                </h3>
                <p className="mt-1 text-xs font-medium text-brand-teal-100">Beach owner applicant</p>
              </div>
              <dl className="space-y-4 text-xs">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-teal-200">Email</dt>
                  <dd className="mt-1 break-all font-semibold">{selectedApp.applicant_email || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-teal-200">Phone</dt>
                  <dd className="mt-1 font-semibold">{selectedApp.contact_phone || selectedApp.contact_info || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-teal-200">Submitted</dt>
                  <dd className="mt-1 font-semibold">
                    {new Date(selectedApp.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-teal-200">Linked account</dt>
                  <dd className="mt-1 font-semibold">
                    {selectedApp.account_status
                      ? `Has a linked account · ${selectedApp.account_status.replaceAll('_', ' ')}`
                      : 'No linked account yet'}
                  </dd>
                  {selectedApp.account_status_reason && (
                    <dd className="mt-1 whitespace-pre-wrap text-brand-teal-100">
                      {selectedApp.account_status === 'suspended' ? 'Reason: ' : 'Note: '}{selectedApp.account_status_reason}
                    </dd>
                  )}
                </div>
              </dl>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <header className="flex flex-shrink-0 items-start gap-3 border-b border-slate-100 p-5 dark:border-neutral-800 sm:p-6">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-900/40 dark:text-brand-teal-300">
                  <Palmtree className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 id="application-view-title" className="truncate text-lg font-extrabold text-brand-navy-500 dark:text-white">
                      {selectedApp.beach_name}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                      selectedApp.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : selectedApp.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-brand-sun-50 text-brand-navy-700 dark:bg-brand-navy-900/60 dark:text-brand-sun-300'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        selectedApp.status === 'approved' ? 'bg-emerald-500' : selectedApp.status === 'rejected' ? 'bg-rose-500' : 'bg-brand-sun-500'
                      }`} />
                      {selectedApp.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-neutral-400">
                    {selectedApp.beach_location || 'Location not provided'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close application details"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                <section aria-labelledby="application-documents-title" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 id="application-documents-title" className="text-sm font-extrabold text-brand-navy-500 dark:text-white">Documents to check</h4>
                  {loadingDetail && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading files...</span>
                    </span>
                  )}
                </div>

                {documentMessage && (
                  <div className="rounded-2xl border border-brand-sun-200 bg-brand-sun-50 px-3.5 py-2 text-xs text-brand-navy-700 dark:border-brand-navy-800 dark:bg-brand-navy-900/40 dark:text-brand-sun-300">
                    {documentMessage}
                  </div>
                )}

                <div className="space-y-2.5">
                  {getApplicationDocuments(selectedApp).map((document) => (
                    <ApplicationDocumentRow
                      key={`${document.id}:${document.asset.thumbnail_url || document.asset.full_url || ''}`}
                      document={document}
                      loading={loadingDetail}
                      onOpen={openDocument}
                    />
                  ))}
                </div>
                </section>

              <section aria-labelledby="application-history-title" className="space-y-3">
                <h4 id="application-history-title" className="text-sm font-extrabold text-brand-navy-500 dark:text-white">What happened so far</h4>
                {historyLoading && <p className="text-xs text-slate-500" role="status">Loading history…</p>}
                {historyError && <p className="text-xs text-rose-600" role="alert">{historyError}</p>}
                {!historyLoading && !historyError && applicationHistory?.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400">No application history yet.</p>
                )}
                {applicationHistory && applicationHistory.length > 0 && (
                  <ol className="space-y-4">
                    {applicationHistory.map((item, index) => (
                      <li key={item.id} className="relative flex gap-3 text-xs">
                        <span className="relative flex w-3 flex-shrink-0 justify-center">
                          {index < applicationHistory.length - 1 && <span className="absolute top-3 h-full w-px bg-brand-teal-200 dark:bg-brand-teal-800" />}
                          <span className="z-10 mt-1 h-2.5 w-2.5 rounded-full bg-brand-teal-600 ring-2 ring-white dark:bg-brand-teal-400 dark:ring-neutral-900" />
                        </span>
                        <span className="min-w-0 flex-1 pb-1">
                          <span className="block font-bold capitalize text-slate-800 dark:text-neutral-100">
                            {item.from_status ? `${item.from_status.replaceAll('_', ' ')} → ` : ''}
                            {item.to_status.replaceAll('_', ' ')}
                          </span>
                          {item.note && <span className="mt-1 block whitespace-pre-wrap text-slate-600 dark:text-neutral-300">{item.note}</span>}
                          <span className="mt-1 block text-slate-400">
                            by {item.changed_by_name} · {new Date(item.created_at).toLocaleString()}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="application-admin-notes" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </label>
                <textarea
                  id="application-admin-notes"
                  rows={2}
                  value={adminNotes}
                  maxLength={500}
                  onChange={(e) => {
                    setAdminNotes(e.target.value);
                    const validation = validateSafeText(e.target.value, { max: 500 });
                    setNotesError(validation.ok ? '' : validation.error);
                  }}
                  disabled={selectedApp.status !== 'pending' && selectedApp.status !== 'under_review'}
                  placeholder="Optional notes or rejection reason..."
                  className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 dark:focus:ring-brand-teal-400 disabled:bg-slate-50 dark:disabled:bg-neutral-800/50 disabled:text-slate-400"
                />
                {notesError && <p role="alert" className="text-xs text-rose-600">{notesError}</p>}
                <p className="text-right text-[10px] text-slate-400">{adminNotes.length}/500</p>
            </div>
            </div>

            <footer className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-neutral-800 dark:bg-black/30 sm:px-6">
            {selectedApp.status === 'pending' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleTransition('start_review')}
                  className="rounded-full bg-brand-sun-500 px-5 py-2 text-xs font-bold text-brand-navy-700 shadow-xs transition-colors hover:bg-brand-sun-600 disabled:opacity-50"
                >
                  Start review
                </button>
              )}

              {selectedApp.status === 'under_review' && (
                <>
                  <button
                    type="button"
                    disabled={submitting || Boolean(notesError) || !adminNotes.trim()}
                    onClick={() => void handleTransition('request_changes')}
                    className="rounded-full bg-brand-sun-500 px-4 py-2 text-xs font-bold text-brand-navy-700 shadow-xs transition-colors hover:bg-brand-sun-600 disabled:opacity-50"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    disabled={submitting || Boolean(notesError) || !adminNotes.trim()}
                    onClick={() => void handleTransition('reject')}
                    className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedApp.status === 'under_review' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleApprove()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy-500 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-navy-600 active:bg-brand-navy-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Approve</span>
                </button>
              )}
              </footer>
            </section>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewDocument(null);
          }}
        >
          <div
            ref={previewDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-document-title"
            className="relative flex max-h-[95dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-950 text-white shadow-2xl"
          >
            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <h3 id="application-document-title" className="min-w-0 flex-1 truncate text-sm font-bold">
                {previewDocument.title}
              </h3>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {previewDocument.fileType === 'image' && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                    <button type="button" aria-label="Zoom out" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))} className="rounded-full p-1 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-xs font-semibold">{Math.round(zoomLevel * 100)}%</span>
                    <button type="button" aria-label="Zoom in" onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))} className="rounded-full p-1 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Reset zoom" onClick={() => setZoomLevel(1)} className="rounded-full p-1 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <a href={previewDocument.url} target="_blank" rel="noopener noreferrer" aria-label="Open document in new tab" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Open in new tab</span>
                </a>
                <a href={previewDocument.downloadUrl} download aria-label="Download document" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button type="button" onClick={() => setPreviewDocument(null)} aria-label="Close document preview" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-xs font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <span>Close</span>
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center gap-2 overflow-auto bg-black/40 p-3 sm:p-5">
              {hasMultipleDocuments && (
                <button
                  type="button"
                  aria-label="Previous document"
                  onClick={() => navigateDocument(-1)}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {previewDocument.fileType === 'pdf' ? (
                <iframe
                  src={previewDocument.url}
                  className="h-[78dvh] max-h-[78dvh] w-full min-w-0 rounded-lg border-0 bg-white"
                  title={`Preview ${previewDocument.title}`}
                />
              ) : (
                <img
                  src={previewDocument.url}
                  alt={previewDocument.title}
                  className="max-h-[80dvh] max-w-full rounded-lg object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              )}
              {hasMultipleDocuments && (
                <button
                  type="button"
                  aria-label="Next document"
                  onClick={() => navigateDocument(1)}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
