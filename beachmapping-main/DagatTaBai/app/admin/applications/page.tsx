'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Eye,
  Loader2,
  Search,
  Filter,
  ChevronDown,
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
  const [searchQuery, setSearchQuery] = useState('');

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
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      app.applicant_full_name.toLowerCase().includes(searchLower) ||
      app.applicant_email.toLowerCase().includes(searchLower) ||
      app.beach_name.toLowerCase().includes(searchLower) ||
      app.business_name.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Frameless Header in Dive Blue (White in dark mode) */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
          Beach Owner Applications
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
          Review submitted legal business permits and proof of ownership. Approving automatically generates and dispatches secure 6-digit PIN credentials to the proprietor.
        </p>
      </div>

      {/* Search Bar and Filter Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar (Oblong, clean) */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by applicant name, email, or beach/resort name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-black text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-sky-500 focus:border-transparent placeholder:italic placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        {/* Filter Dropdown (Replaces old tabs next to search bar) */}
        <div className="relative flex-shrink-0 sm:w-56">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-black text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-sky-500 cursor-pointer shadow-2xs"
          >
            <option value="all">All Applications ({applications.length})</option>
            <option value="pending">
              Pending Review ({applications.filter((a) => a.status === 'pending').length})
            </option>
            <option value="approved">
              Approved ({applications.filter((a) => a.status === 'approved').length})
            </option>
            <option value="rejected">
              Rejected ({applications.filter((a) => a.status === 'rejected').length})
            </option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white shadow-2xs">
                          Pending Review
                        </span>
                      )}
                      {app.status === 'approved' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                          Approved
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-2xs">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white dark:bg-sky-600 dark:hover:bg-sky-500 rounded-full font-bold text-xs transition-all shadow-xs"
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
