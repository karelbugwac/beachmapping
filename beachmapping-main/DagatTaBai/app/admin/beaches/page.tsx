'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Compass,
  Eye,
  Ban,
  CheckCircle2,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  Check,
  X,
  Edit,
  Plus,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Crosshair,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { showToast } from '@/components/ui/feedback-toasts';
import { VirtualTourModal, extractTourEmbedUrl } from '@/components/virtual-tour-modal';
import { LocationPickerModal } from '@/components/map/location-picker-modal';
import type { TourRequestWithBeach } from '@/lib/services/tourRequests';
import type { CoordinateRequestWithBeach } from '@/lib/services/coordinateRequests';

function formatHours(hours: string | Record<string, string>): string {
  if (typeof hours === 'string') return hours;
  if (typeof hours === 'object' && hours !== null) {
    const list = Object.values(hours).filter((h) => h && h !== 'CLOSE' && h !== 'Closed');
    if (list.length > 0) return String(list[0]);
  }
  return 'Not set';
}

export default function AdminBeachesPage() {
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tourRequests, setTourRequests] = useState<TourRequestWithBeach[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Coordinate requests state
  const [coordinateRequests, setCoordinateRequests] = useState<CoordinateRequestWithBeach[]>([]);
  const [loadingCoordRequests, setLoadingCoordRequests] = useState(true);

  // Modals state
  const [previewTourUrl, setPreviewTourUrl] = useState<string | null>(null);
  const [previewTourBeachName, setPreviewTourBeachName] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Admin Direct Tour Edit Modal
  const [selectedBeachForTour, setSelectedBeachForTour] = useState<BeachRecord | null>(null);
  const [adminTourInput, setAdminTourInput] = useState('');
  const [isSavingTour, setIsSavingTour] = useState(false);

  // Admin Direct Coordinates Edit Modal (LocationPickerModal)
  const [selectedBeachForCoords, setSelectedBeachForCoords] = useState<BeachRecord | null>(null);

  // Preview Proposed Coordinates Modal (LocationPickerModal)
  const [previewCoordRequest, setPreviewCoordRequest] = useState<CoordinateRequestWithBeach | null>(null);

  // Reject Tour Request Modal
  const [rejectingRequest, setRejectingRequest] = useState<TourRequestWithBeach | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Reject Coordinate Request Modal
  const [rejectingCoordRequest, setRejectingCoordRequest] = useState<CoordinateRequestWithBeach | null>(null);
  const [coordRejectReason, setCoordRejectReason] = useState('');
  const [isProcessingCoordAction, setIsProcessingCoordAction] = useState(false);

  // Fetch beaches
  const fetchBeaches = async () => {
    try {
      const res = await fetch('/api/admin/beaches', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load beach listings.');
      if (Array.isArray(data)) setBeaches(data);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load beach listings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch 360 tour requests
  const fetchTourRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/admin/beaches/tour-requests', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tour requests.');
      if (Array.isArray(data.requests)) {
        setTourRequests(data.requests);
      }
    } catch (err: unknown) {
      console.error('Failed to load tour requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch coordinates requests
  const fetchCoordinateRequests = async () => {
    try {
      setLoadingCoordRequests(true);
      const res = await fetch('/api/admin/beaches/coordinate-requests', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load coordinate requests.');
      if (Array.isArray(data.requests)) {
        setCoordinateRequests(data.requests);
      }
    } catch (err: unknown) {
      console.error('Failed to load coordinate requests:', err);
    } finally {
      setLoadingCoordRequests(false);
    }
  };

  useEffect(() => {
    void fetchBeaches();
    void fetchTourRequests();
    void fetchCoordinateRequests();
  }, []);

  const pendingTourRequests = useMemo(() => {
    return tourRequests.filter((r) => r.status === 'pending');
  }, [tourRequests]);

  const pendingCoordRequests = useMemo(() => {
    return coordinateRequests.filter((r) => r.status === 'pending');
  }, [coordinateRequests]);

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
      setBeaches((current) =>
        current.map((item) => (item.id === beach.id ? { ...item, status: data.beach.status } : item))
      );
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

  // Handle Approve Tour Request
  const handleApproveTour = async (req: TourRequestWithBeach) => {
    try {
      setIsProcessingAction(true);
      const res = await fetch('/api/admin/beaches/tour-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          beach_id: req.beach_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve tour request.');

      showToast(`360° Virtual Tour for "${req.beach?.name || 'Beach'}" approved and published!`, 'success');
      await Promise.all([fetchBeaches(), fetchTourRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to approve tour.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject Tour Request
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    try {
      setIsProcessingAction(true);
      const res = await fetch('/api/admin/beaches/tour-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          beach_id: rejectingRequest.beach_id,
          rejection_reason: rejectReason.trim() || 'Tour submission did not meet publication standards.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject tour request.');

      showToast('360° Virtual Tour request rejected.');
      setRejectingRequest(null);
      setRejectReason('');
      await fetchTourRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reject tour.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Direct Admin Tour Save
  const handleSaveAdminTour = async () => {
    if (!selectedBeachForTour) return;
    const cleanUrl = extractTourEmbedUrl(adminTourInput) || adminTourInput.trim();

    try {
      setIsSavingTour(true);
      const res = await fetch('/api/admin/beaches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBeachForTour.id,
          virtual_tour_url: cleanUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update 360 virtual tour.');

      showToast(
        cleanUrl
          ? `360° Virtual Tour saved and published for "${selectedBeachForTour.name}".`
          : `360° Virtual Tour removed for "${selectedBeachForTour.name}".`,
        'success'
      );
      setSelectedBeachForTour(null);
      setAdminTourInput('');
      await Promise.all([fetchBeaches(), fetchTourRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save virtual tour.', 'error');
    } finally {
      setIsSavingTour(false);
    }
  };

  // Handle Approve Coordinate Request
  const handleApproveCoordinates = async (req: CoordinateRequestWithBeach) => {
    try {
      setIsProcessingCoordAction(true);
      const res = await fetch('/api/admin/beaches/coordinate-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          beach_id: req.beach_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve coordinates.');

      showToast(`Map location & coordinates for "${req.beach?.name || 'Beach'}" approved!`, 'success');
      await Promise.all([fetchBeaches(), fetchCoordinateRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to approve coordinates.', 'error');
    } finally {
      setIsProcessingCoordAction(false);
    }
  };

  // Handle Reject Coordinate Request
  const handleConfirmRejectCoordinates = async () => {
    if (!rejectingCoordRequest) return;
    try {
      setIsProcessingCoordAction(true);
      const res = await fetch('/api/admin/beaches/coordinate-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          beach_id: rejectingCoordRequest.beach_id,
          rejection_reason: coordRejectReason.trim() || 'Coordinates could not be verified by Admin.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject coordinate request.');

      showToast('Beach coordinate update request rejected.');
      setRejectingCoordRequest(null);
      setCoordRejectReason('');
      await fetchCoordinateRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reject coordinates.', 'error');
    } finally {
      setIsProcessingCoordAction(false);
    }
  };

  // Handle Direct Admin Coordinates Save via LocationPickerModal
  const handleSaveAdminCoordinates = async (data: { location: string; latitude: string; longitude: string }) => {
    if (!selectedBeachForCoords) return;
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      showToast('Invalid coordinates provided.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/beaches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBeachForCoords.id,
          location: data.location.trim() || selectedBeachForCoords.location,
          latitude: lat,
          longitude: lng,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update coordinates.');

      showToast(`Saved coordinates for "${selectedBeachForCoords.name}".`, 'success');
      setSelectedBeachForCoords(null);
      await Promise.all([fetchBeaches(), fetchCoordinateRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save coordinates.', 'error');
    }
  };

  // Open Preview Modal
  const openTourPreview = (url: string | null | undefined, name: string) => {
    if (!url) return;
    setPreviewTourUrl(url);
    setPreviewTourBeachName(name);
    setShowPreviewModal(true);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-gray-300 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Admin Dashboard</span>
      </Link>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Manage Beaches, Coordinates &amp; 360° Tours
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              Admin Moderation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Review pending map pin coordinate requests and 360° virtual tours from beach owners, directly adjust listings, or moderate publication statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void fetchBeaches();
              void fetchTourRequests();
              void fetchCoordinateRequests();
              showToast('Refreshed beach, coordinates, and tour data.');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Pending Beach Coordinates & Map Location Requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pending Map Location &amp; Coordinates Requests</span>
                {pendingCoordRequests.length > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white animate-pulse">
                    {pendingCoordRequests.length} Pending
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    All Verified
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Resort owners must ask Admin permission before updating coordinates or map pin placements. Preview and approve them here.
              </p>
            </div>
          </div>
        </div>

        {loadingCoordRequests ? (
          <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-gray-400">Loading coordinate approval requests...</p>
          </div>
        ) : pendingCoordRequests.length === 0 ? (
          <div className="p-6 bg-gradient-to-r from-emerald-50/60 to-blue-50/60 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Pending Coordinate Requests
                </h4>
                <p className="text-xs text-slate-600 dark:text-gray-300">
                  All beach map pin repositioning requests have been processed. You can also edit or reposition pins directly in the table below.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingCoordRequests.map((req) => {
              const beachName = req.beach?.name || 'Unknown Beach';
              return (
                <div
                  key={req.beach_id}
                  className="bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-300 dark:border-amber-700/60 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-lg">
                    Awaiting Admin Approval
                  </div>

                  {/* Beach Header */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white pr-28">
                      {beachName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <span>{req.beach?.location || 'Catmon, Cebu'}</span>
                      {req.owner && (
                        <span>• Submitted by {req.owner.full_name || req.owner.email}</span>
                      )}
                    </p>
                  </div>

                  {/* Proposed Coordinates Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Proposed Latitude
                      </span>
                      <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {Number(req.requested_latitude).toFixed(6)}° N
                      </p>
                      {req.beach?.latitude !== undefined && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Current: {Number(req.beach.latitude).toFixed(4)}°
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Proposed Longitude
                      </span>
                      <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {Number(req.requested_longitude).toFixed(6)}° E
                      </p>
                      {req.beach?.longitude !== undefined && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Current: {Number(req.beach.longitude).toFixed(4)}°
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Proposed Address
                      </span>
                      <p className="text-xs font-medium text-slate-700 dark:text-gray-300 truncate">
                        {req.requested_location || req.beach?.location || 'Unchanged'}
                      </p>
                    </div>
                  </div>

                  {/* Owner Note */}
                  {req.requester_note && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200 block mb-0.5">
                        Owner&apos;s Message:
                      </span>
                      <p className="text-slate-700 dark:text-gray-300 italic">
                        &ldquo;{req.requester_note}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setPreviewCoordRequest(req)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Preview Pin on Map</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingCoordAction}
                      onClick={() => void handleApproveCoordinates(req)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto shadow-xs disabled:opacity-50"
                    >
                      {isProcessingCoordAction ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve &amp; Update Map</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingCoordAction}
                      onClick={() => {
                        setRejectingCoordRequest(req);
                        setCoordRejectReason('');
                      }}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Pending 360 Virtual Tour Requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pending 360° Virtual Tour Requests</span>
                {pendingTourRequests.length > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white animate-pulse">
                    {pendingTourRequests.length} Pending
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    All Approved
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Resort owners must ask Admin permission before publishing 360° tours. Preview and approve them here.
              </p>
            </div>
          </div>
        </div>

        {loadingRequests ? (
          <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-gray-400">Loading tour approval requests...</p>
          </div>
        ) : pendingTourRequests.length === 0 ? (
          <div className="p-6 bg-gradient-to-r from-emerald-50/60 to-blue-50/60 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Pending 360° Tour Requests
                </h4>
                <p className="text-xs text-slate-600 dark:text-gray-300">
                  All beach owner virtual tour submissions have been processed. You can also edit or assign tours directly in the table below.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTourRequests.map((req) => {
              const cleanEmbed = extractTourEmbedUrl(req.requested_tour_url);
              const beachName = req.beach?.name || 'Unknown Beach';
              return (
                <div
                  key={req.beach_id}
                  className="bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-300 dark:border-amber-700/60 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-lg">
                    Awaiting Admin Approval
                  </div>

                  {/* Beach Header */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white pr-28">
                      {beachName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <span>{req.beach?.location || 'Catmon, Cebu'}</span>
                      {req.owner && (
                        <span>• Submitted by {req.owner.full_name || req.owner.email}</span>
                      )}
                    </p>
                  </div>

                  {/* Owner Note */}
                  {req.requester_note && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200 block mb-0.5">
                        Owner&apos;s Message:
                      </span>
                      <p className="text-slate-700 dark:text-gray-300 italic">
                        &ldquo;{req.requester_note}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Tour URL Info */}
                  <div className="p-2.5 bg-slate-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-slate-700 dark:text-gray-300 break-all border border-slate-200 dark:border-gray-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Proposed Tour URL / Embed:
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400">
                      {cleanEmbed || req.requested_tour_url}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => openTourPreview(req.requested_tour_url, beachName)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview 360° Tour</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => void handleApproveTour(req)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto shadow-xs disabled:opacity-50"
                    >
                      {isProcessingAction ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve &amp; Publish</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => {
                        setRejectingRequest(req);
                        setRejectReason('');
                      }}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Beach Listings Table with 360 Tour Controls */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              All Beach Listings
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Manage 360 tours, statuses, and public availability across all resorts.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold dark:bg-gray-900">
                <tr>
                  <th className="py-3.5 px-4">Beach Name &amp; Location</th>
                  <th className="py-3.5 px-4">Map Coordinates &amp; Pin</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Operating Hours</th>
                  <th className="py-3.5 px-4">Listing Status</th>
                  <th className="py-3.5 px-4">360° Virtual Tour</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-slate-700 dark:text-gray-300">
                {!loading && beaches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-gray-400">
                      No beach listings found.
                    </td>
                  </tr>
                )}
                {beaches.map((b) => {
                  const hasTour = Boolean(b.virtual_tour_url);
                  const pendingReq = tourRequests.find(
                    (r) => r.beach_id === b.id && r.status === 'pending'
                  );
                  const pendingCoordReq = coordinateRequests.find(
                    (r) => r.beach_id === b.id && r.status === 'pending'
                  );

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/60 transition-colors">
                      {/* Name & Location */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {b.name}
                        </span>
                        <span className="text-slate-400 text-[11px] dark:text-gray-400">
                          {b.location}
                        </span>
                      </td>

                      {/* Coordinates & Map Pin Column */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {pendingCoordReq ? (
                              <button
                                type="button"
                                onClick={() => setPreviewCoordRequest(pendingCoordReq)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-200 transition-colors"
                                title="Click to preview proposed pin on map"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Coords Pending</span>
                              </button>
                            ) : b.latitude !== undefined && b.latitude !== null ? (
                              <span className="font-mono text-[11px] text-slate-700 dark:text-gray-300">
                                {Number(b.latitude).toFixed(4)}°N, {Number(b.longitude).toFixed(4)}°E
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Not set</span>
                            )}

                            {/* Direct Admin Edit Pin Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedBeachForCoords(b)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                              title="Directly Edit or Reposition Beach Map Pin as Admin"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit Pin</span>
                            </button>

                            <Link
                              href={`/map?beach=${b.slug || b.id}`}
                              target="_blank"
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                              title="View Pin on Public Map"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 font-semibold text-amber-600">
                        ★ {b.average_rating ? Number(b.average_rating).toFixed(1) : '5.0'}
                      </td>

                      {/* Hours */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-gray-300">
                        {formatHours(b.opening_hours)}
                      </td>

                      {/* Listing Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            b.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* 360 Tour Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pendingReq ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Request Pending</span>
                            </div>
                          ) : hasTour ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-bold">
                              <Compass className="w-3 h-3 text-blue-600" />
                              <span>Live 360°</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400 text-[11px]">
                              <span>None</span>
                            </span>
                          )}

                          {/* Quick Preview or Direct Edit */}
                          {hasTour && (
                            <button
                              type="button"
                              onClick={() => openTourPreview(b.virtual_tour_url, b.name)}
                              className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                              title="Preview Live 360° Tour"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBeachForTour(b);
                              setAdminTourInput(b.virtual_tour_url || '');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                            title="Directly Edit or Set 360° Tour as Admin"
                          >
                            <Edit className="w-3 h-3" />
                            <span>{hasTour ? 'Edit' : '+ Add'}</span>
                          </button>
                        </div>
                      </td>

                      {/* Moderation Actions */}
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
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MODAL 1: Admin Direct 360 Tour Edit Modal */}
      {selectedBeachForTour && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-gray-800 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Manage 360° Virtual Tour
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {selectedBeachForTour.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBeachForTour(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Virtual Tour URL or &lt;iframe&gt; Embed Code
                </label>
                <textarea
                  rows={4}
                  value={adminTourInput}
                  onChange={(e) => setAdminTourInput(e.target.value)}
                  placeholder={`Paste full iframe embed code or link here:\n<iframe src="https://tour.panoee.net/iframe/..." width="100%" height="600"></iframe>\nOR\nhttps://kuula.co/share/...`}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white resize-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">
                  Supports Panoee, Google Maps Photosphere, Kuula, Momento360, Matterport, or raw iframe embeds.
                </p>
              </div>

              {/* Detected URL Preview */}
              {adminTourInput.trim() && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-blue-900 dark:text-blue-200">
                      Detected Embed Source:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        openTourPreview(
                          extractTourEmbedUrl(adminTourInput) || adminTourInput,
                          selectedBeachForTour.name
                        )
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Test Preview</span>
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-blue-700 dark:text-blue-300 break-all">
                    {extractTourEmbedUrl(adminTourInput) || 'Invalid embed code or URL'}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {selectedBeachForTour.virtual_tour_url && (
                  <button
                    type="button"
                    disabled={isSavingTour}
                    onClick={() => {
                      setAdminTourInput('');
                      setTimeout(() => void handleSaveAdminTour(), 50);
                    }}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-200 dark:border-red-800 disabled:opacity-50"
                  >
                    Remove Tour
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBeachForTour(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSavingTour}
                  onClick={handleSaveAdminTour}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSavingTour ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save &amp; Publish Tour</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject Tour Request Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-gray-800 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Reject 360° Virtual Tour Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-gray-300">
                Provide a reason or feedback for the beach owner of{' '}
                <strong className="text-slate-900 dark:text-white">
                  {rejectingRequest.beach?.name || 'this beach'}
                </strong>
                :
              </p>

              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Tour URL was inaccessible, orientation was distorted, or link is missing photosphere data."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white resize-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleConfirmReject}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: 360 Virtual Tour Interactive Preview Modal */}
      <VirtualTourModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        tourUrl={previewTourUrl}
        beachName={previewTourBeachName}
      />

      {/* MODAL 4: Admin Direct Coordinates / Map Pin Edit Modal */}
      {selectedBeachForCoords && (
        <LocationPickerModal
          isOpen={!!selectedBeachForCoords}
          onClose={() => setSelectedBeachForCoords(null)}
          beachName={selectedBeachForCoords.name}
          location={selectedBeachForCoords.location}
          latitude={selectedBeachForCoords.latitude ?? '10.634800'}
          longitude={selectedBeachForCoords.longitude ?? '124.027500'}
          publicMapSlug={selectedBeachForCoords.slug || selectedBeachForCoords.id}
          requireApprovalNotice={false}
          submitButtonText="Save Beach Pin & Coordinates"
          onSave={handleSaveAdminCoordinates}
        />
      )}

      {/* MODAL 5: Preview Proposed Pin on Interactive Map */}
      {previewCoordRequest && (
        <LocationPickerModal
          isOpen={!!previewCoordRequest}
          onClose={() => setPreviewCoordRequest(null)}
          beachName={previewCoordRequest.beach?.name || 'Proposed Pin Preview'}
          location={previewCoordRequest.requested_location || previewCoordRequest.beach?.location || ''}
          latitude={previewCoordRequest.requested_latitude}
          longitude={previewCoordRequest.requested_longitude}
          publicMapSlug={previewCoordRequest.beach?.slug || previewCoordRequest.beach?.id}
          requireApprovalNotice={false}
          submitButtonText="Close Pin Preview"
          onSave={async () => {
            setPreviewCoordRequest(null);
          }}
        />
      )}

      {/* MODAL 6: Reject Coordinate Request Modal */}
      {rejectingCoordRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-gray-800 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Reject Coordinate &amp; Map Pin Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectingCoordRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-gray-300">
                Provide a reason or feedback for the beach owner of{' '}
                <strong className="text-slate-900 dark:text-white">
                  {rejectingCoordRequest.beach?.name || 'this beach'}
                </strong>
                :
              </p>

              <textarea
                rows={3}
                value={coordRejectReason}
                onChange={(e) => setCoordRejectReason(e.target.value)}
                placeholder="e.g. Proposed pin appears in deep water, or coordinate values do not match resort address."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white resize-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingCoordRequest(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingCoordAction}
                  onClick={handleConfirmRejectCoordinates}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingCoordAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
