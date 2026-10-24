'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  Link2,
  Globe,
  Share2,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

interface BeachLink {
  id: string;
  label: string;
  url: string;
}

export default function ManageOwnerLinksPage() {
  const [links, setLinks] = useState<BeachLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    fetch('/api/owner/beach/links', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load external links.');
        setLinks(Array.isArray(data) ? data : []);
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Failed to load external links.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;

    try {
      const response = await fetch('/api/owner/beach/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel, url: newUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save link.');
      setLinks((current) => [...current, data]);
      setNewLabel('');
      setNewUrl('');
      showToast('External link saved.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to save link.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/owner/beach/links?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove link.');
      setLinks((current) => current.filter((link) => link.id !== id));
      showToast('External link removed.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to remove link.', 'error');
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      <Link
        href="/owner/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Owner Dashboard</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            <Share2 className="w-3.5 h-3.5" />
            <span>Online Presence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-heading">
            External Links &amp; Social Channels
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect your official Facebook page, Instagram profile, or booking portals to appear on your public beach listing.
          </p>
        </div>

        {/* Existing Links List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Connected Links ({links.length})
          </h2>

          {loading ? (
            <p className="py-8 text-center text-xs text-slate-500">Loading saved links...</p>
          ) : links.length === 0 ? (
            <div className="py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No external links added yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                        {link.label}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline truncate block"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Link Form */}
        <form onSubmit={handleAddLink} className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Add New External / Social Link</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link Title / Label *
              </label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Official Facebook Page"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination URL *
              </label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://facebook.com/your-resort"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
