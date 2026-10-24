'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Star,
  Shield,
  Bell,
  Palette,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  LogOut,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  ExternalLink,
  Camera,
  Trash2,
  RefreshCw,
  Upload,
  Sun,
  Moon,
  Check,
  Waves,
  Compass,
  MessageSquare,
  Sliders,
  CheckCheck,
  Navigation,
  Info,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  picture?: string | null;
  created_at?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileData | null>(null);

  // Active tab: 'overview' | 'security' | 'preferences'
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'preferences'>('overview');

  // Profile Edit State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Geolocation State
  const [userLocation, setUserLocation] = useState<string>('Detecting location...');
  const [locationDetails, setLocationDetails] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);

  // Security (Password) State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Preferences State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [beachAlerts, setBeachAlerts] = useState(true);
  const [discoveryAlerts, setDiscoveryAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [autoLocateMap, setAutoLocateMap] = useState(true);
  const [saveToast, setSaveToast] = useState(false);

  const triggerSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTemp = localStorage.getItem('dtb_pref_temp');
        if (savedTemp === 'C' || savedTemp === 'F') setTempUnit(savedTemp);

        const savedDist = localStorage.getItem('dtb_pref_dist');
        if (savedDist === 'km' || savedDist === 'mi') setDistanceUnit(savedDist);

        const savedAuto = localStorage.getItem('dtb_pref_autolocate');
        if (savedAuto !== null) setAutoLocateMap(savedAuto === 'true');

        const savedNotifEmail = localStorage.getItem('dtb_pref_notif_email');
        if (savedNotifEmail !== null) setEmailNotifications(savedNotifEmail === 'true');

        const savedNotifAlerts = localStorage.getItem('dtb_pref_notif_alerts');
        if (savedNotifAlerts !== null) setBeachAlerts(savedNotifAlerts === 'true');

        const savedNotifDisc = localStorage.getItem('dtb_pref_notif_disc');
        if (savedNotifDisc !== null) setDiscoveryAlerts(savedNotifDisc === 'true');

        const savedDigest = localStorage.getItem('dtb_pref_digest');
        if (savedDigest !== null) setEmailDigest(savedDigest === 'true');
      } catch {}
    }
  }, []);

  // Handlers for interactive preferences with auto-save
  const toggleEmailNotifications = (val: boolean) => {
    setEmailNotifications(val);
    localStorage.setItem('dtb_pref_notif_email', String(val));
    triggerSaveToast();
  };

  const toggleBeachAlerts = (val: boolean) => {
    setBeachAlerts(val);
    localStorage.setItem('dtb_pref_notif_alerts', String(val));
    triggerSaveToast();
  };

  const toggleDiscoveryAlerts = (val: boolean) => {
    setDiscoveryAlerts(val);
    localStorage.setItem('dtb_pref_notif_disc', String(val));
    triggerSaveToast();
  };

  const toggleEmailDigest = (val: boolean) => {
    setEmailDigest(val);
    localStorage.setItem('dtb_pref_digest', String(val));
    triggerSaveToast();
  };

  const changeTempUnit = (val: 'C' | 'F') => {
    setTempUnit(val);
    localStorage.setItem('dtb_pref_temp', val);
    triggerSaveToast();
  };

  const changeDistanceUnit = (val: 'km' | 'mi') => {
    setDistanceUnit(val);
    localStorage.setItem('dtb_pref_dist', val);
    triggerSaveToast();
  };

  const toggleAutoLocate = (val: boolean) => {
    setAutoLocateMap(val);
    localStorage.setItem('dtb_pref_autolocate', String(val));
    triggerSaveToast();
  };

  // Fetch location using browser Geolocation API
  const detectLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setUserLocation('Location unavailable');
      setLocationDetails('Browser geolocation not supported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationDetails(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const place = data.locality || data.city || data.principalSubdivision;
            const region = data.principalSubdivision || data.countryName;
            const formatted = [place, region].filter(Boolean).join(', ');
            if (formatted) {
              setUserLocation(formatted);
              localStorage.setItem('dtb_user_loc_name', formatted);
              localStorage.setItem('dtb_user_coords', `${lat},${lng}`);
              setIsLocating(false);
              return;
            }
          }
          setUserLocation(`${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`);
        } catch {
          setUserLocation(`${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        const cached = typeof window !== 'undefined' ? localStorage.getItem('dtb_user_loc_name') : null;
        if (cached) {
          setUserLocation(cached);
          setLocationDetails('Cached from previous session');
        } else {
          setUserLocation('Location permission denied');
          setLocationDetails('Enable browser location access');
        }
        setIsLocating(false);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  // Fetch current authenticated user & run initial location detection
  useEffect(() => {
    let isMounted = true;

    // Check cached location immediately for instant display
    if (typeof window !== 'undefined') {
      const cachedLoc = localStorage.getItem('dtb_user_loc_name');
      const cachedCoords = localStorage.getItem('dtb_user_coords');
      if (cachedLoc) setUserLocation(cachedLoc);
      if (cachedCoords) setLocationDetails(cachedCoords);
    }

    detectLocation();

    async function loadUser() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();

        if (data.user) {
          if (isMounted) {
            const profileUser: ProfileData = {
              id: data.user.id,
              name: data.user.full_name || '',
              email: data.user.email || '',
              role: data.user.role || 'user',
              picture: data.user.profile_image_url || null,
              created_at: data.user.created_at,
            };
            setUser(profileUser);
            setName(profileUser.name);
            setEmail(profileUser.email);
          }
        } else {
          // If session endpoint fails, check Supabase client directly
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: sbData } = await supabase.auth.getUser();

          if (sbData.user && isMounted) {
            const fallbackUser: ProfileData = {
              id: sbData.user.id,
              name: sbData.user.user_metadata?.name || sbData.user.email?.split('@')[0] || 'User',
              email: sbData.user.email || '',
              role: 'user',
              picture: sbData.user.user_metadata?.avatar_url || null,
              created_at: sbData.user.created_at,
            };
            setUser(fallbackUser);
            setName(fallbackUser.name);
            setEmail(fallbackUser.email);
          } else {
            router.push('/login?redirect=/profile');
          }
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

  // Handle Avatar Change
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setProfileErrorMsg('Selected image exceeds 3MB limit. Please choose a smaller photo.');
      return;
    }

    setAvatarUploading(true);
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Data = ev.target?.result as string;
        // Optimistic UI update
        setUser((prev) => (prev ? { ...prev, picture: base64Data } : null));

        // Persist via API
        const res = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_image_url: base64Data }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save avatar image');

        setProfileSuccessMsg('Profile picture updated successfully!');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to upload photo');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setAvatarUploading(true);
    try {
      setUser((prev) => (prev ? { ...prev, picture: null } : null));
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: null }),
      });
      if (!res.ok) throw new Error('Failed to remove photo');
      setProfileSuccessMsg('Profile photo removed.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to remove picture');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Update Display Name
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setUser((prev) => (prev ? { ...prev, name: name.trim() } : null));
      setProfileSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccessMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Unable to update password right now.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    } finally {
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 dark:text-sky-400" />
        <p className="text-xs font-medium">Loading your profile & settings...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* MODERN PROFILE HEADER (Clean, Flat, Human-Designed — No AI Gradients/Card) */}
      {/* ========================================================================= */}
      <div className="pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar + User Info */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Avatar with Camera Overlay */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-3xl font-extrabold text-slate-700 dark:text-slate-200">
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

              {/* Camera Hover Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Upload profile picture"
                className="absolute inset-0 rounded-2xl bg-slate-950/60 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-[2px]"
              >
                {avatarUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Edit</span>
                  </>
                )}
              </button>
            </div>

            {/* User Meta Information */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                  {user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {user.role}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </p>

              {/* Dynamic Geolocation & Joined Date */}
              <div className="flex items-center gap-4 text-xs flex-wrap pt-1">
                <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  <span>{userLocation}</span>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    title="Refresh current GPS location"
                    className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-md transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Member since{' '}
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Buttons: Solid, Crisp, Clean */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Photo</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 transition shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT: Sidebar Navigation + Settings Forms                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xs space-y-1 md:sticky md:top-24">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition text-left ${
              activeTab === 'overview'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition text-left ${
              activeTab === 'security'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition text-left ${
              activeTab === 'preferences'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Settings & Preferences</span>
          </button>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Links</span>
            <div className="mt-2 space-y-1">
              <Link
                href="/profile/reviews"
                className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 py-1.5 transition"
              >
                <span className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500" /> My Reviews
                </span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
              {user.role === 'beach_owner' && (
                <Link
                  href="/owner/dashboard"
                  className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 py-1.5 transition"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-sky-500" /> Owner Portal
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: OVERVIEW & PROFILE MANAGEMENT */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                    Personal Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update your public display name and avatar photo.
                  </p>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                {/* Avatar Management Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xl flex-shrink-0">
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
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Profile Photo</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Supports PNG, JPG, or WebP up to 3MB.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
                    >
                      {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Upload New</span>
                    </button>
                    {user.picture && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Display Name & Email Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Email address is linked to your login provider.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Account & Real Location Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Account Role</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white capitalize mt-1">
                    {user.role}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Verified Access</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Status</div>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">In good standing</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Current Location</span>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isLocating}
                      className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 text-[10px] normal-case"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Detecting' : 'GPS'}</span>
                    </button>
                  </div>
                  <div className="text-sm font-extrabold text-sky-600 dark:text-sky-400 mt-1 truncate">
                    {userLocation}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {locationDetails || 'Realtime browser GPS'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  Security & Password
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your login password and account protection.
                </p>
              </div>

              {passwordSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                  >
                    {isSavingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                  Danger Zone
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Permanently delete your Dagat Ta Bai account and remove your posted reviews.
                </p>
                <Link
                  href="/privacy/data-request"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold hover:bg-red-100 transition"
                >
                  Request Account Deletion
                </Link>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: STATE-OF-THE-ART SYSTEM PREFERENCES (Modern, Rich Aesthetics)      */}
          {/* ========================================================================= */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              {/* Preferences Header & Auto-Save Badge */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                      System Preferences
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure your interface theme, real-time coastal alerts, and units.
                    </p>
                  </div>
                </div>

                {/* Auto-save notification pill */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-300 ${
                      saveToast
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 scale-105'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <CheckCheck className={`w-3.5 h-3.5 ${saveToast ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{saveToast ? 'Preference saved!' : 'Auto-saved locally'}</span>
                  </div>
                </div>
              </div>

              {/* 1. VISUAL THEME SELECTION WITH MINI MOCKUP PREVIEWS */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Theme Appearance
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select how Dagat Ta Bai adapts to your lighting environment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* LIGHT MODE CARD WITH REALISTIC MINI-MOCKUP */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      triggerSaveToast();
                    }}
                    className={`group text-left rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer ${
                      theme === 'light'
                        ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 ring-2 ring-sky-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-900/60'
                    }`}
                  >
                    {/* Mini Browser Window Mockup */}
                    <div className="w-full aspect-[16/9] rounded-xl bg-slate-100 border border-slate-200 p-2 flex flex-col gap-1.5 overflow-hidden shadow-2xs group-hover:scale-[1.01] transition-transform duration-200">
                      {/* Window Controls */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-slate-300" />
                      </div>
                      {/* Window Body Layout */}
                      <div className="flex gap-2 flex-1 pt-0.5">
                        {/* Mini Sidebar */}
                        <div className="w-8 rounded-md bg-white border border-slate-200/80 p-1 flex flex-col gap-1">
                          <div className="w-full h-1 rounded-full bg-sky-500" />
                          <div className="w-4 h-1 rounded-full bg-slate-200" />
                          <div className="w-5 h-1 rounded-full bg-slate-200" />
                        </div>
                        {/* Mini Main Card Preview */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="w-2/3 h-1.5 rounded-full bg-slate-300" />
                          <div className="flex-1 rounded-lg bg-white border border-slate-200 p-1.5 flex gap-1.5 items-center">
                            <div className="w-6 h-6 rounded bg-sky-100 border border-sky-200 flex items-center justify-center text-[8px] text-sky-600 font-bold">
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

                    {/* Footer Title & Selection Indicator */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                          <Sun className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Light Mode
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Bright & clear for outdoor sunlight
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          theme === 'light'
                            ? 'bg-sky-600 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {theme === 'light' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>

                  {/* DARK MODE CARD WITH REALISTIC MINI-MOCKUP */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      triggerSaveToast();
                    }}
                    className={`group text-left rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer ${
                      theme === 'dark'
                        ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 ring-2 ring-sky-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-900/60'
                    }`}
                  >
                    {/* Mini Browser Window Mockup (Dark Palette) */}
                    <div className="w-full aspect-[16/9] rounded-xl bg-[#06101e] border border-slate-800 p-2 flex flex-col gap-1.5 overflow-hidden shadow-2xs group-hover:scale-[1.01] transition-transform duration-200">
                      {/* Window Controls */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800" />
                      </div>
                      {/* Window Body Layout */}
                      <div className="flex gap-2 flex-1 pt-0.5">
                        {/* Mini Sidebar */}
                        <div className="w-8 rounded-md bg-[#0b172a] border border-slate-800 p-1 flex flex-col gap-1">
                          <div className="w-full h-1 rounded-full bg-sky-400" />
                          <div className="w-4 h-1 rounded-full bg-slate-700" />
                          <div className="w-5 h-1 rounded-full bg-slate-700" />
                        </div>
                        {/* Mini Main Card Preview */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="w-2/3 h-1.5 rounded-full bg-slate-700" />
                          <div className="flex-1 rounded-lg bg-[#0b172a] border border-slate-800 p-1.5 flex gap-1.5 items-center">
                            <div className="w-6 h-6 rounded bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-[8px] text-sky-400 font-bold">
                              🌊
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="w-3/4 h-1 rounded-full bg-slate-700" />
                              <div className="w-1/2 h-1 rounded-full bg-slate-800" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Title & Selection Indicator */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-sky-950/70 border border-sky-900/60 text-sky-400 flex items-center justify-center">
                          <Moon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Dark Mode
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Deep navy, gentle on tired eyes
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          theme === 'dark'
                            ? 'bg-sky-600 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {theme === 'dark' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. MODERN NOTIFICATION TOGGLES (iOS / SLIDER STYLE) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Notification Alerts
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Control which updates and alerts you receive in real-time.
                  </p>
                </div>

                {/* Grouped list with smooth dividers */}
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden bg-slate-50/30 dark:bg-slate-900/30">
                  {/* Row 1: Review Replies */}
                  <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Review Updates & Owner Replies
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Get notified when resort owners reply to your beach reviews or questions.
                        </div>
                      </div>
                    </div>

                    {/* iOS / Tailwind Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailNotifications}
                      onClick={() => toggleEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${
                        emailNotifications ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          emailNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 2: Marine Tide & Sea Alerts */}
                  <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                        <Waves className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Catmon Tide & Sea Weather Advisories
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          High/low tide forecast, water temperature, and coastal swimming conditions.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={beachAlerts}
                      onClick={() => toggleBeachAlerts(!beachAlerts)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${
                        beachAlerts ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          beachAlerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 3: 360° Panoramas & New Beaches */}
                  <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          New Beach Listings & 360° Panoramas
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Receive notifications when new coastal sanctuaries or virtual tours are published.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={discoveryAlerts}
                      onClick={() => toggleDiscoveryAlerts(!discoveryAlerts)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${
                        discoveryAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          discoveryAlerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 4: Weekly Weekend Beach Digest */}
                  <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Friday Weekend Beach Briefing
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          A curated Friday email with weekend weather highlights and featured spots.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailDigest}
                      onClick={() => toggleEmailDigest(!emailDigest)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${
                        emailDigest ? 'bg-amber-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          emailDigest ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. DISPLAY UNITS & MAP PREFERENCES */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Regional & Map Units
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize your measurement formats across weather graphs and maps.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Temperature Scale */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 space-y-2.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Temperature Format
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Weather and water temperature readings.
                    </div>
                    <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-semibold gap-1">
                      <button
                        type="button"
                        onClick={() => changeTempUnit('C')}
                        className={`py-1.5 rounded-lg transition-all ${
                          tempUnit === 'C'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        °C (Celsius)
                      </button>
                      <button
                        type="button"
                        onClick={() => changeTempUnit('F')}
                        className={`py-1.5 rounded-lg transition-all ${
                          tempUnit === 'F'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        °F (Fahrenheit)
                      </button>
                    </div>
                  </div>

                  {/* Distance Units */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 space-y-2.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Distance Calculation
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Measurement from current GPS to beach resorts.
                    </div>
                    <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-semibold gap-1">
                      <button
                        type="button"
                        onClick={() => changeDistanceUnit('km')}
                        className={`py-1.5 rounded-lg transition-all ${
                          distanceUnit === 'km'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Kilometers (km)
                      </button>
                      <button
                        type="button"
                        onClick={() => changeDistanceUnit('mi')}
                        className={`py-1.5 rounded-lg transition-all ${
                          distanceUnit === 'mi'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Miles (mi)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Map Auto-Centering Row */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Map GPS Auto-Centering
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically pan interactive map to your detected device coordinates.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoLocateMap}
                    onClick={() => toggleAutoLocate(!autoLocateMap)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${
                      autoLocateMap ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        autoLocateMap ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
