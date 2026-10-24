'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

interface ApplicationItem {
  id: string;
  applicant_full_name: string;
  applicant_email: string;
  business_name: string;
  beach_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load applications.');
      const data = await res.json();
      if (data.applications && Array.isArray(data.applications)) {
        setApplications(data.applications);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      showToast(err instanceof Error ? err.message : 'Failed to load applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void fetchApplications(), 0);
    const interval = window.setInterval(() => void fetchApplications(), 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-white dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Beach Owner Applications</h1>
          <p className="text-xs text-slate-500 dark:text-gray-300">
            Review submitted legal documents and approve accounts to auto-generate and email 6-digit staff PINs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchApplications()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors dark:bg-black dark:border-black dark:text-white dark:hover:bg-gray-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-black pb-2 text-xs">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1 rounded-full font-semibold capitalize transition-colors ${
              statusFilter === tab ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {tab} ({applications.filter((a) => tab === 'all' || a.status === tab).length})
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-black shadow-sm overflow-hidden">
        {loading && applications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-gray-300">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
            <p className="text-xs">Loading submitted applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-gray-300 space-y-3">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No applications found in this category.</p>
            <p className="text-[11px] text-slate-400 dark:text-gray-400">
              New submissions from <Link href="/apply" className="text-sky-600 underline">/apply</Link> will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 dark:border-black text-slate-500 dark:text-gray-300 uppercase tracking-wider font-semibold dark:bg-gray-900">
                <tr>
                  <th className="py-3.5 px-4">Applicant & Email</th>
                  <th className="py-3.5 px-4">Beach & Business Name</th>
                  <th className="py-3.5 px-4">Date Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-slate-700 dark:text-gray-300">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{app.applicant_full_name}</span>
                      <span className="text-slate-400 text-[11px] dark:text-gray-400">{app.applicant_email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-white block">{app.beach_name}</span>
                      <span className="text-slate-500 text-[11px] dark:text-gray-400">{app.business_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-gray-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {app.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 uppercase">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {app.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 uppercase">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md font-semibold text-xs transition-colors dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
