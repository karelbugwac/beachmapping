'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { SAFE_TEXT_MESSAGES, validateAdminSearch, validateSafeText } from '@/lib/validation/safe-text';
import type { AccountStatus } from '@/lib/utils/account-status';
import { ADMIN_MESSAGES, SUSPENSION_REASON_TYPES } from '@/lib/validation/admin-messages';
import { validateSuspensionEndDate } from '@/lib/validation/suspension-date';

type AccountRole = string;
type AccountListRole = 'users' | 'beach_owner';
type StatusFilter = 'all' | AccountStatus;

interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  account_status: AccountStatus;
  status_reason: string | null;
  status_reason_type: string | null;
  suspended_until: string | null;
  status_changed_by: string | null;
  status_changed_by_name: string | null;
  status_changed_at: string | null;
  pin_reset_required: boolean;
  joined: string;
  beach_names: string[];
}

interface AccountListResponse {
  accounts: AccountRow[];
  counts: Record<StatusFilter, number>;
  roleCounts: Record<AccountListRole, number>;
  page: number;
  pageSize: number;
  total: number;
  currentAdminId: string;
}

interface AccountDetails {
  account: AccountRow;
  changed_by: { full_name: string | null; email: string | null } | null;
  history: Array<{
    id: string;
    action: string;
    from_status: string | null;
    to_status: string | null;
    reason: string | null;
    reason_type: string | null;
    created_at: string;
    admin_id: string | null;
  }>;
}

const statusLabels: Record<AccountStatus, string> = {
  active: 'Active',
  under_review: 'Under review',
  suspended: 'Suspended',
};

const safeStatusErrors = new Set([
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
  'Invalid account status action.',
  'Invalid account status transition.',
  'The status was changed, but the account holder could not be notified. Refresh before retrying.',
]);

function statusStyle(status: AccountStatus) {
  if (status === 'active') return 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-900/40 dark:text-brand-teal-300';
  if (status === 'under_review') return 'bg-brand-sun-50 text-brand-navy-700 dark:bg-brand-navy-900/50 dark:text-brand-sun-300';
  return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Until further notice';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();
}

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateInputValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateFromInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addLocalDays(date: Date, days: number) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function localDayOffset(value: string) {
  const date = dateFromInput(value);
  const today = new Date();
  return Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000
  );
}

function formatLongDate(value: string) {
  return dateFromInput(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DialogFrame({
  children,
  onClose,
  initialFocus,
  labelledBy,
  lockBodyScroll = false,
  returnFocusRef,
  bottomSheet = false,
  closeOnBackdrop = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  initialFocus?: React.RefObject<HTMLElement | null>;
  labelledBy: string;
  lockBodyScroll?: boolean;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  bottomSheet?: boolean;
  closeOnBackdrop?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnFocus = returnFocusRef?.current;
    const previousOverflow = document.body.style.overflow;
    if (lockBodyScroll) document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      (initialFocus?.current || dialogRef.current?.querySelector<HTMLElement>('button, input, select, textarea'))?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      if (lockBodyScroll) document.body.style.overflow = previousOverflow;
      (returnFocus || previous)?.focus();
    };
  }, [initialFocus, lockBodyScroll, returnFocusRef]);

  return (
    <div
      className={`fixed inset-0 z-[120] flex bg-slate-950/60 backdrop-blur-sm ${
        bottomSheet ? 'items-end p-0 sm:items-center sm:p-4' : 'items-center justify-center p-4'
      }`}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`max-h-[90dvh] min-w-0 w-full max-w-[calc(100vw-2rem)] overflow-x-hidden overflow-y-auto border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 ${
          bottomSheet
            ? 'max-w-[440px] rounded-t-3xl sm:rounded-2xl'
            : 'max-w-md rounded-2xl'
        }`}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const items = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]');
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
        {children}
      </div>
    </div>
  );
}

export function AdminAccountManagement() {
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [roleTab, setRoleTab] = useState<AccountListRole>('users');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AccountListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [statusAccount, setStatusAccount] = useState<AccountRow | null>(null);
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('suspended');
  const [editingSuspensionReason, setEditingSuspensionReason] = useState(false);
  const [reasonType, setReasonType] = useState('');
  const [reasonTypeError, setReasonTypeError] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [suspendDate, setSuspendDate] = useState('');
  const [suspendDateMin, setSuspendDateMin] = useState('');
  const [suspendDateMax, setSuspendDateMax] = useState('');
  const [suspendDateError, setSuspendDateError] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<'1' | '3' | '7' | '30' | 'indefinite' | null>('7');
  const [weekStart, setWeekStart] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [resetAccount, setResetAccount] = useState<AccountRow | null>(null);
  const [resetAction, setResetAction] = useState<'reset_password' | 'reset_pin'>('reset_password');
  const [notice, setNotice] = useState('');
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const reasonTypeRef = useRef<HTMLSelectElement>(null);
  const discardDialogRef = useRef<HTMLDivElement>(null);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const actionButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const statusReturnFocusRef = useRef<HTMLElement | null>(null);
  const statusInitialDraftRef = useRef({ reason: '', reasonType: '', date: '', note: '' });
  const statusSuccessTimeoutRef = useRef<number | null>(null);

  const searchValidation = validateAdminSearch(search);
  const searchValue = searchValidation.ok ? searchValidation.value : '';
  const reasonValidation = validateSafeText(
    targetStatus === 'suspended' ? reason : internalNote,
    {
      min: targetStatus === 'suspended' ? 10 : 0,
      max: 500,
      maxLines: 5,
      invalidMessage: targetStatus === 'suspended' ? ADMIN_MESSAGES.suspensionReasonInvalid : undefined,
      tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
      tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
      tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
    }
  );

  useEffect(() => () => {
    if (statusSuccessTimeoutRef.current !== null) window.clearTimeout(statusSuccessTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (showDiscardConfirmation) {
      discardDialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }, [showDiscardConfirmation]);

  useEffect(() => {
    if (!searchValidation.ok) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      const params = new URLSearchParams({
        role: roleTab,
        status: statusFilter,
        q: searchValue,
        page: String(page),
        pageSize: '10',
      });
      try {
        const response = await fetch(`/api/admin/users/manage?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load accounts.');
        setResult(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Could not load accounts.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [roleTab, statusFilter, page, searchValidation.ok, searchValue, reloadToken]);

  const updateSearch = (input: string) => {
    setSearch(input);
    setPage(1);
    setSearchError(validateAdminSearch(input).ok ? '' : SAFE_TEXT_MESSAGES.invalid);
  };

  const openStatus = (account: AccountRow, next: AccountStatus) => {
    statusReturnFocusRef.current = actionButtonRefs.current.get(account.id) || null;
    const editReason = next === 'suspended' && account.account_status === 'suspended';
    const initialReason = editReason ? account.status_reason || '' : '';
    const initialReasonType = editReason ? account.status_reason_type || '' : '';
    const tomorrow = addLocalDays(new Date(), 1);
    const initialDate = editReason && account.suspended_until
      ? account.suspended_until.slice(0, 10)
      : next === 'suspended' && !editReason ? dateInputValue(addLocalDays(new Date(), 7)) : '';
    setStatusAccount(account);
    setTargetStatus(next);
    setEditingSuspensionReason(editReason);
    setReason(initialReason);
    setInternalNote('');
    setReasonType(initialReasonType);
    setReasonTypeError('');
    setSuspendDate(initialDate);
    setSuspendDateError('');
    const dayOffset = initialDate ? localDayOffset(initialDate) : null;
    setSuspendDuration(!initialDate ? editReason ? 'indefinite' : '7' : [1, 3, 7, 30].includes(dayOffset || -1) ? String(dayOffset) as '1' | '3' | '7' | '30' : null);
    setWeekStart(dateInputValue(tomorrow));
    setCalendarMonth(initialDate ? dateFromInput(initialDate) : tomorrow);
    setCalendarOpen(false);
    setShowDiscardConfirmation(false);
    statusInitialDraftRef.current = { reason: initialReason, reasonType: initialReasonType, date: initialDate, note: '' };
    setSuspendDateMin(dateInputValue(tomorrow));
    const oneYearAhead = new Date();
    oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
    setSuspendDateMax(dateInputValue(oneYearAhead));
    setModalError('');
    setModalSuccess('');
    setReasonError('');
    setOpenMenuId(null);
  };

  const closeStatus = () => {
    if (submitting) return;
    const initial = statusInitialDraftRef.current;
    if (showDiscardConfirmation) {
      setShowDiscardConfirmation(false);
      return;
    }
    const reasonChanged = targetStatus === 'suspended' && reason !== initial.reason && Boolean(reason.trim());
    const noteChanged = targetStatus !== 'suspended' && internalNote !== initial.note && Boolean(internalNote.trim());
    if (!modalSuccess && (reasonChanged || noteChanged)) {
      setShowDiscardConfirmation(true);
      return;
    }
    if (statusSuccessTimeoutRef.current !== null) {
      window.clearTimeout(statusSuccessTimeoutRef.current);
      statusSuccessTimeoutRef.current = null;
    }
    setStatusAccount(null);
    setCalendarOpen(false);
    setModalError('');
    setModalSuccess('');
  };

  const discardStatusChanges = () => {
    if (submitting) return;
    if (statusSuccessTimeoutRef.current !== null) {
      window.clearTimeout(statusSuccessTimeoutRef.current);
      statusSuccessTimeoutRef.current = null;
    }
    setShowDiscardConfirmation(false);
    setStatusAccount(null);
    setCalendarOpen(false);
    setModalError('');
    setModalSuccess('');
  };

  const selectSuspensionDate = (value: string) => {
    setSuspendDate(value);
    setSuspendDateError('');
    const tomorrow = addLocalDays(new Date(), 1);
    const daysFromToday = localDayOffset(value);
    setSuspendDuration([1, 3, 7, 30].includes(daysFromToday) ? String(daysFromToday) as '1' | '3' | '7' | '30' : null);
    if (dateFromInput(value) < addLocalDays(tomorrow, 6)) {
      setWeekStart(dateInputValue(tomorrow));
    } else {
      setWeekStart(dateInputValue(addLocalDays(dateFromInput(value), -6)));
    }
  };

  const selectSuspensionDuration = (duration: '1' | '3' | '7' | '30' | 'indefinite') => {
    setSuspendDuration(duration);
    setSuspendDateError('');
    setCalendarOpen(false);
    if (duration === 'indefinite') {
      setSuspendDate('');
      setWeekStart(dateInputValue(addLocalDays(new Date(), 1)));
      return;
    }
    const date = addLocalDays(new Date(), Number(duration));
    const tomorrow = addLocalDays(new Date(), 1);
    setSuspendDate(dateInputValue(date));
    setWeekStart(dateInputValue(Number(duration) <= 7 ? tomorrow : addLocalDays(date, -6)));
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const submitStatus = async () => {
    if (!statusAccount || !result) return;
    if (targetStatus === 'suspended' && !suspensionDateValid) {
      setSuspendDateError(ADMIN_MESSAGES.suspensionDateInvalid);
      return;
    }
    if (targetStatus === 'suspended' && !SUSPENSION_REASON_TYPES.includes(reasonType as (typeof SUSPENSION_REASON_TYPES)[number])) {
      setReasonTypeError(ADMIN_MESSAGES.reasonTypeRequired);
      return;
    }
    const value = targetStatus === 'suspended' ? reason : internalNote;
    const validation = validateSafeText(value, {
      min: targetStatus === 'suspended' ? 10 : 0,
      max: 500,
      maxLines: 5,
      invalidMessage: targetStatus === 'suspended' ? ADMIN_MESSAGES.suspensionReasonInvalid : undefined,
      tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
      tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
      tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
    });
    if (!validation.ok) {
      setReasonError(validation.error);
      return;
    }
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      const response = await fetch(`/api/admin/users/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingSuspensionReason ? 'reason_edit' : 'status_change',
          id: statusAccount.id,
          to_status: targetStatus,
          reason: validation.value,
          reason_type: targetStatus === 'suspended' ? reasonType : null,
          suspended_until: targetStatus === 'suspended' ? suspendDate || null : null,
          expected_status_changed_at: statusAccount.status_changed_at,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || ADMIN_MESSAGES.serverError);
      const updatedAccount: AccountRow = {
        ...statusAccount,
        account_status: data.account_status,
        status_reason: data.status_reason,
        status_reason_type: data.status_reason_type,
        suspended_until: data.suspended_until,
        status_changed_by: data.status_changed_by,
        status_changed_by_name: data.status_changed_by_name,
        status_changed_at: data.status_changed_at,
      };
      setResult((current) => {
        if (!current) return current;
        const counts = { ...current.counts };
        if (statusAccount.account_status !== updatedAccount.account_status) {
          counts[statusAccount.account_status] = Math.max(0, counts[statusAccount.account_status] - 1);
          counts[updatedAccount.account_status] += 1;
        }
        const remainsInFilter = statusFilter === 'all' || updatedAccount.account_status === statusFilter;
        const accounts = current.accounts
          .map((account) => account.id === updatedAccount.id ? updatedAccount : account)
          .filter((account) => account.id !== updatedAccount.id || remainsInFilter);
        return {
          ...current,
          accounts,
          counts,
          total: current.total - (statusFilter !== 'all' && !remainsInFilter ? 1 : 0),
        };
      });
      if (details?.account.id === statusAccount.id) setDetails(null);
      setModalSuccess(editingSuspensionReason ? 'Suspension details updated.' : targetStatus === 'suspended' ? 'Account suspended.' : targetStatus === 'active' ? 'Account reinstated.' : 'Account set under review.');
      if (targetStatus === 'suspended' && !editingSuspensionReason) {
        setNotice(suspendDuration === 'indefinite'
          ? 'Account suspended until you lift it.'
          : `Account suspended until ${dateFromInput(suspendDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}.`);
      }
      statusSuccessTimeoutRef.current = window.setTimeout(() => {
        statusSuccessTimeoutRef.current = null;
        setStatusAccount(null);
        setModalError('');
        setModalSuccess('');
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setModalError(safeStatusErrors.has(message) ? message : ADMIN_MESSAGES.serverError);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = async (account: AccountRow) => {
    setOpenMenuId(null);
    setLoadingDetails(true);
    setDetails(null);
    try {
      const response = await fetch(`/api/admin/users/${account.id}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load account details.');
      setDetails(data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load account details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const confirmReset = async () => {
    if (!resetAccount) return;
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      const response = await fetch(`/api/admin/users/${resetAccount.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: resetAction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setModalSuccess(data.message || (resetAction === 'reset_password' ? 'Password reset email sent.' : 'PIN reset.'));
      setReloadToken((current) => current + 1);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'under_review', label: 'Under review' },
    { value: 'suspended', label: 'Suspended' },
  ];
  const weekDates = weekStart
    ? Array.from({ length: 7 }, (_, index) => dateInputValue(addLocalDays(dateFromInput(weekStart), index)))
    : [];
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarGridStart = addLocalDays(monthStart, -monthStart.getDay());
  const calendarDates = Array.from({ length: 42 }, (_, index) => addLocalDays(calendarGridStart, index));
  const minDate = suspendDateMin ? dateFromInput(suspendDateMin) : addLocalDays(new Date(), 1);
  const canGoToPreviousMonth = monthStart > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxDate = suspendDateMax ? dateFromInput(suspendDateMax) : addLocalDays(new Date(), 365);
  const canGoToNextMonth = monthStart < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const suspensionDateValid = suspendDuration === 'indefinite'
    ? !suspendDate
    : Boolean(suspendDate && validateSuspensionEndDate(suspendDate).ok);

  return (
    <div className="mx-auto max-w-7xl space-y-5 font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy-500 dark:text-white sm:text-3xl">User Management</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 sm:text-sm">Review and manage visitor and beach owner accounts.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900" role="tablist" aria-label="Account role">
          {([
            { role: 'users', label: 'Users' },
            { role: 'beach_owner', label: 'Beach Owners' },
          ] as const).map((tab) => (
            <button
              key={tab.role}
              type="button"
              role="tab"
              aria-selected={roleTab === tab.role}
              onClick={() => {
                if (roleTab === tab.role) return;
                setRoleTab(tab.role);
                setStatusFilter('all');
                setPage(1);
                setOpenMenuId(null);
                setDetails(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                roleTab === tab.role
                  ? 'bg-brand-teal-50 text-brand-navy-500 dark:bg-brand-teal-900/30 dark:text-brand-teal-200'
                  : 'text-slate-500 hover:text-brand-navy-500 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">{result?.roleCounts?.[tab.role] ?? '...'}</span>
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-neutral-400">
          {roleTab === 'users' ? 'Users and other non-owner roles' : 'Beach owners'} · {result?.counts?.all ?? '...'} matching
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-4 border-b border-slate-100 p-4 dark:border-neutral-800">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              maxLength={60}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder={roleTab === 'users' ? 'Search users by name or email...' : 'Search owners by name, email or beach...'}
              aria-label={roleTab === 'users' ? 'Search users' : 'Search beach owners'}
              aria-invalid={Boolean(searchError)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
            />
            {searchError && <p className="mt-1 text-xs text-rose-600" role="alert">{searchError}</p>}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by account status">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setStatusFilter(option.value);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  statusFilter === option.value
                    ? 'border-brand-teal-600 bg-brand-teal-50 text-brand-navy-500 dark:bg-brand-teal-900/30 dark:text-brand-teal-200'
                    : 'border-slate-200 text-slate-600 hover:border-brand-teal-500 dark:border-neutral-700 dark:text-neutral-300'
                }`}
              >
                {option.label} <span className="ml-1 opacity-70">{result?.counts?.[option.value] ?? '...'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-neutral-800 dark:bg-black/30 dark:text-neutral-400">
              <tr>
                <th className="px-5 py-3.5">Account</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Beach</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-neutral-800 dark:text-neutral-300">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-teal-600" /></td></tr>
              ) : loadError ? (
                <tr><td colSpan={5} className="py-12 text-center text-rose-600">{loadError}</td></tr>
              ) : !result?.accounts.length ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">No accounts found.</td></tr>
              ) : result.accounts.map((account) => {
                const disabled = account.id === result.currentAdminId;
                const isAdmin = account.role === 'admin';
                const canManageStatus = !disabled && !isAdmin && ['user', 'beach_owner', 'beach_manager'].includes(account.role);
                const endPreview = account.account_status === 'suspended'
                  ? account.suspended_until ? `Until ${formatDate(account.suspended_until)}` : 'Until further notice'
                  : '';
                return (
                  <tr key={account.id} className="align-top hover:bg-slate-50/70 dark:hover:bg-neutral-800/30">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-brand-navy-500 dark:text-white">{account.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{account.email}</div>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(account.account_status)}`}>
                        {statusLabels[account.account_status]}
                      </span>
                      {account.account_status === 'suspended' && (
                        <div className="mt-1 max-w-xs text-[11px] text-rose-700 dark:text-rose-300">
                          <p className="truncate" title={account.status_reason || ''}>{account.status_reason || 'No reason provided'}</p>
                          <p className="text-slate-500 dark:text-neutral-400">
                            {account.status_reason_type || 'Other'} · {endPreview} · by {account.status_changed_by_name || 'Administrator'} on {formatDate(account.status_changed_at)}
                          </p>
                        </div>
                      )}
                      {account.account_status === 'under_review' && account.status_reason && (
                        <div className="mt-1 max-w-xs truncate text-[11px] text-brand-navy-700 dark:text-brand-sun-300" title={account.status_reason}>
                          Internal note: {account.status_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-brand-sun-50 px-2.5 py-1 text-[11px] font-bold text-brand-navy-700 dark:bg-brand-navy-900/50 dark:text-brand-sun-300">
                        {formatRole(account.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {account.role === 'beach_owner' ? account.beach_names.join(', ') || 'No beach linked' : '—'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-neutral-400">{formatDate(account.joined)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          ref={(element) => {
                            if (element) actionButtonRefs.current.set(account.id, element);
                            else actionButtonRefs.current.delete(account.id);
                          }}
                          aria-label={`Actions for ${account.name}`}
                          aria-expanded={openMenuId === account.id}
                          onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-brand-teal-500 hover:text-brand-navy-500 dark:border-neutral-700 dark:text-neutral-300"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuId === account.id && (
                          <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                            <ActionItem icon={<Eye />} label="View" onClick={() => void openDetails(account)} />
                                      {disabled && <p className="px-2.5 py-2 text-left text-[11px] font-semibold text-slate-500">You cannot change your own account status.</p>}
                                      {canManageStatus && account.account_status === 'active' && <ActionItem icon={<Clock />} label="Set under review" onClick={() => openStatus(account, 'under_review')} />}
                            {canManageStatus && ['active', 'under_review'].includes(account.account_status) && <ActionItem icon={<Shield />} label="Suspend" onClick={() => openStatus(account, 'suspended')} />}
                            {canManageStatus && account.account_status === 'suspended' && <ActionItem icon={<Shield />} label="Edit reason" onClick={() => openStatus(account, 'suspended')} />}
                            {canManageStatus && ['under_review', 'suspended'].includes(account.account_status) && <ActionItem icon={<Shield />} label="Reinstate" onClick={() => openStatus(account, 'active')} />}
                            {!disabled && account.role === 'user' && <ActionItem icon={<Mail />} label="Reset password" onClick={() => { setOpenMenuId(null); setResetAction('reset_password'); setResetAccount(account); setModalError(''); setModalSuccess(''); }} />}
                            {!disabled && account.role === 'beach_owner' && <ActionItem icon={<Shield />} label="Reset PIN" onClick={() => { setOpenMenuId(null); setResetAction('reset_pin'); setResetAccount(account); setModalError(''); setModalSuccess(''); }} />}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-neutral-800">
          <span className="text-xs text-slate-500 dark:text-neutral-400">
            Page {page} of {Math.max(1, Math.ceil((result?.total || 0) / 10))}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" disabled={loading || page >= Math.ceil((result?.total || 0) / 10)} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {notice && (
        <div role="status" className="fixed bottom-5 right-5 z-40 rounded-xl border border-brand-teal-200 bg-white px-4 py-3 text-sm font-semibold text-brand-navy-500 shadow-lg dark:border-brand-teal-800 dark:bg-neutral-900 dark:text-brand-teal-200">
          <button type="button" onClick={() => setNotice('')} className="absolute right-2 top-2 text-slate-400" aria-label="Dismiss"><X className="h-3 w-3" /></button>
          {notice}
        </div>
      )}

      {statusAccount && (
        <DialogFrame
          onClose={closeStatus}
          initialFocus={targetStatus === 'suspended' ? reasonTypeRef : undefined}
          labelledBy="account-status-title"
          lockBodyScroll
          returnFocusRef={statusReturnFocusRef}
          closeOnBackdrop
        >
          <h2 id="account-status-title" className="text-xl font-extrabold text-slate-900 dark:text-white">
            {targetStatus === 'suspended'
              ? editingSuspensionReason ? `Edit suspension` : 'Suspend this account'
              : targetStatus === 'under_review' ? `Set under review: ${statusAccount.name}` : `Reinstate ${statusAccount.name}`}
          </h2>
          {targetStatus === 'suspended' && <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">For how long? The user is signed out right away.</p>}
          <div className="mt-2">
            <span className="rounded-full bg-brand-teal-50 px-2.5 py-1 text-[11px] font-bold text-brand-teal-700 dark:bg-brand-teal-900/40 dark:text-brand-teal-300">
              {formatRole(statusAccount.role)}
            </span>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{statusAccount.email}</p>
          </div>
          {targetStatus === 'suspended' ? (
            <div className="mt-5 space-y-4">
              <section aria-labelledby="suspension-duration-label">
                <h3 id="suspension-duration-label" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Duration</h3>
                <div className="mt-2 grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-neutral-800" role="group" aria-label="Suspension duration">
                  {([
                    { value: '1', label: '1 day' },
                    { value: '3', label: '3 days' },
                    { value: '7', label: '7 days' },
                    { value: '30', label: '30 days' },
                    { value: 'indefinite', label: 'Until lifted' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={suspendDuration === option.value}
                      onClick={() => selectSuspensionDuration(option.value)}
                      className={`min-h-11 rounded-lg px-1 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 sm:text-xs ${
                        suspendDuration === option.value
                          ? 'bg-white text-brand-teal-700 shadow-sm dark:bg-neutral-700 dark:text-brand-teal-200'
                          : 'text-slate-700 hover:bg-white/70 dark:text-neutral-200 dark:hover:bg-neutral-700/70'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              <section aria-labelledby="suspension-ends-label">
                <div className="flex items-center justify-between gap-2">
                  <h3 id="suspension-ends-label" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Ends on</h3>
                  <button
                    ref={calendarTriggerRef}
                    type="button"
                    aria-expanded={calendarOpen}
                    onClick={() => {
                      if (!calendarOpen && suspendDate) setCalendarMonth(dateFromInput(suspendDate));
                      setCalendarOpen((open) => !open);
                    }}
                    className="min-h-11 px-2 text-xs font-bold text-brand-teal-700 underline decoration-brand-teal-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 dark:text-brand-teal-300"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {calendarOpen ? 'Close calendar' : 'Open full calendar'}
                    </span>
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1" role="group" aria-label="Choose an end date">
                  {weekDates.map((dateValue) => {
                    const date = dateFromInput(dateValue);
                    const selected = dateValue === suspendDate;
                    return (
                      <button
                        key={dateValue}
                        type="button"
                        aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        aria-pressed={selected}
                        onClick={() => selectSuspensionDate(dateValue)}
                        className={`flex min-h-[54px] min-w-0 flex-col items-center justify-center rounded-xl px-0.5 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 ${
                          selected
                            ? 'bg-brand-teal-700 text-white'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <span className="text-[9px] font-semibold opacity-80">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <span className="mt-0.5 text-sm">{date.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                {calendarOpen && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={!canGoToPreviousMonth}
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                        aria-label="Previous month"
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 disabled:opacity-40 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        disabled={!canGoToNextMonth}
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                        aria-label="Next month"
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 disabled:opacity-40 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold text-slate-500">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-1">{day}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDates.map((date) => {
                        const value = dateInputValue(date);
                        const disabled = value < suspendDateMin || value > suspendDateMax;
                        const selected = value === suspendDate;
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={disabled}
                            aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            aria-pressed={selected}
                            onClick={() => {
                              selectSuspensionDate(value);
                              setCalendarOpen(false);
                            }}
                            className={`min-h-10 rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 disabled:cursor-not-allowed disabled:opacity-30 ${
                              selected ? 'bg-brand-teal-700 text-white' : date.getMonth() === calendarMonth.getMonth() ? 'text-slate-800 hover:bg-slate-100 dark:text-neutral-100 dark:hover:bg-neutral-800' : 'text-slate-400'
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {suspendDateError && <p role="alert" className="mt-1 text-xs text-rose-700 dark:text-rose-300">{suspendDateError}</p>}
              </section>

              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Reason type <span className="text-rose-600">*</span>
                <select
                  ref={reasonTypeRef}
                  required
                  value={reasonType}
                  onBlur={() => {
                    if (!reasonType) setReasonTypeError(ADMIN_MESSAGES.reasonTypeRequired);
                  }}
                  onChange={(event) => {
                    setReasonType(event.target.value);
                    setReasonTypeError('');
                  }}
                  aria-invalid={Boolean(reasonTypeError)}
                  aria-describedby={reasonTypeError ? 'suspension-reason-type-error' : undefined}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="">Choose a reason type</option>
                  {SUSPENSION_REASON_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {reasonTypeError && <span id="suspension-reason-type-error" role="alert" className="mt-1 block font-normal text-rose-600">{reasonTypeError}</span>}
              </label>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Reason (shown to the user) <span className="text-rose-600">*</span>
                <textarea
                  ref={reasonRef}
                  value={reason}
                  required
                  maxLength={500}
                  placeholder="Explain why this account is being suspended…"
                  onBlur={() => {
                    if (!reason.trim()) setReasonError(ADMIN_MESSAGES.reasonTooShort);
                  }}
                  onChange={(event) => {
                    setReason(event.target.value);
                    const validation = validateSafeText(event.target.value, {
                      min: 10,
                      max: 500,
                      maxLines: 5,
                      invalidMessage: ADMIN_MESSAGES.suspensionReasonInvalid,
                      tooShortMessage: ADMIN_MESSAGES.reasonTooShort,
                      tooLongMessage: ADMIN_MESSAGES.reasonTooLong,
                      tooManyLinesMessage: ADMIN_MESSAGES.reasonTooManyLines,
                    });
                    setReasonError(validation.ok ? '' : validation.error);
                  }}
                  rows={3}
                  aria-invalid={Boolean(reasonError)}
                  aria-describedby="suspension-reason-error"
                  className={`mt-1.5 min-h-[72px] w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 dark:bg-neutral-950 dark:text-white ${reasonError ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-300 dark:border-neutral-700'}`}
                  id="suspension-reason"
                />
                <span id="suspension-reason-error" role={reasonError ? 'alert' : undefined} className="mt-1 flex justify-between gap-3 font-normal text-slate-500">
                  <span className={reasonError ? 'text-rose-700 dark:text-rose-300' : ''}>{reasonError}</span>
                  <span className="shrink-0">{reason.length} / 500</span>
                </span>
              </label>
              <div className="rounded-[14px] border border-teal-200 bg-teal-50 p-3.5 text-slate-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
                <p className="text-sm font-bold">
                  {suspendDuration === 'indefinite'
                    ? 'Suspended until you lift it'
                    : suspendDate ? `Back on ${formatLongDate(suspendDate)}` : 'Choose an end date'}
                </p>
                <p className="mt-1 text-xs text-slate-700 dark:text-teal-200">
                  {suspendDuration === 'indefinite'
                    ? 'Access returns when you reinstate the account.'
                    : suspendDate
                      ? `${localDayOffset(suspendDate)} ${localDayOffset(suspendDate) === 1 ? 'day' : 'days'} from today. Access returns automatically.`
                      : 'Select an end date to continue.'}
                </p>
              </div>
              {['beach_owner', 'beach_manager'].includes(statusAccount.role) && (
                <p className="rounded-xl bg-brand-sun-50 p-3 text-xs font-medium text-brand-navy-700 dark:bg-brand-navy-900/50 dark:text-brand-sun-200">
                  Their beach listing will be hidden from the public pages and the map until the suspension is lifted. Nothing is deleted.
                </p>
              )}
            </div>
          ) : (
            <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-neutral-300">
              {targetStatus === 'under_review' ? 'Optional internal note' : 'Optional note'}
              <textarea value={internalNote} maxLength={500} onChange={(event) => setInternalNote(event.target.value)} className="mt-1.5 min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-950" />
              {internalNote && !validateSafeText(internalNote, { max: 500 }).ok && <span className="mt-1 block font-normal text-rose-600">{SAFE_TEXT_MESSAGES.invalid}</span>}
              <span className="mt-1 block font-normal text-right text-slate-500">{internalNote.length}/500</span>
            </label>
          )}
          {modalError && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{modalError}</p>}
          {modalSuccess && <p role="status" className="mt-3 rounded-lg bg-brand-teal-50 px-3 py-2 text-xs font-semibold text-brand-teal-800 dark:bg-brand-teal-900/30 dark:text-brand-teal-200">{modalSuccess}</p>}
          <div className={`mt-5 ${targetStatus === 'suspended' ? 'space-y-2' : 'flex justify-end gap-2'}`}>
            {targetStatus === 'suspended' && (
              <button
                type="button"
                disabled={submitting || Boolean(modalSuccess) || !reasonType || !reasonValidation.ok || !suspensionDateValid}
                onClick={() => void submitStatus()}
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingSuspensionReason ? 'Save changes' : 'Suspend account'}
              </button>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={closeStatus}
              className={targetStatus === 'suspended'
                ? 'mx-auto block min-h-11 min-w-32 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800'
                : 'rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200'}
            >
              {modalSuccess ? 'Close' : 'Cancel'}
            </button>
            {targetStatus !== 'suspended' && (
              <button
                type="button"
                disabled={submitting || Boolean(modalSuccess) || Boolean(internalNote && !validateSafeText(internalNote, { max: 500 }).ok)}
                onClick={() => void submitStatus()}
                className="inline-flex min-w-24 items-center justify-center gap-2 rounded-full bg-brand-navy-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-navy-600"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {targetStatus === 'under_review' ? 'Set under review' : 'Confirm reinstate'}
              </button>
            )}
          </div>
          {showDiscardConfirmation && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/40 p-4">
              <div
                ref={discardDialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="discard-status-title"
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
                onKeyDown={(event) => {
                  if (event.key !== 'Tab') return;
                  event.stopPropagation();
                  const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
                  if (!buttons.length) return;
                  if (event.shiftKey && document.activeElement === buttons[0]) {
                    event.preventDefault();
                    buttons[buttons.length - 1].focus();
                  } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
                    event.preventDefault();
                    buttons[0].focus();
                  }
                }}
              >
                <h3 id="discard-status-title" className="text-base font-extrabold text-slate-900 dark:text-white">Discard changes?</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Your unsaved changes will be lost.</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowDiscardConfirmation(false); (targetStatus === 'suspended' ? reasonRef.current : undefined)?.focus(); }} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-700 dark:border-neutral-700 dark:text-neutral-200">Keep editing</button>
                  <button type="button" onClick={discardStatusChanges} className="min-h-11 rounded-full bg-rose-700 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700">Discard</button>
                </div>
              </div>
            </div>
          )}
        </DialogFrame>
      )}

      {(details || loadingDetails) && (
        <DialogFrame onClose={() => setDetails(null)} labelledBy="account-details-title">
          {loadingDetails ? <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-teal-600" /> : details && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="account-details-title" className="text-lg font-extrabold text-brand-navy-500 dark:text-white">{details.account.name}</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{details.account.email}</p>
                </div>
                <button type="button" onClick={() => setDetails(null)} aria-label="Close details" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-teal-50 px-2.5 py-1 text-[11px] font-bold text-brand-teal-700 dark:bg-brand-teal-900/40 dark:text-brand-teal-300">{formatRole(details.account.role)}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(details.account.account_status)}`}>{statusLabels[details.account.account_status]}</span>
              </div>
              <dl className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-neutral-800/50">
                {details.account.status_reason_type && <div><dt className="font-bold text-slate-500">Reason type</dt><dd className="mt-1">{details.account.status_reason_type}</dd></div>}
                <div><dt className="font-bold text-slate-500">Reason</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-neutral-200">{details.account.status_reason || 'No reason recorded.'}</dd></div>
                {details.account.account_status === 'suspended' && <div><dt className="font-bold text-slate-500">Suspended until</dt><dd className="mt-1">{formatDate(details.account.suspended_until)}</dd></div>}
                <div><dt className="font-bold text-slate-500">Changed by</dt><dd className="mt-1">{details.changed_by?.full_name || details.changed_by?.email || 'System'}</dd></div>
                <div><dt className="font-bold text-slate-500">Changed at</dt><dd className="mt-1">{formatDate(details.account.status_changed_at)}</dd></div>
              </dl>
              <h3 className="mt-5 text-xs font-extrabold uppercase tracking-wide text-slate-500">History</h3>
              <div className="mt-2 max-h-52 space-y-2 overflow-y-auto">
                {details.history.length ? details.history.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 p-3 text-xs dark:border-neutral-800">
                    <div className="flex justify-between gap-2 font-bold"><span>{item.action === 'status_change' ? `${item.from_status || 'Created'} → ${item.to_status || 'Updated'}` : item.action === 'reason_edit' ? 'Suspension reason updated' : item.action === 'reset_pin' ? 'PIN reset' : 'Password reset email'}</span><span className="shrink-0 text-slate-400">{formatDate(item.created_at)}</span></div>
                    {item.reason_type && <p className="mt-1 font-semibold text-slate-500">{item.reason_type}</p>}
                    {item.reason && <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-neutral-300">{item.reason}</p>}
                  </div>
                )) : <p className="text-xs text-slate-500">No account history yet.</p>}
              </div>
            </>
          )}
        </DialogFrame>
      )}

      {resetAccount && (
        <DialogFrame onClose={() => { if (!submitting) { setResetAccount(null); setModalError(''); } }} labelledBy="reset-confirm-title">
          <h2 id="reset-confirm-title" className="text-lg font-extrabold text-brand-navy-500 dark:text-white">
            {resetAction === 'reset_password' ? `Send a password reset email to ${resetAccount.email}?` : `Reset the PIN for ${resetAccount.name}?`}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
            {resetAction === 'reset_password'
              ? 'The account holder will receive a reset link by email.'
              : 'The owner will need to create a new PIN the next time they sign in.'}
          </p>
          {modalError && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{modalError}</p>}
          {modalSuccess && <p role="status" className="mt-3 rounded-lg bg-brand-teal-50 px-3 py-2 text-xs font-semibold text-brand-teal-800 dark:bg-brand-teal-900/30 dark:text-brand-teal-200">{modalSuccess}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={submitting} onClick={() => { setResetAccount(null); setModalSuccess(''); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold dark:border-neutral-700">{modalSuccess ? 'Close' : 'Cancel'}</button>
            <button type="button" disabled={submitting || Boolean(modalSuccess)} onClick={() => void confirmReset()} className="inline-flex items-center gap-2 rounded-full bg-brand-navy-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}Confirm
            </button>
          </div>
        </DialogFrame>
      )}
    </div>
  );
}

function ActionItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-neutral-200 dark:hover:bg-neutral-800">
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-3.5 w-3.5' })}
      {label}<ChevronDown className="ml-auto h-3 w-3 -rotate-90" />
    </button>
  );
}
