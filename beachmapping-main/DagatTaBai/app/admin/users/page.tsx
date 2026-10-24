'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, UserCheck, UserX, Trash2, RotateCcw } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  joined: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    fetch('/api/admin/users', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load users.');
        setUsers(Array.isArray(data.users) ? data.users : []);
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Failed to load users.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (user: AdminUser) => {
    const suspended = user.status === 'active';
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, suspended }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user status.');
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: data.status } : item));
      showToast(`User ${data.status === 'suspended' ? 'suspended' : 'reactivated'}.`);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update user status.', 'error');
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user account.');
      setUsers((current) => current.filter((item) => item.id !== user.id));
      showToast('User account deleted successfully.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to delete user account.', 'error');
    }
  };

  const resetUserPin = async (user: AdminUser) => {
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      showToast('Please enter a valid 6-digit PIN.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset user PIN.');
      showToast('PIN reset successfully.');
      setResettingUserId(null);
      setNewPin('');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to reset user PIN.', 'error');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-xs text-slate-500 dark:text-gray-300">
            View all registered users and moderate or suspend accounts.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-black shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:border-black text-slate-500 dark:text-gray-300 uppercase tracking-wider font-semibold dark:bg-gray-900">
              <tr>
                <th className="py-3.5 px-4">Name & Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-slate-700 dark:text-gray-300">
              {loading && <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-slate-500 dark:text-gray-300">No registered users found.</td></tr>}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block dark:text-white">{u.name}</span>
                    <span className="text-slate-400 text-[11px] dark:text-gray-400">{u.email}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-gray-400">{new Date(u.joined).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {u.role !== 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                            u.status === 'active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setResettingUserId(u.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md font-semibold text-xs transition-colors dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset PIN</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-semibold text-xs transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset PIN Modal */}
      {resettingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset User PIN</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter a new 6-digit PIN for this user account.
            </p>
            <input
              type="text"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit PIN"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-center text-2xl tracking-widest dark:bg-gray-800 dark:text-white"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setResettingUserId(null); setNewPin(''); }}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resetUserPin(users.find(u => u.id === resettingUserId)!)}
                className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
              >
                Reset PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
