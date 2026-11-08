'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Palmtree,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

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

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.applications && Array.isArray(data.applications)) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
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
    void fetchApplications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchApplications();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
  const handleOpenView = async (app: ApplicationItem) => {
    setSelectedApp(app);
    setAdminNotes(app.rejection_reason || '');
    setDocumentMessage(null);
    setLoadingDetail(true);

    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data?.application) {
        setSelectedApp(data.application);
        setAdminNotes(data.application.rejection_reason || '');
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
          applicant_email: selectedApp.applicant_email,
          applicant_name: selectedApp.applicant_full_name || selectedApp.applicant_name || 'Beach Owner',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve application');

      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'approved' } : a))
      );
      setSelectedApp((prev) => (prev ? { ...prev, status: 'approved' } : null));
      showToast(`Approved! 6-digit PIN emailed to ${selectedApp.applicant_email}.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setSubmitting(true);
    try {
      const reason = adminNotes.trim() || 'Incomplete business permits or permit mismatch.';
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          applicant_email: selectedApp.applicant_email,
          applicant_name: selectedApp.applicant_full_name || selectedApp.applicant_name || 'Beach Owner',
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-[#1F3F74] dark:hover:border-[#4987BA] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh applications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : 'text-slate-500 dark:text-neutral-400'}`} />
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
              ? 'border-[#1F3F74] dark:border-[#4987BA] ring-2 ring-[#1F3F74]/15'
              : 'border-slate-200 dark:border-neutral-800 hover:border-[#1F3F74]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Total
            </span>
            <FileText className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" strokeWidth={2.2} />
          </div>
          <div className="mt-3 text-3xl font-black text-[#1F3F74] dark:text-white leading-none">
            {loading ? '...' : stats.total}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-5 rounded-3xl bg-white dark:bg-neutral-900 border text-left shadow-xs transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'border-yellow-500 ring-2 ring-yellow-500/15'
              : 'border-slate-200 dark:border-neutral-800 hover:border-yellow-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Pending
            </span>
            <Clock className="w-4 h-4 text-yellow-500" strokeWidth={2.2} />
          </div>
          <div className="mt-3 text-3xl font-black text-yellow-500 dark:text-yellow-400 leading-none">
            {loading ? '...' : stats.pending}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
          className={`p-5 rounded-3xl bg-white dark:bg-neutral-900 border text-left shadow-xs transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'border-emerald-500 ring-2 ring-emerald-500/15'
              : 'border-slate-200 dark:border-neutral-800 hover:border-emerald-500'
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-sky-500 placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-48">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter applications by status"
              className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-sky-500 cursor-pointer shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
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
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#1F3F74] dark:text-[#4987BA]" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <FileText className="w-9 h-9 mx-auto text-slate-300 dark:text-neutral-700" />
            <p className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">No applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-black/40 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-4 px-6">Applicant</th>
                  <th className="py-4 px-6 whitespace-nowrap">Beach</th>
                  <th className="py-4 px-6 whitespace-nowrap">Status</th>
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

                    <td className="py-4 px-6 whitespace-nowrap">
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
                        onClick={() => void handleOpenView(app)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white dark:bg-sky-600 dark:hover:bg-sky-500 rounded-full font-bold text-xs transition-all shadow-xs cursor-pointer"
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
                        selectedApp.live_selfie_url || selectedApp.live_selfie_path || '/images/logo.png',
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
                  disabled={selectedApp.status !== 'pending'}
                  placeholder="Optional notes or rejection reason..."
                  className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-sky-500 disabled:bg-slate-50 dark:disabled:bg-neutral-800/50 disabled:text-slate-400"
                />
              </div>
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
                  disabled={submitting}
                  onClick={() => void handleReject()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-xs cursor-pointer"
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
