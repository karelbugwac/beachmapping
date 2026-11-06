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
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { showToast } from '@/components/ui/feedback-toasts';

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
  rating: number;
  comment: string;
  created_at: string;
}

const AVATAR_PREVIEW_SIZE = 192;

function cropAvatarImage(
  imageUrl: string,
  zoom: number,
  offsetX: number,
  offsetY: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const cropSize = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
      const maxOffsetX = (image.naturalWidth - cropSize) / 2;
      const maxOffsetY = (image.naturalHeight - cropSize) / 2;
      const centerX = image.naturalWidth / 2 + offsetX * maxOffsetX;
      const centerY = image.naturalHeight / 2 + offsetY * maxOffsetY;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not prepare the selected photo.'));
        return;
      }

      context.drawImage(
        image,
        centerX - cropSize / 2,
        centerY - cropSize / 2,
        cropSize,
        cropSize,
        0,
        0,
        canvas.width,
        canvas.height
      );
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = () => reject(new Error('Could not load the selected photo.'));
    image.src = imageUrl;
  });
}

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
  const [email, setEmail] = useState('');
  const [profileSaveState, setProfileSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedProfileRef = useRef<{ name: string; location: string } | null>(null);
  const locationLookupStartedRef = useRef(false);

  // Avatar selection and confirmation state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
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

    const pendingProfile = { name: name.trim(), location: userLocation.trim() };
    if (
      pendingProfile.name.length < 2 ||
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
        setProfileSaveState('saved');
      } catch (error: unknown) {
        setProfileSaveState('error');
        showToast(error instanceof Error ? error.message : 'Could not save your profile.', 'error');
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [name, user, userLocation]);

  useEffect(() => {
    if (activeCategory !== 'reviews' || !user?.id) return;

    let isMounted = true;
    setReviewsLoading(true);
    fetch(`/api/profile/reviews?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load your reviews.');
        return result;
      })
      .then((result: unknown) => {
        if (isMounted && Array.isArray(result)) setReviews(result as UserReview[]);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setReviews([]);
          showToast(error instanceof Error ? error.message : 'Could not load your reviews.', 'error');
        }
      })
      .finally(() => {
        if (isMounted) setReviewsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory, user?.id]);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/profile/reviews?id=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not delete your review.');
      }
      setReviews((previous) => previous.filter((review) => review.id !== reviewId));
      showToast('Review removed.', 'destructive');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not delete your review.', 'error');
    }
  };

  // Select a photo first; it is only applied after the user confirms the crop.
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Choose a JPG, PNG, or WebP image.', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('Selected image exceeds 3MB limit. Please choose a smaller photo.', 'error');
      e.target.value = '';
      return;
    }

    try {
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
    if (!avatarDraft) return;
    setAvatarUploading(true);
    try {
      const croppedImage = await cropAvatarImage(
        avatarDraft,
        avatarZoom,
        avatarOffsetX,
        avatarOffsetY
      );
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: croppedImage }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Could not save your photo (HTTP ${res.status}).`);
      }
      if (!data?.user) throw new Error('The server did not confirm the photo update.');

      setUser((prev) => (prev ? { ...prev, picture: data.user.profile_image_url } : null));
      window.dispatchEvent(
        new CustomEvent('dtb_user_updated', {
          detail: { profile_image_url: data.user.profile_image_url },
        })
      );
      showToast('Profile photo updated.', 'success');
      setAvatarEditorOpen(false);
      setAvatarDraft(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not update your photo.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user.picture) return;
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
      window.dispatchEvent(
        new CustomEvent('dtb_user_updated', {
          detail: { profile_image_url: null },
        })
      );
      setAvatarEditorOpen(false);
      setAvatarDraft(null);
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
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {} finally {
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading profile"
        className="min-h-[70vh] flex items-center justify-center text-slate-500 dark:text-slate-400"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#1F3F74] dark:text-[#4987BA]" />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-neutral-900 border-4 border-white dark:border-neutral-900 shadow-md flex items-center justify-center text-4xl font-extrabold text-[#1F3F74] dark:text-[#4987BA] mx-auto">
            <span>{user.name.charAt(0).toUpperCase()}</span>
            {user.picture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={user.picture}
                src={user.picture}
                alt=""
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
            className="absolute bottom-0 right-0 p-2 bg-[#1F3F74] hover:bg-[#285091] text-white rounded-full shadow-md transition-transform group-hover:scale-110 cursor-pointer"
          >
            {avatarUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
            {user.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user.email}
          </p>
        </div>

      </div>

      {activeCategory ? (
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            aria-label="Back to profile settings"
            className="inline-flex shrink-0 items-center text-slate-600 transition hover:text-[#1F3F74] dark:text-slate-300 dark:hover:text-[#4987BA]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {profileCategories.find((category) => category.id === activeCategory)?.label}
          </h2>
        </div>
      ) : (
        <nav aria-label="Profile settings" className="mx-auto max-w-2xl space-y-3 pt-3 sm:space-y-4">
          {profileCategories.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory(id)}
              className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-4 py-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#1F3F74]/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-[#4987BA]/50 dark:focus-visible:ring-[#4987BA] dark:focus-visible:ring-offset-neutral-950 sm:px-5 sm:py-5"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F3F74]/[0.07] text-[#1F3F74] transition-colors group-hover:bg-[#1F3F74]/[0.12] dark:bg-[#4987BA]/10 dark:text-[#70A9D6] dark:group-hover:bg-[#4987BA]/20">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1F3F74] dark:group-hover:text-[#70A9D6]" />
            </button>
          ))}
        </nav>
      )}

      {/* ========================================================================= */}
      {/* 3. CATEGORY CONTENT SECTION (Seamless / No Box Enclosures)                 */}
      {/* ========================================================================= */}
      <div className="pt-4 pb-12">
        {/* ===================================================================== */}
        {/* CATEGORY 1: PERSONAL INFORMATION (Seamless, Form-First, No Cards)     */}
        {/* ===================================================================== */}
        {activeCategory === 'personal' && (
          <div id="personal-settings" role="tabpanel" aria-labelledby="personal-tab" className="space-y-6">
            <div className="border-b border-slate-200 pb-4 dark:border-neutral-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
                  Basic Info
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Some info may be visible to other people using Dagat Ta Bai services.
                </p>
              </div>
            </div>

            <div className="space-y-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setProfileSaveState('idle');
                    }}
                    className="w-full pl-11 pr-5 py-3 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400"
                    placeholder="Your display name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-11 pr-5 py-3 text-xs bg-slate-100 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-full text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-3">
                  Email is linked to your authentication provider.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={160}
                    value={userLocation}
                    onChange={(e) => {
                      setUserLocation(e.target.value);
                      setProfileSaveState('idle');
                    }}
                    className="w-full pl-11 pr-5 py-3 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400"
                    placeholder={isFetchingLocation ? 'Detecting your location...' : 'Your town or city'}
                  />
                </div>
              </div>

              <p aria-live="polite" className="min-h-4 text-[11px] text-slate-500 dark:text-slate-400">
                {profileSaveState === 'saving' && 'Saving changes...'}
                {profileSaveState === 'saved' && 'Changes saved automatically.'}
                {profileSaveState === 'error' && 'Could not save. Edit a field to try again.'}
              </p>
            </div>

            {(user.role === 'beach_owner' || user.role === 'beach_manager') && (
              <section className="border-t border-slate-200 pt-5 dark:border-neutral-800" aria-label="Account status">
                <h3 className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">Account Status</h3>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-neutral-900">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {user.role === 'beach_owner' ? 'Beach Owner' : 'Beach Manager'}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
              </section>
            )}

            <section className="space-y-5 border-t border-slate-200 pt-6 dark:border-neutral-800" aria-label="Account access and deletion">
              <div>
                <h3 className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">Reset Password</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  We&apos;ll email you a secure link to choose a new password.
                </p>
                <button
                  type="button"
                  onClick={handleSendPasswordResetEmail}
                  disabled={isSendingReset}
                  className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#1F3F74] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#285091] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-neutral-950"
                >
                  {isSendingReset && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Reset Password</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-5 dark:border-neutral-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Danger Zone
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Permanently delete your Dagat Ta Bai account.
                </p>
                <Link
                  href="/contact?subject=Account%20Deletion%20Request"
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
                >
                  Request Account Deletion
                </Link>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================== */}
        {/* CATEGORY 2: PREFERENCES (NO CARDS / SEAMLESS)                         */}
        {/* ===================================================================== */}
        {activeCategory === 'appearance' && (
          <div id="appearance-settings" role="tabpanel" aria-labelledby="appearance-tab" className="space-y-6">
            <div className="border-b border-slate-200 pb-4 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">Theme mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the appearance that feels comfortable for you.
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="sr-only">Theme mode</legend>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={theme === 'light'}
                  onClick={() => setTheme('light')}
                  className={`inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] focus-visible:ring-offset-2 dark:focus-visible:ring-[#4987BA] dark:focus-visible:ring-offset-neutral-950 ${
                    theme === 'light'
                      ? 'border-[#1F3F74] bg-[#1F3F74]/[0.06] text-[#1F3F74] dark:border-[#4987BA] dark:bg-[#4987BA]/10 dark:text-[#70A9D6]'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-2"><Sun className="h-4 w-4" />Light</span>
                  {theme === 'light' && <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  aria-pressed={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                  className={`inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] focus-visible:ring-offset-2 dark:focus-visible:ring-[#4987BA] dark:focus-visible:ring-offset-neutral-950 ${
                    theme === 'dark'
                      ? 'border-[#4987BA] bg-[#4987BA]/10 text-[#1F3F74] dark:text-[#70A9D6]'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-2"><Moon className="h-4 w-4" />Dark</span>
                  {theme === 'dark' && <Check className="h-4 w-4" />}
                </button>
              </div>
            </fieldset>

          </div>
        )}

        {activeCategory === 'reviews' && (
          <section id="reviews-settings" className="space-y-5">
            {reviewsLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#1F3F74] dark:text-[#4987BA]" />
                <span className="text-sm">Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1F3F74] dark:bg-neutral-900 dark:text-[#4987BA]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You haven&apos;t posted any reviews yet.
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="flex items-start justify-between gap-4 border-b border-slate-200 py-4 dark:border-neutral-800"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">
                      {review.beach_name || 'Beach'}
                    </h3>
                    <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-neutral-700'
                          }`}
                        />
                      ))}
                      <time className="ml-2 text-xs text-slate-500" dateTime={review.created_at}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteReview(review.id)}
                    aria-label={`Delete review for ${review.beach_name || 'beach'}`}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </article>
              ))
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
              className={`relative mx-auto flex h-48 w-48 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-5xl font-bold text-[#1F3F74] dark:bg-neutral-900 dark:text-[#4987BA] ${
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={avatarPreviewImageRef}
                  src={avatarDraft || user.picture || ''}
                  alt="Profile photo preview"
                  draggable={false}
                  onLoad={(event) => {
                    if (avatarDraft) {
                      setAvatarImageSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      });
                    }
                  }}
                  className={`absolute left-1/2 top-1/2 max-w-none ${
                    avatarDraft ? '' : 'h-full w-full object-cover'
                  }`}
                  style={avatarDraft && avatarImageSize
                    ? {
                        width: `${AVATAR_PREVIEW_SIZE * (avatarImageSize.width / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom}px`,
                        height: `${AVATAR_PREVIEW_SIZE * (avatarImageSize.height / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom}px`,
                        transform: `translate(calc(-50% - ${avatarOffsetX * Math.max(0, (AVATAR_PREVIEW_SIZE * (avatarImageSize.width / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom - AVATAR_PREVIEW_SIZE) / 2)}px), calc(-50% - ${avatarOffsetY * Math.max(0, (AVATAR_PREVIEW_SIZE * (avatarImageSize.height / Math.min(avatarImageSize.width, avatarImageSize.height)) * avatarZoom - AVATAR_PREVIEW_SIZE) / 2)}px))`,
                      }
                    : avatarDraft
                      ? { width: '100%', height: '100%', objectFit: 'cover' }
                      : undefined}
                />
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
                      className="mt-2 block w-full accent-[#1F3F74]"
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
                  className="inline-flex items-center gap-2 rounded-full bg-[#1F3F74] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#285091] disabled:opacity-50"
                >
                  {avatarUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {avatarUploading ? 'Applying...' : 'Apply photo'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAvatarEditorOpen(false)}
                  disabled={avatarUploading}
                  className="rounded-full bg-[#1F3F74] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#285091] disabled:opacity-50"
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
