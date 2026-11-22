'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import {
  filterFullNameInput,
  FULL_NAME_MESSAGES,
  validateFullName,
} from '@/lib/validation/fullName';
import { validateSafeText } from '@/lib/validation/safe-text';
import { ADMIN_MESSAGES, SUSPENSION_REASON_TYPES } from '@/lib/validation/admin-messages';
import { validateSuspensionEndDate } from '@/lib/validation/suspension-date';
import { notifyRealtimeSync, useRealtimeSync } from '@/lib/realtime-sync';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'admin';
  status: 'active' | 'deactivated' | 'suspended';
  statusreason?: string | null;
  statusreasontype?: string | null;
  statusupdatedat?: string | null;
  suspensionendsat?: string | null;
  suspendeduntil?: string | null;
  accountstatus?: 'active' | 'under_review' | 'suspended';
  statuschangedat?: string | null;
  location?: string | null;
  profileimageurl?: string | null;
  joined: string;
  last_sign_in_at?: string | null;
  has_pin: boolean;
  beaches: Array<{ id: string; name: string }>;
}

type ApiAdminUser = Omit<AdminUser, 'role'> & {
  role: AdminUser['role'] | 'beach_manager';
};

function dateInputValue(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
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
  const [statusReasonType, setStatusReasonType] = useState('');
  const [suspensionEndDate, setSuspensionEndDate] = useState('');
  const [statusModalError, setStatusModalError] = useState('');
  const [statusModalSuccess, setStatusModalSuccess] = useState('');
  const [statusInitialDraft, setStatusInitialDraft] = useState({ reason: '', reasonType: '', date: '' });
  const suspensionReasonTypeRef = useRef<HTMLSelectElement>(null);
  const statusReturnFocusRef = useRef<HTMLElement | null>(null);
  const statusModalRef = useRef<HTMLDivElement>(null);
  const statusSuccessTimeoutRef = useRef<number | null>(null);
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
  const [editNameInputError, setEditNameInputError] = useState<string | null>(null);
  const editNameValidation = validateFullName(editFormData.name);
  const editNameError = editNameInputError || editNameValidation.error;
  const editNameValid = editNameValidation.ok && !editNameInputError;
  const suspensionReasonValidation = validateSafeText(statusReason, {
    min: 10,
    max: 500,
    maxLines: 5,
    invalidMessage: ADMIN_MESSAGES.suspensionReasonInvalid,
    tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
    tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
    tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
  });
  const suspensionDateValidation = validateSuspensionEndDate(suspensionEndDate);
  const suspensionDateMin = new Date();
  suspensionDateMin.setDate(suspensionDateMin.getDate() + 1);
  const suspensionDateMax = new Date();
  suspensionDateMax.setFullYear(suspensionDateMax.getFullYear() + 1);

  // Fetch Users
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!response.ok) {
        console.warn('Failed to load registered users, status:', response.status);
        return;
      }
      const data = await response.json();
      const rawUsers: ApiAdminUser[] = Array.isArray(data.users) ? data.users : [];
      setUsers(
        rawUsers.map((user): AdminUser => ({
          ...user,
          role: user.role === 'beach_manager' ? 'beach_owner' : user.role,
        }))
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

  useEffect(() => {
    if (!statusModalUser || targetStatus !== 'suspended') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => suspensionReasonTypeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      statusReturnFocusRef.current?.focus();
    };
  }, [statusModalUser, targetStatus]);

  useEffect(() => {
    return () => {
      if (statusSuccessTimeoutRef.current !== null) {
        window.clearTimeout(statusSuccessTimeoutRef.current);
      }
    };
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
    setEditNameInputError(null);
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

    const nameValidation = validateFullName(editFormData.name);
    if (!editNameInputError) setEditNameInputError(nameValidation.error);
    if (!nameValidation.ok || editNameInputError) {
      showToast(editNameInputError || nameValidation.error || FULL_NAME_MESSAGES.required, 'error');
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
          name: nameValidation.value,
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
                name: nameValidation.value,
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
                name: nameValidation.value,
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
    if (statusSuccessTimeoutRef.current !== null) {
      window.clearTimeout(statusSuccessTimeoutRef.current);
      statusSuccessTimeoutRef.current = null;
    }
    statusReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nextStatus = defaultStatus || (user.status === 'active' ? 'suspended' : 'active');
    const editingSuspension = nextStatus === 'suspended' && user.accountstatus === 'suspended';
    const reinstating = nextStatus === 'active' && user.accountstatus === 'suspended';
    const initialReason = ((nextStatus === 'suspended' && !editingSuspension) || reinstating)
      ? ''
      : user.statusreason || '';
    setStatusModalUser(user);
    setTargetStatus(nextStatus);
    setStatusReason(initialReason);
    setStatusReasonType(editingSuspension ? user.statusreasontype || '' : '');
    const date = editingSuspension ? user.suspendeduntil || user.suspensionendsat : null;
    const endDate = date ? date.slice(0, 10) : '';
    setSuspensionEndDate(endDate);
    setStatusInitialDraft({ reason: initialReason, reasonType: user.statusreasontype || '', date: endDate });
    setStatusModalError('');
    setStatusModalSuccess('');
  };

  // Submit Status Change (Activate, Deactivate, Suspend)
  const handleSaveStatus = async () => {
    if (!statusModalUser) return;

    if (targetStatus === 'active' && statusModalUser.accountstatus === 'suspended') {
      const noteValidation = validateSafeText(statusReason, { max: 500 });
      if (!noteValidation.ok) {
        setStatusModalError(noteValidation.error || ADMIN_MESSAGES.serverError);
        return;
      }
      setSubmitting(true);
      setStatusModalError('');
      setStatusModalSuccess('');
      try {
        const response = await fetch('/api/admin/users/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status_change',
            id: statusModalUser.id,
            tostatus: 'active',
            reason: noteValidation.value,
            reasontype: null,
            suspendeduntil: null,
            expected_status_changed_at: statusModalUser.statuschangedat || null,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || ADMIN_MESSAGES.serverError);
        const updated: Partial<AdminUser> = {
          status: 'active',
          accountstatus: 'active',
          statusreason: null,
          statusreasontype: null,
          suspensionendsat: null,
          suspendeduntil: null,
          statusupdatedat: data.statuschangedat,
          statuschangedat: data.statuschangedat,
        };
        setUsers((current) => current.map((user) => user.id === statusModalUser.id ? { ...user, ...updated } : user));
        setSelectedUser((current) => current?.id === statusModalUser.id ? { ...current, ...updated } : current);
        setStatusModalSuccess('Account reinstated.');
        statusSuccessTimeoutRef.current = window.setTimeout(() => {
          statusSuccessTimeoutRef.current = null;
          setStatusModalUser(null);
          setStatusModalSuccess('');
        }, 1000);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const safeMessages = new Set([
          ADMIN_MESSAGES.notAllowed,
          ADMIN_MESSAGES.staleChange,
          ADMIN_MESSAGES.rateLimited,
          ADMIN_MESSAGES.serverError,
          ADMIN_MESSAGES.reasonTooLong,
          ADMIN_MESSAGES.suspensionReasonInvalid,
          'Account not found.',
        ]);
        setStatusModalError(safeMessages.has(message) ? message : ADMIN_MESSAGES.serverError);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (targetStatus === 'suspended') {
      if (!SUSPENSION_REASON_TYPES.includes(statusReasonType as (typeof SUSPENSION_REASON_TYPES)[number])) {
        setStatusModalError(ADMIN_MESSAGES.reasonTypeRequired);
        return;
      }
      const reasonValidation = validateSafeText(statusReason, {
        min: 10,
        max: 500,
        maxLines: 5,
        invalidMessage: ADMIN_MESSAGES.suspensionReasonInvalid,
        tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
        tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
        tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
      });
      if (!reasonValidation.ok) {
        setStatusModalError(reasonValidation.error);
        return;
      }
      const dateValidation = validateSuspensionEndDate(suspensionEndDate);
      if (!dateValidation.ok) {
        setStatusModalError(ADMIN_MESSAGES.suspensionDateInvalid);
        return;
      }

      setSubmitting(true);
      setStatusModalError('');
      setStatusModalSuccess('');
      try {
        const response = await fetch('/api/admin/users/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: statusModalUser.accountstatus === 'suspended' ? 'reason_edit' : 'status_change',
            id: statusModalUser.id,
            tostatus: 'suspended',
            reason: reasonValidation.value,
            reasontype: statusReasonType,
            suspendeduntil: suspensionEndDate || null,
            expected_status_changed_at: statusModalUser.statuschangedat || null,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || ADMIN_MESSAGES.serverError);

        const updated: Partial<AdminUser> = {
          status: 'suspended',
          accountstatus: 'suspended',
          statusreason: data.statusreason,
          statusreasontype: data.statusreasontype,
          suspensionendsat: data.suspendeduntil,
          suspendeduntil: data.suspendeduntil,
          statusupdatedat: data.statuschangedat,
          statuschangedat: data.statuschangedat,
        };
        setUsers((current) => current.map((user) => user.id === statusModalUser.id ? { ...user, ...updated } : user));
        setSelectedUser((current) => current?.id === statusModalUser.id ? { ...current, ...updated } : current);
        setStatusModalSuccess(statusModalUser.accountstatus === 'suspended' ? 'Suspension details updated.' : 'Account suspended.');
        statusSuccessTimeoutRef.current = window.setTimeout(() => {
          statusSuccessTimeoutRef.current = null;
          setStatusModalUser(null);
          setStatusModalSuccess('');
        }, 1000);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const safeMessages = new Set([
          ADMIN_MESSAGES.notAllowed,
          ADMIN_MESSAGES.staleChange,
          ADMIN_MESSAGES.rateLimited,
          ADMIN_MESSAGES.serverError,
          ADMIN_MESSAGES.reasonTypeRequired,
          ADMIN_MESSAGES.reasonTooShort,
          ADMIN_MESSAGES.reasonTooLong,
          ADMIN_MESSAGES.suspensionReasonInvalid,
          ADMIN_MESSAGES.reasonTooManyLines,
          ADMIN_MESSAGES.suspensionDateInvalid,
          'Account not found.',
        ]);
        setStatusModalError(safeMessages.has(message) ? message : ADMIN_MESSAGES.serverError);
      } finally {
        setSubmitting(false);
      }
      return;
    }

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
          suspensionendsat: suspensionEndDate
            ? new Date(`${suspensionEndDate}T23:59:59`).toISOString()
            : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update account status.');

      const newStatus = data.status || targetStatus;
      const newReason = newStatus === 'active'
        ? null
        : data.statusreason || statusReason.trim() || null;
      const newSuspensionEnd = data.suspensionendsat || null;
      const suspendedAt = data.suspendedat || null;

      setUsers((current) =>
        current.map((u) =>
          u.id === statusModalUser.id
            ? {
                ...u,
                status: newStatus,
                statusreason: newReason,
                statusupdatedat: suspendedAt || new Date().toISOString(),
                suspensionendsat: newSuspensionEnd,
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
                statusreason: newReason,
                statusupdatedat: suspendedAt || new Date().toISOString(),
                suspensionendsat: newSuspensionEnd,
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

  const closeStatusModal = () => {
    if (submitting) return;
    const hasChanges = statusReason !== statusInitialDraft.reason ||
      statusReasonType !== statusInitialDraft.reasonType ||
      suspensionEndDate !== statusInitialDraft.date;
    const hasDraft = targetStatus === 'suspended' || statusModalUser?.accountstatus === 'suspended';
    if (hasDraft && hasChanges && !statusModalSuccess && !window.confirm('Discard changes?')) return;
    if (statusSuccessTimeoutRef.current !== null) {
      window.clearTimeout(statusSuccessTimeoutRef.current);
      statusSuccessTimeoutRef.current = null;
    }
    setStatusModalUser(null);
    setStatusModalError('');
    setStatusModalSuccess('');
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy-500 dark:text-white">
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
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-brand-navy-500 dark:text-brand-teal-300 hover:border-brand-teal-600 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div
        role="group"
        aria-label="Filter users by account group"
        className="grid grid-cols-2 border-y border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-4"
      >
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          aria-pressed={statusFilter === 'active'}
          className={`flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 text-left text-sm transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 sm:border-b-0 sm:border-r ${
            statusFilter === 'active'
              ? 'border-l-2 border-l-brand-600 bg-slate-50 font-semibold text-brand-700 dark:bg-neutral-800 dark:text-sky-300'
              : 'text-slate-600 dark:text-neutral-300'
          }`}
        >
          <span>Active</span>
          <span className="tabular-nums text-slate-500 dark:text-neutral-400">{loadingUsers ? '...' : stats.active}</span>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === 'beach_owner' ? 'all' : 'beach_owner')}
          aria-pressed={roleFilter === 'beach_owner'}
          className={`flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 text-left text-sm transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 sm:border-b-0 sm:border-r ${
            roleFilter === 'beach_owner'
              ? 'border-l-2 border-l-brand-600 bg-slate-50 font-semibold text-brand-700 dark:bg-neutral-800 dark:text-sky-300'
              : 'text-slate-600 dark:text-neutral-300'
          }`}
        >
          <span>Beach owners</span>
          <span className="tabular-nums text-slate-500 dark:text-neutral-400">{loadingUsers ? '...' : stats.owners}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'deactivated' ? 'all' : 'deactivated')}
          aria-pressed={statusFilter === 'deactivated'}
          className={`flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 text-left text-sm transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 sm:border-b-0 sm:border-r ${
            statusFilter === 'deactivated'
              ? 'border-l-2 border-l-brand-600 bg-slate-50 font-semibold text-brand-700 dark:bg-neutral-800 dark:text-sky-300'
              : 'text-slate-600 dark:text-neutral-300'
          }`}
        >
          <span>Deactivated</span>
          <span className="tabular-nums text-slate-500 dark:text-neutral-400">{loadingUsers ? '...' : stats.deactivated}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')}
          aria-pressed={statusFilter === 'suspended'}
          className={`flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 text-left text-sm transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 sm:border-b-0 sm:last:border-r-0 ${
            statusFilter === 'suspended'
              ? 'border-l-2 border-l-brand-600 bg-slate-50 font-semibold text-brand-700 dark:bg-neutral-800 dark:text-sky-300'
              : 'text-slate-600 dark:text-neutral-300'
          }`}
        >
          <span>Suspended</span>
          <span className="tabular-nums text-slate-500 dark:text-neutral-400">{loadingUsers ? '...' : stats.suspended}</span>
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
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600 focus:bg-white dark:focus:bg-neutral-900 placeholder:text-slate-400"
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
                className="appearance-none pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600 cursor-pointer"
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
                className="appearance-none pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600 cursor-pointer"
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
          <table className="w-full min-w-[800px] table-fixed border-collapse text-left text-xs">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/80 dark:bg-neutral-950/60 border-b border-slate-100 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold text-[11px]">
                <th scope="col" className="py-3.5 px-5">User</th>
                <th scope="col" className="py-3.5 px-5">Role</th>
                <th scope="col" className="py-3.5 px-5 text-center">Status</th>
                <th scope="col" className="py-3.5 px-5 text-center">Joined</th>
                <th scope="col" className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80 text-slate-700 dark:text-neutral-300">
              {loadingUsers && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-navy-500 dark:text-brand-teal-300" />
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
                                ? 'bg-brand-navy-500 text-white'
                                : u.role === 'beach_owner'
                                  ? 'bg-brand-teal-100 dark:bg-brand-teal-700/80 text-brand-teal-700 dark:text-brand-teal-300'
                                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                            }`}
                          >
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-brand-navy-500 dark:text-white truncate">
                                {u.name}
                              </span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-navy-500/10 text-brand-navy-500 dark:bg-brand-teal-500/20 dark:text-brand-teal-300">
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
                              ? 'bg-brand-navy-500/10 text-brand-navy-500 dark:bg-brand-navy-500/40 dark:text-brand-teal-400'
                              : u.role === 'beach_owner'
                                ? 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-700/60 dark:text-brand-teal-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          <span>{getRoleLabel(u.role)}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
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
                      <td className="py-3.5 px-5 text-center whitespace-nowrap text-slate-500 dark:text-neutral-400 tabular-nums">
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
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-brand-navy-500 dark:text-white shadow-2xs transition hover:border-brand-teal-600 hover:text-brand-teal-600 cursor-pointer"
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
                      ? 'bg-brand-navy-500 text-white'
                      : selectedUser.role === 'beach_owner'
                        ? 'bg-brand-teal-100 dark:bg-brand-teal-700 text-brand-teal-700 dark:text-brand-teal-300'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  {selectedUser.name ? selectedUser.name.charAt(0) : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-brand-navy-500 dark:text-white truncate">
                      {selectedUser.name}
                    </h3>
                    {selectedUser.id === currentAdminId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-navy-500/10 text-brand-navy-500 dark:bg-brand-teal-500/20 dark:text-brand-teal-300">
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
                      className="text-slate-400 hover:text-brand-navy-500 dark:hover:text-white transition-colors cursor-pointer"
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-navy-500/10 text-brand-navy-500 dark:bg-brand-navy-500/40 dark:text-brand-teal-400">
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
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-brand-sun-50 text-brand-navy-700 dark:bg-brand-navy-900/50 dark:text-brand-sun-300">
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
                    {selectedUser.statusreason || 'No reason recorded.'}
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
                        className="px-3 py-1 rounded-full bg-brand-teal-50 dark:bg-brand-teal-700/50 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-700 text-xs font-bold inline-flex items-center gap-1.5"
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
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-600 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:border-brand-teal-500 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />
                  <span>Reset PIN</span>
                </button>

                {selectedUser.id !== currentAdminId && selectedUser.role !== 'admin' && (
                  selectedUser.accountstatus === 'suspended' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openStatusModal(selectedUser, 'suspended')}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer bg-brand-sun-50 text-brand-navy-700 hover:bg-brand-sun-100 dark:bg-brand-navy-900/40 dark:text-brand-sun-300 border border-brand-sun-200 dark:border-brand-navy-800/60"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Edit reason</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openStatusModal(selectedUser, 'active')}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer bg-brand-teal-50 text-brand-teal-700 hover:bg-brand-teal-100 dark:bg-brand-teal-700/20 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-700/60"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reinstate</span>
                      </button>
                    </>
                  ) : selectedUser.status === 'active' &&
                    (selectedUser.accountstatus === 'active' || selectedUser.accountstatus === 'under_review') ? (
                    <button
                      type="button"
                      onClick={() => openStatusModal(selectedUser, 'suspended')}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Suspend</span>
                    </button>
                  ) : null
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
              <h3 className="text-base font-extrabold text-brand-navy-500 dark:text-white">
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
                <label htmlFor="admin-edit-full-name" className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Full Name *
                </label>
                <input
                  id="admin-edit-full-name"
                  type="text"
                  maxLength={80}
                  autoComplete="name"
                  inputMode="text"
                  value={editFormData.name}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const validation = validateFullName(rawValue);
                    setEditFormData({ ...editFormData, name: filterFullNameInput(rawValue) });
                    setEditNameInputError(validation.error);
                  }}
                  onBlur={() => {
                    const validation = validateFullName(editFormData.name);
                    if (!editNameInputError) setEditNameInputError(validation.error);
                    if (validation.ok && !editNameInputError) {
                      setEditFormData((current) => ({ ...current, name: validation.value }));
                    }
                  }}
                  aria-invalid={Boolean(editNameError)}
                  aria-describedby={editNameError ? 'admin-edit-full-name-error' : undefined}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-black text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600 ${
                    editNameError
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-200 dark:border-neutral-700'
                  }`}
                  required
                />
                {editNameError && (
                  <p
                    id="admin-edit-full-name-error"
                    role="alert"
                    className="flex items-center gap-1 text-[11px] text-red-600"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {editNameError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600"
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
                      className="w-full appearance-none px-3.5 pr-10 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600 cursor-pointer"
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
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600"
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
                  disabled={submitting || !editNameValid}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-600 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
      {statusModalUser && targetStatus === 'suspended' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div
            ref={statusModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suspension-dialog-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeStatusModal();
                return;
              }
              if (event.key !== 'Tab') return;
              const items = statusModalRef.current?.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
              );
              if (!items?.length) return;
              const first = items[0];
              const last = items[items.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <h2 id="suspension-dialog-title" className="text-lg font-extrabold text-brand-navy-500 dark:text-white">
              {statusModalUser.accountstatus === 'suspended'
                ? `Edit suspension reason: ${statusModalUser.name}`
                : `Suspend ${statusModalUser.name}`}
            </h2>
            <div className="mt-2">
              <span className="rounded-full bg-brand-teal-50 px-2.5 py-1 text-[11px] font-bold text-brand-teal-700 dark:bg-brand-teal-900/40 dark:text-brand-teal-300">
                {statusModalUser.role === 'user' ? 'User' : 'Beach owner'}
              </span>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{statusModalUser.email}</p>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Reason type <span className="text-rose-600">*</span>
                <select
                  ref={suspensionReasonTypeRef}
                  required
                  value={statusReasonType}
                  onBlur={() => {
                    if (!statusReasonType) setStatusModalError(ADMIN_MESSAGES.reasonTypeRequired);
                  }}
                  onChange={(event) => {
                    setStatusReasonType(event.target.value);
                    setStatusModalError(event.target.value ? '' : ADMIN_MESSAGES.reasonTypeRequired);
                  }}
                  aria-describedby="hub-suspension-error"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="">Choose a reason type</option>
                  {SUSPENSION_REASON_TYPES.map((reasonType) => (
                    <option key={reasonType} value={reasonType}>{reasonType}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Reason (shown to the account holder) <span className="text-rose-600">*</span>
                <textarea
                  value={statusReason}
                  required
                  maxLength={500}
                  rows={3}
                  onChange={(event) => {
                    setStatusReason(event.target.value);
                    const validation = validateSafeText(event.target.value, {
                      min: 10,
                      max: 500,
                      maxLines: 5,
                      invalidMessage: ADMIN_MESSAGES.suspensionReasonInvalid,
                      tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
                      tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
                      tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
                    });
                    setStatusModalError(validation.ok ? '' : validation.error);
                  }}
                  aria-describedby="hub-suspension-help hub-suspension-error"
                  aria-invalid={!suspensionReasonValidation.ok}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
                <span className="mt-1 flex justify-between gap-3 font-normal text-slate-500">
                  <span id="hub-suspension-error" role={statusModalError ? 'alert' : undefined} className={statusModalError ? 'text-rose-600 dark:text-rose-400' : ''}>
                    {statusModalError}
                  </span>
                  <span className="shrink-0">{statusReason.length} / 500</span>
                </span>
                <span id="hub-suspension-help" className="mt-1 block font-normal text-slate-500 dark:text-neutral-400">
                  The user will see this message. Keep it clear and respectful.
                </span>
              </label>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Suspend until <span className="font-normal text-slate-500">(optional; default is until I lift it)</span>
                <span className="mt-1.5 flex items-center gap-3">
                  <input
                    type="date"
                    min={dateInputValue(suspensionDateMin)}
                    max={dateInputValue(suspensionDateMax)}
                    value={suspensionEndDate}
                    onChange={(event) => {
                      setSuspensionEndDate(event.target.value);
                      setStatusModalError(validateSuspensionEndDate(event.target.value).ok
                        ? ''
                        : ADMIN_MESSAGES.suspensionDateInvalid);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  />
                  {suspensionEndDate && (
                    <button type="button" onClick={() => { setSuspensionEndDate(''); setStatusModalError(''); }} className="text-xs font-semibold text-brand-navy-500 underline dark:text-brand-teal-300">
                      Clear
                    </button>
                  )}
                </span>
              </label>
              {statusModalUser.role === 'beach_owner' && (
                <p className="rounded-xl bg-brand-sun-50 p-3 text-xs font-medium text-brand-navy-700 dark:bg-brand-navy-900/50 dark:text-brand-sun-200">
                  Their beach listing will be hidden from the public pages and the map until the suspension is lifted. Nothing is deleted.
                </p>
              )}
            </div>
            {statusModalSuccess && <p role="status" className="mt-3 rounded-lg bg-brand-teal-50 px-3 py-2 text-xs font-semibold text-brand-teal-800 dark:bg-brand-teal-900/30 dark:text-brand-teal-200">{statusModalSuccess}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={submitting} onClick={closeStatusModal} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200">
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || Boolean(statusModalSuccess) || !statusReasonType || !suspensionReasonValidation.ok || !suspensionDateValidation.ok}
                onClick={() => void handleSaveStatus()}
                className="inline-flex min-w-24 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {statusModalUser.accountstatus === 'suspended' ? 'Save changes' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModalUser && targetStatus !== 'suspended' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-brand-navy-500 dark:text-white">
                  {statusModalUser.accountstatus === 'suspended' && targetStatus === 'active'
                    ? `Reinstate ${statusModalUser.name}`
                    : 'Account Status'}
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
                    className="text-emerald-600 focus:ring-brand-teal-400"
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600"
                    required
                  />
                </div>
              )}
              {targetStatus === 'active' && statusModalUser.accountstatus === 'suspended' && (
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Optional note
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={statusReason}
                    onChange={(event) => {
                      setStatusReason(event.target.value);
                      const validation = validateSafeText(event.target.value, { max: 500 });
                      setStatusModalError(validation.ok ? '' : validation.error || ADMIN_MESSAGES.serverError);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
              )}
              {statusModalError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{statusModalError}</p>}
              {statusModalSuccess && <p role="status" className="rounded-lg bg-brand-teal-50 px-3 py-2 text-xs font-semibold text-brand-teal-800 dark:bg-brand-teal-900/30 dark:text-brand-teal-200">{statusModalSuccess}</p>}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => statusModalUser.accountstatus === 'suspended'
                    ? closeStatusModal()
                    : setStatusModalUser(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={submitting || Boolean(statusModalSuccess) || (
                    targetStatus === 'active' && statusModalUser.accountstatus === 'suspended'
                      ? !validateSafeText(statusReason, { max: 500 }).ok
                      : false
                  )}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-600 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{statusModalUser.accountstatus === 'suspended' && targetStatus === 'active' ? 'Confirm reinstate' : 'Apply'}</span>
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
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-black text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-rose-500"
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
                <div className="w-10 h-10 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-700/60 flex items-center justify-center text-brand-teal-600 dark:text-brand-teal-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-navy-500 dark:text-white">
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
              className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-700 rounded-xl text-center text-2xl font-mono tracking-[0.4em] bg-slate-50 dark:bg-black text-brand-navy-500 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:border-brand-teal-600"
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
                className="px-5 py-2 text-xs font-bold text-white bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
