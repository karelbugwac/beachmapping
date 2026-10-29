'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Eye, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { showToast } from '@/components/ui/feedback-toasts';

function formatHours(hours: string | Record<string, string>): string {
  if (typeof hours === 'string') return hours;
  if (typeof hours === 'object' && hours !== null) {
    const list = Object.values(hours).filter(h => h && h !== 'CLOSE' && h !== 'Closed');
    if (list.length > 0) return String(list[0]);
  }
  return 'Not set';
}

export default function AdminBeachesPage() {
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/beaches', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load beach listings.');
        if (Array.isArray(data)) setBeaches(data);
      })
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Failed to load beach listings.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggleBeachStatus = async (beach: BeachRecord) => {
    const status = beach.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch('/api/admin/beaches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: beach.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update beach status.');
      setBeaches((current) => current.map((item) => item.id === beach.id ? { ...item, status: data.beach.status } : item));
      showToast(`Beach listing ${status === 'active' ? 'activated' : 'suspended'}.`);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update beach status.', 'error');
    }
  };

  const deleteBeach = async (beach: BeachRecord) => {
    if (!confirm(`Are you sure you want to delete "${beach.name}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch('/api/admin/beaches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: beach.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete beach listing.');
      setBeaches((current) => current.filter((item) => item.id !== beach.id));
      showToast('Beach listing deleted successfully.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to delete beach listing.', 'error');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-white dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Beach Listings Moderation</h1>
          <p className="text-xs text-slate-500 dark:text-gray-300">
            View, moderate, and activate or suspend beach listings across Catmon.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-black shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:border-black text-slate-500 dark:text-gray-300 uppercase tracking-wider font-semibold dark:bg-gray-900">
              <tr>
                <th className="py-3.5 px-4">Beach Name & Location</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Operating Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-slate-700 dark:text-gray-300">
              {!loading && beaches.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-slate-500 dark:text-gray-300">No beach listings found.</td></tr>}
              {beaches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">{b.name}</span>
                    <span className="text-slate-400 text-[11px] dark:text-gray-400">{b.location}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-amber-600">
                    ★ {b.average_rating.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-gray-300">{formatHours(b.opening_hours)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        b.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      href={`/beaches/${b.slug || b.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition-colors dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-black dark:border"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void toggleBeachStatus(b)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                        b.status === 'active'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {b.status === 'active' ? (
                        <>
                          <Ban className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteBeach(b)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-semibold text-xs transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
