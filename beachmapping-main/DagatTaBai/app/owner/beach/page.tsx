'use client';

import React, { useState, useEffect, useRef } from 'react';
import { showToast } from '@/components/ui/feedback-toasts';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Eye,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Clock,
  Coins,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Compass,
  Globe,
  MoreHorizontal,
  BadgeCheck,
  Tag,
  Smile,
  Edit,
  X,
  Send,
  SlidersHorizontal,
  Locate,
  Star,
  Home,
  Grid,
  Waves,
  Check,
  MessageCircle,
  ChevronRight,
  Upload,
  Copy,
  Crosshair,
  Search,
} from 'lucide-react';
import type { BeachRecord, BeachPhoto } from '@/lib/db/beaches';
import { VirtualTourModal, extractTourEmbedUrl } from '@/components/virtual-tour-modal';
import { LocationPickerModal } from '@/components/map/location-picker-modal';

const PRESET_COVERS = [
  {
    name: 'Sunset Shoreline',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Tropical Palms & Sand',
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Crystal Turquoise Lagoon',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Catmon Coastal Horizon',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=85',
  },
];

const PRESET_PROFILES = [
  {
    name: 'Palm Resort Crest',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Blue Lagoon Emblem',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Ocean Sunset Badge',
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80',
  },
];

export default function ManageBeachPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'general' | 'cottages' | 'facilities' | 'activities' | 'rules' | 'reviews' | 'posts'>('overview');
  const [focusedSection, setFocusedSection] = useState<'entrance-fee' | 'opening-hours' | 'location' | null>(null);
  const [beachId, setBeachId] = useState<string | null>(null);
  const [beachSlug, setBeachSlug] = useState<string | null>(null);
  const [availableBeaches, setAvailableBeaches] = useState<BeachRecord[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCottageEditModal, setShowCottageEditModal] = useState(false);
  const [editingCottage, setEditingCottage] = useState<BeachPhoto | null>(null);
  const [cottagePhotoUrl, setCottagePhotoUrl] = useState('');
  const [cottageDescription, setCottageDescription] = useState('');
  const [cottagePrice, setCottagePrice] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    latitude: '10.6348',
    longitude: '124.0275',
    cover_image: '',
    profile_image: '',
    virtual_tour_url: '',
    opening_hours: {
      Mon: '',
      Tue: '',
      Wed: '',
      Thu: '',
      Fri: '',
      Sat: '',
      Sun: ''
    } as Record<string, string>,
    entrance_fee_adults: '',
    entrance_fee_children: '',
    cottage_fee: '',
    rules: '',
    contact_phone: '',
    contact_email: '',
  });

  const [geocoding, setGeocoding] = useState(false);

  const handleGeocode = async () => {
    if (!formData.location.trim()) {
      showToast('Please enter a location address first.', 'error');
      return;
    }
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat).toFixed(6),
          longitude: parseFloat(data[0].lon).toFixed(6),
        });
        showToast('Coordinates updated from address.');
      } else {
        showToast('Could not find coordinates for this address. Please enter manually.', 'error');
      }
    } catch (error) {
      showToast('Failed to get coordinates. Please enter manually.', 'error');
    } finally {
      setGeocoding(false);
    }
  };

  const [images, setImages] = useState<BeachPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [postPhotoUrl, setPostPhotoUrl] = useState('');
  const [postCategory, setPostCategory] = useState('Shoreline');

  const [showCoverModal, setShowCoverModal] = useState(false);
  const [tempCoverInput, setTempCoverInput] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const directCoverInputRef = useRef<HTMLInputElement>(null);

  const [showTourModal, setShowTourModal] = useState(false);
  const [tempTourInput, setTempTourInput] = useState('');
  const [showTourPreviewModal, setShowTourPreviewModal] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempProfileInput, setTempProfileInput] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Post & Cottage upload states & refs
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingCottagePhoto, setUploadingCottagePhoto] = useState(false);
  const cottageEditFileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingCottageRate, setUploadingCottageRate] = useState(false);
  const cottageRateFileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Photo-to-URL Converter modal states
  const [showConverterModal, setShowConverterModal] = useState(false);
  const [convertedPhotoUrl, setConvertedPhotoUrl] = useState('');
  const [uploadingConverter, setUploadingConverter] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const converterFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadPhoto = async (
    file: File,
    type: 'cover' | 'profile' | 'post' | 'cottage' | 'cottageRate' | 'converter'
  ): Promise<string | null> => {
    if (!file) return null;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Photo must be 10MB or smaller.', 'error');
      return null;
    }

    if (type === 'cover') setUploadingCover(true);
    else if (type === 'profile') setUploadingProfile(true);
    else if (type === 'post') setUploadingPostPhoto(true);
    else if (type === 'cottage') setUploadingCottagePhoto(true);
    else if (type === 'cottageRate') setUploadingCottageRate(true);
    else if (type === 'converter') setUploadingConverter(true);

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      if (beachId) {
        uploadData.append('beach_id', beachId);
      }

      const res = await fetch('/api/owner/beach/images', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo.');
      }

      showToast('Photo uploaded from device and converted to cloud URL!');
      return data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.';
      console.error('Upload photo error:', err);
      showToast(msg, 'error');
      return null;
    } finally {
      if (type === 'cover') setUploadingCover(false);
      else if (type === 'profile') setUploadingProfile(false);
      else if (type === 'post') setUploadingPostPhoto(false);
      else if (type === 'cottage') setUploadingCottagePhoto(false);
      else if (type === 'cottageRate') setUploadingCottageRate(false);
      else if (type === 'converter') setUploadingConverter(false);
    }
  };

  const [photoFilter, setPhotoFilter] = useState('all');

  const [showCottageRatesModal, setShowCottageRatesModal] = useState(false);
  const [cottageImage, setCottageImage] = useState('');
  const [editingCottageIndex, setEditingCottageIndex] = useState<number | null>(null);

  const cottageFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectBeach = (b: BeachRecord) => {
    setBeachId(b.id);
    setBeachSlug(b.slug || b.id);
    setFormData({
      name: b.name || '',
      description: b.description || '',
      location: b.location || '',
      latitude: b.latitude !== undefined && b.latitude !== null ? b.latitude.toString() : '10.6348',
      longitude: b.longitude !== undefined && b.longitude !== null ? b.longitude.toString() : '124.0275',
      cover_image: b.cover_image || '',
      profile_image: b.profile_image || '',
      virtual_tour_url: b.virtual_tour_url || '',
      opening_hours: typeof b.opening_hours === 'object' && b.opening_hours ? b.opening_hours : {
        Mon: '',
        Tue: '',
        Wed: '',
        Thu: '',
        Fri: '',
        Sat: '',
        Sun: ''
      },
      entrance_fee_adults: b.entrance_fee?.includes('|') 
        ? b.entrance_fee.split('|')[0] || ''
        : b.entrance_fee || '',
      entrance_fee_children: b.entrance_fee?.includes('|')
        ? b.entrance_fee.split('|')[1] || ''
        : b.entrance_fee || '',
      cottage_fee: b.cottage_fee || '',
      rules: b.rules || '',
      contact_phone: b.contact_phone || '',
      contact_email: b.contact_email || '',
    });
    setImages(Array.isArray(b.images) ? b.images : []);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'location') {
        setActiveTab('location');
      }
      if (params.get('action') === 'set-location') {
        setShowLocationModal(true);
      }
    }

    fetch('/api/owner/beach', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: BeachRecord[]) => {
        console.log('Raw API data:', data);
        if (Array.isArray(data) && data.length > 0) {
          setAvailableBeaches(data);
          handleSelectBeach(data[0]);
        }
      })
      .catch((err) => console.error('Failed to load beach info:', err))
      .finally(() => setLoading(false));
  }, []);

  // Save changes to DB
  const saveBeachData = async (updatedFields: Partial<typeof formData>, updatedImages?: BeachPhoto[]) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData,
        ...updatedFields,
        id: beachId,
        images: updatedImages !== undefined ? updatedImages : images,
      };

      console.log('Owner/beach - Saving payload:', {
        opening_hours: payload.opening_hours,
        entrance_fee_adults: payload.entrance_fee_adults,
        entrance_fee_children: payload.entrance_fee_children,
      });

      const res = await fetch('/api/owner/beach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Owner/beach - API response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes');
      }

      if (data.beach?.id) setBeachId(data.beach.id);
      if (data.beach?.slug) setBeachSlug(data.beach.slug);

      // Update formData with the values that were just saved (from payload)
      setFormData(prev => ({
        ...prev,
        ...updatedFields,
        opening_hours: updatedFields.opening_hours || prev.opening_hours,
        entrance_fee_adults: updatedFields.entrance_fee_adults !== undefined ? updatedFields.entrance_fee_adults : prev.entrance_fee_adults,
        entrance_fee_children: updatedFields.entrance_fee_children !== undefined ? updatedFields.entrance_fee_children : prev.entrance_fee_children,
      }));

      setSavedMessage('Page published & updated successfully!');
      showToast('Beach information saved successfully.');
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (err: any) {
      const message = err.message || 'Failed to save beach information.';
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Publish Post
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postPhotoUrl.trim() && !postText.trim()) return;

    const newPost: BeachPhoto = {
      photo_url: postPhotoUrl.trim(),
      caption: postText.trim() || `${formData.name || 'Resort'} update`,
      category: postCategory,
      created_at: new Date().toISOString(),
    };

    const newImages = [newPost, ...images];
    setImages(newImages);
    setPostText('');
    setPostPhotoUrl('');
    setShowCreatePostModal(false);

    await saveBeachData({}, newImages);
  };

  // Handle Delete Post
  const handleDeletePost = async (indexToDelete: number) => {
    const updated = images.filter((_, idx) => idx !== indexToDelete);
    setImages(updated);
    await saveBeachData({}, updated);
  };

  // Handle Edit Cottage
  const handleEditCottage = (cottage: BeachPhoto) => {
    setEditingCottage(cottage);
    setCottagePhotoUrl(cottage.photo_url || '');
    setCottageDescription(cottage.description || '');
    setCottagePrice(cottage.price || '');
    setShowCottageEditModal(true);
  };

  // Handle Save Cottage
  const handleSaveCottage = async () => {
    if (editingCottage) {
      // Edit existing cottage
      const updatedImages = images.map((img) => {
        if (img === editingCottage) {
          return {
            ...img,
            photo_url: cottagePhotoUrl,
            description: cottageDescription,
            price: cottagePrice,
          };
        }
        return img;
      });
      setImages(updatedImages);
      await saveBeachData({}, updatedImages);
    } else {
      // Add new cottage
      const newCottage: BeachPhoto = {
        photo_url: cottagePhotoUrl,
        caption: cottageDescription || 'Cottage',
        description: cottageDescription,
        price: cottagePrice,
        category: 'Cottages',
        created_at: new Date().toISOString(),
      };
      const newImages = [newCottage, ...images];
      setImages(newImages);
      await saveBeachData({}, newImages);
    }

    setShowCottageEditModal(false);
    setEditingCottage(null);
    setCottagePhotoUrl('');
    setCottageDescription('');
    setCottagePrice('');
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0866FF]" />
        <p className="text-xs font-semibold">Loading Facebook Page in Meta Business Suite...</p>
      </div>
    );
  }

  const filteredPhotos =
    photoFilter === 'All'
      ? images
      : images.filter((img) => img.category.toLowerCase() === photoFilter.toLowerCase());

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            Dagat Ta Bai
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {beachSlug && (
              <Link
                href={`/beaches/${beachSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View as Visitor</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Save / Error Feedback Alert */}
      {savedMessage && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{savedMessage}</span>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Section (Split Layout) */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Beach Info */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Link href="/owner/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </Link>
              {availableBeaches.length > 1 && (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Switch Beach:</span>
                  <select
                    value={beachId || ''}
                    onChange={(e) => {
                      const selected = availableBeaches.find((b) => b.id === e.target.value);
                      if (selected) handleSelectBeach(selected);
                    }}
                    aria-label="Switch managed beach"
                    className="text-xs font-bold text-gray-900 dark:text-white bg-transparent outline-none cursor-pointer"
                  >
                    {availableBeaches.map((b) => (
                      <option key={b.id} value={b.id} className="text-gray-900 bg-white dark:bg-gray-800 dark:text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{formData.location}</p>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{formData.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{formData.description}</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Create New Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConvertedPhotoUrl('');
                    setShowConverterModal(true);
                  }}
                  className="px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold transition-colors border border-blue-200 dark:border-blue-800/60 flex items-center gap-2 shadow-sm"
                  title="Upload photo from Downloads and convert to URL"
                >
                  <Upload size={17} />
                  <span>Upload Photo &amp; Get URL</span>
                </button>
                {formData.virtual_tour_url ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTourPreviewModal(true)}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Compass size={18} />
                      <span>Explore 360° Tour</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempTourInput(formData.virtual_tour_url);
                        setShowTourModal(true);
                      }}
                      className="px-3.5 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-1.5"
                      title="Edit 360° Tour Link or Embed"
                    >
                      <Edit size={16} />
                      <span className="text-xs">Edit Tour</span>
                    </button>
                  </div>
                ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempTourInput('');
                        setShowTourModal(true);
                      }}
                      className="px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-lg text-sm font-medium transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-2"
                    >
                      <Compass size={18} />
                      <span>Set Up 360° Tour</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-2 shadow-sm"
                    title="Change beach latitude, longitude, and map pin location"
                  >
                    <MapPin size={17} className="text-blue-600" />
                    <span>Change Coordinates &amp; Pin</span>
                  </button>
                </div>
            </div>
          </div>

          {/* Right: Cover Image */}
          <div className="relative h-64 lg:h-96 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800">
            {formData.cover_image ? (
              <Image
                src={formData.cover_image}
                alt="Cover Photo"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon size={48} />
              </div>
            )}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => directCoverInputRef.current?.click()}
                disabled={uploadingCover}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                title="Choose photo from Downloads and set as cover immediately"
              >
                {uploadingCover ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Upload from Downloads</span>
                  </>
                )}
              </button>
              <input
                ref={directCoverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await handleUploadPhoto(file, 'cover');
                    if (url) {
                      setFormData((prev) => ({ ...prev, cover_image: url }));
                      await saveBeachData({ cover_image: url });
                      showToast('Cover photo uploaded & updated successfully!');
                    }
                  }
                  if (e.target) e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setTempCoverInput(formData.cover_image);
                  setShowCoverModal(true);
                }}
                className="px-3 py-2 bg-white/95 dark:bg-gray-900/95 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold hover:bg-white dark:hover:bg-gray-900 transition-colors shadow-md flex items-center gap-1.5"
              >
                <Camera size={14} />
                <span>Options / URL</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Facts Strip */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <div className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">4.6</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">(128 reviews)</p>
            </div>
          </div>
          <div className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Entrance Fee</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
              <span className="font-semibold text-gray-900 dark:text-white text-xs">Adults</span>
              <span className="text-gray-600 dark:text-gray-400 text-right text-xs font-variant-numeric tabular-nums">₱{formData.entrance_fee_adults || 'Not set'}</span>
              <span className="font-semibold text-gray-900 dark:text-white text-xs">Children</span>
              <span className="text-gray-600 dark:text-gray-400 text-right text-xs font-variant-numeric tabular-nums">₱{formData.entrance_fee_children || 'Not set'}</span>
            </div>
          </div>
          <div className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Opening Hours</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
              {(() => {
                const hours = formData.opening_hours || {};
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                
                const groups: { time: string; days: string[] }[] = [];
                let currentGroup: { time: string; days: string[] } | null = null;
                
                days.forEach(day => {
                  const time = hours[day] || 'Not set';
                  if (!currentGroup || currentGroup.time !== time) {
                    if (currentGroup) groups.push(currentGroup);
                    currentGroup = { time, days: [day] };
                  } else {
                    currentGroup.days.push(day);
                  }
                });
                if (currentGroup) groups.push(currentGroup);
                
                const validGroups = groups.filter(g => g.time !== 'Not set');
                
                if (validGroups.length === 0) return <p className="text-xs text-gray-900 dark:text-white col-span-2">Not set</p>;
                
                return validGroups.map((group, index) => {
                  const dayRange = group.days.length === 1 
                    ? group.days[0] 
                    : `${group.days[0]} - ${group.days[group.days.length - 1]}`;
                  return (
                    <React.Fragment key={`${dayRange}-${group.time}-${index}`}>
                      <span className="font-semibold text-gray-900 dark:text-white text-xs">{dayRange}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-right text-xs font-variant-numeric tabular-nums">{group.time}</span>
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          </div>
          <div className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Map Location & Coordinates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Edit size={12} />
                  <span>Edit Pin</span>
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white break-words mb-2">
                {formData.location || 'No address specified'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 text-[11px] font-mono text-gray-700 dark:text-gray-300">
                <Crosshair size={12} className="text-blue-600" />
                <span>{formData.latitude}° N, {formData.longitude}° E</span>
              </div>
            </div>
            <div className="pt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <MapPin size={13} />
                <span>Set Coordinates</span>
              </button>
              <Link 
                href={`/map?beach=${beachSlug || beachId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>View on Map</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation (Pill Style with Icons) */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Home size={16} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'location'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <MapPin size={16} />
            <span>Map &amp; Coordinates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cottages')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'cottages'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Home size={16} />
            <span>Cottages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'facilities'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Grid size={16} />
            <span>Facilities</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'activities'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Waves size={16} />
            <span>Activities</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Do's & Don'ts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'reviews'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Star size={16} />
            <span>Reviews</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'posts'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <MessageCircle size={16} />
            <span>Posts</span>
          </button>
        </div>
      </div>

      {/* Main Content Area (Two-Column Layout) */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Overview Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Overview</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('general')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-gray-200 rounded-full bg-white hover:bg-gray-50"
                    >
                      <Edit size={13} />
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-32 flex items-center justify-center text-gray-400">
                        <ImageIcon size={22} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-12 flex items-center justify-center text-gray-400">
                            <ImageIcon size={16} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beach Location & Coordinates Overview Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Beach Location &amp; Map Coordinates</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Position where guests locate your beach on the live map</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                      >
                        <Crosshair size={13} />
                        <span>Change Coordinates / Pin</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Address</span>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{formData.location || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Latitude</span>
                      <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{formData.latitude}° N</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Longitude</span>
                      <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{formData.longitude}° E</p>
                    </div>
                  </div>
                  <div className="mt-3.5 flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('location')}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open coordinates editor</span>
                      <ChevronRight size={14} />
                    </button>
                    <Link
                      href={`/map?beach=${beachSlug || beachId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 inline-flex items-center gap-1 text-xs"
                    >
                      <span>Preview live on map</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                {/* What's Available Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">What's available here?</h2>
                    <button className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600">
                      Manage <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('cottages')}
                      className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center gap-3 hover:border-blue-600 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Home size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Cottages</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Types · Capacity · Rates</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('facilities')}
                      className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center gap-3 hover:border-blue-600 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Grid size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Facilities</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">What you can use</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('activities')}
                      className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center gap-3 hover:border-blue-600 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Waves size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Activities</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Things to do</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center gap-3 hover:border-blue-600 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Check size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Food & Drinks</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Available options</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Posts Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Posts</h2>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                      {formData.profile_image && (
                        <Image
                          src={formData.profile_image}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreatePostModal(true)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 text-left px-4 py-2.5 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      What's new at {formData.name || 'your resort'}?
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreatePostModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-gray-200 rounded-full bg-white hover:bg-gray-50"
                    >
                      <ImageIcon size={13} />
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreatePostModal(true)}
                      className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                  {images.length === 0 ? (
                    <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-400 text-sm">
                      No posts yet. Create your first post!
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {images.map((post, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                                {formData.profile_image && (
                                  <Image
                                    src={formData.profile_image}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-gray-900 dark:text-white">{formData.name}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeletePost(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {post.caption && (
                            <div className="px-4 pb-2">
                              <p className="text-xs text-gray-700 dark:text-gray-300">{post.caption}</p>
                            </div>
                          )}
                          {post.photo_url && (
                            <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800">
                              <Image
                                src={post.photo_url}
                                alt={post.caption}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guest Reviews Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Guest Reviews</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600"
                    >
                      View all reviews <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-yellow-500">★</span>
                    <span className="font-bold text-gray-900 dark:text-white">4.6</span>
                    <span className="text-gray-500 dark:text-gray-400">(128 reviews)</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {['All', '5★', '4★', '3★', '2★', '1★', '📷 With Photos'].map((filter) => (
                      <button
                        key={filter}
                        className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">User {i}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">2 days ago</p>
                          </div>
                        </div>
                        <div className="text-yellow-500 mb-1">★★★★★</div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">Clean area and relaxing place. The cottage was spacious enough for our group.</p>
                        <div className="flex gap-1 mb-2">
                          <div className="w-10 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="w-10 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="w-10 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400">
                          <span>👍 12</span>
                          <button className="text-blue-600 font-semibold">Reply</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Location & Map Coordinates Tab Content */}
            {activeTab === 'location' && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <MapPin className="text-blue-600" size={22} />
                      <span>Beach Map Coordinates &amp; Pin</span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Change the latitude and longitude of your beach so guests can locate you on the interactive map.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Crosshair size={14} />
                      <span>Open Map Picker</span>
                    </button>
                    <Link
                      href={`/map?beach=${beachSlug || beachId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1"
                    >
                      <span>Public Map</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                {/* Direct Numeric Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Latitude (°N)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="e.g. 10.634800"
                        className="w-full pl-3.5 pr-12 py-2.5 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                        °N
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Example: 10.634800 (Binongkalan, Catmon)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Longitude (°E)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="e.g. 124.027500"
                        className="w-full pl-3.5 pr-12 py-2.5 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                        °E
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Example: 124.027500 (Catmon Coast)</p>
                  </div>
                </div>

                {/* Location Address input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Beach Location Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Binongkalan, Catmon, Cebu, Philippines"
                      className="flex-1 px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleGeocode}
                      disabled={geocoding}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      {geocoding ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      <span>Lookup Coordinates</span>
                    </button>
                  </div>
                </div>

                {/* GPS and Quick Helper tools */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Auto-Positioning Tools
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          showToast('Geolocation is not supported by your browser.', 'error');
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setFormData({
                              ...formData,
                              latitude: pos.coords.latitude.toFixed(6),
                              longitude: pos.coords.longitude.toFixed(6),
                            });
                            showToast('🎯 GPS coordinates captured from your current device!');
                          },
                          (err) => {
                            showToast(`GPS Error: ${err.message}`, 'error');
                          },
                          { enableHighAccuracy: true }
                        );
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Crosshair size={13} />
                      <span>🎯 Use My Current GPS Location</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, latitude: '10.634800', longitude: '124.027500' });
                        showToast('Coordinates set to Binongkalan Center');
                      }}
                      className="px-3 py-1.5 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                    >
                      Binongkalan Center (10.6348, 124.0275)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, latitude: '10.642500', longitude: '124.030200' });
                        showToast('Coordinates set to North Shoreline (LiteBay)');
                      }}
                      className="px-3 py-1.5 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                    >
                      North Shoreline (10.6425, 124.0302)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, latitude: '10.638800', longitude: '124.029200' });
                        showToast('Coordinates set to Hinagdan Point');
                      }}
                      className="px-3 py-1.5 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                    >
                      Hinagdan Point (10.6388, 124.0292)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, latitude: '10.646800', longitude: '124.031500' });
                        showToast('Coordinates set to Majestique Cove');
                      }}
                      className="px-3 py-1.5 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                    >
                      Majestique Cove (10.6468, 124.0315)
                    </button>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin size={15} className="text-blue-600" />
                    <span>Visual Map Pin Picker</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      const lat = parseFloat(formData.latitude);
                      const lng = parseFloat(formData.longitude);
                      if (isNaN(lat) || lat < -90 || lat > 90) {
                        showToast('Please enter a valid Latitude between -90 and 90.', 'error');
                        return;
                      }
                      if (isNaN(lng) || lng < -180 || lng > 180) {
                        showToast('Please enter a valid Longitude between -180 and 180.', 'error');
                        return;
                      }
                      await saveBeachData({
                        location: formData.location,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                      });
                      showToast('Beach coordinates & location saved to database!');
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save Coordinates to Database</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cottages Tab Content */}
            {activeTab === 'cottages' && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cottages</h2>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images
                      .filter((img) => img.category === 'Cottages')
                      .map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleEditCottage(img)}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-blue-600 transition-colors"
                        >
                          <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                            <Image
                              src={img.photo_url}
                              alt={img.caption}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const originalIndex = images.indexOf(img);
                                  handleDeletePost(originalIndex);
                                }}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                              {img.price || 'No price set'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {img.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  {images.filter((img) => img.category === 'Cottages').length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No cottage pictures added yet.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCottage(null);
                    setCottagePhotoUrl('');
                    setCottageDescription('');
                    setCottagePrice('');
                    setShowCottageEditModal(true);
                  }}
                  className="absolute bottom-6 right-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg"
                >
                  <Plus size={14} />
                  Add Cottage
                </button>
              </div>
            )}

            {/* Facilities Tab Content */}
            {activeTab === 'facilities' && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Facilities</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage available facilities and amenities.</p>
              </div>
            )}

            {/* Activities Tab Content */}
            {activeTab === 'activities' && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Activities</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage available activities for guests.</p>
              </div>
            )}

            {/* Rules Tab Content */}
            {activeTab === 'rules' && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Do's & Don'ts</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage beach rules and regulations.</p>
              </div>
            )}

            {/* Reviews Tab Content */}
            {activeTab === 'reviews' && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reviews</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">View and manage guest reviews.</p>
              </div>
            )}

            {/* Posts Tab Content */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {/* Create Post Composer */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                      {formData.profile_image && (
                        <Image
                          src={formData.profile_image}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreatePostModal(true)}
                      className="flex-1 bg-white dark:bg-gray-700 text-left px-4 py-2.5 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      What's new at {formData.name || 'your resort'}?
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreatePostModal(true)}
                      className="flex-1 py-2 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ImageIcon size={16} />
                      <span>Photo</span>
                    </button>
                  </div>
                </div>

                {/* Posts Feed */}
                {images.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-500 dark:text-gray-400">No posts yet. Create your first post!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {images.map((post, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                              {formData.profile_image && (
                                <Image
                                  src={formData.profile_image}
                                  alt="Profile"
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900 dark:text-white">{formData.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(idx)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {post.caption && (
                          <div className="px-4 pb-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{post.caption}</p>
                          </div>
                        )}
                        {post.photo_url && (
                          <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800">
                            <Image
                              src={post.photo_url}
                              alt={post.caption}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (1/3) - Sidebar */}
          <div className="space-y-6">
            {/* General Information Card */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="mb-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {focusedSection === 'entrance-fee' ? 'Edit Entrance Fee' : 'General Information'}
                </h2>
                {focusedSection && (
                  <button
                    type="button"
                    onClick={() => setFocusedSection(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Show All
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {focusedSection === 'entrance-fee' ? (
                  <>
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Entrance Fee (Adults)
                      </label>
                      <input
                        type="text"
                        value={formData.entrance_fee_adults || ''}
                        onChange={(e) => setFormData({ ...formData, entrance_fee_adults: e.target.value })}
                        placeholder="e.g., ₱50"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Entrance Fee (Children)
                      </label>
                      <input
                        type="text"
                        value={formData.entrance_fee_children || ''}
                        onChange={(e) => setFormData({ ...formData, entrance_fee_children: e.target.value })}
                        placeholder="e.g., ₱30"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Opening Hours
                      </label>
                      <div className="space-y-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12">{day}</span>
                            <input
                              type="text"
                              value={formData.opening_hours?.[day] || ''}
                              onChange={(e) => setFormData({ ...formData, opening_hours: { ...formData.opening_hours, [day]: e.target.value } })}
                              placeholder="e.g., 8:00 AM - 6:00 PM"
                              className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Entrance Fee (Adults)
                      </label>
                      <input
                        type="text"
                        value={formData.entrance_fee_adults || ''}
                        onChange={(e) => setFormData({ ...formData, entrance_fee_adults: e.target.value })}
                        placeholder="e.g., ₱50"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Entrance Fee (Children)
                      </label>
                      <input
                        type="text"
                        value={formData.entrance_fee_children || ''}
                        onChange={(e) => setFormData({ ...formData, entrance_fee_children: e.target.value })}
                        placeholder="e.g., ₱30"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Location & Map Coordinates
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowLocationModal(true)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <MapPin size={12} />
                          <span>Interactive Map</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Enter location address"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            Latitude (°N)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            placeholder="10.6348"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            Longitude (°E)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            placeholder="124.0275"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className="mt-2 w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <MapPin size={13} className="text-blue-600" />
                        <span>Pick Pin on Interactive Map</span>
                      </button>
                    </div>
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={formData.contact_phone || ''}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="Enter contact phone"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => saveBeachData({ ...formData })}
                className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>

            {/* 360° Virtual Tour Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">360° Virtual Tour</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempTourInput(formData.virtual_tour_url || '');
                    setShowTourModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit size={12} />
                  {formData.virtual_tour_url ? 'Edit' : 'Configure'}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                {formData.virtual_tour_url
                  ? 'Your interactive 360° tour is configured and live on your public beach page.'
                  : 'Add an interactive 360° tour so visitors can explore your beach resort online.'}
              </p>
              {formData.virtual_tour_url ? (
                <button
                  type="button"
                  onClick={() => setShowTourPreviewModal(true)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Compass size={14} />
                  Preview 360° Tour
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempTourInput('');
                    setShowTourModal(true);
                  }}
                  className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Compass size={14} />
                  Add Embed Code / URL
                </button>
              )}
            </div>

            {/* Cottage Rates Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cottage Rates</h2>
                <button
                  type="button"
                  onClick={() => {
                    setCottagePrice('');
                    setCottageDescription('');
                    setCottageImage('');
                    setShowCottageRatesModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-gray-200 rounded-full bg-white hover:bg-gray-50"
                >
                  <Edit size={13} />
                  Edit
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">₱{formData.cottage_fee || '500'}+</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 mb-3">Rates vary depending on cottage type and availability.</p>
              <button
                type="button"
                onClick={() => setActiveTab('cottages')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View Cottage Details →
              </button>
            </div>

            {/* Entrance Fee Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Entrance Fee</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-gray-200 rounded-full bg-white hover:bg-gray-50"
                >
                  <Edit size={13} />
                  Edit
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Adults</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{formData.entrance_fee_adults || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Children</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{formData.entrance_fee_children || 'Not set'}</span>
                </div>
              </div>
            </div>

            {/* Profile Picture Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="flex justify-start mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Picture</h2>
              </div>
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 mx-auto mb-4">
                {formData.profile_image ? (
                  <Image
                    src={formData.profile_image}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempProfileInput(formData.profile_image);
                  setShowProfileModal(true);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors"
              >
                Change Profile Picture
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Stats</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Published Photos</span>
                  <span className="font-bold text-gray-900 dark:text-white">{images.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className="font-bold text-green-600 dark:text-green-400">Published</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Post</h3>
              <button
                type="button"
                onClick={() => setShowCreatePostModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePublishPost} className="px-6 pb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                  {formData.profile_image && (
                    <Image
                      src={formData.profile_image}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{formData.name}</p>
              </div>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white resize-none"
              />
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Post Photo (Upload from Downloads or enter URL)
                </label>
                <div
                  onClick={() => !uploadingPostPhoto && postFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all mb-2 ${
                    uploadingPostPhoto
                      ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 cursor-wait'
                      : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60'
                  }`}
                >
                  <input
                    ref={postFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleUploadPhoto(file, 'post');
                        if (url) {
                          setPostPhotoUrl(url);
                        }
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />
                  {uploadingPostPhoto ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Uploading from Downloads &amp; converting to URL...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Choose photo from Downloads
                      </span>
                    </div>
                  )}
                </div>

                {postPhotoUrl && (
                  <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                      <Image
                        src={postPhotoUrl}
                        alt="Post Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Photo Ready (Converted to URL)
                      </span>
                      <p className="text-[11px] font-mono text-gray-500 truncate">{postPhotoUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPostPhotoUrl('')}
                      className="text-gray-400 hover:text-red-500 text-xs px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <input
                  type="url"
                  value={postPhotoUrl}
                  onChange={(e) => setPostPhotoUrl(e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                >
                  <option value="Shoreline">Shoreline</option>
                  <option value="Cottages">Cottages</option>
                  <option value="Sunset">Sunset</option>
                  <option value="Drone">Drone</option>
                  <option value="Amenities">Amenities</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cover Photo Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Cover Photo</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Upload from your computer or paste a URL</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pb-6 pt-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Option 1: Direct File Upload from Device / Downloads */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  1. Upload from Device (Downloads, Pictures, Files)
                </label>
                <div
                  onClick={() => !uploadingCover && coverFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    uploadingCover
                      ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 cursor-wait'
                      : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/70'
                  }`}
                >
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleUploadPhoto(file, 'cover');
                        if (url) {
                          setTempCoverInput(url);
                        }
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />
                  {uploadingCover ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Uploading from your device &amp; converting to URL...
                      </p>
                      <p className="text-[11px] text-gray-400">Please wait a moment</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Click to choose photo from Downloads
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Uploads file &amp; automatically converts it to a cloud URL
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Preview / Converted URL badge */}
              {tempCoverInput && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Photo Ready (Converted to URL)
                    </span>
                    <button
                      type="button"
                      onClick={() => setTempCoverInput('')}
                      className="text-gray-400 hover:text-red-500 text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 h-36">
                    <Image
                      src={tempCoverInput}
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Option 2: Direct URL Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  2. Converted / Direct Image URL
                </label>
                <input
                  type="url"
                  value={tempCoverInput}
                  onChange={(e) => setTempCoverInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
              </div>

              {/* Option 3: Presets */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Or Select a Preset Cover:</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setTempCoverInput(preset.url);
                      }}
                      className="text-left px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 truncate"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={uploadingCover || !tempCoverInput}
                onClick={() => {
                  saveBeachData({ cover_image: tempCoverInput });
                  setShowCoverModal(false);
                  showToast('Cover photo updated successfully.');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
              >
                Save Cover Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Profile Picture</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Upload your resort crest/logo or choose preset</p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormData({ ...formData, profile_image: tempProfileInput });
                setShowProfileModal(false);
                saveBeachData({ ...formData, profile_image: tempProfileInput });
                showToast('Profile picture updated successfully.');
              }}
              className="px-6 pb-6 pt-4 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Upload from device */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Upload Logo / Picture from Device
                </label>
                <div
                  onClick={() => !uploadingProfile && profileFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    uploadingProfile
                      ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 cursor-wait'
                      : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60'
                  }`}
                >
                  <input
                    ref={profileFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleUploadPhoto(file, 'profile');
                        if (url) {
                          setTempProfileInput(url);
                        }
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />
                  {uploadingProfile ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Uploading &amp; converting photo...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Choose photo from Downloads or Device
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {tempProfileInput && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                    <Image
                      src={tempProfileInput}
                      alt="Profile Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                      ✓ Converted to URL
                    </span>
                    <p className="text-[11px] font-mono text-gray-500 truncate">{tempProfileInput}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Or Paste Profile Picture URL
                </label>
                <input
                  type="url"
                  value={tempProfileInput}
                  onChange={(e) => setTempProfileInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PRESET_PROFILES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setTempProfileInput(preset.url)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors relative ${
                      tempProfileInput === preset.url
                        ? 'border-blue-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={preset.url}
                      alt={preset.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={uploadingProfile || !tempProfileInput}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
              >
                Save Profile Picture
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cottage Edit Modal */}
      {showCottageEditModal && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowCottageEditModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCottage ? 'Edit Cottage' : 'Add Cottage'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCottageEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveCottage();
              }}
              className="px-6 py-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Cottage Photo (Upload from Downloads or enter URL)
                </label>
                <div
                  onClick={() => !uploadingCottagePhoto && cottageEditFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all mb-2 ${
                    uploadingCottagePhoto
                      ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 cursor-wait'
                      : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60'
                  }`}
                >
                  <input
                    ref={cottageEditFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleUploadPhoto(file, 'cottage');
                        if (url) {
                          setCottagePhotoUrl(url);
                        }
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />
                  {uploadingCottagePhoto ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Uploading from Downloads &amp; converting to URL...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Choose photo from Downloads
                      </span>
                    </div>
                  )}
                </div>

                {cottagePhotoUrl && (
                  <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                      <Image
                        src={cottagePhotoUrl}
                        alt="Cottage Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Photo Ready (Converted to URL)
                      </span>
                      <p className="text-[11px] font-mono text-gray-500 truncate">{cottagePhotoUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCottagePhotoUrl('')}
                      className="text-gray-400 hover:text-red-500 text-xs px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={cottagePhotoUrl}
                  onChange={(e) => setCottagePhotoUrl(e.target.value)}
                  placeholder="Or paste cottage image URL (https://...)"
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={cottageDescription}
                  onChange={(e) => setCottageDescription(e.target.value)}
                  placeholder="Describe the cottage (capacity, amenities, etc.)"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  value={cottagePrice}
                  onChange={(e) => setCottagePrice(e.target.value)}
                  placeholder="e.g., ₱500/day"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCottageEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCottage ? 'Save Changes' : 'Add Cottage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cottage Rates Modal */}
      {showCottageRatesModal && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowCottageRatesModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Cottage Rates</h3>
              <button
                type="button"
                onClick={() => setShowCottageRatesModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormData({ ...formData, cottage_fee: cottagePrice });
                  setShowCottageRatesModal(false);
                  saveBeachData({ ...formData, cottage_fee: cottagePrice });
                  showToast('Cottage rates updated successfully.');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Cottage Price
                  </label>
                  <input
                    type="text"
                    value={cottagePrice}
                    onChange={(e) => setCottagePrice(e.target.value)}
                    placeholder="e.g., ₱500"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={cottageDescription}
                    onChange={(e) => setCottageDescription(e.target.value)}
                    placeholder="Describe your cottage types, capacity, and rates..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Cottage Picture
                  </label>
                  <div
                    onClick={() => !uploadingCottageRate && cottageRateFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      uploadingCottageRate
                        ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 cursor-wait'
                        : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60'
                    }`}
                  >
                    <input
                      ref={cottageRateFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleUploadPhoto(file, 'cottageRate');
                          if (url) {
                            setCottageImage(url);
                          }
                        }
                        if (e.target) e.target.value = '';
                      }}
                    />
                    {uploadingCottageRate ? (
                      <div className="flex items-center justify-center gap-2 py-1">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          Uploading from Downloads &amp; converting to URL...
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-1">
                        <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Choose cottage photo from Downloads
                        </span>
                      </div>
                    )}
                  </div>
                  {cottageImage && (
                    <div className="mt-3 relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <Image
                        src={cottageImage}
                        alt="Cottage Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="px-6 pb-6 pt-0 flex flex-col gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    if (cottageImage) {
                      const newCottageImage: BeachPhoto = {
                        photo_url: cottageImage,
                        caption: 'Cottage Photo',
                        category: 'Cottages',
                        created_at: new Date().toISOString(),
                        price: cottagePrice,
                        description: cottageDescription,
                      };
                      const newImages = [newCottageImage, ...images];
                      console.log('Saving with new image:', newImages.length);
                      setImages(newImages);
                      await saveBeachData({}, newImages);
                    } else if (editingCottageIndex !== null) {
                      const updatedImages = [...images];
                      updatedImages[editingCottageIndex] = {
                        ...updatedImages[editingCottageIndex],
                        price: cottagePrice,
                        description: cottageDescription,
                      };
                      console.log('Updating existing cottage:', editingCottageIndex);
                      setImages(updatedImages);
                      await saveBeachData({}, updatedImages);
                    } else {
                      console.log('Updating cottage rates without image');
                      setFormData({ ...formData, cottage_fee: cottagePrice });
                      await saveBeachData({ ...formData, cottage_fee: cottagePrice }, images);
                    }
                    setShowCottageRatesModal(false);
                    setEditingCottageIndex(null);
                    setCottagePrice('');
                    setCottageDescription('');
                    setCottageImage('');
                    showToast('Cottage saved successfully.');
                  } catch (error) {
                    console.error('Error saving cottage:', error);
                    showToast('Failed to save cottage. Please try again.');
                  }
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setShowCottageRatesModal(false)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 360° Tour Configuration Modal */}
      {showTourModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">360° Virtual Tour Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTourModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Virtual Tour Link or &lt;iframe&gt; Embed Code
                </label>
                <textarea
                  rows={4}
                  value={tempTourInput}
                  onChange={(e) => setTempTourInput(e.target.value)}
                  placeholder={`Paste full iframe embed code or link here:\n<iframe src="https://kuula.co/share/..." width="100%" height="600"></iframe>\nOR\nhttps://momento360.com/e/u/...`}
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white leading-relaxed resize-none"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                  Supports Google Maps Photosphere, Kuula, Momento360, Matterport, Pannellum, or direct iframe embed codes.
                </p>
              </div>

              {/* Detected URL Preview */}
              {tempTourInput.trim() && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50 text-xs">
                  <span className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">
                    Detected Embed Source:
                  </span>
                  <p className="font-mono text-[11px] text-blue-700 dark:text-blue-300 break-all">
                    {extractTourEmbedUrl(tempTourInput) || 'Invalid embed code or URL'}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {formData.virtual_tour_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, virtual_tour_url: '' }));
                      saveBeachData({ virtual_tour_url: '' });
                      setShowTourModal(false);
                      showToast('360° Virtual Tour removed.');
                    }}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-200"
                  >
                    Remove Tour
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTourModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanUrl = extractTourEmbedUrl(tempTourInput) || tempTourInput.trim();
                    setFormData((prev) => ({ ...prev, virtual_tour_url: cleanUrl }));
                    saveBeachData({ virtual_tour_url: cleanUrl });
                    setShowTourModal(false);
                    showToast('360° Virtual Tour saved successfully.');
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Save Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Photo to URL Converter Modal */}
      {showConverterModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Photo to URL Converter
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload any photo from Downloads or device to convert it to a cloud URL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConverterModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Dropzone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Photo from Device
                </label>
                <div
                  onClick={() => !uploadingConverter && converterFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    uploadingConverter
                      ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 cursor-wait'
                      : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/70'
                  }`}
                >
                  <input
                    ref={converterFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleUploadPhoto(file, 'converter');
                        if (url) {
                          setConvertedPhotoUrl(url);
                        }
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />
                  {uploadingConverter ? (
                    <div className="flex flex-col items-center justify-center py-3 space-y-2">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Uploading from Downloads &amp; converting to URL...
                      </p>
                      <p className="text-xs text-gray-400">Please wait a moment</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Click to choose photo from Downloads
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG, WebP, GIF, or AVIF (up to 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Converted Result */}
              {convertedPhotoUrl && (
                <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={15} />
                      Photo Successfully Converted to Cloud URL!
                    </span>
                    <button
                      type="button"
                      onClick={() => setConvertedPhotoUrl('')}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 h-48">
                    <Image
                      src={convertedPhotoUrl}
                      alt="Converted Photo Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Cloud Public URL (Copy or Use Anywhere)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={convertedPhotoUrl}
                        className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white select-all"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(convertedPhotoUrl);
                            setCopiedUrl(true);
                            showToast('URL copied to clipboard!');
                            setTimeout(() => setCopiedUrl(false), 2000);
                          } catch {
                            showToast('Failed to copy to clipboard', 'error');
                          }
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {copiedUrl ? (
                          <>
                            <Check size={14} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick-Apply Actions */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Quick Apply Options:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setFormData((prev) => ({ ...prev, cover_image: convertedPhotoUrl }));
                          await saveBeachData({ cover_image: convertedPhotoUrl });
                          showToast('Updated Cover Photo with this image!');
                          setShowConverterModal(false);
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors"
                      >
                        Set as Cover Photo
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setFormData((prev) => ({ ...prev, profile_image: convertedPhotoUrl }));
                          await saveBeachData({ profile_image: convertedPhotoUrl });
                          showToast('Updated Profile Picture with this image!');
                          setShowConverterModal(false);
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors"
                      >
                        Set as Profile Picture
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const newPhoto: BeachPhoto = {
                            photo_url: convertedPhotoUrl,
                            caption: 'Beach Photo',
                            category: 'Shoreline',
                            created_at: new Date().toISOString(),
                          };
                          const newImages = [newPhoto, ...images];
                          setImages(newImages);
                          await saveBeachData({}, newImages);
                          showToast('Added photo to Beach Gallery!');
                          setShowConverterModal(false);
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors"
                      >
                        Add to Gallery
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConvertedPhotoUrl('');
                          converterFileInputRef.current?.click();
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Convert Another Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 360° Virtual Tour Preview Modal */}
      <VirtualTourModal
        isOpen={showTourPreviewModal}
        onClose={() => setShowTourPreviewModal(false)}
        tourUrl={formData.virtual_tour_url}
        beachName={formData.name || 'Your Beach'}
      />

      {/* Map Location & Coordinates Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        beachName={formData.name}
        location={formData.location}
        latitude={formData.latitude}
        longitude={formData.longitude}
        publicMapSlug={beachSlug || beachId || undefined}
        onSave={async (coords) => {
          setFormData((prev) => ({
            ...prev,
            location: coords.location,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }));
          await saveBeachData({
            location: coords.location,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        }}
      />
    </div>
  );
}
