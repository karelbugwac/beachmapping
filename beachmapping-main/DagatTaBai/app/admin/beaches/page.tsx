'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Compass,
  Eye,
  Sparkles,
  Loader2,
  MapPin,
  Palmtree,
  Star,
  X,
  Upload,
  Search,
  RefreshCw,
  MessageSquare,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { showToast } from '@/components/ui/feedback-toasts';
import { confirmAction } from '@/components/ui/confirm-dialog';
import { VirtualTourModal, extractTourEmbedUrl } from '@/components/virtual-tour-modal';
import { LocationPickerModal } from '@/components/map/location-picker-modal';
import type { TourRequestWithBeach } from '@/lib/services/tourRequests';
import type { CoordinateRequestWithBeach } from '@/lib/services/coordinateRequests';

type BeachReviewItem = {
  id: string;
  beach_id?: string | null;
  user_id?: string | null;
  review_type?: 'beach' | 'platform';
  user_name: string;
  beach_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
};

type BeachReviewReport = {
  id: string;
  review_id?: string | null;
  beach_id?: string | null;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: string;
  beach: string;
  review: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer: string;
  } | null;
};

function StarRating({ rating }: { rating: number }) {
  const safeRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${safeRating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < safeRating;
        return (
          <Star
            key={index}
            className={`h-3.5 w-3.5 ${
              filled
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-slate-300 dark:text-neutral-700'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function AdminBeachesPage() {
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tourRequests, setTourRequests] = useState<TourRequestWithBeach[]>([]);
  const [coordinateRequests, setCoordinateRequests] = useState<CoordinateRequestWithBeach[]>([]);
  const [reviews, setReviews] = useState<BeachReviewItem[]>([]);
  const [reports, setReports] = useState<BeachReviewReport[]>([]);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [deletingBeachId, setDeletingBeachId] = useState<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'flagged' | 'suspended'>('all');

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

  // Beach Details & Management Modal State
  const [editingBeach, setEditingBeach] = useState<BeachRecord | null>(null);
  const [editTab, setEditTab] = useState<'basic' | 'reviews' | 'tour' | 'coordinates' | 'rates' | 'photos' | 'posts' | 'dos'>('basic');
  const [resortPosts, setResortPosts] = useState<Array<{ id: string; caption: string; image_url?: string; created_at: string }>>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [resortRules, setResortRules] = useState<Array<{ id: string; type: 'do' | 'dont'; title: string; description: string; category: string }>>([]);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleType, setNewRuleType] = useState<'do' | 'dont'>('do');
  const [newRuleCategory, setNewRuleCategory] = useState('Safety');
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

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data?.reviews)) {
        setReviews(data.reviews.filter((r: BeachReviewItem) => r.review_type !== 'platform'));
      }
      if (Array.isArray(data?.reports)) {
        setReports(data.reports);
      }
    } catch (err: unknown) {
      console.error('Failed to load reviews:', err);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchBeaches(),
      fetchTourRequests(),
      fetchCoordinateRequests(),
      fetchReviews(),
    ]);
  };

  useEffect(() => {
    void refreshAll();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshAll();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const pendingTourRequests = useMemo(
    () => tourRequests.filter((r) => r.status === 'pending'),
    [tourRequests]
  );

  const pendingCoordRequests = useMemo(
    () => coordinateRequests.filter((r) => r.status === 'pending'),
    [coordinateRequests]
  );

  const getBeachReviews = (beach: BeachRecord) => {
    return reviews.filter(
      (r) =>
        r.beach_id === beach.id ||
        r.beach_name?.trim().toLowerCase() === beach.name?.trim().toLowerCase()
    );
  };

  const getBeachReports = (beach: BeachRecord) => {
    return reports.filter(
      (rep) =>
        rep.beach_id === beach.id ||
        rep.beach?.trim().toLowerCase() === beach.name?.trim().toLowerCase()
    );
  };

  const handleDeleteReview = async (review: BeachReviewItem) => {
    const confirmed = await confirmAction({
      title: 'Delete Review',
      message: `Delete this review by ${review.user_name}?`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    setDeletingReviewId(review.id);
    try {
      const params = new URLSearchParams({
        id: review.id,
        type: review.review_type === 'platform' ? 'platform' : 'beach',
      });
      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete review.');
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setReports((current) => current.filter((rep) => rep.review_id !== review.id));
      showToast('Review deleted.', 'destructive');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete review.', 'error');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const stats = useMemo(() => {
    const total = beaches.length;
    const active = beaches.filter((b) => b.status === 'active').length;
    const flagged = reports.length;
    const suspended = beaches.filter((b) => b.status !== 'active').length;
    return { total, active, flagged, suspended };
  }, [beaches, reports]);

  const filteredBeaches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return beaches.filter((beach) => {
      const matchesSearch =
        !q ||
        beach.name.toLowerCase().includes(q) ||
        (beach.location || '').toLowerCase().includes(q);
      const matchesFilter =
        filterMode === 'all'
          ? true
          : filterMode === 'active'
          ? beach.status === 'active'
          : filterMode === 'flagged'
          ? getBeachReports(beach).length > 0
          : beach.status !== 'active';
      return matchesSearch && matchesFilter;
    });
  }, [beaches, searchQuery, filterMode, reports]);

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
      if (editingBeach?.id === beach.id) {
        setEditingBeach((prev) => (prev ? { ...prev, status: data.beach.status } : null));
        setEditForm((prev) => ({ ...prev, status: data.beach.status }));
      }
      if (status === 'active') {
        showToast(`"${beach.name}" activated.`, 'success');
      } else {
        showToast(`"${beach.name}" suspended.`, 'error');
      }
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update beach status.', 'error');
    }
  };

  const handleDeleteBeach = async (beach: BeachRecord) => {
    const confirmed = await confirmAction({
      title: 'Delete Beach & Owner',
      message: `Are you sure you want to permanently delete "${beach.name}" from the user side and delete its beach owner account? This action cannot be undone.`,
      confirmLabel: 'Delete Beach & Owner',
    });
    if (!confirmed) return;

    setDeletingBeachId(beach.id);
    try {
      const response = await fetch('/api/admin/beaches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: beach.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete beach.');

      setBeaches((current) => current.filter((item) => item.id !== beach.id));
      setTourRequests((current) => current.filter((req) => req.beach_id !== beach.id));
      setCoordinateRequests((current) => current.filter((req) => req.beach_id !== beach.id));
      if (editingBeach?.id === beach.id) {
        setEditingBeach(null);
      }
      showToast(data.message || `"${beach.name}" and its owner account deleted.`, 'destructive');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to delete beach.', 'error');
    } finally {
      setDeletingBeachId(null);
    }
  };

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

      showToast(`360° Tour for "${req.beach?.name || 'Beach'}" approved.`, 'success');
      await Promise.all([fetchBeaches(), fetchTourRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to approve tour.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

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

      showToast('360° Tour request rejected.', 'error');
      setRejectingRequest(null);
      setRejectReason('');
      await fetchTourRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to reject tour request.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

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

      showToast(`Coordinates for "${req.beach?.name || 'Beach'}" approved.`, 'success');
      await Promise.all([fetchBeaches(), fetchCoordinateRequests()]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to approve coordinate request.', 'error');
    } finally {
      setIsProcessingCoordAction(false);
    }
  };

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

  const openEditModal = (
    beach: BeachRecord,
    initialTab: 'basic' | 'reviews' | 'tour' | 'coordinates' | 'rates' | 'photos' | 'posts' | 'dos' = 'basic'
  ) => {
    setEditingBeach(beach);
    setEditTab(initialTab);

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
      latitude: beach.latitude == null ? '' : String(beach.latitude),
      longitude: beach.longitude == null ? '' : String(beach.longitude),
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

  const handleSaveBeachInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeach) return;

    if (!editForm.name.trim()) {
      showToast('Beach name is required.', 'error');
      return;
    }

    if (editForm.contact_email && !editForm.contact_email.includes('@')) {
      showToast('Valid contact email must include "@".', 'error');
      return;
    }

    const hasLatitude = editForm.latitude.trim() !== '';
    const hasLongitude = editForm.longitude.trim() !== '';
    const parsedLatitude = Number.parseFloat(editForm.latitude);
    const parsedLongitude = Number.parseFloat(editForm.longitude);
    if (
      hasLatitude !== hasLongitude ||
      (hasLatitude &&
        (!Number.isFinite(parsedLatitude) ||
          parsedLatitude < -90 ||
          parsedLatitude > 90 ||
          !Number.isFinite(parsedLongitude) ||
          parsedLongitude < -180 ||
          parsedLongitude > 180))
    ) {
      showToast('Enter both valid coordinates or leave both blank.', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const payload: Record<string, any> = {
        id: editForm.id,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        location: editForm.location.trim(),
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
      if (hasLatitude && hasLongitude) {
        payload.latitude = parsedLatitude;
        payload.longitude = parsedLongitude;
      }

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

      showToast(`"${editForm.name}" updated.`, 'success');
      setEditingBeach(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update beach.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

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
        showToast('Image uploaded.', 'success');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Image upload failed.', 'error');
    }
  };

  const editingBeachReviews = useMemo(
    () => (editingBeach ? getBeachReviews(editingBeach) : []),
    [editingBeach, reviews]
  );

  const editingBeachReports = useMemo(
    () => (editingBeach ? getBeachReports(editingBeach) : []),
    [editingBeach, reports]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
            Manage Beaches
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Registered beaches, 360° tours, map pins, and visitor reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshAll()}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] shadow-2xs transition hover:border-[#4987BA]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`text-left rounded-2xl border p-4 transition-all ${
            filterMode === 'all'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Total Beaches</p>
          <p className="mt-1 text-2xl font-extrabold text-[#1F3F74] dark:text-white">{stats.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'active' ? 'all' : 'active')}
          className={`text-left rounded-2xl border p-4 transition-all ${
            filterMode === 'active'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Active</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'flagged' ? 'all' : 'flagged')}
          className={`text-left rounded-2xl border p-4 transition-all ${
            filterMode === 'flagged'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Flagged Reviews</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-500 dark:text-amber-400">{stats.flagged}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'suspended' ? 'all' : 'suspended')}
          className={`text-left rounded-2xl border p-4 transition-all ${
            filterMode === 'suspended'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Suspended</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.suspended}</p>
        </button>
      </div>

      {/* Pending Requests Banners */}
      {(pendingTourRequests.length > 0 || pendingCoordRequests.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingTourRequests.length > 0 && (
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Pending 360° Tour Requests ({pendingTourRequests.length})
                </h2>
              </div>

              <div className="space-y-2">
                {pendingTourRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50 flex items-center justify-between gap-3"
                  >
                    <span className="font-bold text-xs text-[#1F3F74] dark:text-white truncate">
                      {req.beach?.name || 'Beach'}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {req.requested_tour_url && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewTourUrl(req.requested_tour_url);
                            setPreviewTourBeachName(req.beach?.name || 'Beach');
                            setShowPreviewModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 cursor-pointer"
                        >
                          Preview
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApproveTour(req)}
                        disabled={isProcessingAction}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingRequest(req)}
                        disabled={isProcessingAction}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingCoordRequests.length > 0 && (
            <div className="bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h2 className="text-xs font-bold text-sky-900 dark:text-sky-300">
                  Pending Coordinate Requests ({pendingCoordRequests.length})
                </h2>
              </div>

              <div className="space-y-2">
                {pendingCoordRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-sky-100 dark:border-sky-900/50 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#1F3F74] dark:text-white truncate">
                        {req.beach?.name || 'Beach'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                        {req.requested_latitude.toFixed(4)}, {req.requested_longitude.toFixed(4)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewCoordRequest(req)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 cursor-pointer"
                      >
                        Map
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveCoord(req)}
                        disabled={isProcessingCoordAction}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1F3F74] hover:bg-[#18325c] text-white cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingCoordRequest(req)}
                        disabled={isProcessingCoordAction}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search beach or location..."
            className="w-full rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#4987BA] focus:bg-white dark:focus:bg-neutral-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-200 focus:border-[#4987BA] focus:outline-none"
          >
            <option value="all">All Beaches</option>
            <option value="active">Active</option>
            <option value="flagged">Flagged Reviews</option>
            <option value="suspended">Suspended</option>
          </select>

          {(searchQuery || filterMode !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
              }}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Beaches Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#1F3F74] dark:text-[#4987BA] mb-2" />
          <p className="text-xs font-semibold text-slate-400">Loading beaches...</p>
        </div>
      ) : filteredBeaches.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 space-y-2">
          <Palmtree className="w-9 h-9 mx-auto text-slate-300 dark:text-neutral-600" />
          <h3 className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA]">No beaches found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBeaches.map((beach) => {
            const hasTour = Boolean(beach.virtual_tour_url);
            const isActive = beach.status === 'active';
            const coverImg = beach.cover_image || (beach as any).cover_image_url;
            const beachReviews = getBeachReviews(beach);
            const beachReports = getBeachReports(beach);
            const latestReviews = beachReviews.slice(0, 2);

            return (
              <div
                key={beach.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-2xs hover:border-[#4987BA] transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative h-40 w-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                    {coverImg ? (
                      <Image
                        src={coverImg}
                        alt={beach.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-neutral-600">
                        <Palmtree className="w-10 h-10" />
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                          isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {isActive ? 'Active' : 'Suspended'}
                      </span>

                      {hasTour && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1F3F74] text-white shadow-xs">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>360°</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-[#1F3F74] dark:text-white truncate">
                          {beach.name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400 text-xs mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{beach.location || 'Barangay Binongkalan'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{beach.average_rating ? Number(beach.average_rating).toFixed(1) : 'New'}</span>
                      </div>
                    </div>

                    {/* Per-Beach Reviews Section on Card */}
                    <div className="rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1F3F74] dark:text-[#4987BA]">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Reviews ({beachReviews.length})
                        </span>
                        {beachReports.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3 h-3" />
                            {beachReports.length} Flagged
                          </span>
                        )}
                      </div>

                      {latestReviews.length === 0 ? (
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                          No reviews yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {latestReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="rounded-lg bg-white dark:bg-neutral-900 px-2.5 py-1.5 border border-slate-100 dark:border-neutral-800/80"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-200 truncate">
                                  {rev.user_name}
                                </span>
                                <StarRating rating={rev.rating} />
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1">
                                {rev.comment || 'No comment provided.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clean Card Footer */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(beach, 'reviews')}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-[#4987BA]" />
                    Reviews ({beachReviews.length})
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(beach, 'basic')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-[#1F3F74] dark:text-white shadow-2xs transition hover:border-[#4987BA] hover:text-[#4987BA] cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteBeach(beach)}
                      disabled={deletingBeachId === beach.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-100 disabled:opacity-50 transition cursor-pointer"
                      title="Delete beach & owner"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEACH DETAILS & MANAGEMENT MODAL                                          */}
      {/* ========================================================================= */}
      {editingBeach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#1F3F74] dark:text-white truncate">
                    {editingBeach.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      editingBeach.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    }`}
                  >
                    {editingBeach.status === 'active' ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                  {editingBeach.location || 'Barangay Binongkalan'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {editingBeach.virtual_tour_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTourUrl(editingBeach.virtual_tour_url);
                      setPreviewTourBeachName(editingBeach.name);
                      setShowPreviewModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] hover:bg-slate-200 cursor-pointer"
                  >
                    View 360°
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleBeachStatus(editingBeach)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    editingBeach.status === 'active'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  {editingBeach.status === 'active' ? 'Suspend' : 'Activate'}
                </button>

                <button
                  type="button"
                  onClick={() => void handleDeleteBeach(editingBeach)}
                  disabled={deletingBeachId === editingBeach.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => setEditingBeach(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 py-2.5 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
              {[
                { id: 'basic', label: 'Details' },
                { id: 'reviews', label: `Reviews (${editingBeachReviews.length})` },
                { id: 'tour', label: '360° Tour' },
                { id: 'coordinates', label: 'Coordinates' },
                { id: 'rates', label: 'Rates' },
                { id: 'photos', label: 'Photos' },
                { id: 'posts', label: 'Posts' },
                { id: 'dos', label: 'Rules' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    editTab === tab.id
                      ? 'bg-[#1F3F74] text-white shadow-2xs dark:bg-[#4987BA]'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBeachInfo} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* TAB: BASIC DETAILS */}
              {editTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Beach Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="e.g. Catmon Beach Resort"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        placeholder="Barangay Binongkalan, Catmon, Cebu"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
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
                          className="w-full pl-11 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={editForm.contact_email}
                        onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                        placeholder="contact@resort.ph"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Beach shoreline, atmosphere, and amenities..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                    />
                  </div>
                </div>
              )}

              {/* TAB: REVIEWS */}
              {editTab === 'reviews' && (
                <div className="space-y-4">
                  {/* Summary Header */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {editingBeach.average_rating
                            ? Number(editingBeach.average_rating).toFixed(1)
                            : 'New'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                        {editingBeachReviews.length} {editingBeachReviews.length === 1 ? 'Review' : 'Reviews'}
                      </span>
                    </div>

                    {editingBeachReports.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {editingBeachReports.length} Flagged
                      </span>
                    )}
                  </div>

                  {/* Reviews List */}
                  {editingBeachReviews.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-slate-100 dark:border-neutral-800">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-neutral-700 mb-2" />
                      <p className="text-xs font-semibold text-slate-400">
                        No reviews for this beach yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {editingBeachReviews.map((review) => {
                        const report = editingBeachReports.find((r) => r.review_id === review.id);
                        return (
                          <div
                            key={review.id}
                            className="p-4 rounded-xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-[#1F3F74] dark:text-white">
                                  {review.user_name}
                                </span>
                                <StarRating rating={review.rating} />
                                <span className="text-[11px] text-slate-400">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                                {report && (
                                  <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                                    Flagged: {report.reason}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                                {review.comment || 'No written comment.'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteReview(review)}
                              disabled={deletingReviewId === review.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-100 disabled:opacity-50 shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: 360 VIRTUAL TOUR */}
              {editTab === 'tour' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      360° Virtual Tour URL / Embed Link
                    </label>
                    <input
                      type="url"
                      value={editForm.virtual_tour_url}
                      onChange={(e) => setEditForm({ ...editForm, virtual_tour_url: e.target.value })}
                      placeholder="https://kuula.co/share/... or Street View embed URL"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                    />
                  </div>

                  {editForm.virtual_tour_url && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Live Preview</span>
                      <div className="relative h-64 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-black">
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

              {/* TAB: COORDINATES */}
              {editTab === 'coordinates' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBeachForCoords({
                        ...editingBeach,
                        latitude: Number.isFinite(Number.parseFloat(editForm.latitude))
                          ? Number.parseFloat(editForm.latitude)
                          : null,
                        longitude: Number.isFinite(Number.parseFloat(editForm.longitude))
                          ? Number.parseFloat(editForm.longitude)
                          : null,
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Pick on Map</span>
                  </button>
                </div>
              )}

              {/* TAB: RATES & FEES */}
              {editTab === 'rates' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Entrance Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={editForm.entrance_fee}
                        onChange={(e) => setEditForm({ ...editForm, entrance_fee: e.target.value })}
                        placeholder="50"
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Cottage Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={editForm.cottage_fee}
                        onChange={(e) => setEditForm({ ...editForm, cottage_fee: e.target.value })}
                        placeholder="500"
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PHOTOS */}
              {editTab === 'photos' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Cover Photo (PNG or JPG)
                  </label>
                  <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
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
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Cover Image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleImageUpload(e, 'cover_image')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* TAB: POSTS */}
              {editTab === 'posts' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40 space-y-3">
                    <label className="block text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">
                      New Post
                    </label>
                    <textarea
                      rows={2}
                      value={newPostCaption}
                      onChange={(e) => setNewPostCaption(e.target.value)}
                      placeholder="Write announcement or update..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none"
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <input
                        type="url"
                        value={newPostImage}
                        onChange={(e) => setNewPostImage(e.target.value)}
                        placeholder="Optional photo URL"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPostCaption.trim()) {
                            showToast('Enter a post caption.', 'error');
                            return;
                          }
                          setResortPosts((prev) => [
                            {
                              id: `post-${Date.now()}`,
                              caption: newPostCaption.trim(),
                              image_url: newPostImage.trim() || undefined,
                              created_at: 'Just now',
                            },
                            ...prev,
                          ]);
                          setNewPostCaption('');
                          setNewPostImage('');
                          showToast('Post published.', 'success');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold transition cursor-pointer"
                      >
                        Publish
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {resortPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">{editForm.name || 'Resort'}</span>
                          <span className="text-[10px] text-slate-400">{post.created_at}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                          {post.caption}
                        </p>
                        {post.image_url && (
                          <div className="relative h-36 w-full rounded-lg overflow-hidden bg-slate-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!await confirmAction({ title: 'Delete Post', message: 'Delete this post?' })) return;
                              setResortPosts((prev) => prev.filter((p) => p.id !== post.id));
                              showToast('Post deleted.', 'destructive');
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: RULES */}
              {editTab === 'dos' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={newRuleType}
                        onChange={(e) => setNewRuleType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black font-bold focus:outline-none"
                      >
                        <option value="do">DO (Required)</option>
                        <option value="dont">DON&apos;T (Prohibited)</option>
                      </select>
                      <select
                        value={newRuleCategory}
                        onChange={(e) => setNewRuleCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black font-bold focus:outline-none"
                      >
                        <option value="Safety">Safety</option>
                        <option value="Environment">Environment</option>
                        <option value="Etiquette">Etiquette</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={newRuleTitle}
                      onChange={(e) => setNewRuleTitle(e.target.value)}
                      placeholder="Rule title..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={newRuleDesc}
                      onChange={(e) => setNewRuleDesc(e.target.value)}
                      placeholder="Short description..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newRuleTitle.trim()) {
                            showToast('Enter a rule title.', 'error');
                            return;
                          }
                          setResortRules((prev) => [
                            ...prev,
                            {
                              id: `rule-${Date.now()}`,
                              type: newRuleType,
                              category: newRuleCategory,
                              title: newRuleTitle.trim(),
                              description: newRuleDesc.trim(),
                            },
                          ]);
                          setNewRuleTitle('');
                          setNewRuleDesc('');
                          showToast('Rule added.', 'success');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold transition cursor-pointer"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {resortRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                rule.type === 'do'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {rule.type.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">{rule.category}</span>
                            <h6 className="text-xs font-bold text-slate-900 dark:text-white">{rule.title}</h6>
                          </div>
                          {rule.description && (
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {rule.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!await confirmAction({ title: 'Delete Rule', message: 'Delete this rule?' })) return;
                            setResortRules((prev) => prev.filter((r) => r.id !== rule.id));
                            showToast('Rule deleted.', 'destructive');
                          }}
                          className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          title="Remove rule"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBeach(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                {editTab !== 'reviews' && (
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2 rounded-xl bg-[#1F3F74] hover:bg-[#18325c] dark:bg-[#4987BA] dark:hover:bg-[#3a72a1] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject 360 Tour Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#1F3F74] dark:text-[#4987BA]">
              Reject 360° Tour
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Reason for rejecting &ldquo;{rejectingRequest.beach?.name}&rdquo;:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectTour}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Coordinate Request Modal */}
      {rejectingCoordRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#1F3F74] dark:text-[#4987BA]">
              Reject Coordinates
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Reason for rejecting &ldquo;{rejectingCoordRequest.beach?.name}&rdquo;:
            </p>
            <textarea
              rows={3}
              value={coordRejectReason}
              onChange={(e) => setCoordRejectReason(e.target.value)}
              placeholder="Reason..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-xs font-semibold focus:outline-none focus:border-[#4987BA]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingCoordRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectCoord}
                disabled={isProcessingCoordAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Reject
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

      {/* Map Location Picker Modal */}
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

              showToast(`Pin updated to ${latNum.toFixed(5)}, ${lngNum.toFixed(5)}.`, 'success');
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
          beachName={`Proposed: ${previewCoordRequest.beach?.name || 'Beach'}`}
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
