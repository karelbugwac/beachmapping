'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  Shield,
  ShieldAlert,
  UserCheck,
  Trash2,
  Edit3,
  Eye,
  KeyRound,
  XCircle,
  Clock,
  Loader2,
  Copy,
  Check,
  Palmtree,
  RefreshCw,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { notifyRealtimeSync, useRealtimeSync } from '@/lib/realtime-sync';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'admin';
  status: 'active' | 'deactivated' | 'suspended';
  status_reason?: string | null;
  status_updated_at?: string | null;
  location?: string | null;
  profile_image_url?: string | null;
  joined: string;
  last_sign_in_at?: string | null;
  has_pin: boolean;
  beaches: Array<{ id: string; name: string }>;
}

interface UserModerationHubProps {
  initialTab?: string;
}

export function UserModerationHub(_props: UserModerationHubProps) {
  // Data States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User Filter States
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'beach_owner' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated' | 'suspended'>('all');

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
      if (!response.ok) {
        console.warn('Failed to load registered users, status:', response.status);
        return;
      }
      const data = await response.json();
      const rawUsers = Array.isArray(data.users) ? data.users : [];
      // Exclude any legacy beach_manager accounts or normalize them
      setUsers(
        rawUsers.filter((u: any) => u.role !== 'beach_manager')
      );
      if (data.currentAdminId) setCurrentAdminId(data.currentAdminId);
    } catch (error: unknown) {
      console.error('Failed to load registered users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
    showToast('Users refreshed.');
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useRealtimeSync(() => {
    void loadUsers();
  });

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

      showToast('User details updated.');
      notifyRealtimeSync('users');
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

      showToast(`Account updated to ${newStatus}.`);
      notifyRealtimeSync('users');
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

  // Submit Delete Account
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;

    if (!deletePolicyAccepted) {
      showToast('Please acknowledge the deletion policy before proceeding.', 'error');
      return;
    }

    const trimmedInput = deleteConfirmText.trim().toLowerCase();
    const targetEmail = deleteModalUser.email.trim().toLowerCase();

    if (trimmedInput !== 'delete' && trimmedInput !== targetEmail) {
      showToast('Please type the user email or DELETE to confirm.', 'error');
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

      showToast('User account deleted.', 'destructive');
      notifyRealtimeSync('all');
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
      showToast('PIN must be 6 digits.', 'error');
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

      showToast('6-digit PIN reset.');
      notifyRealtimeSync('users');
      setResetPinUser(null);
      setNewPin('');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to reset PIN.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      deactivated: users.filter((u) => u.status === 'deactivated').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      owners: users.filter((u) => u.role === 'beach_owner').length,
    };
  }, [users]);

  const getRoleLabel = (role: AdminUser['role']) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'beach_owner':
        return 'Beach Owner';
      default:
        return 'User';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Manage registered users, beach owners, and account statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAll}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] hover:border-[#4987BA] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-left transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Active
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {loadingUsers ? '...' : stats.active}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === 'beach_owner' ? 'all' : 'beach_owner')}
          className={`p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-left transition-all cursor-pointer ${
            roleFilter === 'beach_owner'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Beach Owners
            </span>
            <Palmtree className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-sky-600 dark:text-sky-400">
            {loadingUsers ? '...' : stats.owners}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'deactivated' ? 'all' : 'deactivated')}
          className={`p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-left transition-all cursor-pointer ${
            statusFilter === 'deactivated'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Deactivated
            </span>
            <Clock className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-slate-700 dark:text-neutral-300">
            {loadingUsers ? '...' : stats.deactivated}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')}
          className={`p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-left transition-all cursor-pointer ${
            statusFilter === 'suspended'
              ? 'border-[#4987BA] bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-[#4987BA]/20'
              : 'border-slate-200/80 dark:border-neutral-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Suspended
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {loadingUsers ? '...' : stats.suspended}
          </div>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#4987BA] focus:bg-white dark:focus:bg-neutral-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Role Filter */}
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                aria-label="Filter users by role"
                className="appearance-none pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-[#4987BA] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="beach_owner">Beach Owners</option>
                <option value="admin">Admins</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter users by account status"
                className="appearance-none pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-[#4987BA] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {(userSearch || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setUserSearch('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-neutral-950/60 border-b border-slate-100 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Role</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Joined</th>
                <th className="py-3.5 px-5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80 text-slate-700 dark:text-neutral-300">
              {loadingUsers && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1F3F74] dark:text-[#4987BA]" />
                  </td>
                </tr>
              )}

              {!loadingUsers && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 mb-2 text-slate-300 dark:text-neutral-700" />
                    <p className="text-xs font-semibold text-slate-400">No users found</p>
                  </td>
                </tr>
              )}

              {!loadingUsers &&
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentAdminId;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      {/* User (Avatar, Name, Email) */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              u.role === 'admin'
                                ? 'bg-[#1F3F74] text-white'
                                : u.role === 'beach_owner'
                                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                            }`}
                          >
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-[#1F3F74] dark:text-white truncate">
                                {u.name}
                              </span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F3F74]/10 text-[#1F3F74] dark:bg-sky-500/20 dark:text-sky-300">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-neutral-400 block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-[#1F3F74]/10 text-[#1F3F74] dark:bg-[#1F3F74]/40 dark:text-[#38BDF8]'
                              : u.role === 'beach_owner'
                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          <span>{getRoleLabel(u.role)}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : u.status === 'deactivated'
                                ? 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active'
                                ? 'bg-emerald-500'
                                : u.status === 'deactivated'
                                  ? 'bg-slate-400'
                                  : 'bg-rose-500'
                            }`}
                          />
                          <span>{u.status}</span>
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-500 dark:text-neutral-400">
                        {new Date(u.joined).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Single View Action Button */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-[#1F3F74] dark:text-white shadow-2xs transition hover:border-[#4987BA] hover:text-[#4987BA] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: USER DETAILS MODAL                                               */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-extrabold uppercase shrink-0 ${
                    selectedUser.role === 'admin'
                      ? 'bg-[#1F3F74] text-white'
                      : selectedUser.role === 'beach_owner'
                        ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  {selectedUser.name ? selectedUser.name.charAt(0) : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-[#1F3F74] dark:text-white truncate">
                      {selectedUser.name}
                    </h3>
                    {selectedUser.id === currentAdminId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F3F74]/10 text-[#1F3F74] dark:bg-sky-500/20 dark:text-sky-300">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                      {selectedUser.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedUser.id)}
                      className="text-slate-400 hover:text-[#1F3F74] dark:hover:text-white transition-colors cursor-pointer"
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
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1F3F74]/10 text-[#1F3F74] dark:bg-[#1F3F74]/40 dark:text-[#38BDF8]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{getRoleLabel(selectedUser.role)}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    selectedUser.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : selectedUser.status === 'deactivated'
                        ? 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedUser.status === 'active'
                        ? 'bg-emerald-500'
                        : selectedUser.status === 'deactivated'
                          ? 'bg-slate-400'
                          : 'bg-rose-500'
                    }`}
                  />
                  <span>{selectedUser.status}</span>
                </span>
                {selectedUser.has_pin && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    <KeyRound className="w-3 h-3" />
                    <span>PIN Active</span>
                  </span>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-3.5 text-xs bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-slate-100 dark:border-neutral-800">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Joined
                  </span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                    {new Date(selectedUser.joined).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Last Sign In
                  </span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block">
                    {selectedUser.last_sign_in_at
                      ? new Date(selectedUser.last_sign_in_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Never'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Location
                  </span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 mt-1 block truncate">
                    {selectedUser.location || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Status Reason Notice if Deactivated or Suspended */}
              {selectedUser.status !== 'active' && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 capitalize block">
                    {selectedUser.status} Reason
                  </span>
                  <p className="text-xs text-rose-700 dark:text-rose-400">
                    {selectedUser.status_reason || 'No reason recorded.'}
                  </p>
                </div>
              )}

              {/* Associated Beaches if any */}
              {selectedUser.beaches.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Beaches ({selectedUser.beaches.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.beaches.map((b) => (
                      <span
                        key={b.id}
                        className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Palmtree className="w-3.5 h-3.5" />
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50/70 dark:bg-black/30 border-t border-slate-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#18325c] dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    setResetPinUser(target);
                    setNewPin('');
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:border-sky-500 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Reset PIN</span>
                </button>

                {selectedUser.id !== currentAdminId && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedUser;
                      setSelectedUser(null);
                      openStatusModal(target);
                    }}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                      selectedUser.status === 'active'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Status</span>
                  </button>
                )}
              </div>

              {selectedUser.id !== currentAdminId && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    openDeleteModal(target);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1F3F74] dark:text-white">
                Edit User
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:border-[#4987BA]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:border-[#4987BA]"
                  required
                />
              </div>

              {editingUser.role !== 'admin' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                      className="w-full appearance-none px-3.5 pr-10 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:border-[#4987BA] cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="beach_owner">Beach Owner</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Catmon, Cebu"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:border-[#4987BA]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#18325c] dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#1F3F74] dark:text-white">
                  Account Status
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  {statusModalUser.name} ({statusModalUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-2.5">
                {/* Active */}
                <label
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    targetStatus === 'active'
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={targetStatus === 'active'}
                    onChange={() => setTargetStatus('active')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                </label>

                {/* Deactivate */}
                <label
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    targetStatus === 'deactivated'
                      ? 'border-slate-500 bg-slate-100/80 dark:bg-neutral-800'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="deactivated"
                    checked={targetStatus === 'deactivated'}
                    onChange={() => setTargetStatus('deactivated')}
                    className="text-slate-600 focus:ring-slate-500"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-neutral-200">
                    <Clock className="w-4 h-4" />
                    <span>Deactivate</span>
                  </div>
                </label>

                {/* Suspend */}
                <label
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    targetStatus === 'suspended'
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="suspended"
                    checked={targetStatus === 'suspended'}
                    onChange={() => setTargetStatus('suspended')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Suspend</span>
                  </div>
                </label>
              </div>

              {targetStatus !== 'active' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Reason..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:border-[#4987BA]"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#18325c] dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ACCOUNT DELETION MODAL                                           */}
      {/* ========================================================================= */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4 my-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Delete Account
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {deleteModalUser.name} ({deleteModalUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-neutral-300 select-none">
              <input
                type="checkbox"
                checked={deletePolicyAccepted}
                onChange={(e) => setDeletePolicyAccepted(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>
                I confirm that permanently deleting this account is authorized.
              </span>
            </label>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
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
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
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
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1F3F74] dark:text-white">
                    Reset 6-Digit PIN
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {resetPinUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPinUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-700 rounded-xl text-center text-2xl font-mono tracking-[0.4em] bg-slate-50 dark:bg-black text-[#1F3F74] dark:text-white focus:outline-none focus:border-[#4987BA]"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setResetPinUser(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPin}
                disabled={submitting || newPin.length !== 6}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#18325c] dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save PIN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
