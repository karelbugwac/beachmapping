'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ExternalLink,
  Upload,
  Camera,
  Compass,
  ChevronDown,
  Clock,
  Sparkles,
  Share2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { BeachRecord, BeachPhoto } from '@/lib/db/beaches';
import { VirtualTourModal } from '@/components/virtual-tour-modal';

interface CottageItem {
  id: string;
  name: string;
  price: string;
  capacity: string;
  description: string;
  image_url: string;
}

interface FacilityItem {
  id: string;
  title: string;
  category: 'parking' | 'equipment' | 'amenity' | 'safety';
  price: string;
  description: string;
  image_url: string;
}

interface ResortPost {
  id: string;
  caption: string;
  image_url?: string;
  created_at: string;
  likes: number;
}

interface ResortRuleItem {
  id: string;
  type: 'do' | 'dont';
  title: string;
  description: string;
  category: string;
}

const DEFAULT_RESORT_RULES: ResortRuleItem[] = [
  {
    id: 'rule-1',
    type: 'do',
    category: 'Safety',
    title: 'Wear life vests when swimming in deep areas',
    description: 'Guests and children are advised to use personal floatation devices past the reef markers.',
  },
  {
    id: 'rule-2',
    type: 'do',
    category: 'Environment',
    title: 'Practice CLAYGO (Clean As You Go)',
    description: 'Deposit all food packaging, plastics, and bottles into designated garbage bins located along the shoreline.',
  },
  {
    id: 'rule-3',
    type: 'do',
    category: 'Etiquette',
    title: 'Observe quiet hours after 10:00 PM',
    description: 'Keep sound systems, portable karaoke, and outdoor music low to respect cottage neighbors and local residents.',
  },
  {
    id: 'rule-4',
    type: 'dont',
    category: 'Safety',
    title: 'No glass bottles or breakable containers on the sand',
    description: 'Glass shards pose severe puncture hazards to barefoot swimmers and beachgoers.',
  },
  {
    id: 'rule-5',
    type: 'dont',
    category: 'Environment',
    title: 'No bonfires or uncontained open fires on the shoreline',
    description: 'Use designated communal grilling stations only to protect coastal vegetation and prevent embers.',
  },
  {
    id: 'rule-6',
    type: 'dont',
    category: 'Environment',
    title: 'Do not step on or collect live coral and marine life',
    description: 'Preserve Binongkalan marine life. Take pictures only and leave corals undisturbed.',
  },
];

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ManageInformationPage() {
  const [activeTab, setActiveTab] = useState<'basic' | 'cottages' | 'facilities' | 'hours' | 'photos' | 'dos' | 'tour'>('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setBeach] = useState<BeachRecord | null>(null);

  // Floating Toast State (Centered, green for success, red for error, 5s duration, NO "x")
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    location: '',
    latitude: '10.6348',
    longitude: '124.0275',
    cover_image: '',
    profile_image: '',
    virtual_tour_url: '',
    contact_phone: '', // 10 numeric digits after +63
    contact_email: '',
    facebook_url: '',
    instagram_url: '',
    peak_days: 'Saturdays, Sundays & Holidays',
    peak_hours: '10:00 AM – 3:00 PM',
    best_visiting_time: 'Morning low-tide for wide sandy shoreline',
    entrance_fee_adults: '',
    entrance_fee_children: '',
    cottage_fee: '',
    images: [] as Array<BeachPhoto | string>,
  });

  // Operating Hours State: day -> { isOpen: boolean, openTime: string, closeTime: string }
  const [schedule, setSchedule] = useState<Record<string, { isOpen: boolean; openTime: string; closeTime: string }>>({
    Mon: { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    Tue: { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    Wed: { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    Thu: { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    Fri: { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    Sat: { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    Sun: { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
  });

  // Cottages State
  const [cottages, setCottages] = useState<CottageItem[]>([
    {
      id: 'cot-1',
      name: 'Open Air Bamboo Cottage',
      price: '500',
      capacity: '10 - 15 persons',
      description: 'Shaded shoreline cottage made of natural bamboo with wooden picnic table and direct beach access.',
      image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cot-2',
      name: 'Family Umbrella Gazebo',
      price: '800',
      capacity: '15 - 20 persons',
      description: 'Spacious octagonal gazebo with electrical outlets, grilling station access, and panoramic ocean views.',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    },
  ]);

  // Facilities & Equipment State
  const [facilities, setFacilities] = useState<FacilityItem[]>([
    {
      id: 'fac-1',
      title: 'Secured Visitor Parking',
      category: 'parking',
      price: 'Free',
      description: 'Wide, well-lit parking area accommodating cars, motorcycles, and tourist vans with staff monitoring.',
      image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'fac-2',
      title: 'Snorkeling Gear & Life Vests',
      category: 'equipment',
      price: '150',
      description: 'Clean, sanitized life vests (adult & kids sizes) and underwater snorkeling masks available for daily rental.',
      image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'fac-3',
      title: 'Freshwater Shower Cubicles',
      category: 'amenity',
      price: 'Free',
      description: 'Multiple private shower cubicles and foot-washing taps with clean mountain spring water.',
      image_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
    },
  ]);

  // Facebook-Style Posts / Feed State
  const [resortPosts, setResortPosts] = useState<ResortPost[]>([
    {
      id: 'post-1',
      caption: 'Calm waters and gentle breeze today at Binongkalan! Fresh coconuts are available at our beach stall.',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      created_at: '2 hours ago',
      likes: 12,
    },
  ]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);

  // Modals for adding cottage / facility
  const [showAddCottage, setShowAddCottage] = useState(false);
  const [newCottage, setNewCottage] = useState<Partial<CottageItem>>({
    name: '',
    price: '',
    capacity: '',
    description: '',
    image_url: '',
  });

  const [showAddFacility, setShowAddFacility] = useState(false);
  const [newFacility, setNewFacility] = useState<Partial<FacilityItem>>({
    title: '',
    category: 'parking',
    price: '',
    description: '',
    image_url: '',
  });

  // Do's & Don'ts Rules State
  const [rules, setRules] = useState<ResortRuleItem[]>(DEFAULT_RESORT_RULES);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState<{
    type: 'do' | 'dont';
    title: string;
    description: string;
    category: string;
  }>({
    type: 'do',
    title: '',
    description: '',
    category: 'Safety',
  });

  // Photo upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // 360 Virtual Tour Recapture Modal State
  const [showRecaptureModal, setShowRecaptureModal] = useState(false);
  const [recaptureReason, setRecaptureReason] = useState('New cottage/building added');
  const [recaptureNotes, setRecaptureNotes] = useState('');
  const [submittingRecapture, setSubmittingRecapture] = useState(false);
  const [showTourPreview, setShowTourPreview] = useState(false);

  // Photos & Gallery Sub-Category: 'branding' | 'posts' | 'gallery'
  const [photoSubTab, setPhotoSubTab] = useState<'branding' | 'posts' | 'gallery'>('branding');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing beach data
  useEffect(() => {
    fetch('/api/owner/beach', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const b = data[0];
          setBeach(b);

          let feeAdults = '';
          let feeChildren = '';
          if (b.entrance_fee) {
            const parts = String(b.entrance_fee).split('|');
            feeAdults = (parts[0] || '').replace(/[^\d.]/g, '');
            feeChildren = (parts[1] || '').replace(/[^\d.]/g, '');
          }

          // Strip +63 or non-digits for phone
          let cleanPhone = b.contact_phone || '';
          cleanPhone = cleanPhone.replace(/^\+63\s*/, '').replace(/\D/g, '').slice(0, 10);

          setFormData({
            id: b.id || '',
            name: b.name || '',
            description: b.description || '',
            location: b.location || 'Barangay Binongkalan, Catmon, Cebu',
            latitude: b.latitude ? String(b.latitude) : '10.6348',
            longitude: b.longitude ? String(b.longitude) : '124.0275',
            cover_image: b.cover_image || b.cover_image_url || '',
            profile_image: b.profile_image || b.profile_image_url || '',
            virtual_tour_url: b.virtual_tour_url || '',
            contact_phone: cleanPhone,
            contact_email: b.contact_email || '',
            facebook_url: '',
            instagram_url: '',
            peak_days: 'Saturdays, Sundays & Holidays',
            peak_hours: '10:00 AM – 3:00 PM',
            best_visiting_time: 'Morning low-tide for wide sandy shoreline',
            entrance_fee_adults: feeAdults,
            entrance_fee_children: feeChildren,
            cottage_fee: b.cottage_fee || '',
            images: Array.isArray(b.images) ? b.images : [],
          });

          // Parse opening hours into schedule
          if (b.opening_hours) {
            try {
              const raw = typeof b.opening_hours === 'string' && b.opening_hours.startsWith('{')
                ? JSON.parse(b.opening_hours)
                : b.opening_hours;

              if (typeof raw === 'object' && raw !== null) {
                const nextSched: Record<string, { isOpen: boolean; openTime: string; closeTime: string }> = {};
                DEFAULT_DAYS.forEach((day) => {
                  const val = raw[day];
                  if (!val || val === 'Closed' || val === 'CLOSE') {
                    nextSched[day] = { isOpen: false, openTime: '08:00 AM', closeTime: '06:00 PM' };
                  } else {
                    const times = String(val).split('–').map((t) => t.trim());
                    nextSched[day] = {
                      isOpen: true,
                      openTime: times[0] || '08:00 AM',
                      closeTime: times[1] || '06:00 PM',
                    };
                  }
                });
                setSchedule(nextSched);
              }
            } catch {
              // Ignore fallback
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load beach information:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Resort establishment name is required.';
    if (!formData.location.trim()) errs.location = 'Resort location address is required.';
    if (formData.contact_email && !formData.contact_email.includes('@')) {
      errs.contact_email = 'Valid email address must include "@".';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Convert schedule to save payload
  const formatSchedulePayload = () => {
    const hours: Record<string, string> = {};
    DEFAULT_DAYS.forEach((day) => {
      const item = schedule[day];
      if (!item || !item.isOpen) {
        hours[day] = 'Closed';
      } else {
        hours[day] = `${item.openTime} – ${item.closeTime}`;
      }
    });
    return hours;
  };

  // Save changes handler
  const handleSave = async () => {
    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please correct the highlighted form errors before saving.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        contact_phone: formData.contact_phone ? `+63 ${formData.contact_phone}` : '',
        opening_hours: formatSchedulePayload(),
      };

      const res = await fetch('/api/owner/beach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update resort information.');
      }

      setToast({
        type: 'success',
        message: 'Resort information updated successfully!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  // Upload helper for PNG / JPG only
  const uploadImageFile = async (file: File): Promise<string> => {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type.toLowerCase())) {
      throw new Error('Please upload an image in PNG or JPG format only.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image file size must be less than 5MB.');
    }

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('category', 'gallery');

    const res = await fetch('/api/owner/beach/images', {
      method: 'POST',
      body: uploadData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Photo upload failed.');
    }

    return data.url;
  };

  // Photo Upload Handler (Gallery)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const newImageUrl = await uploadImageFile(file);
      const nextImages: BeachPhoto[] = [
        ...formData.images.map((img) =>
          typeof img === 'string'
            ? { category: 'gallery', caption: '', photo_url: img }
            : {
                category: img.category || 'gallery',
                caption: img.caption || '',
                photo_url: img.photo_url || (img as any).url || '',
                created_at: img.created_at,
              }
        ),
        {
          category: 'gallery',
          caption: file.name.replace(/\.[^/.]+$/, ''),
          photo_url: newImageUrl,
          created_at: new Date().toISOString(),
        },
      ];

      setFormData((prev) => ({ ...prev, images: nextImages }));
      setToast({ type: 'success', message: 'Photo uploaded and added to resort gallery!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Profile Upload Handler
  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfile(true);
    try {
      const url = await uploadImageFile(file);
      setFormData((prev) => ({ ...prev, profile_image: url }));
      setToast({ type: 'success', message: 'Resort profile logo updated! Click Save Changes.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Profile upload failed.';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploadingProfile(false);
      e.target.value = '';
    }
  };

  // Cover Upload Handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await uploadImageFile(file);
      setFormData((prev) => ({ ...prev, cover_image: url }));
      setToast({ type: 'success', message: 'Resort banner cover updated! Click Save Changes.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cover upload failed.';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Create Facebook-Style Resort Post
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption.trim() && !newPostImage) {
      setToast({ type: 'error', message: 'Please write a caption or attach a photo.' });
      return;
    }

    const post: ResortPost = {
      id: `post-${Date.now()}`,
      caption: newPostCaption.trim(),
      image_url: newPostImage || undefined,
      created_at: 'Just now',
      likes: 0,
    };

    setResortPosts([post, ...resortPosts]);
    setNewPostCaption('');
    setNewPostImage(null);
    setToast({ type: 'success', message: 'Update posted to resort feed!' });
  };

  // Photo Delete Handler
  const handleDeletePhoto = (index: number) => {
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: updated }));
    setToast({ type: 'success', message: 'Photo removed from gallery. Click Save Changes to finalize.' });
  };

  // Recapture Tour Request
  const handleSubmitRecapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRecapture(true);
    try {
      const res = await fetch('/api/owner/beach/tour-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beach_id: formData.id,
          reason: recaptureReason,
          notes: recaptureNotes,
          is_recapture: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit 360° recapture request.');
      }

      setToast({
        type: 'success',
        message: '360° virtual tour recapture request submitted to Municipal Tourism Admin!',
      });
      setShowRecaptureModal(false);
      setRecaptureNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit tour request.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSubmittingRecapture(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1F3F74] border-t-transparent" />
        <p className="text-xs font-semibold text-[#1F3F74] dark:text-[#4987BA]">
          Loading resort information...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      
      {/* ── Floating Message Banner (Centered, solid green/red, white text, 5s duration, NO "x") ── */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3.5 rounded-full shadow-2xl max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300 text-white font-medium text-xs sm:text-sm tracking-wide ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Header: Manage Information (No back arrow, Blue header, clean divider) ── */}
      <div className="pb-4 border-b border-slate-200 dark:border-neutral-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-[#4987BA] tracking-tight font-sans">
          Manage Information
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 font-medium">
          Update resort details, cottages, facilities, operating hours, peak days, photos, and virtual tours.
        </p>
      </div>

      {/* ── Oblong Category Tab Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'basic', label: 'Basic Info' },
          { key: 'cottages', label: 'Cottages & Rooms' },
          { key: 'facilities', label: 'Facilities & Parkings' },
          { key: 'hours', label: 'Operating Schedule' },
          { key: 'photos', label: 'Photos & Updates' },
          { key: 'dos', label: "Do's & Don'ts" },
          { key: 'tour', label: '360° Virtual Tour' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#1F3F74] text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800 hover:border-[#1F3F74]/50 hover:text-[#1F3F74] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: BASIC INFORMATION (Frameless, Flat layout) ── */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
              Establishment Overview &amp; Social Links
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Public details displayed to tourists on the Dagat Ta Bai map and listing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Resort Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Resort Establishment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Catmon Coral Beach Resort"
                className={`w-full rounded-full border bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none transition-all ${
                  errors.name
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-slate-300 dark:border-neutral-700 focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-500 font-medium pl-3">{errors.name}</p>
              )}
            </div>

            {/* Description (Textarea) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Resort Description &amp; Highlights
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what makes your beach unique, sea condition, sand quality, and guest policies..."
                className="w-full rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all leading-relaxed"
              />
            </div>

            {/* Official Contact Phone with BUILT-IN +63 prefix badge and numbers only */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Official Contact Phone
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] select-none pointer-events-none">
                  +63
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={formData.contact_phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, contact_phone: cleaned });
                  }}
                  placeholder="912 345 6789"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-17 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all"
                />
              </div>
              <span className="text-[10.5px] text-slate-400 pl-3">Enter 10-digit mobile number (e.g. 9123456789)</span>
            </div>

            {/* Public Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Public Inquiries Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="e.g. info@catmonbeach.ph"
                className={`w-full rounded-full border bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none transition-all ${
                  errors.contact_email
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-slate-300 dark:border-neutral-700 focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20'
                }`}
              />
              {errors.contact_email && (
                <p className="text-[11px] text-red-500 font-medium pl-3">{errors.contact_email}</p>
              )}
            </div>

            {/* Facebook Page URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA]" />
                <span>Official Facebook Page</span>
              </label>
              <input
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/your-resort-page"
                className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all"
              />
            </div>

            {/* Instagram / Social Media Link */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA]" />
                <span>Instagram / Website Link</span>
              </label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/your-resort"
                className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all"
              />
            </div>

            {/* Location Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Location Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Sitio Panangatan, Barangay Binongkalan, Catmon, Cebu"
                className={`w-full rounded-full border bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none transition-all ${
                  errors.location
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-slate-300 dark:border-neutral-700 focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20'
                }`}
              />
              {errors.location && (
                <p className="text-[11px] text-red-500 font-medium pl-3">{errors.location}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: COTTAGES & RATES (Built-in Peso ₱ sign, PNG/JPG upload only) ── */}
      {activeTab === 'cottages' && (
        <div className="space-y-8">
          {/* General Entrance Fee Card */}
          <div className="space-y-4 pb-8 border-b border-slate-200 dark:border-neutral-800">
            <div>
              <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                General Admission Rates
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Standard gate entrance fees per visitor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Adult Entrance Fee
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                  <input
                    type="number"
                    value={formData.entrance_fee_adults}
                    onChange={(e) => setFormData({ ...formData, entrance_fee_adults: e.target.value })}
                    placeholder="50"
                    className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-9 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Children / Senior Citizen Entrance Fee
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                  <input
                    type="number"
                    value={formData.entrance_fee_children}
                    onChange={(e) => setFormData({ ...formData, entrance_fee_children: e.target.value })}
                    placeholder="25"
                    className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-9 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cottage Units Listing with PNG/JPG upload */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                  Resort Cottages &amp; Sheds
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Detailed cottage listings including photos, capacity, rates, and features.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCottage(true)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Cottage</span>
              </button>
            </div>

            {/* Cottage Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {cottages.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-950 flex flex-col justify-between shadow-2xs"
                >
                  <div className="relative w-full h-48 bg-slate-200 dark:bg-neutral-800">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-black/90 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] shadow-xs">
                      ₱{item.price} / day
                    </div>
                  </div>

                  <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Capacity: {item.capacity}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-neutral-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setCottages(cottages.filter((c) => c.id !== item.id));
                          setToast({ type: 'success', message: 'Cottage removed.' });
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: FACILITIES & PARKINGS (With Price and PNG/JPG upload) ── */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                Facilities, Parkings &amp; Equipment
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Showcase parking capacity, shower cubicles, water sports gear, and amenity highlights with pictures and pricing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddFacility(true)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Facility</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="rounded-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-950 flex flex-col justify-between shadow-2xs"
              >
                <div className="relative w-full h-40 bg-slate-200 dark:bg-neutral-800">
                  <Image
                    src={fac.image_url}
                    alt={fac.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {fac.category}
                  </span>
                  <span className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-black/90 backdrop-blur-xs text-[#1F3F74] dark:text-[#4987BA] text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {fac.price === 'Free' ? 'Free' : `₱${fac.price}`}
                  </span>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {fac.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 leading-relaxed">
                      {fac.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-neutral-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFacilities(facilities.filter((f) => f.id !== fac.id));
                        setToast({ type: 'success', message: 'Facility item removed.' });
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: OPERATING HOURS & PEAK VISITING TIMES (Frameless, NO card container) ── */}
      {activeTab === 'hours' && (
        <div className="space-y-8">
          {/* Peak Days & Visiting Hours Section */}
          <div className="space-y-4 pb-8 border-b border-slate-200 dark:border-neutral-800">
            <div>
              <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1F3F74] dark:text-[#4987BA]" />
                <span>Peak Days &amp; Recommended Visiting Hours</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Help tourists choose the optimal time to visit your beach based on crowds and tide conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Peak Visiting Days
                </label>
                <input
                  type="text"
                  value={formData.peak_days}
                  onChange={(e) => setFormData({ ...formData, peak_days: e.target.value })}
                  placeholder="e.g. Saturdays, Sundays & Holidays"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Peak Visiting Hours
                </label>
                <input
                  type="text"
                  value={formData.peak_hours}
                  onChange={(e) => setFormData({ ...formData, peak_hours: e.target.value })}
                  placeholder="e.g. 10:00 AM – 3:00 PM"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Best Time to Visit
                </label>
                <input
                  type="text"
                  value={formData.best_visiting_time}
                  onChange={(e) => setFormData({ ...formData, best_visiting_time: e.target.value })}
                  placeholder="e.g. Morning low tide"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>
            </div>
          </div>

          {/* Daily Schedule (Frameless, Flat layout with clean dividers) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                Daily Operating Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Toggle the switch to &quot;Closed&quot; for days when your resort is private or closed for maintenance.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-neutral-800 max-w-2xl">
              {DEFAULT_DAYS.map((day) => {
                const current = schedule[day] || { isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' };
                const fullDayNames: Record<string, string> = {
                  Mon: 'Monday',
                  Tue: 'Tuesday',
                  Wed: 'Wednesday',
                  Thu: 'Thursday',
                  Fri: 'Friday',
                  Sat: 'Saturday',
                  Sun: 'Sunday',
                };

                return (
                  <div
                    key={day}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Day Name & Toggle */}
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={current.isOpen}
                          onChange={(e) => {
                            setSchedule({
                              ...schedule,
                              [day]: { ...current, isOpen: e.target.checked },
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1F3F74]" />
                      </label>

                      <div className="min-w-28">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {fullDayNames[day]}
                        </span>
                      </div>

                      {!current.isOpen && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                          Closed
                        </span>
                      )}
                    </div>

                    {/* Time Selectors (Active when Open) */}
                    {current.isOpen ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={current.openTime}
                          onChange={(e) => {
                            setSchedule({
                              ...schedule,
                              [day]: { ...current, openTime: e.target.value },
                            });
                          }}
                          placeholder="08:00 AM"
                          className="w-28 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-1.5 px-3 text-xs text-center font-medium placeholder:italic text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74]"
                        />
                        <span className="text-xs text-slate-400 font-bold">to</span>
                        <input
                          type="text"
                          value={current.closeTime}
                          onChange={(e) => {
                            setSchedule({
                              ...schedule,
                              [day]: { ...current, closeTime: e.target.value },
                            });
                          }}
                          placeholder="06:00 PM"
                          className="w-28 rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-1.5 px-3 text-xs text-center font-medium placeholder:italic text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74]"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Not accepting visitors on this day
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PHOTOS, UPDATES & FB-STYLE FEED ── */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Sub-Tabs: Profile/Cover, Facebook Style Feed, Shoreline Gallery */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-3">
            {[
              { key: 'branding', label: 'Profile & Cover Banner' },
              { key: 'posts', label: 'Resort Updates (Facebook Style)' },
              { key: 'gallery', label: 'Shoreline Photo Gallery' },
            ].map((sub) => (
              <button
                key={sub.key}
                type="button"
                onClick={() => setPhotoSubTab(sub.key as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  photoSubTab === sub.key
                    ? 'bg-[#1F3F74] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* 1. Profile Picture & Cover Photo */}
          {photoSubTab === 'branding' && (
            <div className="space-y-6">
              {/* Cover Banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Resort Cover Banner (Landscape)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      High-resolution landscape photo shown at the top of your public beach profile. PNG or JPG only.
                    </p>
                  </div>

                  <label className="px-5 py-2 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5">
                    {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{formData.cover_image ? 'Change Cover' : 'Upload Cover'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                  {formData.cover_image ? (
                    <Image
                      src={formData.cover_image}
                      alt="Resort Cover Banner"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Camera className="w-8 h-8" />
                      <span className="text-xs font-medium">No cover image uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Logo */}
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Resort Profile Logo (Square)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Square avatar or logo badge shown next to reviews and search pins. PNG or JPG only.
                    </p>
                  </div>

                  <label className="px-5 py-2 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5">
                    {uploadingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{formData.profile_image ? 'Change Profile' : 'Upload Profile'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleProfileUpload}
                      disabled={uploadingProfile}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                  {formData.profile_image ? (
                    <Image
                      src={formData.profile_image}
                      alt="Resort Profile Logo"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px]">No Logo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Facebook-Style Resort Feed & Post Updates */}
          {photoSubTab === 'posts' && (
            <div className="space-y-6">
              {/* Post Composer (FB Style) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1F3F74] text-white flex items-center justify-center font-bold text-xs">
                    {formData.name ? formData.name.charAt(0) : 'R'}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Post an official update to your beach listing page
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  placeholder="Share recent ocean conditions, food specials, cottage availability, or upcoming weekend events..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />

                {/* Attached Preview */}
                {newPostImage && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800">
                    <Image src={newPostImage} alt="Post Attachment" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewPostImage(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer">
                    {uploadingPostImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA]" />}
                    <span>Attach Photo (PNG/JPG)</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      disabled={uploadingPostImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingPostImage(true);
                        try {
                          const url = await uploadImageFile(file);
                          setNewPostImage(url);
                        } catch (err: unknown) {
                          setToast({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
                        } finally {
                          setUploadingPostImage(false);
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handlePublishPost}
                    className="px-6 py-2 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Publish Update
                  </button>
                </div>
              </div>

              {/* Feed of Posts */}
              <div className="space-y-4">
                {resortPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1F3F74] text-white flex items-center justify-center font-bold text-xs">
                          {formData.name ? formData.name.charAt(0) : 'R'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {formData.name || 'Resort Admin'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {post.created_at} &bull; Public Post
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setResortPosts(resortPosts.filter((p) => p.id !== post.id));
                          setToast({ type: 'success', message: 'Post removed from feed.' });
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 dark:text-neutral-200 leading-relaxed">
                      {post.caption}
                    </p>

                    {post.image_url && (
                      <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800">
                        <Image src={post.image_url} alt="Post image" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Shoreline Photo Gallery */}
          {photoSubTab === 'gallery' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Shoreline Photo Gallery
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    High-resolution photos showcasing beaches, sea conditions, and facilities. PNG or JPG only.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handlePhotoUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((img, i) => {
                    const url = typeof img === 'string' ? img : ((img as any).photo_url || (img as any).url || '');
                    return (
                      <div
                        key={i}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-950"
                      >
                        <Image
                          src={url}
                          alt={`Resort Photo ${i + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(i)}
                            className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Camera className="w-8 h-8 text-slate-300 dark:text-neutral-700" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-neutral-300">
                    No gallery photos added yet
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Click &quot;Upload Photo&quot; to showcase your resort shoreline. PNG or JPG only.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DO'S & DON'TS ── */}
      {activeTab === 'dos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                Resort Guidelines &amp; Regulations (Do&apos;s &amp; Don&apos;ts)
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Establish clear safety policies, environmental guidelines, and conduct expectations for resort guests.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewRule({ type: 'do', title: '', description: '', category: 'Safety' });
                setShowAddRule(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Guideline / Rule</span>
            </button>
          </div>

          {/* Dual Columns: Do's vs Don'ts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* DO'S COLUMN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Do&apos;s (Recommended &amp; Permitted)
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {rules.filter((r) => r.type === 'do').length} Guidelines
                </span>
              </div>

              <div className="space-y-3">
                {rules.filter((r) => r.type === 'do').map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {rule.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                            {rule.category}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRules(rules.filter((r) => r.id !== rule.id));
                        setToast({ type: 'success', message: 'Guideline removed.' });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer flex-shrink-0"
                      title="Delete guideline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {rules.filter((r) => r.type === 'do').length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-4 text-slate-400 text-xs">
                    No &quot;Do&quot; guidelines registered. Click &quot;Add Guideline / Rule&quot; to add one.
                  </div>
                )}
              </div>
            </div>

            {/* DON'TS COLUMN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-red-200 dark:border-red-900/60">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-red-800 dark:text-red-300 uppercase tracking-wider">
                    Don&apos;ts (Strict Prohibitions)
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                  {rules.filter((r) => r.type === 'dont').length} Restrictions
                </span>
              </div>

              <div className="space-y-3">
                {rules.filter((r) => r.type === 'dont').map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xs hover:border-red-300 dark:hover:border-red-800 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {rule.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                            {rule.category}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRules(rules.filter((r) => r.id !== rule.id));
                        setToast({ type: 'success', message: 'Restriction removed.' });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer flex-shrink-0"
                      title="Delete restriction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {rules.filter((r) => r.type === 'dont').length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-4 text-slate-400 text-xs">
                    No &quot;Don&apos;t&quot; restrictions registered. Click &quot;Add Guideline / Rule&quot; to add one.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: 360° VIRTUAL TOUR ── */}
      {activeTab === 'tour' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                360° Virtual Tour Panorama
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Immersive 360° panoramic scan of your resort coastline powered by Panoee.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRecaptureModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all self-start sm:self-auto"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Request 360° Recapture</span>
            </button>
          </div>

          {formData.virtual_tour_url ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Active 360° Virtual Tour Published
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTourPreview(true)}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Preview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Embedded Interactive Viewer */}
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-black">
                <iframe
                  src={formData.virtual_tour_url}
                  title="360 Tour"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <Compass className="w-8 h-8 text-slate-300 dark:text-neutral-700" />
              <p className="text-xs font-semibold text-slate-700 dark:text-neutral-200">
                No 360° virtual tour registered yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Click &quot;Request 360° Recapture&quot; to notify the municipal team to scan your resort with our 360° camera equipment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM SAVE CHANGES BUTTON (Oblong, Dive Blue, Strictly NO icon inside) ── */}
      <div className="pt-6 border-t border-slate-200 dark:border-neutral-800 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full px-8 py-3 bg-[#1F3F74] hover:bg-[#183460] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* ── MODAL: ADD COTTAGE (PNG/JPG Upload Only, Built-in ₱) ── */}
      {showAddCottage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
              Add New Resort Cottage
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCottage.name || !newCottage.price) {
                  setToast({ type: 'error', message: 'Cottage name and rate are required.' });
                  return;
                }
                const item: CottageItem = {
                  id: `cot-${Date.now()}`,
                  name: newCottage.name,
                  price: newCottage.price,
                  capacity: newCottage.capacity || '10 - 15 persons',
                  description: newCottage.description || 'Shoreline cottage with direct ocean access.',
                  image_url: newCottage.image_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
                };
                setCottages([...cottages, item]);
                setShowAddCottage(false);
                setNewCottage({ name: '', price: '', capacity: '', description: '', image_url: '' });
                setToast({ type: 'success', message: 'New cottage added!' });
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Cottage Name / Type *
                </label>
                <input
                  type="text"
                  required
                  value={newCottage.name}
                  onChange={(e) => setNewCottage({ ...newCottage, name: e.target.value })}
                  placeholder="e.g. Seafront Mahogany Cottage"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Daily Rate *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                    <input
                      type="number"
                      required
                      value={newCottage.price}
                      onChange={(e) => setNewCottage({ ...newCottage, price: e.target.value })}
                      placeholder="700"
                      className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-8 pr-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Guest Capacity
                  </label>
                  <input
                    type="text"
                    value={newCottage.capacity}
                    onChange={(e) => setNewCottage({ ...newCottage, capacity: e.target.value })}
                    placeholder="e.g. 10 - 15 persons"
                    className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                  />
                </div>
              </div>

              {/* PNG/JPG File Upload Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Upload Cottage Photo (PNG or JPG only)
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-full border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose PNG/JPG File</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImageFile(file);
                          setNewCottage({ ...newCottage, image_url: url });
                          setToast({ type: 'success', message: 'Cottage photo uploaded!' });
                        } catch (err: unknown) {
                          setToast({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {newCottage.image_url && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Photo Attached</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCottage.description}
                  onChange={(e) => setNewCottage({ ...newCottage, description: e.target.value })}
                  placeholder="Details about shade, grilling area, table setup..."
                  className="w-full rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCottage(false)}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full px-6 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Cottage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD FACILITY (PNG/JPG Upload Only, Built-in ₱) ── */}
      {showAddFacility && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
              Add Facility or Equipment
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newFacility.title) {
                  setToast({ type: 'error', message: 'Facility title is required.' });
                  return;
                }
                const item: FacilityItem = {
                  id: `fac-${Date.now()}`,
                  title: newFacility.title,
                  category: newFacility.category || 'amenity',
                  price: newFacility.price || 'Free',
                  description: newFacility.description || 'Available facility for resort visitors.',
                  image_url: newFacility.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
                };
                setFacilities([...facilities, item]);
                setShowAddFacility(false);
                setNewFacility({ title: '', category: 'parking', price: '', description: '', image_url: '' });
                setToast({ type: 'success', message: 'New facility or equipment added!' });
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Facility / Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFacility.title}
                  onChange={(e) => setNewFacility({ ...newFacility, title: e.target.value })}
                  placeholder="e.g. Secured Gated Parking"
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={newFacility.category}
                      onChange={(e) => setNewFacility({ ...newFacility, category: e.target.value as any })}
                      className="w-full appearance-none rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-4 pr-10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74]"
                    >
                      <option value="parking">Parking Area</option>
                      <option value="equipment">Water Equipment / Life Vests</option>
                      <option value="amenity">Comfort Rooms &amp; Showers</option>
                      <option value="safety">Lifeguard &amp; Safety Station</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Rental Rate / Fee
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                    <input
                      type="text"
                      value={newFacility.price}
                      onChange={(e) => setNewFacility({ ...newFacility, price: e.target.value })}
                      placeholder="Free or 100"
                      className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-8 pr-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                    />
                  </div>
                </div>
              </div>

              {/* PNG/JPG File Upload Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Upload Photo (PNG or JPG only)
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-full border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose PNG/JPG File</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImageFile(file);
                          setNewFacility({ ...newFacility, image_url: url });
                          setToast({ type: 'success', message: 'Facility photo uploaded!' });
                        } catch (err: unknown) {
                          setToast({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {newFacility.image_url && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Photo Attached</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newFacility.description}
                  onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
                  placeholder="Description of the facility, capacity, fee if any..."
                  className="w-full rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFacility(false)}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full px-6 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD RESORT GUIDELINE / RULE ── */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                Add Resort Guideline / Policy
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Configure guidelines, safety warnings, and rules for tourists visiting your resort.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRule.title.trim()) {
                  setToast({ type: 'error', message: 'Rule title is required.' });
                  return;
                }
                const item: ResortRuleItem = {
                  id: `rule-${Date.now()}`,
                  type: newRule.type,
                  title: newRule.title.trim(),
                  description: newRule.description.trim(),
                  category: newRule.category || 'General',
                };
                setRules([...rules, item]);
                setShowAddRule(false);
                setNewRule({ type: 'do', title: '', description: '', category: 'Safety' });
                setToast({ type: 'success', message: 'New resort rule added successfully!' });
              }}
              className="space-y-4"
            >
              {/* Type Switcher: Do vs Don't */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Rule Type *
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-neutral-950 rounded-full border border-slate-200 dark:border-neutral-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setNewRule({ ...newRule, type: 'do' })}
                    className={`py-2 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newRule.type === 'do'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Do (Permitted / Recommended)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRule({ ...newRule, type: 'dont' })}
                    className={`py-2 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newRule.type === 'dont'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-red-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Don&apos;t (Prohibited)</span>
                  </button>
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="w-full appearance-none rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-4 pr-10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74]"
                  >
                    <option value="Safety">Safety</option>
                    <option value="Shoreline Etiquette">Shoreline Etiquette</option>
                    <option value="Environment">Environment &amp; Marine Life</option>
                    <option value="Noise & Curfew">Noise &amp; Curfew</option>
                    <option value="Pets">Pets Policy</option>
                    <option value="General Policy">General Policy</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Rule Headline *
                </label>
                <input
                  type="text"
                  required
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  placeholder={newRule.type === 'do' ? 'e.g. Wear life vests during high tide' : 'e.g. No glassware or bottles on shoreline'}
                  className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Explanation / Details
                </label>
                <textarea
                  rows={2}
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Provide additional context or instructions for guests..."
                  className="w-full rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full px-6 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Guideline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: 360° RECAPTURE REQUEST ── */}
      {showRecaptureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                Request 360° Virtual Tour Recapture
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Notify the Dagat Ta Bai Admin to schedule a panoramic re-scanning of your resort.
              </p>
            </div>

            <form onSubmit={handleSubmitRecapture} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Reason for Recapture *
                </label>
                <div className="relative">
                  <select
                    value={recaptureReason}
                    onChange={(e) => setRecaptureReason(e.target.value)}
                    className="w-full appearance-none rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 pl-4 pr-10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1F3F74]"
                  >
                    <option value="New cottage/building added">New cottage/building added</option>
                    <option value="Renovated shoreline or pool">Renovated shoreline or pool</option>
                    <option value="Existing tour is outdated">Existing tour is outdated</option>
                    <option value="New amenities/facilities available">New amenities/facilities available</option>
                    <option value="Other structural improvements">Other structural improvements</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Additional Notes for Municipal Admin
                </label>
                <textarea
                  rows={3}
                  value={recaptureNotes}
                  onChange={(e) => setRecaptureNotes(e.target.value)}
                  placeholder="Detail what new features were constructed and preferred scanning dates..."
                  className="w-full rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecaptureModal(false)}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRecapture}
                  className="rounded-full px-6 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingRecapture ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: TOUR PREVIEW ── */}
      {showTourPreview && (
        <VirtualTourModal
          isOpen={showTourPreview}
          onClose={() => setShowTourPreview(false)}
          tourUrl={formData.virtual_tour_url}
          beachName={formData.name || 'Resort 360° Virtual Tour'}
        />
      )}

    </div>
  );
}
