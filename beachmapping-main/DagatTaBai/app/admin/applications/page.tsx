'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Eye,
  Loader2,
  Search,
  RefreshCw,
  XCircle,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Palmtree,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { CoastalEmptyState } from '@/components/ui/coastal-empty-state';
import { notifyRealtimeSync, useRealtimeSync } from '@/lib/realtime-sync';
import { getApplicationNotesDisplay } from '@/lib/utils/application-review-notes';

interface ApplicationItem {
  id: string;
  applicant_full_name: string;
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

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state when "View" is clicked
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchApplications = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load applications.');
      const data = await res.json();
      if (!Array.isArray(data?.applications)) throw new Error('Application response was invalid.');
      setApplications(data.applications);
      setLoadError(false);
      return true;
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setLoadError(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const refreshed = await fetchApplications();
    setRefreshing(false);
    showToast(
      refreshed ? 'Applications refreshed.' : 'Applications could not be refreshed. Please try again.',
      refreshed ? 'success' : 'error'
    );
  };

  useEffect(() => {
    void fetchApplications();
  }, []);

  useRealtimeSync(() => {
    void fetchApplications();
  });

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

  const notesDisplay = selectedApp
    ? getApplicationNotesDisplay(selectedApp.status, selectedApp.rejection_reason)
    : null;

  // Open View Modal & load signed document URLs
  const handleOpenView = async (app: ApplicationItem) => {
    setSelectedApp(app);
    setAdminNotes(app.status === 'pending' ? '' : app.rejection_reason || '');
    setDocumentMessage(null);
    setLoadingDetail(true);

    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data?.application) {
        setSelectedApp(data.application);
        setAdminNotes(
          data.application.status === 'pending' ? '' : data.application.rejection_reason || ''
        );
      }
    } catch {
      // Keep initial row data if detail fetch fails
    } finally {
      setLoadingDetail(false);
    }
  };

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

  const handleApprove = async () => {
    if (!selectedApp) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve application');

      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'approved' } : a))
      );
      setSelectedApp((prev) => (prev ? { ...prev, status: 'approved' } : null));
      notifyRealtimeSync('all');
      showToast(`Approved! 6-digit PIN emailed to ${selectedApp.applicant_email}.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    const reason = adminNotes.trim();
    if (!reason) {
      showToast('Add a rejection reason in Notes before rejecting.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject application');

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id ? { ...a, status: 'rejected', rejection_reason: reason } : a
        )
      );
      setSelectedApp((prev) =>
        prev ? { ...prev, status: 'rejected', rejection_reason: reason } : null
      );
      notifyRealtimeSync('applications');
      showToast('Application rejected.', 'error');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Rejection failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Frameless Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
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
            className="inline-flex min-h-11 items-center gap-2 border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-brand-600 active:bg-slate-100 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-sky-400"
            title="Refresh applications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : 'text-slate-500 dark:text-neutral-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search applicant or beach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search owner applications"
            className="min-h-11 w-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </div>

        {(searchQuery || statusFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="min-h-11 border border-slate-200 px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Reset filters
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Filter applications by status"
        className="grid grid-cols-2 border-y border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-4"
      >
        {([
          ['all', 'All', stats.total],
          ['pending', 'Pending', stats.pending],
          ['approved', 'Approved', stats.approved],
          ['rejected', 'Rejected', stats.rejected],
        ] as const).map(([status, label, count]) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            aria-pressed={statusFilter === status}
            className={`flex min-h-14 items-center justify-between gap-3 border-b border-l-2 border-l-transparent border-slate-200 px-4 text-left text-sm transition-colors last:border-b-0 hover:bg-slate-50 active:bg-slate-100 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 sm:border-b-0 sm:border-r sm:last:border-r-0 ${
              statusFilter === status
                ? 'border-l-brand-600 bg-slate-50 font-semibold text-brand-700 dark:bg-neutral-800 dark:text-sky-300'
                : 'text-slate-600 dark:text-neutral-300'
            }`}
          >
            <span>{label}</span>
            <span className="tabular-nums text-slate-500 dark:text-neutral-400">
              {loading ? '...' : count}
            </span>
          </button>
        ))}
      </div>

      {/* Main List Table */}
      <div className="border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {loadError && applications.length === 0 ? (
          <div className="py-12">
            <CoastalEmptyState
              variant="error"
              title="Applications are unavailable"
              description="The application list could not be loaded. Try again."
              action={
                <button
                  type="button"
                  onClick={() => void fetchApplications()}
                  disabled={loading}
                  className="min-h-11 border border-brand-600 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:opacity-60 dark:text-sky-300 dark:hover:bg-neutral-800"
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </button>
              }
            />
          </div>
        ) : loading && applications.length === 0 ? (
          <div className="py-20 text-center" role="status" aria-label="Loading applications">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#1F3F74] dark:text-[#4987BA]" />
            <p className="mt-3 text-sm text-slate-600 dark:text-neutral-400">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-12">
            <CoastalEmptyState
              title="No applications found"
              description="Try adjusting the filters or check back when new owner applications arrive."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] table-fixed text-xs">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[26%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-slate-50/80 dark:bg-black/40 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th scope="col" className="py-4 px-6">Applicant</th>
                  <th scope="col" className="py-4 px-6">Beach</th>
                  <th scope="col" className="py-4 px-6 text-center">Status</th>
                  <th scope="col" className="py-4 px-6 text-center">Date</th>
                  <th scope="col" className="py-4 px-6 text-right">Actions</th>
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
                        <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {app.applicant_full_name ? app.applicant_full_name.charAt(0) : 'A'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                            {app.applicant_full_name}
                          </span>
                          <span className="text-slate-400 text-xs dark:text-neutral-400 block truncate">
                            {app.applicant_email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA] block">
                        {app.beach_name}
                      </span>
                      <span className="text-slate-400 text-xs dark:text-neutral-400 block">
                        {app.business_name}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          app.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : app.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            app.status === 'approved'
                              ? 'bg-emerald-500'
                              : app.status === 'rejected'
                                ? 'bg-rose-500'
                                : 'bg-yellow-500'
                          }`}
                        />
                        <span>{app.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap text-slate-500 dark:text-neutral-400 font-medium tabular-nums">
                      {new Date(app.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => void handleOpenView(app)}
                        className="inline-flex min-h-11 items-center gap-1.5 bg-[#1F3F74] px-4 py-2 text-white transition-colors hover:bg-[#153651] active:bg-[#102b40] dark:bg-sky-700 dark:hover:bg-sky-600"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center text-lg font-extrabold uppercase flex-shrink-0">
                  <Palmtree className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-extrabold text-[#1F3F74] dark:text-white truncate">
                      {selectedApp.beach_name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        selectedApp.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : selectedApp.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedApp.status === 'approved'
                            ? 'bg-emerald-500'
                            : selectedApp.status === 'rejected'
                              ? 'bg-rose-500'
                              : 'bg-yellow-500'
                        }`}
                      />
                      <span>{selectedApp.status}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                    {selectedApp.business_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Applicant Info Grid */}
              <div className="grid grid-cols-2 gap-3.5 text-xs bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Applicant
                  </span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                    {selectedApp.applicant_full_name || selectedApp.applicant_name || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Email
                  </span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block truncate">
                    {selectedApp.applicant_email}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Phone
                  </span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                    {selectedApp.contact_phone || selectedApp.contact_info || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Submitted
                  </span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                    {new Date(selectedApp.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Documents
                  </span>
                  {loadingDetail && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading files...</span>
                    </span>
                  )}
                </div>

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
                        selectedApp.business_permit_url || selectedApp.business_permit_path,
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
                        selectedApp.proof_of_ownership_url ||
                          selectedApp.proof_of_ownership_path ||
                          selectedApp.ownership_proof_path,
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
                        selectedApp.live_selfie_url || selectedApp.live_selfie_path || '/logo.png',
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

              {notesDisplay?.kind === 'input' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="application-rejection-reason"
                    className="block text-xs font-semibold text-slate-700 dark:text-neutral-300"
                  >
                    Rejection reason <span className="text-rose-700 dark:text-rose-300">(required)</span>
                  </label>
                  <textarea
                    id="application-rejection-reason"
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    required
                    aria-required="true"
                    placeholder="Explain what needs to be corrected."
                    className="min-h-24 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-black dark:text-white"
                  />
                </div>
              )}

              {notesDisplay?.kind === 'reason' && (
                <div className="border-l-2 border-rose-600 bg-rose-50 px-4 py-3 dark:border-rose-400 dark:bg-rose-950/30">
                  <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                    Rejection reason
                  </h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-rose-800 dark:text-rose-300">
                    {notesDisplay.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50/70 dark:bg-black/30 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedApp.status === 'pending' && (
                <button
                  type="button"
                  disabled={submitting || !adminNotes.trim()}
                  onClick={() => void handleReject()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full transition-colors shadow-xs cursor-pointer"
                >
                  Reject
                </button>
              )}

              {(selectedApp.status === 'pending' || selectedApp.status === 'approved') && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleApprove()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{selectedApp.status === 'approved' ? 'Resend PIN' : 'Approve'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
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
