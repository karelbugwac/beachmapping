'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Palette,
  Star,
  MessageSquare,
  Loader2,
  LogOut,
  MapPin,
  Camera,
  Trash2,
  Sun,
  Moon,
  Check,
  Trash,
  X,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { showToast } from '@/components/ui/feedback-toasts';
import { signOutAndClearClientState } from '@/lib/client/logout';
import { confirmAction } from '@/components/ui/confirm-dialog';
import { createClient } from '@/lib/supabase/client';
import { formatImageSize } from '@/lib/utils/image-upload-config';
import { prepareImageForUpload } from '@/lib/utils/image-compression';
import { validateImageFile } from '@/lib/utils/image-validation';
import { filterFullNameInput, validateFullName } from '@/lib/validation/fullName';
import { notifyRealtimeSync, useRealtimeSync } from '@/lib/realtime-sync';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  picture?: string | null;
  location?: string | null;
  created_at?: string;
}

interface UserReview {
  id: string;
  beach_id: string;
  beach_name?: string;
  beach_slug?: string;
  review_type?: 'beach' | 'platform';
  rating: number;
  comment: string;
  created_at: string;
}

const AVATAR_PREVIEW_SIZE = 192;

const profileCategories = [
  {
    id: 'personal',
    label: 'Account Settings',
    description: 'Manage your personal details and account access.',
    icon: User,
  },
  {
    id: 'appearance',
    label: 'Preferences',
    description: 'Choose your preferred theme mode.',
    icon: Palette,
  },
  {
    id: 'reviews',
    label: 'My Reviews',
    description: 'View and manage the reviews you have shared.',
    icon: Star,
  },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileData | null>(null);

  const [activeCategory, setActiveCategory] = useState<'personal' | 'appearance' | 'reviews' | null>(null);

  // Personal Info Edit State
  const [name, setName] = useState('');
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [profileSaveState, setProfileSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedProfileRef = useRef<{ name: string; location: string } | null>(null);
  const locationLookupStartedRef = useRef(false);

  // Avatar selection and confirmation state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [avatarDraftFile, setAvatarDraftFile] = useState<File | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [avatarImageSize, setAvatarImageSize] = useState<{ width: number; height: number } | null>(null);
  const avatarPreviewImageRef = useRef<HTMLImageElement>(null);
  const avatarDragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const [userLocation, setUserLocation] = useState('');

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Password Reset Link State
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Fetch session user.
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();

        if (res.ok && data.user && isMounted) {
          const profileUser: ProfileData = {
            id: data.user.id,
            name: data.user.full_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: data.user.role || 'user',
            picture: data.user.profile_image_url || null,
            location: data.user.location || '',
            created_at: data.user.created_at,
          };
          savedProfileRef.current = { name: profileUser.name, location: profileUser.location || '' };
          setUser(profileUser);
          setName(profileUser.name);
          setEmail(profileUser.email);
          setUserLocation(profileUser.location || '');
          return;
        }

        // Direct fallback to browser Supabase client
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData?.session?.user;

        if (sbUser && isMounted) {
          const fallbackUser: ProfileData = {
            id: sbUser.id,
            name:
              sbUser.user_metadata?.full_name ||
              sbUser.user_metadata?.name ||
              sbUser.email?.split('@')[0] ||
              'User',
            email: sbUser.email || '',
            role: (sbUser.user_metadata?.role as any) || 'user',
            picture:
              sbUser.user_metadata?.profile_image_url ||
              sbUser.user_metadata?.avatar_url ||
              sbUser.user_metadata?.picture ||
              null,
            location: typeof sbUser.user_metadata?.location === 'string' ? sbUser.user_metadata.location : '',
            created_at: sbUser.created_at,
          };
          savedProfileRef.current = { name: fallbackUser.name, location: fallbackUser.location || '' };
          setUser(fallbackUser);
          setName(fallbackUser.name);
          setEmail(fallbackUser.email);
          setUserLocation(fallbackUser.location || '');
          return;
        }

        const { data: sbData } = await supabase.auth.getUser();
        if (sbData.user && isMounted) {
          const fallbackUser: ProfileData = {
            id: sbData.user.id,
            name:
              sbData.user.user_metadata?.full_name ||
              sbData.user.user_metadata?.name ||
              sbData.user.email?.split('@')[0] ||
              'User',
            email: sbData.user.email || '',
            role: (sbData.user.user_metadata?.role as any) || 'user',
            picture:
              sbData.user.user_metadata?.profile_image_url ||
              sbData.user.user_metadata?.avatar_url ||
              sbData.user.user_metadata?.picture ||
              null,
            location: typeof sbData.user.user_metadata?.location === 'string' ? sbData.user.user_metadata.location : '',
            created_at: sbData.user.created_at,
          };
          savedProfileRef.current = { name: fallbackUser.name, location: fallbackUser.location || '' };
          setUser(fallbackUser);
          setName(fallbackUser.name);
          setEmail(fallbackUser.email);
          setUserLocation(fallbackUser.location || '');
          return;
        }

        if (isMounted) {
          router.push('/login?redirect=/profile');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (
      !user ||
      user.location ||
      userLocation.trim() ||
      locationLookupStartedRef.current ||
      !navigator.geolocation
    ) {
      return;
    }

    let isMounted = true;
    locationLookupStartedRef.current = true;
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          if (!response.ok) throw new Error(`Location lookup failed (${response.status}).`);
          const result = await response.json();
          const address = result.address || {};
          const town =
            address.town ||
            address.municipality ||
            address.city ||
            address.village ||
            address.county;
          const region = address.state || address.region;
          const detectedLocation = [town, region].filter(Boolean).join(', ');
          if (isMounted && detectedLocation) setUserLocation(detectedLocation);
        } catch (error: unknown) {
          console.error('Could not detect profile location:', error);
        } finally {
          if (isMounted) setIsFetchingLocation(false);
        }
      },
      () => {
        if (isMounted) setIsFetchingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );

    return () => {
      isMounted = false;
    };
  }, [user, userLocation]);

  useEffect(() => {
    if (!user || !savedProfileRef.current) return;

    const nameValidation = validateFullName(name);
    if (!nameValidation.ok || nameInputError) return;

    const pendingProfile = { name: nameValidation.value, location: userLocation.trim() };
    if (
      (pendingProfile.name === savedProfileRef.current.name &&
        pendingProfile.location === savedProfileRef.current.location)
    ) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setProfileSaveState('saving');
      try {
        const response = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: pendingProfile.name,
            location: pendingProfile.location,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.user) {
          throw new Error(data?.error || `Could not save your profile (HTTP ${response.status}).`);
        }

        savedProfileRef.current = pendingProfile;
        setUser((previous) =>
          previous
            ? { ...previous, name: data.user.full_name, location: data.user.location || '' }
            : null
        );
        window.dispatchEvent(
          new CustomEvent('dtb_user_updated', {
            detail: { full_name: data.user.full_name },
          })
        );
        notifyRealtimeSync('users');
        setProfileSaveState('saved');
      } catch (error: unknown) {
        setProfileSaveState('error');
        showToast(error instanceof Error ? error.message : 'Could not save your profile.', 'error');
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [name, nameInputError, user, userLocation]);

  const fetchUserReviews = (silent = false) => {
    if (!user?.id) return;
    if (!silent) setReviewsLoading(true);
    fetch(`/api/profile/reviews?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load your reviews.');
        return result;
      })
      .then((result: unknown) => {
        if (Array.isArray(result)) setReviews(result as UserReview[]);
      })
      .catch((error: unknown) => {
        if (!silent) {
          setReviews([]);
          showToast(error instanceof Error ? error.message : 'Could not load your reviews.', 'error');
        }
      })
      .finally(() => {
        if (!silent) setReviewsLoading(false);
      });
  };

  useEffect(() => {
    if (activeCategory !== 'reviews' || !user?.id) return;
    fetchUserReviews(false);
  }, [activeCategory, user?.id]);

  useRealtimeSync(() => {
    if (activeCategory === 'reviews' && user?.id) {
      fetchUserReviews(true);
    }
  });

  const handleDeleteReview = async (reviewId: string) => {
    if (!await confirmAction({ title: 'Delete Review', message: 'Are you sure you want to delete this review?' })) return;
    try {
      const response = await fetch(`/api/profile/reviews?id=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete review.');
      }
      setReviews((previous) => previous.filter((review) => review.id !== reviewId));
      notifyRealtimeSync('reviews');
      showToast('Review deleted.', 'destructive');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to delete review.', 'error');
    }
  };

  // Select a photo first; it is only applied after the user confirms the crop.
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await validateImageFile(file, 'profile');
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Could not read the selected image.'));
        };
        reader.onerror = () => reject(reader.error || new Error('Could not read the selected image.'));
        reader.readAsDataURL(file);
      });
      setAvatarDraft(base64Data);
      setAvatarDraftFile(file);
      setAvatarImageSize(null);
      setAvatarZoom(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
      setAvatarEditorOpen(true);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not read the selected photo.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleApplyAvatar = async () => {
    if (!avatarDraft || !avatarDraftFile || !user) return;
    setAvatarUploading(true);
    try {
      const prepared = await prepareImageForUpload(
        avatarDraftFile,
        'profile',
        {
          zoom: avatarZoom,
          offsetX: avatarOffsetX,
          offsetY: avatarOffsetY,
        }
      );
      const supabase = createClient();
      const extension = prepared.file.type === 'image/webp' ? 'webp' : 'jpg';
      const storagePath = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(
        storagePath,
        prepared.file,
        {
          cacheControl: '3600',
          contentType: prepared.file.type,
          upsert: true,
        }
      );
      if (uploadError) throw uploadError;

      const profileImageUrl = `${supabase.storage.from('avatars').getPublicUrl(storagePath).data.publicUrl}?v=${Date.now()}`;
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: profileImageUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (user.picture !== profileImageUrl) {
          const { error: cleanupError } = await supabase.storage.from('avatars').remove([storagePath]);
          if (cleanupError) {
            console.error('Failed to clean up an avatar after profile update failed:', cleanupError);
          }
        }
        throw new Error(data?.error || `Could not save your photo (HTTP ${res.status}).`);
      }
      if (!data?.user) throw new Error('The server did not confirm the photo update.');

      setUser((prev) => (prev ? { ...prev, picture: data.user.profile_image_url } : null));
      const oldAvatarPaths = ['webp', 'jpg']
        .map((suffix) => `${user.id}/avatar.${suffix}`)
        .filter((path) => path !== storagePath);
      const { error: cleanupError } = await supabase.storage.from('avatars').remove(oldAvatarPaths);
      if (cleanupError) {
        console.error('Failed to remove a replaced avatar file:', cleanupError);
        showToast('Profile photo updated, but the previous file could not be removed.', 'error');
      } else {
        showToast(
          `Profile photo updated (${formatImageSize(prepared.originalSize)} → ${formatImageSize(prepared.compressedSize)}).`,
          'success'
        );
      }
      window.dispatchEvent(
        new CustomEvent('dtb_user_updated', {
          detail: { profile_image_url: data.user.profile_image_url },
        })
      );
      setAvatarEditorOpen(false);
      setAvatarDraft(null);
      setAvatarDraftFile(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not update your photo.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.picture) return;
    setAvatarUploading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Could not remove your photo (HTTP ${res.status}).`);
      }
      if (!data?.user) throw new Error('The server did not confirm the photo removal.');

      setUser((prev) => (prev ? { ...prev, picture: null } : null));
      const supabase = createClient();
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.webp`, `${user.id}/avatar.jpg`]);
      if (storageError) {
        throw new Error(`Profile photo was cleared, but its storage file could not be removed: ${storageError.message}`);
      }
      window.dispatchEvent(
        new CustomEvent('dtb_user_updated', {
          detail: { profile_image_url: null },
        })
      );
      setAvatarEditorOpen(false);
      setAvatarDraft(null);
      setAvatarDraftFile(null);
      showToast('Profile photo removed.', 'destructive');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to remove picture', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Password Reset Link via Supabase Auth
  const handleSendPasswordResetEmail = async () => {
    if (!user?.email) {
      showToast('No email address associated with this account.', 'error');
      return;
    }

    setIsSendingReset(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) throw error;

      showToast('Password reset link sent to your email! Please check your inbox.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not send password reset email.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Delete User Review
  const handleSignOut = async () => {
    try {
      await signOutAndClearClientState(user?.id);
    } catch (error: unknown) {
      console.error('Sign-out cleanup did not complete:', error);
    } finally {
      window.location.replace('/login');
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading profile"
        className="min-h-[70vh] flex items-center justify-center text-slate-500 dark:text-slate-400"
      >
        <Loader2 className="w-8 h-8 animate-spin text-brand-navy-500 dark:text-brand-teal-300" />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. GOOGLE-STYLE PROFILE HERO (Centered Avatar, Name, Email, Subtitle)     */}
      {/* ========================================================================= */}
      <div className="text-center space-y-3 pt-4">
        {/* Large Profile Picture with Camera Action */}
        <div className="relative inline-block group">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-neutral-900 border-4 border-white dark:border-neutral-900 shadow-md flex items-center justify-center text-4xl font-extrabold text-brand-navy-500 dark:text-brand-teal-300 mx-auto">
            <span>{user.name.charAt(0).toUpperCase()}</span>
            {user.picture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={user.picture}
                src={user.picture}
                alt=""
                width={112}
                height={112}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{ aspectRatio: '1 / 1' }}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setAvatarDraft(null);
              setAvatarEditorOpen(true);
            }}
            disabled={avatarUploading}
            aria-label="Manage profile photo"
            className="absolute bottom-0 right-0 p-2 bg-brand-navy-500 hover:bg-brand-navy-600 text-white rounded-full shadow-md transition-transform group-hover:scale-110 cursor-pointer"
          >
            {avatarUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy-500 dark:text-white">
            {user.name}
          </h1>
          <p className="break-all text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user.email}
          </p>
        </div>

      </div>

      {activeCategory ? (
        <div className="mx-auto max-w-2xl flex items-center gap-3 pt-2 pb-2 border-b border-slate-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            aria-label="Back to profile settings"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-brand-navy-500 dark:text-white transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-brand-navy-500 dark:text-white tracking-tight">
              {profileCategories.find((category) => category.id === activeCategory)?.label}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {profileCategories.find((category) => category.id === activeCategory)?.description}
            </p>
          </div>
        </div>
      ) : (
        <nav aria-label="Profile settings" className="mx-auto max-w-2xl space-y-3.5 pt-3 sm:space-y-4">
          {profileCategories.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory(id)}
              className="group flex w-full items-center justify-between gap-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white px-4 py-4.5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-navy-500/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-900/90 dark:hover:border-brand-teal-400/40 dark:focus-visible:ring-brand-teal-400 dark:focus-visible:ring-offset-neutral-950 sm:px-6 sm:py-5 cursor-pointer"
            >
              <span className="flex min-w-0 items-center gap-4 sm:gap-4.5">
                <span className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy-500/[0.08] text-brand-navy-500 transition-all duration-200 group-hover:bg-brand-navy-500 group-hover:text-white dark:bg-brand-teal-700/60 dark:text-brand-teal-400 dark:group-hover:bg-brand-teal-400 dark:group-hover:text-neutral-950 shadow-2xs">
                  <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base sm:text-lg font-extrabold text-brand-navy-500 dark:text-brand-teal-400 tracking-tight group-hover:translate-x-0.5 transition-transform duration-200">
                    {label}
                  </span>
                  <span className="mt-0.5 sm:mt-1 block text-xs sm:text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
                    {description}
                  </span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand-navy-500 dark:text-neutral-500 dark:group-hover:text-brand-teal-400" />
            </button>
          ))}
        </nav>
      )}

      {/* ========================================================================= */}
      {/* 3. CATEGORY CONTENT SECTION (Seamless / No Box Enclosures)                 */}
      {/* ========================================================================= */}
      <div className="pt-4 pb-12">
        {/* ===================================================================== */}
        {/* CATEGORY 1: PERSONAL INFORMATION (Clean, Senior Designer Layout)       */}
        {/* ===================================================================== */}
        {activeCategory === 'personal' && (
          <div id="personal-settings" role="tabpanel" aria-labelledby="personal-tab" className="max-w-2xl space-y-8">
            {/* Header & Auto-Save Badge */}
            <div className="border-b border-slate-200 pb-4 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-brand-navy-500 dark:text-white tracking-tight">
                  Basic Info
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage your personal details and public profile display on Dagat Ta Bai.
                </p>
              </div>

              <div aria-live="polite" className="text-[11px] font-medium shrink-0">
                {profileSaveState === 'saving' && (
                  <span className="inline-flex items-center gap-1.5 text-brand-teal-600 dark:text-brand-teal-400 bg-brand-teal-50 dark:bg-brand-teal-700/50 px-2.5 py-1 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {profileSaveState === 'saved' && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                    <Check className="w-3 h-3" />
                    Changes saved
                  </span>
                )}
                {profileSaveState === 'error' && (
                  <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full">
                    Could not save
                  </span>
                )}
              </div>
            </div>

            {/* Profile Input Fields (Responsive Form Layout) */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-overview-full-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="profile-overview-full-name"
                      type="text"
                      required
                      maxLength={80}
                      autoComplete="name"
                      inputMode="text"
                      value={name}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const validation = validateFullName(rawValue);
                        setName(filterFullNameInput(rawValue));
                        setNameInputError(validation.error);
                        setProfileSaveState('idle');
                      }}
                      onBlur={() => {
                        const validation = validateFullName(name);
                        if (!nameInputError) setNameInputError(validation.error);
                        if (validation.ok && !nameInputError) setName(validation.value);
                      }}
                      aria-invalid={Boolean(nameInputError || !validateFullName(name).ok)}
                      aria-describedby={
                        nameInputError || !validateFullName(name).ok
                          ? 'profile-overview-name-error'
                          : undefined
                      }
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-neutral-900 border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 transition ${
                        nameInputError || !validateFullName(name).ok
                          ? 'border-red-500 dark:border-red-500'
                          : 'border-slate-200 dark:border-neutral-800'
                      }`}
                      placeholder="Your display name"
                    />
                  </div>
                  {(nameInputError || validateFullName(name).error) && (
                    <p
                      id="profile-overview-name-error"
                      role="alert"
                      className="mt-1 flex items-center gap-1 text-[11px] text-red-600"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {nameInputError || validateFullName(name).error}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={160}
                      value={userLocation}
                      onChange={(e) => {
                        setUserLocation(e.target.value);
                        setProfileSaveState('idle');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus:ring-2 focus:ring-brand-teal-400 text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 transition"
                      placeholder={isFetchingLocation ? 'Detecting your location...' : 'Your town or city'}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-slate-400">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 break-all">{email}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-1">
                  Email is linked to your authentication provider.
                </p>
              </div>
            </div>

            {/* Account Status for Owners/Managers */}
            {(user.role === 'beach_owner' || user.role === 'beach_manager') && (
              <section className="border-t border-slate-200 pt-6 dark:border-neutral-800" aria-label="Account status">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Account Status</h3>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {user.role === 'beach_owner' ? 'Beach Owner' : 'Beach Manager'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active &amp; Verified
                  </span>
                </div>
              </section>
            )}

            {/* Account Security (Reset Password) */}
            <section className="border-t border-slate-200 pt-6 dark:border-neutral-800 space-y-3" aria-label="Account security">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Account Password</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  We&apos;ll email you a secure link to choose a new password.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSendPasswordResetEmail}
                disabled={isSendingReset}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-navy-500 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-neutral-950 shadow-2xs sm:w-auto"
              >
                {isSendingReset && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Reset Password</span>
              </button>
            </section>

            {/* Danger Zone */}
            <section className="border-t border-slate-200 pt-6 dark:border-neutral-800 space-y-3" aria-label="Account deletion">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Danger Zone
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Permanently delete your Dagat Ta Bai account and associated preferences.
                </p>
              </div>
              <Link
                href="/contact?subject=Account%20Deletion%20Request"
                className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 sm:w-auto"
              >
                Request Account Deletion
              </Link>
            </section>
          </div>
        )}

        {/* ===================================================================== */}
        {/* CATEGORY 2: PREFERENCES (Senior UI Design, Smooth Toggle Cards)       */}
        {/* ===================================================================== */}
        {activeCategory === 'appearance' && (
          <div id="appearance-settings" role="tabpanel" aria-labelledby="appearance-tab" className="max-w-2xl space-y-6">
            <div className="border-b border-slate-200 pb-4 dark:border-neutral-800">
              <h3 className="text-base font-bold text-brand-navy-500 dark:text-white">Theme Mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose the visual appearance that feels comfortable for your coastal exploration.
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="sr-only">Theme mode</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  aria-pressed={theme === 'light'}
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-brand-navy-500 bg-brand-navy-500/[0.06] shadow-sm ring-1 ring-brand-teal-400'
                      : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${theme === 'light' ? 'bg-brand-navy-500 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'}`}>
                      <Sun className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">Light Mode</span>
                      <span className="block text-[11px] text-slate-500 dark:text-neutral-400">Crisp coastal daylight</span>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <span className="h-6 w-6 rounded-full bg-brand-navy-500 text-white flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  aria-pressed={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-brand-teal-400 bg-brand-teal-700/40 shadow-sm ring-1 ring-brand-teal-400'
                      : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-brand-teal-400 text-neutral-950' : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'}`}>
                      <Moon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">Dark Mode</span>
                      <span className="block text-[11px] text-slate-500 dark:text-neutral-400">Deep night ocean ambience</span>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <span className="h-6 w-6 rounded-full bg-brand-teal-400 text-neutral-950 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </div>
            </fieldset>

          </div>
        )}

        {activeCategory === 'reviews' && (
          <section id="reviews-settings" className="max-w-2xl space-y-5">
            <div className="border-b border-slate-200 pb-4 dark:border-neutral-800">
              <h3 className="text-base font-bold text-brand-navy-500 dark:text-white">My Reviews &amp; Feedback</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reviews and community feedback submitted under your account.
              </p>
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-brand-navy-500 dark:text-brand-teal-400" />
                <span className="text-xs font-semibold">Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand-navy-500/[0.08] text-brand-navy-500 dark:bg-brand-teal-700/60 dark:text-brand-teal-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">No reviews yet</h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm">
                  You haven&apos;t shared any beach reviews or platform feedback yet. Explore beaches and share your experience!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-2xs"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-brand-navy-500 dark:text-white">
                          {review.beach_name || 'Beach Resort'}
                        </h4>
                        {review.review_type === 'platform' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-teal-100 text-brand-navy-500 dark:bg-brand-teal-700/70 dark:text-brand-teal-300">
                            Platform Feedback
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`h-3.5 w-3.5 ${
                              index < review.rating
                                ? 'fill-brand-sun-400 text-brand-sun-700'
                                : 'text-slate-300 dark:text-neutral-700'
                            }`}
                          />
                        ))}
                        <time className="ml-2 text-xs text-slate-500" dateTime={review.created_at}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                        {review.comment}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteReview(review.id)}
                      aria-label={`Delete review for ${review.beach_name || 'beach'}`}
                      className="rounded-full p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {avatarEditorOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !avatarUploading) {
              setAvatarEditorOpen(false);
              setAvatarDraft(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-editor-title"
            className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id="avatar-editor-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Profile photo
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Adjust the framing, then apply your changes.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close photo editor"
                disabled={avatarUploading}
                onClick={() => {
                  setAvatarEditorOpen(false);
                  setAvatarDraft(null);
                }}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div
              className={`relative mx-auto flex h-48 w-48 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-5xl font-bold text-brand-navy-500 dark:bg-neutral-900 dark:text-brand-teal-300 ${
                avatarDraft ? 'cursor-grab touch-none active:cursor-grabbing' : ''
              }`}
              role={avatarDraft ? 'group' : undefined}
              aria-label={avatarDraft ? 'Photo framing. Drag the image to reposition it.' : undefined}
              tabIndex={avatarDraft ? 0 : undefined}
              onPointerDown={(event) => {
                if (!avatarDraft) return;
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                avatarDragRef.current = {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  y: event.clientY,
                };
              }}
              onPointerMove={(event) => {
                const drag = avatarDragRef.current;
                const image = avatarPreviewImageRef.current;
                if (!avatarDraft || !drag || drag.pointerId !== event.pointerId || !image?.naturalWidth) return;

                const deltaX = event.clientX - drag.x;
                const deltaY = event.clientY - drag.y;
                drag.x = event.clientX;
                drag.y = event.clientY;

                const shortestSide = Math.min(image.naturalWidth, image.naturalHeight);
                const maxOffsetX = Math.max(
                  0,
                  (AVATAR_PREVIEW_SIZE * (image.naturalWidth / shortestSide) * avatarZoom - AVATAR_PREVIEW_SIZE) / 2
                );
                const maxOffsetY = Math.max(
                  0,
                  (AVATAR_PREVIEW_SIZE * (image.naturalHeight / shortestSide) * avatarZoom - AVATAR_PREVIEW_SIZE) / 2
                );
                if (maxOffsetX > 0) {
                  setAvatarOffsetX((offset) => Math.max(-1, Math.min(1, offset - deltaX / maxOffsetX)));
                }
                if (maxOffsetY > 0) {
                  setAvatarOffsetY((offset) => Math.max(-1, Math.min(1, offset - deltaY / maxOffsetY)));
                }
              }}
              onPointerUp={(event) => {
                if (avatarDragRef.current?.pointerId === event.pointerId) avatarDragRef.current = null;
              }}
              onPointerCancel={() => {
                avatarDragRef.current = null;
              }}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 0.1 : 0.03;
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                  event.preventDefault();
                  const direction = event.key === 'ArrowLeft' ? -1 : 1;
                  setAvatarOffsetX((offset) => Math.max(-1, Math.min(1, offset + direction * step)));
                } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  const direction = event.key === 'ArrowUp' ? -1 : 1;
                  setAvatarOffsetY((offset) => Math.max(-1, Math.min(1, offset + direction * step)));
                }
              }}
            >
              {avatarDraft || user.picture ? (
                <>
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={avatarPreviewImageRef}
                    key={avatarDraft || user.picture}
                    src={avatarDraft || user.picture || ''}
                    alt="Profile photo preview"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onLoad={(event) => {
                      if (avatarDraft) {
                        setAvatarImageSize({
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        });
                      }
                    }}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                    className={
                      avatarDraft && avatarImageSize
                        ? 'absolute left-1/2 top-1/2 max-w-none'
                        : 'absolute inset-0 h-full w-full object-cover'
                    }
                    style={
                      avatarDraft && avatarImageSize
                        ? {
                            width: `${AVATAR_PREVIEW_SIZE * (avatarImageSize.width / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom}px`,
                            height: `${AVATAR_PREVIEW_SIZE * (avatarImageSize.height / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom}px`,
                            transform: `translate(calc(-50% - ${avatarOffsetX * Math.max(0, (AVATAR_PREVIEW_SIZE * (avatarImageSize.width / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom - AVATAR_PREVIEW_SIZE) / 2)}px), calc(-50% - ${avatarOffsetY * Math.max(0, (AVATAR_PREVIEW_SIZE * (avatarImageSize.height / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom - AVATAR_PREVIEW_SIZE) / 2)}px))`,
                          }
                        : undefined
                    }
                  />
                </>
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="w-full rounded-full border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-slate-200 dark:hover:bg-neutral-900"
              >
                {avatarDraft || user.picture ? 'Choose a different photo' : 'Choose a photo'}
              </button>

              {avatarDraft && (
                <div className="space-y-3">
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Drag the photo to reposition it. Use the arrow keys when the preview is focused.
                  </p>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Zoom
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={avatarZoom}
                      onChange={(event) => {
                        setAvatarZoom(Number(event.target.value));
                        setAvatarOffsetX((offset) => Math.max(-1, Math.min(1, offset)));
                        setAvatarOffsetY((offset) => Math.max(-1, Math.min(1, offset)));
                      }}
                      className="mt-2 block w-full accent-brand-navy-500"
                    />
                  </label>
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-neutral-800">
              {user.picture ? (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  aria-busy={avatarUploading}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove photo
                </button>
              ) : (
                <span />
              )}
              {avatarDraft ? (
                <button
                  type="button"
                  onClick={handleApplyAvatar}
                  disabled={avatarUploading}
                  aria-busy={avatarUploading}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-navy-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-navy-600 disabled:opacity-50"
                >
                  {avatarUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {avatarUploading ? 'Applying...' : 'Apply photo'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAvatarEditorOpen(false)}
                  disabled={avatarUploading}
                  className="rounded-full bg-brand-navy-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-navy-600 disabled:opacity-50"
                >
                  Done
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
