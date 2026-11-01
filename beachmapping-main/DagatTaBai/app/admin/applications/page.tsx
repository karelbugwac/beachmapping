'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
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
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' });
      if (!res.ok) {
        console.warn('Applications fetch status:', res.status);
        return;
      }
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

  useEffect(() => {
    void fetchApplications();
    // Automatic 30-second background polling
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Frameless Header in Dive Blue */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
          Beach Owner Applications
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-2xl">
          Review submitted legal business permits and proof of ownership. Approving automatically generates and dispatches secure 6-digit PIN credentials to the proprietor.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-3 text-xs overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
          const count = applications.filter((a) => tab === 'all' || a.status === tab).length;
          const isActive = statusFilter === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-full font-bold capitalize transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1F3F74] text-white shadow-xs dark:bg-[#4987BA]'
                  : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-[#1F3F74] dark:hover:text-white'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Main List Table / Cards */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {loading && applications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-neutral-400">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-[#1F3F74] dark:text-[#4987BA]" />
            <p className="text-xs font-semibold">Loading submitted applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-20 text-center text-slate-500 dark:text-neutral-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-neutral-600" />
            <p className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">No applications in this category</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500">
              New submissions from resort proprietors will automatically sync here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-black/50 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Applicant &amp; Email</th>
                  <th className="py-4 px-6">Beach &amp; Business Name</th>
                  <th className="py-4 px-6">Date Submitted</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-slate-700 dark:text-neutral-300">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {app.applicant_full_name}
                      </span>
                      <span className="text-slate-400 text-xs dark:text-neutral-400">
                        {app.applicant_email}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#1F3F74] dark:text-[#4987BA] block text-sm">
                        {app.beach_name}
                      </span>
                      <span className="text-slate-500 text-xs dark:text-neutral-400">
                        {app.business_name}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-neutral-400 font-medium">
                      {new Date(app.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      {app.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                      {app.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F3F74]/10 hover:bg-[#1F3F74] text-[#1F3F74] hover:text-white dark:bg-[#4987BA]/20 dark:hover:bg-[#4987BA] dark:text-[#4987BA] dark:hover:text-white rounded-full font-bold text-xs transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
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
