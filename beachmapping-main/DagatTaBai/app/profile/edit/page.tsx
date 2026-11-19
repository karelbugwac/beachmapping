'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Save, Loader2, User, Mail } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import {
  filterFullNameInput,
  FULL_NAME_MESSAGES,
  validateFullName,
} from '@/lib/validation/fullName';

export default function EditProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const nameValidation = validateFullName(name);
  const nameError = nameInputError || nameValidation.error;
  const nameValid = nameValidation.ok && !nameInputError;

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!data.user) throw new Error('Please sign in to edit your profile.');
        setName(data.user.full_name || '');
        setEmail(data.user.email || '');
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Could not load your profile.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submittedName = validateFullName(name);
    if (!nameInputError) setNameInputError(submittedName.error);
    if (!submittedName.ok || nameInputError) {
      showToast(nameInputError || submittedName.error || FULL_NAME_MESSAGES.required, 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: submittedName.value }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `Could not save your profile (HTTP ${response.status}).`);
      }
      if (!data?.user?.full_name) throw new Error('The server did not confirm the profile update.');
      window.dispatchEvent(
        new CustomEvent('dtb_user_updated', {
          detail: { full_name: data.user.full_name },
        })
      );
      showToast('Profile updated successfully.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Profile</span>
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h1 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
          Edit Profile Information
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="profile-edit-full-name" className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="profile-edit-full-name"
                type="text"
                required
                maxLength={80}
                autoComplete="name"
                inputMode="text"
                disabled={loading || saving}
                value={name}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  const validation = validateFullName(rawValue);
                  setName(filterFullNameInput(rawValue));
                  setNameInputError(validation.error);
                }}
                onBlur={() => {
                  const validation = validateFullName(name);
                  if (!nameInputError) setNameInputError(validation.error);
                  if (validation.ok && !nameInputError) setName(validation.value);
                }}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? 'profile-edit-name-error' : undefined}
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 ${
                  nameError ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {nameError && (
              <p
                id="profile-edit-name-error"
                role="alert"
                className="mt-1 flex items-center gap-1 text-sm text-red-600"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                readOnly
                value={email}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || saving || !nameValid}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-medium text-xs rounded-md transition-colors shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
