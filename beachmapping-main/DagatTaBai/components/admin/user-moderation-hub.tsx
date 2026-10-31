'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  MessageSquare,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  Eye,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Mail,
  Calendar,
  Building,
  ArrowRight,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Palmtree,
  Star,
  Info,
  RefreshCw,
} from 'lucide-react';
import { StarRating } from '@/components/star-rating';
import { showToast } from '@/components/ui/feedback-toasts';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  status: 'active' | 'deactivated' | 'suspended';
  status_reason?: string | null;
  status_updated_at?: string | null;
  location?: string | null;
  profile_image_url?: string | null;
  joined: string;
  last_sign_in_at?: string | null;
  has_pin: boolean;
  beaches: Array<{ id: string; name: string }>;
  reviews_count: number;
  recent_reviews?: Array<{
    id: string;
    beach_id: string | null;
    beach_name: string;
    rating: number;
    comment: string;
    created_at: string;
    review_type: 'beach' | 'platform';
  }>;
}

export interface AdminReview {
  id: string;
  beach_id: string | null;
  user_id: string | null;
  review_type: 'beach' | 'platform';
  user_name: string;
  beach_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewReport {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: string;
  beach: string;
  review: { id: string; comment: string; rating: number } | null;
}

interface UserModerationHubProps {
  initialTab?: 'users' | 'reviews' | 'reports';
}

export function UserModerationHub({ initialTab = 'users' }: UserModerationHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State
  const tabParam = searchParams.get('tab') as 'users' | 'reviews' | 'reports' | null;
  const [activeTab, setActiveTab] = useState<'users' | 'reviews' | 'reports'>(tabParam || initialTab);

  // Data States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User Filter States
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'beach_owner' | 'beach_manager' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated' | 'suspended'>('all');

  // Review Filter States
  const [reviewSearch, setReviewSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [reviewTypeFilter, setReviewTypeFilter] = useState<'all' | 'beach' | 'platform'>('all');
  const [userFilterForReviews, setUserFilterForReviews] = useState<string | null>(null);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<AdminUser | null>(null);
  const [targetStatus, setTargetStatus] = useState<'active' | 'deactivated' | 'suspended'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePolicyAccepted, setDeletePolicyAccepted] = useState(false);
  const [resetPinUser, setResetPinUser] = useState<AdminUser | null>(null);
  const [newPin, setNewPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'user' as AdminUser['role'],
    location: '',
  });

  // Fetch Users
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load users.');
      setUsers(Array.isArray(data.users) ? data.users : []);
      if (data.currentAdminId) setCurrentAdminId(data.currentAdminId);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to load registered users.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Reviews & Reports
  const loadReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load reviews.');
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to load reviews.', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadUsers(), loadReviews()]);
    setRefreshing(false);
    showToast('Admin data refreshed.');
  };

  useEffect(() => {
    void loadUsers();
    void loadReviews();
  }, []);

  // Update tab in URL when changed
  const handleTabChange = (tab: 'users' | 'reviews' | 'reports') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Switch to reviews tab filtered by a specific user
  const handleViewUserReviews = (user: AdminUser) => {
    setUserFilterForReviews(user.name);
    setReviewSearch('');
    setActiveTab('reviews');
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'reviews');
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Copy ID
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showToast('User ID copied to clipboard.');
  };

  // Filter Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.location && u.location.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  // Filter Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const q = reviewSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.comment.toLowerCase().includes(q) ||
        r.user_name.toLowerCase().includes(q) ||
        r.beach_name.toLowerCase().includes(q);

      const matchesRating = ratingFilter === 'all' || Math.round(r.rating) === ratingFilter;
      const matchesType = reviewTypeFilter === 'all' || r.review_type === reviewTypeFilter;
      const matchesUser = !userFilterForReviews || r.user_name.toLowerCase() === userFilterForReviews.toLowerCase();

      return matchesSearch && matchesRating && matchesType && matchesUser;
    });
  }, [reviews, reviewSearch, ratingFilter, reviewTypeFilter, userFilterForReviews]);

  // Open Edit Modal
  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location || '',
    });
  };

  // Submit Edit User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editFormData.name.trim()) {
      showToast('User name cannot be empty.', 'error');
      return;
    }
    if (!editFormData.email.trim() || !editFormData.email.includes('@')) {
      showToast('A valid email address is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          action: 'edit',
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          role: editFormData.role,
          location: editFormData.location.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user.');

      setUsers((current) =>
        current.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: editFormData.name.trim(),
                email: editFormData.email.trim(),
                role: editFormData.role,
                location: editFormData.location.trim() || null,
              }
            : u
        )
      );

      // If user details modal was open, update it
      if (selectedUser?.id === editingUser.id) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                name: editFormData.name.trim(),
                email: editFormData.email.trim(),
                role: editFormData.role,
                location: editFormData.location.trim() || null,
              }
            : null
        );
      }

      showToast('User details updated successfully.');
      setEditingUser(null);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Status Modal
  const openStatusModal = (user: AdminUser, defaultStatus?: 'active' | 'deactivated' | 'suspended') => {
    setStatusModalUser(user);
    setTargetStatus(defaultStatus || (user.status === 'active' ? 'suspended' : 'active'));
    setStatusReason(user.status_reason || '');
  };

  // Submit Status Change (Activate, Deactivate, Suspend)
  const handleSaveStatus = async () => {
    if (!statusModalUser) return;

    if (targetStatus !== 'active' && !statusReason.trim()) {
      showToast('Please provide a reason for deactivating or suspending this account.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: statusModalUser.id,
          action: 'status',
          status: targetStatus,
          reason: statusReason.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update account status.');

      const newStatus = data.status || targetStatus;
      const newReason = data.status_reason || statusReason.trim() || null;

      setUsers((current) =>
        current.map((u) =>
          u.id === statusModalUser.id
            ? {
                ...u,
                status: newStatus,
                status_reason: newReason,
                status_updated_at: new Date().toISOString(),
              }
            : u
        )
      );

      if (selectedUser?.id === statusModalUser.id) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                status_reason: newReason,
                status_updated_at: new Date().toISOString(),
              }
            : null
        );
      }

      showToast(`Account successfully updated to ${newStatus}.`);
      setStatusModalUser(null);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update account status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (user: AdminUser) => {
    if (user.id === currentAdminId) {
      showToast('You cannot delete your own active administrator account.', 'error');
      return;
    }
    setDeleteModalUser(user);
    setDeleteConfirmText('');
    setDeletePolicyAccepted(false);
  };

  // Submit Delete Account following Policy
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;

    if (!deletePolicyAccepted) {
      showToast('You must acknowledge the municipal data policy before proceeding.', 'error');
      return;
    }

    const trimmedInput = deleteConfirmText.trim().toLowerCase();
    const targetEmail = deleteModalUser.email.trim().toLowerCase();

    if (trimmedInput !== 'delete' && trimmedInput !== targetEmail) {
      showToast('Please type the user email or DELETE exactly to confirm.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteModalUser.id, policyConfirmed: true }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user account.');

      setUsers((current) => current.filter((u) => u.id !== deleteModalUser.id));

      if (selectedUser?.id === deleteModalUser.id) {
        setSelectedUser(null);
      }

      showToast('User account permanently deleted in accordance with policy.');
      setDeleteModalUser(null);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to delete user account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset PIN
  const handleResetPin = async () => {
    if (!resetPinUser) return;
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      showToast('PIN must be exactly 6 numeric digits.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resetPinUser.id,
          action: 'reset_pin',
          pin: newPin,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset PIN.');

      setUsers((current) =>
        current.map((u) => (u.id === resetPinUser.id ? { ...u, has_pin: true } : u))
      );

      showToast('6-digit PIN pass reset successfully.');
      setResetPinUser(null);
      setNewPin('');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to reset PIN.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Review Actions
  const handleDeleteReview = async (review: AdminReview) => {
    if (!confirm(`Are you sure you want to delete this review by "${review.user_name}"?`)) return;

    try {
      const response = await fetch(
        `/api/admin/reviews?id=${encodeURIComponent(review.id)}&type=${review.review_type}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete review.');

      setReviews((current) => current.filter((r) => r.id !== review.id));

      // Also remove from selected user recent reviews if open
      if (selectedUser) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                reviews_count: Math.max(0, prev.reviews_count - 1),
                recent_reviews: prev.recent_reviews?.filter((r) => r.id !== review.id),
              }
            : null
        );
      }

      showToast('Review removed from municipal records.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to delete review.', 'error');
    }
  };

  // Report Actions
  const handleReportDecision = async (reportId: string, decision: 'remove' | 'dismiss') => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not process report decision.');

      const targetReport = reports.find((r) => r.id === reportId);
      const reportedReviewId = targetReport?.review?.id;

      setReports((current) => current.filter((r) => r.id !== reportId));

      if (decision === 'remove' && reportedReviewId) {
        setReviews((current) => current.filter((r) => r.id !== reportedReviewId));
      }

      showToast(decision === 'remove' ? 'Reported review removed.' : 'Report dismissed.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not process report decision.', 'error');
    }
  };

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      deactivated: users.filter((u) => u.status === 'deactivated').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      owners: users.filter((u) => u.role === 'beach_owner' || u.role === 'beach_manager').length,
      reviewsCount: reviews.length,
      pendingReports: reports.length,
    };
  }, [users, reviews, reports]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              User &amp; Review Management Hub
            </h1>
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Unified console to oversee registered citizens, resort staff, account permissions, and community review moderation.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {stats.total} Users
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {stats.reviewsCount} Reviews
            </span>
          </div>
          {stats.pendingReports > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-600 dark:text-amber-400 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold">
                {stats.pendingReports} Flagged
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Unified Tab Selector */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('reviews')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Review Moderation</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {stats.reviewsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('reports')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reported Reviews</span>
          {stats.pendingReports > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">
              {stats.pendingReports}
            </span>
          ) : (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              0
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER ACCOUNTS                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                Active Users
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {stats.active}
                </span>
                <span className="text-xs text-slate-500">accounts</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                Deactivated
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-600 dark:text-slate-400">
                  {stats.deactivated}
                </span>
                <span className="text-xs text-slate-500">dormant</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                Suspended
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {stats.suspended}
                </span>
                <span className="text-xs text-slate-500">penalized</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                Resort Owners / Staff
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                  {stats.owners}
                </span>
                <span className="text-xs text-slate-500">proprietors</span>
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, municipality or user ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-semibold">Role:</span>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                aria-label="Filter users by role"
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Roles</option>
                <option value="user">Regular Tourists (User)</option>
                <option value="beach_owner">Beach Owners</option>
                <option value="beach_manager">Beach Managers</option>
                <option value="admin">Administrators</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-2">
                <span className="font-semibold">Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter users by account status"
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="suspended">Suspended</option>
              </select>

              {(userSearch || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearch('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4">Resorts &amp; Reviews</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {loadingUsers && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-600" />
                        <span className="mt-2 block text-xs text-slate-400">Loading registered users...</span>
                      </td>
                    </tr>
                  )}

                  {!loadingUsers && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <Users className="mx-auto h-8 w-8 mb-2 stroke-1 opacity-50" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No registered users found.</p>
                        <p className="text-xs text-slate-400 mt-1">Try broadening your search query or role filter.</p>
                      </td>
                    </tr>
                  )}

                  {!loadingUsers &&
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentAdminId;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Name & Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                                  u.role === 'admin'
                                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : u.role === 'beach_owner'
                                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                    : u.role === 'beach_manager'
                                    ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {u.name ? u.name.charAt(0) : 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white truncate">
                                    {u.name}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400 text-[11px] block truncate">
                                  {u.email}
                                </span>
                                {u.location && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                    {u.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                                  : u.role === 'beach_owner'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                                  : u.role === 'beach_manager'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {u.role === 'admin' && <Shield className="w-3 h-3" />}
                              {u.role === 'beach_owner' && <Palmtree className="w-3 h-3" />}
                              {u.role === 'beach_manager' && <Building className="w-3 h-3" />}
                              <span>{u.role.replace('_', ' ')}</span>
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                u.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : u.status === 'deactivated'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {u.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                              {u.status === 'deactivated' && <Clock className="w-3 h-3" />}
                              {u.status === 'suspended' && <XCircle className="w-3 h-3" />}
                              <span>{u.status}</span>
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            <span className="block font-medium">
                              {new Date(u.joined).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {u.last_sign_in_at
                                ? `Active ${new Date(u.last_sign_in_at).toLocaleDateString()}`
                                : 'No logins recorded'}
                            </span>
                          </td>

                          {/* Resorts & Reviews */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              {u.beaches.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                                  <Palmtree className="w-3 h-3" />
                                  {u.beaches.length} beach {u.beaches.length === 1 ? 'resort' : 'resorts'}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleViewUserReviews(u)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                title="Inspect user reviews in Review Moderation tab"
                              >
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>{u.reviews_count} {u.reviews_count === 1 ? 'review' : 'reviews'}</span>
                              </button>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="View User Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Information */}
                              <button
                                type="button"
                                onClick={() => openEditModal(u)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit User Information"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Status Moderation */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => openStatusModal(u)}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    u.status === 'active'
                                      ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  }`}
                                  title="Change Account Status (Activate / Deactivate / Suspend)"
                                >
                                  {u.status === 'active' ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* Reset PIN */}
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPinUser(u);
                                  setNewPin('');
                                }}
                                className="p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Reset 6-digit PIN"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {/* Delete Account Following Policy */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(u)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                  title="Permanently Delete Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REVIEW MODERATION                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Active User Filter Notification Pill */}
          {userFilterForReviews && (
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300">
                <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>
                  Filtering reviews submitted by <strong>{userFilterForReviews}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUserFilterForReviews(null)}
                className="text-xs font-bold text-sky-600 hover:underline dark:text-sky-400"
              >
                Clear user filter
              </button>
            </div>
          )}

          {/* Search & Review Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews by comment text, reviewer, or beach name..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Rating:</span>
              </div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                aria-label="Filter reviews by rating"
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Stars</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-2">
                <span className="font-semibold">Type:</span>
              </div>
              <select
                value={reviewTypeFilter}
                onChange={(e) => setReviewTypeFilter(e.target.value as any)}
                aria-label="Filter reviews by review type"
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Submissions</option>
                <option value="beach">Beach Resort Reviews</option>
                <option value="platform">Platform Feedback</option>
              </select>

              {(reviewSearch || ratingFilter !== 'all' || reviewTypeFilter !== 'all' || userFilterForReviews) && (
                <button
                  type="button"
                  onClick={() => {
                    setReviewSearch('');
                    setRatingFilter('all');
                    setReviewTypeFilter('all');
                    setUserFilterForReviews(null);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Reviews List */}
          {loadingReviews && (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-600" />
              <span className="mt-2 block text-xs text-slate-400">Loading reviews...</span>
            </div>
          )}

          {!loadingReviews && filteredReviews.length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 stroke-1 text-slate-400 opacity-50" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No matching reviews found.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the rating or search filters.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((r) => {
              const matchedUser = users.find((u) => u.id === r.user_id || u.name === r.user_name);
              return (
                <div
                  key={`${r.review_type}:${r.id}`}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {r.user_name}
                          </span>
                          {matchedUser && (
                            <button
                              type="button"
                              onClick={() => setSelectedUser(matchedUser)}
                              className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>View Profile</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            {r.review_type === 'beach' ? (
                              <Palmtree className="w-3.5 h-3.5 text-sky-600" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                            )}
                            {r.beach_name}
                          </span>
                          <span>•</span>
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      {r.review_type} review
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteReview(r)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Review</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REPORTED REVIEWS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Resort Owner Review Moderation Queue ({reports.length})
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Beach resort proprietors can flag reviews they suspect violate municipal conduct standards or contain inappropriate statements. Review each case and either remove the review or dismiss the report.
              </p>
            </div>
          </div>

          {loadingReviews && (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-amber-600" />
              <span className="mt-2 block text-xs text-slate-400">Loading flagged reports...</span>
            </div>
          )}

          {!loadingReviews && reports.length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-emerald-500 stroke-1" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">All clear!</p>
              <p className="text-xs text-slate-400 mt-1">There are no pending owner reports awaiting moderation.</p>
            </div>
          )}

          <div className="space-y-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-slate-900 dark:text-white">
                      {report.beach}
                    </strong>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 uppercase">
                      Pending Review
                    </span>
                  </div>
                  <span className="text-slate-400">
                    Reported by <strong>{report.reporter}</strong> on{' '}
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                    Reason Given:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {report.reason}
                  </p>
                </div>

                {report.review && (
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                      Target Review Content:
                    </span>
                    <blockquote className="border-l-4 border-amber-400 pl-3 py-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic">
                      &ldquo;{report.review.comment}&rdquo;
                      <div className="mt-1 flex items-center gap-1 not-italic">
                        <StarRating rating={report.review.rating} size="sm" />
                      </div>
                    </blockquote>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => void handleReportDecision(report.id, 'remove')}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Remove Inappropriate Review
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReportDecision(report.id, 'dismiss')}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    Dismiss Report (Keep Review)
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: USER DETAILS MODAL                                               */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold uppercase flex-shrink-0 ${
                    selectedUser.role === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : selectedUser.role === 'beach_owner'
                      ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {selectedUser.name ? selectedUser.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{selectedUser.email}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedUser.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title="Copy User ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Role: {selectedUser.role.replace('_', ' ')}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedUser.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : selectedUser.status === 'deactivated'
                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                Status: {selectedUser.status}
              </span>
              {selectedUser.has_pin && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  PIN Configured
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Registered Date
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {new Date(selectedUser.joined).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Last Sign In
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedUser.last_sign_in_at
                    ? new Date(selectedUser.last_sign_in_at).toLocaleString()
                    : 'Never recorded'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Municipality / Location
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedUser.location || 'Not specified (Catmon, Cebu)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Total Reviews Written
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedUser.reviews_count} submission(s)
                </span>
              </div>
            </div>

            {/* Status Reason Notice if Deactivated or Suspended */}
            {selectedUser.status !== 'active' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                  Account {selectedUser.status} notice:
                </span>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  {selectedUser.status_reason || 'No administrative reason recorded.'}
                </p>
                {selectedUser.status_updated_at && (
                  <span className="text-[10px] text-rose-500 block">
                    Updated on {new Date(selectedUser.status_updated_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Associated Beaches if any */}
            {selectedUser.beaches.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Owned Beach Listings ({selectedUser.beaches.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.beaches.map((b) => (
                    <span
                      key={b.id}
                      className="px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Palmtree className="w-3.5 h-3.5" />
                      {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Reviews Preview */}
            {selectedUser.recent_reviews && selectedUser.recent_reviews.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Recent Reviews by User
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      handleViewUserReviews(selectedUser);
                    }}
                    className="text-xs text-sky-600 font-semibold hover:underline"
                  >
                    View in Moderation Tab →
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedUser.recent_reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.beach_name}
                        </span>
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  openEditModal(target);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit User</span>
              </button>

              {selectedUser.id !== currentAdminId && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    openStatusModal(target);
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                    selectedUser.status === 'active'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Change Status</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setResetPinUser(target);
                  setNewPin('');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset PIN</span>
              </button>

              {selectedUser.id !== currentAdminId && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    openDeleteModal(target);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER INFORMATION                                            */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Edit User Information
                </h3>
                <p className="text-xs text-slate-400">
                  Update personal profile data and role permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Platform Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="user">Regular Tourist (user)</option>
                  <option value="beach_owner">Resort Owner (beach_owner)</option>
                  <option value="beach_manager">Resort Manager (beach_manager)</option>
                  <option value="admin">Administrator (admin)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Note: Elevating to Administrator grants full municipal privileges across all beaches and moderation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Municipality
                </label>
                <input
                  type="text"
                  placeholder="e.g. Catmon, Cebu"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ACCOUNT STATUS (ACTIVATE / DEACTIVATE / SUSPEND)                  */}
      {/* ========================================================================= */}
      {statusModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Manage Account Status
                </h3>
                <p className="text-xs text-slate-400">
                  Target: <strong>{statusModalUser.name}</strong> ({statusModalUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Choose Desired Account State:
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Active */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    targetStatus === 'active'
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={targetStatus === 'active'}
                    onChange={() => setTargetStatus('active')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                      <UserCheck className="w-4 h-4" />
                      <span>Activate Account</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Account has full access to login, submit reviews, and manage certified beaches.
                    </p>
                  </div>
                </label>

                {/* Deactivate */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    targetStatus === 'deactivated'
                      ? 'border-slate-500 bg-slate-100 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="deactivated"
                    checked={targetStatus === 'deactivated'}
                    onChange={() => setTargetStatus('deactivated')}
                    className="mt-0.5 text-slate-600 focus:ring-slate-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-slate-300">
                      <Clock className="w-4 h-4" />
                      <span>Deactivate Account</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Temporarily pause account (e.g. user requested, seasonal hiatus). Does not mark account with violation penalty.
                    </p>
                  </div>
                </label>

                {/* Suspend */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    targetStatus === 'suspended'
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="suspended"
                    checked={targetStatus === 'suspended'}
                    onChange={() => setTargetStatus('suspended')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Suspend Account (Policy Violation)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Bans user from signing in due to terms violation, fraudulent permit filings, or abusive reviews.
                    </p>
                  </div>
                </label>
              </div>

              {targetStatus !== 'active' && (
                <div className="space-y-1 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Administrative Reason / Moderation Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a clear explanation for this moderation action..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: POLICY-DRIVEN ACCOUNT DELETION MODAL                             */}
      {/* ========================================================================= */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-5 my-8">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Municipal Account Deletion Policy
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Target Account: <strong>{deleteModalUser.name}</strong> ({deleteModalUser.email})
                </p>
              </div>
            </div>

            {/* Clear Municipal Policy Box */}
            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-rose-900 dark:text-rose-300">
                Please review the data deletion safeguards before proceeding:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                <li>
                  <strong>Permanent Purge:</strong> All authentication credentials, login passes, and user profile metadata will be permanently eradicated.
                </li>
                <li>
                  <strong>Listing Safeguard:</strong> Any beach resort listings owned by this account will be preserved and unassigned to prevent directory disruption.
                </li>
                <li>
                  <strong>Auditing Integrity:</strong> Historical visitor transaction records and submitted permits remain archived for municipal transparency.
                </li>
              </ul>
            </div>

            {/* Policy Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={deletePolicyAccepted}
                onChange={(e) => setDeletePolicyAccepted(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>
                I confirm that I have reviewed the municipal account deletion policy and this removal is justified and authorized.
              </span>
            </label>

            {/* Type to Confirm */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Type <strong>{deleteModalUser.email}</strong> or <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="Type here..."
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={
                  submitting ||
                  !deletePolicyAccepted ||
                  (deleteConfirmText.trim().toLowerCase() !== 'delete' &&
                    deleteConfirmText.trim().toLowerCase() !== deleteModalUser.email.trim().toLowerCase())
                }
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RESET 6-DIGIT PIN MODAL                                          */}
      {/* ========================================================================= */}
      {resetPinUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reset 6-Digit PIN Pass
                </h3>
                <p className="text-xs text-slate-400">
                  Target: <strong>{resetPinUser.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPinUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Assign a new 6-digit PIN for resort owner or administrative quick sign-in.
            </p>

            <input
              type="text"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-3xl font-mono tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResetPinUser(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPin}
                disabled={submitting || newPin.length !== 6}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Set New PIN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
