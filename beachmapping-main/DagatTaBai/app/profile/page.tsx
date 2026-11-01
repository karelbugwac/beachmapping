'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Star,
  Palette,
  Loader2,
  Save,
  LogOut,
  MapPin,
  Calendar,
  Camera,
  Trash2,
  Upload,
  Sun,
  Moon,
  Check,
  CheckCircle2,
  MessageSquare,
  Send,
  Trash,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { showToast } from '@/components/ui/feedback-toasts';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  picture?: string | null;
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

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileData | null>(null);

  // Google-Style Categories: 'personal' | 'appearance' | 'security' | 'reviews'
  const [activeCategory, setActiveCategory] = useState<'personal' | 'appearance' | 'security' | 'reviews'>('personal');

  // Personal Info Edit State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Location display (No refresh button)
  const [userLocation, setUserLocation] = useState<string>('Binongkalan, Catmon, Cebu');

  // Password Reset Link State
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Measurement Units
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTemp = localStorage.getItem('dtb_pref_temp');
        if (savedTemp === 'C' || savedTemp === 'F') setTempUnit(savedTemp);

        const savedDist = localStorage.getItem('dtb_pref_dist');
        if (savedDist === 'km' || savedDist === 'mi') setDistanceUnit(savedDist);
      } catch {}
    }
  }, []);

  // Fetch session user
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
            created_at: data.user.created_at,
          };
          setUser(profileUser);
          setName(profileUser.name);
          setEmail(profileUser.email);
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
              sbUser.user_metadata?.avatar_url ||
              sbUser.user_metadata?.picture ||
              null,
            created_at: sbUser.created_at,
          };
          setUser(fallbackUser);
          setName(fallbackUser.name);
          setEmail(fallbackUser.email);
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
              sbData.user.user_metadata?.avatar_url ||
              sbData.user.user_metadata?.picture ||
              null,
            created_at: sbData.user.created_at,
          };
          setUser(fallbackUser);
          setName(fallbackUser.name);
          setEmail(fallbackUser.email);
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

    // Geolocation detection (pure display)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return;
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              { headers: { 'User-Agent': 'DagatTaBai-App' } }
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const town =
                geoData.address?.town ||
                geoData.address?.municipality ||
                geoData.address?.city ||
                'Catmon';
              const region = geoData.address?.state || 'Cebu';
              setUserLocation(`${town}, ${region}`);
            }
          } catch {}
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Load reviews when 'reviews' tab is opened
  useEffect(() => {
    if (activeCategory === 'reviews' && user?.id) {
      setReviewsLoading(true);
      fetch(`/api/profile/reviews?userId=${encodeURIComponent(user.id)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setReviews(data);
        })
        .catch(() => setReviews([]))
        .finally(() => setReviewsLoading(false));
    }
  }, [activeCategory, user?.id]);

  // Handle Avatar Change
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Selected image exceeds 3MB limit. Please choose a smaller photo.', 'error');
      return;
    }

    setAvatarUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Data = ev.target?.result as string;
        setUser((prev) => (prev ? { ...prev, picture: base64Data } : null));

        // Sync client Supabase session
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          await supabase.auth.updateUser({
            data: { profile_image_url: base64Data },
          });
        } catch {}

        // Dispatch instant event to Navbar & other UI components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dtb_user_updated', {
              detail: { profile_image_url: base64Data },
            })
          );
        }

        const res = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_image_url: base64Data }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save avatar image');

        router.refresh();
        showToast('Profile picture updated successfully!', 'success');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      setUser((prev) => (prev ? { ...prev, picture: null } : null));

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { profile_image_url: null },
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dtb_user_updated', {
            detail: { profile_image_url: null },
          })
        );
      }

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: null }),
      });
      if (!res.ok) throw new Error('Failed to remove photo');

      router.refresh();
      showToast('Profile photo removed.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove picture', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Update Display Name & Location
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your display name.', 'error');
      return;
    }

    setIsSavingProfile(true);

    try {
      const trimmedName = name.trim();
      setUser((prev) => (prev ? { ...prev, name: trimmedName } : null));

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { full_name: trimmedName, location: userLocation },
        });
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dtb_user_updated', {
            detail: { full_name: trimmedName },
          })
        );
      }

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: trimmedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      router.refresh();
      showToast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSavingProfile(false);
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
  const handleDeleteReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/profile/reviews?id=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete review');
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast('Review removed successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete review.', 'error');
    }
  };

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F3F74] dark:text-[#4987BA]" />
        <p className="text-xs font-medium">Loading Google-style profile...</p>
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
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-neutral-900 border-4 border-white dark:border-neutral-900 shadow-md flex items-center justify-center text-4xl font-extrabold text-[#1F3F74] dark:text-[#4987BA] mx-auto">
            {user.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            aria-label="Change photo"
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

        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Manage your personal information, privacy, appearance, and account preferences.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. GOOGLE-STYLE HORIZONTAL CATEGORY NAVIGATION BAR                         */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-center border-b border-slate-200 dark:border-neutral-800 overflow-x-auto no-scrollbar gap-2 sm:gap-6 pt-2">
        <button
          type="button"
          onClick={() => setActiveCategory('personal')}
          className={`flex items-center gap-2 pb-3.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeCategory === 'personal'
              ? 'border-[#1F3F74] text-[#1F3F74] dark:border-[#4987BA] dark:text-[#4987BA]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Information</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('appearance')}
          className={`flex items-center gap-2 pb-3.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeCategory === 'appearance'
              ? 'border-[#1F3F74] text-[#1F3F74] dark:border-[#4987BA] dark:text-[#4987BA]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('security')}
          className={`flex items-center gap-2 pb-3.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeCategory === 'security'
              ? 'border-[#1F3F74] text-[#1F3F74] dark:border-[#4987BA] dark:text-[#4987BA]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('reviews')}
          className={`flex items-center gap-2 pb-3.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeCategory === 'reviews'
              ? 'border-[#1F3F74] text-[#1F3F74] dark:border-[#4987BA] dark:text-[#4987BA]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>My Reviews</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. CATEGORY CONTENT SECTION (Seamless / No Box Enclosures)                 */}
      {/* ========================================================================= */}
      <div className="pt-4 pb-12">
        {/* ===================================================================== */}
        {/* CATEGORY 1: PERSONAL INFORMATION (Seamless, Form-First, No Cards)     */}
        {/* ===================================================================== */}
        {activeCategory === 'personal' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
                  Basic Info
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Some info may be visible to other people using Dagat Ta Bai services.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-neutral-800">
                {user.role}
              </span>
            </div>

            {/* Photo Row */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-neutral-900">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Profile Photo</div>
                <div className="text-[11px] text-slate-500">A photo helps personalize your account</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center font-bold text-[#1F3F74] dark:text-[#4987BA]">
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-full transition cursor-pointer"
                >
                  Change
                </button>
                {user.picture && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Form: Oblong fields with italic placeholders (Name -> Email -> Location) */}
            <form onSubmit={handleUpdateProfile} className="space-y-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="w-full pl-11 pr-5 py-3 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1F3F74] text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400"
                    placeholder="Your location (e.g. Lilo-an, Cebu)"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-3">
                  Realtime detected or personalized locality.
                </p>
              </div>

              {/* Submit Button (Oblong, NO disk icon) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center justify-center px-8 py-3 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] text-white text-xs font-bold rounded-full transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================== */}
        {/* CATEGORY 2: PREFERENCES (NO CARDS / SEAMLESS)                         */}
        {/* ===================================================================== */}
        {activeCategory === 'appearance' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-neutral-800 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
                Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your preferred interface mode and measuring units. Transitions happen silently and instantly.
              </p>
            </div>

            {/* Theme Previews matching Beach Owner & Admin (SILENT - NO TOAST MESSAGE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Mode Preview */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`group text-left rounded-2xl p-4 border transition-all duration-200 cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#1F3F74] bg-blue-50/50 ring-2 ring-[#1F3F74]/20'
                    : 'border-slate-200 dark:border-neutral-900 hover:border-slate-300 dark:hover:border-neutral-800 bg-slate-50/40 dark:bg-neutral-950'
                }`}
              >
                <div className="w-full aspect-[16/9] rounded-xl bg-white border border-slate-200 p-2.5 flex flex-col gap-1.5 overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="w-16 h-1.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="flex gap-2 flex-1 pt-0.5">
                    <div className="w-8 rounded-md bg-slate-50 border border-slate-200 p-1 flex flex-col gap-1">
                      <div className="w-full h-1 rounded-full bg-[#1F3F74]" />
                      <div className="w-4 h-1 rounded-full bg-slate-200" />
                      <div className="w-5 h-1 rounded-full bg-slate-200" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="w-2/3 h-1.5 rounded-full bg-slate-300" />
                      <div className="flex-1 rounded-lg bg-slate-50 border border-slate-200 p-1.5 flex gap-1.5 items-center">
                        <div className="w-5 h-5 rounded bg-blue-100 text-[#1F3F74] flex items-center justify-center text-[8px] font-bold">
                          🌊
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="w-3/4 h-1 rounded-full bg-slate-300" />
                          <div className="w-1/2 h-1 rounded-full bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</div>
                      <div className="text-[10px] text-slate-500">Crisp coastal sunlight theme</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      theme === 'light' ? 'bg-[#1F3F74] text-white' : 'border-2 border-slate-300 dark:border-neutral-700'
                    }`}
                  >
                    {theme === 'light' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Dark Mode Preview (Pure Black) */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`group text-left rounded-2xl p-4 border transition-all duration-200 cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#4987BA] bg-neutral-900 ring-2 ring-[#4987BA]/20'
                    : 'border-slate-200 dark:border-neutral-900 hover:border-slate-300 dark:hover:border-neutral-800 bg-slate-50/40 dark:bg-neutral-950'
                }`}
              >
                <div className="w-full aspect-[16/9] rounded-xl bg-black border border-neutral-800 p-2.5 flex flex-col gap-1.5 overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="w-16 h-1.5 rounded-full bg-neutral-800" />
                  </div>
                  <div className="flex gap-2 flex-1 pt-0.5">
                    <div className="w-8 rounded-md bg-neutral-950 border border-neutral-800 p-1 flex flex-col gap-1">
                      <div className="w-full h-1 rounded-full bg-[#4987BA]" />
                      <div className="w-4 h-1 rounded-full bg-neutral-800" />
                      <div className="w-5 h-1 rounded-full bg-neutral-800" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="w-2/3 h-1.5 rounded-full bg-neutral-700" />
                      <div className="flex-1 rounded-lg bg-neutral-950 border border-neutral-800 p-1.5 flex gap-1.5 items-center">
                        <div className="w-5 h-5 rounded bg-blue-950 text-[#4987BA] flex items-center justify-center text-[8px] font-bold">
                          🌊
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="w-3/4 h-1 rounded-full bg-neutral-700" />
                          <div className="w-1/2 h-1 rounded-full bg-neutral-800" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-neutral-800 text-[#4987BA] flex items-center justify-center">
                      <Moon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Pure black, OLED optimized</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      theme === 'dark' ? 'bg-[#4987BA] text-white' : 'border-2 border-slate-300 dark:border-neutral-700'
                    }`}
                  >
                    {theme === 'dark' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>
            </div>

            {/* Units */}
            <div className="pt-4 border-t border-slate-100 dark:border-neutral-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3F74] dark:text-[#4987BA] mb-3">
                Measurement Units
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-neutral-900 bg-slate-50/40 dark:bg-neutral-900/40 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Temperature Format</div>
                  <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-neutral-800 rounded-full text-xs font-semibold gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTempUnit('C');
                        localStorage.setItem('dtb_pref_temp', 'C');
                      }}
                      className={`py-1.5 rounded-full transition-all cursor-pointer ${
                        tempUnit === 'C'
                          ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      °C (Celsius)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempUnit('F');
                        localStorage.setItem('dtb_pref_temp', 'F');
                      }}
                      className={`py-1.5 rounded-full transition-all cursor-pointer ${
                        tempUnit === 'F'
                          ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      °F (Fahrenheit)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-neutral-900 bg-slate-50/40 dark:bg-neutral-900/40 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Distance Format</div>
                  <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-neutral-800 rounded-full text-xs font-semibold gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDistanceUnit('km');
                        localStorage.setItem('dtb_pref_dist', 'km');
                      }}
                      className={`py-1.5 rounded-full transition-all cursor-pointer ${
                        distanceUnit === 'km'
                          ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Kilometers (km)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDistanceUnit('mi');
                        localStorage.setItem('dtb_pref_dist', 'mi');
                      }}
                      className={`py-1.5 rounded-full transition-all cursor-pointer ${
                        distanceUnit === 'mi'
                          ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Miles (mi)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* CATEGORY 3: SECURITY & PASSWORD (NO CARDS / SEAMLESS)                 */}
        {/* ===================================================================== */}
        {activeCategory === 'security' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-neutral-800 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
                Password & Security
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your credentials and sign-in verification via official Supabase authentication.
              </p>
            </div>

            {/* Password Reset Action Box */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-neutral-900 bg-slate-50/60 dark:bg-neutral-900/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-neutral-900 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Reset Password Link
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    We will dispatch an authentication reset link to your verified email (<strong className="text-slate-800 dark:text-slate-200">{user.email}</strong>).
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendPasswordResetEmail}
                  disabled={isSendingReset}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1F3F74] hover:bg-[#285091] text-white text-xs font-bold rounded-full transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSendingReset ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Password Reset Link to Email</span>
                </button>
              </div>
            </div>

            {/* Account Deletion */}
            <div className="pt-4 border-t border-slate-100 dark:border-neutral-900">
              <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                Danger Zone
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Permanently delete your Dagat Ta Bai account and remove all posted reviews.
              </p>
              <Link
                href="/contact?subject=Account%20Deletion%20Request"
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs shadow-md transition-colors"
              >
                Request Account Deletion
              </Link>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* CATEGORY 4: MY REVIEWS (NO CARDS / SEAMLESS)                           */}
        {/* ===================================================================== */}
        {activeCategory === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
                  My Posted Reviews
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage and review ratings you published for Catmon beaches.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-neutral-900 text-[#1F3F74] dark:text-[#4987BA] border border-blue-200 dark:border-neutral-800">
                {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>

            {reviewsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#1F3F74] dark:text-[#4987BA]" />
                <span className="text-xs">Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center space-y-3 p-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className="text-xs text-slate-500 dark:text-slate-400">You haven&apos;t posted any reviews yet.</p>
                <Link
                  href="/map"
                  className="inline-block px-5 py-2 bg-[#1F3F74] text-white rounded-full text-xs font-bold hover:bg-[#285091] transition"
                >
                  Explore Catmon Beaches
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-neutral-900 bg-slate-50/50 dark:bg-neutral-900/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">
                          {rev.beach_name || 'Beach Resort'}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-neutral-700'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        title="Delete review"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
