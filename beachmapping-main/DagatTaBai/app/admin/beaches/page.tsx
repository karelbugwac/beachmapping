'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Compass,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  MapPin,
  Palmtree,
  Star,
  X,
  Upload,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { showToast } from '@/components/ui/feedback-toasts';
import { VirtualTourModal, extractTourEmbedUrl } from '@/components/virtual-tour-modal';
import { LocationPickerModal } from '@/components/map/location-picker-modal';
import type { TourRequestWithBeach } from '@/lib/services/tourRequests';
import type { CoordinateRequestWithBeach } from '@/lib/services/coordinateRequests';

export default function AdminBeachesPage() {
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tourRequests, setTourRequests] = useState<TourRequestWithBeach[]>([]);
  const [coordinateRequests, setCoordinateRequests] = useState<CoordinateRequestWithBeach[]>([]);

  // Modals state
  const [previewTourUrl, setPreviewTourUrl] = useState<string | null>(null);
  const [previewTourBeachName, setPreviewTourBeachName] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  // Comprehensive "Edit Info" Modal State
  const [editingBeach, setEditingBeach] = useState<BeachRecord | null>(null);
  const [editTab, setEditTab] = useState<'basic' | 'tour' | 'coordinates' | 'rates' | 'photos'>('basic');
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    virtual_tour_url: '',
    contact_phone: '',
    contact_email: '',
    cover_image: '',
    profile_image: '',
    entrance_fee: '',
    cottage_fee: '',
    status: 'active',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch beaches
  const fetchBeaches = async () => {
    try {
      const res = await fetch('/api/admin/beaches', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load beach listings.');
      if (Array.isArray(data)) setBeaches(data);
    } catch (err: unknown) {
      console.error('Failed to load beach listings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch 360 tour requests
  const fetchTourRequests = async () => {
    try {
      const res = await fetch('/api/admin/beaches/tour-requests', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data?.requests)) {
        setTourRequests(data.requests);
      }
    } catch (err: unknown) {
      console.error('Failed to load tour requests:', err);
    }
  };

  // Fetch coordinates requests
  const fetchCoordinateRequests = async () => {
    try {
      const res = await fetch('/api/admin/beaches/coordinate-requests', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data?.requests)) {
        setCoordinateRequests(data.requests);
      }
    } catch (err: unknown) {
      console.error('Failed to load coordinate requests:', err);
    }
  };

  useEffect(() => {
    void fetchBeaches();
    void fetchTourRequests();
    void fetchCoordinateRequests();

    // Background auto-refresh every 30 seconds
    const interval = setInterval(() => {
      void fetchBeaches();
      void fetchTourRequests();
      void fetchCoordinateRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const pendingTourRequests = useMemo(() => {
    return tourRequests.filter((r) => r.status === 'pending');
  }, [tourRequests]);

  const pendingCoordRequests = useMemo(() => {
    return coordinateRequests.filter((r) => r.status === 'pending');
  }, [coordinateRequests]);

  // Toggle Beach Status (Active / Suspended)
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
      if (status === 'active') {
        showToast(`Beach listing "${beach.name}" activated!`, 'success');
      } else {
        showToast(`Beach listing "${beach.name}" suspended.`, 'error');
      }
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update beach status.', 'error');
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

      showToast(`360° Virtual Tour for "${req.beach?.name || 'Beach'}" approved!`, 'success');
      await Promise.all([fetchBeaches(), fetchTourRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to approve tour.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject Tour Request
  const handleRejectTour = async () => {
    if (!rejectingRequest) return;
    try {
      setIsProcessingAction(true);
      const res = await fetch('/api/admin/beaches/tour-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          beach_id: rejectingRequest.beach_id,
          rejection_reason: rejectReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject tour request.');

      showToast('360° Virtual Tour request rejected.', 'error');
      setRejectingRequest(null);
      setRejectReason('');
      await fetchTourRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reject tour request.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Approve Coordinate Request
  const handleApproveCoord = async (req: CoordinateRequestWithBeach) => {
    try {
      setIsProcessingCoordAction(true);
      const res = await fetch('/api/admin/beaches/coordinate-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          request_id: req.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve coordinate request.');

      showToast(`Map location coordinates for "${req.beach?.name || 'Beach'}" approved!`, 'success');
      await Promise.all([fetchBeaches(), fetchCoordinateRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to approve coordinate request.', 'error');
    } finally {
      setIsProcessingCoordAction(false);
    }
  };

  // Handle Reject Coordinate Request
  const handleRejectCoord = async () => {
    if (!rejectingCoordRequest) return;
    try {
      setIsProcessingCoordAction(true);
      const res = await fetch('/api/admin/beaches/coordinate-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          request_id: rejectingCoordRequest.id,
          rejection_reason: coordRejectReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject coordinate request.');

      showToast('Coordinate request rejected.', 'error');
      setRejectingCoordRequest(null);
      setCoordRejectReason('');
      await fetchCoordinateRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reject coordinate request.', 'error');
    } finally {
      setIsProcessingCoordAction(false);
    }
  };

  // Open "Edit Info" Modal
  const openEditModal = (beach: BeachRecord) => {
    setEditingBeach(beach);
    setEditTab('basic');

    // Strip +63 from phone if present for cleaner input
    let cleanPhone = beach.contact_phone || '';
    if (cleanPhone.startsWith('+63')) {
      cleanPhone = cleanPhone.replace('+63', '').trim();
    }

    const coverImg = beach.cover_image || (beach as any).cover_image_url || '';
    const profileImg = beach.profile_image || (beach as any).profile_image_url || '';

    setEditForm({
      id: beach.id,
      name: beach.name || '',
      description: beach.description || '',
      location: beach.location || '',
      latitude: beach.latitude ? String(beach.latitude) : '10.6348',
      longitude: beach.longitude ? String(beach.longitude) : '124.0275',
      virtual_tour_url: beach.virtual_tour_url || '',
      contact_phone: cleanPhone,
      contact_email: beach.contact_email || '',
      cover_image: coverImg,
      profile_image: profileImg,
      entrance_fee: beach.entrance_fee ? String(beach.entrance_fee) : '',
      cottage_fee: beach.cottage_fee ? String(beach.cottage_fee) : '',
      status: beach.status || 'active',
    });
  };

  // Save "Edit Info" Form
  const handleSaveBeachInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeach) return;

    if (!editForm.name.trim()) {
      showToast('Resort beach name is required.', 'error');
      return;
    }

    if (editForm.contact_email && !editForm.contact_email.includes('@')) {
      showToast('Valid contact email must include "@".', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const payload: Record<string, any> = {
        id: editForm.id,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        location: editForm.location.trim(),
        latitude: parseFloat(editForm.latitude) || 10.6348,
        longitude: parseFloat(editForm.longitude) || 124.0275,
        virtual_tour_url: editForm.virtual_tour_url.trim() || null,
        contact_phone: editForm.contact_phone.trim() ? `+63 ${editForm.contact_phone.trim()}` : null,
        contact_email: editForm.contact_email.trim() || null,
        cover_image: editForm.cover_image.trim() || null,
        cover_image_url: editForm.cover_image.trim() || null,
        profile_image: editForm.profile_image.trim() || null,
        profile_image_url: editForm.profile_image.trim() || null,
        entrance_fee: editForm.entrance_fee ? String(editForm.entrance_fee) : null,
        cottage_fee: editForm.cottage_fee ? String(editForm.cottage_fee) : null,
      };

      const res = await fetch('/api/admin/beaches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save beach information.');

      setBeaches((current) =>
        current.map((b) => (b.id === editingBeach.id ? { ...b, ...data.beach } : b))
      );

      showToast(`Information for "${editForm.name}" updated successfully.`, 'success');
      setEditingBeach(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update beach.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Upload helper for PNG / JPG only
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'cover_image' | 'profile_image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type.toLowerCase())) {
      showToast('Please upload an image in PNG or JPG format only.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('category', targetField === 'cover_image' ? 'cover' : 'profile');

      const res = await fetch('/api/owner/beach/images', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      const url = data.photo_url || data.url;
      if (url) {
        setEditForm((prev) => ({ ...prev, [targetField]: url }));
        showToast('Image uploaded successfully.', 'success');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Image upload failed.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      {/* Frameless Hero Header: Dive Blue */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
          Manage Beaches &amp; 360° Tours
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-2xl">
          Directory of registered beaches in Barangay Binongkalan. Oversee map pins, review proprietor requests, and directly manage 360° virtual tours.
        </p>
      </div>

      {/* Pending 360 Virtual Tour Requests */}
      {pendingTourRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">
              Pending 360° Virtual Tour Requests ({pendingTourRequests.length})
            </h2>
          </div>

          <div className="space-y-3">
            {pendingTourRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div>
                  <h3 className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA]">
                    {req.beach?.name || 'Beach Listing'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Proprietor submitted a 360° virtual tour for admin approval.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {req.requested_tour_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewTourUrl(req.requested_tour_url);
                        setPreviewTourBeachName(req.beach?.name || 'Beach');
                        setShowPreviewModal(true);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 cursor-pointer"
                    >
                      Preview Tour
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleApproveTour(req)}
                    disabled={isProcessingAction}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                  >
                    Approve &amp; Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingRequest(req)}
                    disabled={isProcessingAction}
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Coordinate Requests */}
      {pendingCoordRequests.length > 0 && (
        <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-sky-900 dark:text-sky-300">
              Pending Map Coordinate Requests ({pendingCoordRequests.length})
            </h2>
          </div>

          <div className="space-y-3">
            {pendingCoordRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div>
                  <h3 className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA]">
                    {req.beach?.name || 'Beach Listing'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Proposed: {req.requested_latitude.toFixed(5)}, {req.requested_longitude.toFixed(5)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPreviewCoordRequest(req)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Inspect on Map
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveCoord(req)}
                    disabled={isProcessingCoordAction}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#1F3F74] hover:bg-[#18325c] text-white shadow-2xs transition-all cursor-pointer"
                  >
                    Approve Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingCoordRequest(req)}
                    disabled={isProcessingCoordAction}
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Beaches Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#1F3F74] dark:text-[#4987BA]">
            Registered Beaches ({beaches.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1F3F74] dark:text-[#4987BA] mb-2" />
            <p className="text-xs font-semibold text-slate-400">Loading beach directory...</p>
          </div>
        ) : beaches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 space-y-3">
            <Palmtree className="w-10 h-10 mx-auto text-slate-300 dark:text-neutral-600" />
            <h3 className="font-bold text-base text-[#1F3F74] dark:text-[#4987BA]">No beach listings registered</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Approved resort applications will automatically generate beach cards here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beaches.map((beach) => {
              const hasTour = Boolean(beach.virtual_tour_url);
              const isActive = beach.status === 'active';
              const coverImg = beach.cover_image || (beach as any).cover_image_url;

              return (
                <div
                  key={beach.id}
                  className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-[#1F3F74] dark:hover:border-[#4987BA] transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Image / Cover */}
                  <div>
                    <div className="relative h-44 w-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                      {coverImg ? (
                        <Image
                          src={coverImg}
                          alt={beach.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-neutral-600">
                          <Palmtree className="w-12 h-12" />
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                            isActive
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>

                        {/* 360 Tour Badge */}
                        {hasTour ? (
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#1F3F74] text-white shadow-sm"
                            title="360° Virtual Tour Active"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>360° Tour</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white/80 backdrop-blur-xs">
                            No Tour
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-[#1F3F74] dark:text-[#4987BA] truncate">
                            {beach.name}
                          </h3>
                          <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400 text-xs mt-0.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{beach.location || 'Barangay Binongkalan'}</span>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{beach.average_rating ? Number(beach.average_rating).toFixed(1) : 'New'}</span>
                        </div>
                      </div>

                      {/* Coordinates Info */}
                      <div className="text-[11px] text-slate-400 dark:text-neutral-500 flex items-center justify-between">
                        <span>GPS Coordinates:</span>
                        <span className="font-mono text-slate-600 dark:text-neutral-400">
                          {beach.latitude ? Number(beach.latitude).toFixed(4) : '—'}, {beach.longitude ? Number(beach.longitude).toFixed(4) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-neutral-800/80 mt-2 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      {/* Edit Info Button (Opens Comprehensive Modal) */}
                      <button
                        type="button"
                        onClick={() => openEditModal(beach)}
                        className="w-full py-2.5 px-3 rounded-full bg-[#1F3F74] hover:bg-[#18325c] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Edit Info</span>
                      </button>

                      {/* 360 Tour Button (Direct Preview or Assign) */}
                      {hasTour ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewTourUrl(beach.virtual_tour_url);
                            setPreviewTourBeachName(beach.name);
                            setShowPreviewModal(true);
                          }}
                          className="w-full py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View 360°</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            openEditModal(beach);
                            setEditTab('tour');
                          }}
                          className="w-full py-2.5 px-3 rounded-full border border-[#1F3F74] text-[#1F3F74] dark:border-[#4987BA] dark:text-[#4987BA] hover:bg-[#1F3F74]/10 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Add 360°</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary Actions: Map Pin & Status */}
                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBeachForCoords(beach)}
                        className="text-slate-500 dark:text-neutral-400 hover:text-[#1F3F74] dark:hover:text-[#4987BA] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Pin Location</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBeachStatus(beach)}
                        className={`font-semibold cursor-pointer ${
                          isActive
                            ? 'text-rose-600 hover:text-rose-700'
                            : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        {isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COMPREHENSIVE "EDIT INFO" MODAL (Admin Exclusive 360° Tour & Details)     */}
      {/* ========================================================================= */}
      {editingBeach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#1F3F74] dark:text-[#4987BA]">
                  Manage Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Editing: {editingBeach.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingBeach(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs font-bold">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'tour', label: '360° Virtual Tour (Admin)' },
                { id: 'coordinates', label: 'Map Coordinates' },
                { id: 'rates', label: 'Rates & Fees' },
                { id: 'photos', label: 'Photos & Cover' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditTab(tab.id as any)}
                  className={`px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    editTab === tab.id
                      ? 'bg-[#1F3F74] text-white shadow-2xs dark:bg-[#4987BA]'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveBeachInfo} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: BASIC INFO */}
              {editTab === 'basic' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Beach Establishment Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. Catmon Beach Resort"
                      className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Location Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="e.g. Barangay Binongkalan, Catmon, Cebu"
                      className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Official Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                          +63
                        </span>
                        <input
                          type="text"
                          maxLength={10}
                          value={editForm.contact_phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, contact_phone: e.target.value.replace(/\D/g, '') })
                          }
                          placeholder="9123456789"
                          className="w-full pl-12 pr-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Official Contact Email
                      </label>
                      <input
                        type="email"
                        value={editForm.contact_email}
                        onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                        placeholder="contact@resort.ph"
                        className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      About &amp; Description
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Describe the beach shoreline, atmosphere, and amenities..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: 360 VIRTUAL TOUR (ADMIN EXCLUSIVE) */}
              {editTab === 'tour' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <h4 className="text-xs font-bold text-sky-900 dark:text-sky-300">
                        Administrator Exclusive 360° Virtual Tour Privileges
                      </h4>
                    </div>
                    <p className="text-[11px] text-sky-800 dark:text-sky-400 mt-1">
                      As Administrator, you have direct rights to enter, embed, or update the 360° virtual tour iframe URL (Kuula, Google Street View, Matterport, etc.).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      360° Virtual Tour URL / Embed Link
                    </label>
                    <input
                      type="url"
                      value={editForm.virtual_tour_url}
                      onChange={(e) => setEditForm({ ...editForm, virtual_tour_url: e.target.value })}
                      placeholder="https://kuula.co/share/... or Google Street View embed URL"
                      className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                    />
                  </div>

                  {/* Tour Live Preview inside Modal */}
                  {editForm.virtual_tour_url && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500">Live Preview:</span>
                      <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-black">
                        <iframe
                          src={extractTourEmbedUrl(editForm.virtual_tour_url) || ''}
                          className="w-full h-full border-0"
                          allow="accelerometer; gyroscope; magnetometer; vr"
                          title="Tour Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COORDINATES */}
              {editTab === 'coordinates' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Set precise GPS coordinates for the interactive Barangay Binongkalan coastal map.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBeachForCoords({
                        ...editingBeach,
                        latitude: parseFloat(editForm.latitude) || 10.6348,
                        longitude: parseFloat(editForm.longitude) || 124.0275,
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Pick Point Directly on Interactive Map</span>
                  </button>
                </div>
              )}

              {/* TAB 4: RATES & FEES */}
              {editTab === 'rates' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Entrance Fee
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                          ₱
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={editForm.entrance_fee}
                          onChange={(e) => setEditForm({ ...editForm, entrance_fee: e.target.value })}
                          placeholder="50"
                          className="w-full pl-8 pr-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Cottage Starting Fee
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                          ₱
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={editForm.cottage_fee}
                          onChange={(e) => setEditForm({ ...editForm, cottage_fee: e.target.value })}
                          placeholder="500"
                          className="w-full pl-8 pr-4 py-2.5 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:focus:ring-[#4987BA]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PHOTOS */}
              {editTab === 'photos' && (
                <div className="space-y-6">
                  {/* Cover Photo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Cover Banner Photo (PNG or JPG)
                    </label>
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                      {editForm.cover_image ? (
                        <Image
                          src={editForm.cover_image}
                          alt="Cover photo"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No cover image uploaded</span>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Cover Image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => handleImageUpload(e, 'cover_image')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBeach(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#18325c] dark:bg-[#4987BA] dark:hover:bg-[#3a72a1] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject 360 Tour Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#1F3F74] dark:text-[#4987BA]">
              Reject 360° Virtual Tour
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Provide an administrative reason for the proprietor of &ldquo;{rejectingRequest.beach?.name}&rdquo;.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete 360 stitching, broken link, or low resolution."
              className="w-full p-3 rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectTour}
                disabled={isProcessingAction}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Coordinate Request Modal */}
      {rejectingCoordRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#1F3F74] dark:text-[#4987BA]">
              Reject Coordinate Placement
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Provide reason for rejecting new coordinates for &ldquo;{rejectingCoordRequest.beach?.name}&rdquo;.
            </p>
            <textarea
              rows={3}
              value={coordRejectReason}
              onChange={(e) => setCoordRejectReason(e.target.value)}
              placeholder="e.g. Coordinates placed in sea waters instead of shoreline property."
              className="w-full p-3 rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold placeholder:italic focus:outline-none focus:ring-2 focus:ring-[#1F3F74]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingCoordRequest(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectCoord}
                disabled={isProcessingCoordAction}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360 Virtual Tour Fullscreen Modal */}
      <VirtualTourModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        tourUrl={previewTourUrl}
        beachName={previewTourBeachName}
      />

      {/* Map Location Picker Modal for Direct Admin Repositioning */}
      {selectedBeachForCoords && (
        <LocationPickerModal
          isOpen={true}
          onClose={() => setSelectedBeachForCoords(null)}
          beachName={selectedBeachForCoords.name}
          location={selectedBeachForCoords.location || 'Barangay Binongkalan'}
          latitude={selectedBeachForCoords.latitude}
          longitude={selectedBeachForCoords.longitude}
          onSave={async (coords) => {
            try {
              const latNum = parseFloat(coords.latitude);
              const lngNum = parseFloat(coords.longitude);
              const res = await fetch('/api/admin/beaches', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: selectedBeachForCoords.id,
                  latitude: latNum,
                  longitude: lngNum,
                  location: coords.location,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to update coordinates.');

              setBeaches((current) =>
                current.map((b) =>
                  b.id === selectedBeachForCoords.id
                    ? { ...b, latitude: latNum, longitude: lngNum, location: coords.location }
                    : b
                )
              );
              if (editingBeach?.id === selectedBeachForCoords.id) {
                setEditForm((prev) => ({
                  ...prev,
                  latitude: String(latNum),
                  longitude: String(lngNum),
                  location: coords.location,
                }));
              }

              showToast(`Pin location updated to ${latNum.toFixed(5)}, ${lngNum.toFixed(5)}.`, 'success');
              setSelectedBeachForCoords(null);
            } catch (err: unknown) {
              showToast(err instanceof Error ? err.message : 'Failed to update pin.', 'error');
            }
          }}
        />
      )}

      {/* Map Inspector for Proposed Coordinates */}
      {previewCoordRequest && (
        <LocationPickerModal
          isOpen={true}
          onClose={() => setPreviewCoordRequest(null)}
          beachName={`Proposed for: ${previewCoordRequest.beach?.name || 'Beach'}`}
          location={previewCoordRequest.requested_location || 'Barangay Binongkalan'}
          latitude={previewCoordRequest.requested_latitude}
          longitude={previewCoordRequest.requested_longitude}
          onSave={async () => {
            await handleApproveCoord(previewCoordRequest);
            setPreviewCoordRequest(null);
          }}
        />
      )}
    </div>
  );
}
