'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MapPin,
  ChevronDown,
  Clock,
  Share2,
  XCircle,
  X,
} from 'lucide-react';
import type { BeachRecord, BeachPhoto, FacilityRate } from '@/lib/db/beaches';
import { LocationPickerModal } from '@/components/map/location-picker-modal';
import { VirtualTourModal } from '@/components/virtual-tour-modal';
import { PhotoViewerModal, type CottagePhoto } from '@/components/cottages/cottage-photos-modal';
import { CottageCard } from '@/components/cottages/cottage-card';
import { FacilityCard, type FacilityCardPhoto } from '@/components/FacilityCard';
import { FACILITY_CATEGORY_CONFIG, type FacilityCategory, getFacilityCategoryLabel } from '@/lib/utils/facility-categories';
import { getFacilityFeeItems } from '@/lib/utils/facility-pricing';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';
import { MAX_BEACH_IMAGE_SIZE_BYTES, removeBeachImageByPath, uploadBeachImage, uploadBeachImageWithPath } from '@/lib/utils/beach-image-upload';
import { generateUUID } from '@/lib/utils/uuid';

interface CottageItem {
  id: string;
  name: string;
  price: string;
  capacity: string;
  description: string;
  image_url: string;
  photos: CottagePhoto[];
}

interface CottagePhotoDraft extends CottagePhoto {
  localId: string;
  previewUrl?: string;
  file?: File;
  error?: string;
  progress: number;
  status: 'uploading' | 'saved' | 'error';
}

interface FacilityItem {
  id: string;
  title: string;
  category: FacilityCategory | string;
  price: string;
  description: string;
  image_url: string;
  rates: FacilityRate[];
  photos: FacilityCardPhoto[];
}

interface FacilityPhotoDraft extends FacilityCardPhoto {
  localId: string;
  previewUrl?: string;
  file?: File;
  error?: string;
  progress: number;
  status: 'uploading' | 'saved' | 'error';
}

interface FacilityRateDraft {
  localId: string;
  label: string;
  amount: string;
}

const FACILITY_RATE_OPTIONS = {
  comfort_room: [
    { key: 'ihi', label: 'Ihi' },
    { key: 'kalibang', label: 'Kalibang' },
    { key: 'kaligo', label: 'Kaligo' },
  ],
  parking: [
    { key: 'car', label: 'Car' },
    { key: 'motorcycle', label: 'Motorcycle' },
  ],
} as const;

function parseFacilityRateAmount(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === 'free') return null;
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmed)) return undefined;
  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? (amount === 0 ? null : amount) : undefined;
}

function formatFacilityRateInput(amount: number | null): string {
  return amount == null || amount === 0 ? 'Free' : String(amount);
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

interface ModalStatus {
  type: 'success' | 'error';
  message: string;
}

function ModalStatusBanner({ status }: { status: ModalStatus | null }) {
  if (!status) return null;

  const isSuccess = status.type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
      }`}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{status.message}</span>
    </div>
  );
}

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_IMAGE_SIZE_BYTES = MAX_BEACH_IMAGE_SIZE_BYTES;

export default function ManageInformationPage() {
  const [activeTab, setActiveTab] = useState<'basic' | 'cottages' | 'facilities' | 'hours' | 'photos' | 'dos' | 'tour'>('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setBeach] = useState<BeachRecord | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Floating Toast State (Centered, green for success, red for error/delete, 5s duration, NO "x")
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'delete'; message: string } | null>(null);

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
    latitude: '',
    longitude: '',
    cover_image: '',
    profile_image: '',
    virtual_tour_url: '',
    contact_phone: '', // 10 numeric digits after +63
    contact_email: '',
    facebook_url: '',
    instagram_url: '',
    peak_days: '',
    peak_hours: '',
    best_visiting_time: '',
    entrance_fee_adults: '',
    entrance_fee_children: '',
    entrance_fee_senior: '',
    cottage_fee: '',
    images: [] as Array<BeachPhoto | string>,
  });

  // Operating Hours State: day -> { isOpen: boolean, openTime: string, closeTime: string }
  const [schedule, setSchedule] = useState<Record<string, { isOpen: boolean; openTime: string; closeTime: string }>>({
    Mon: { isOpen: false, openTime: '', closeTime: '' },
    Tue: { isOpen: false, openTime: '', closeTime: '' },
    Wed: { isOpen: false, openTime: '', closeTime: '' },
    Thu: { isOpen: false, openTime: '', closeTime: '' },
    Fri: { isOpen: false, openTime: '', closeTime: '' },
    Sat: { isOpen: false, openTime: '', closeTime: '' },
    Sun: { isOpen: false, openTime: '', closeTime: '' },
  });

  // Cottages State
  const [cottages, setCottages] = useState<CottageItem[]>([]);

  // Facilities & Equipment State
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);

  // Facebook-Style Posts / Feed State
  const [resortPosts, setResortPosts] = useState<ResortPost[]>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);

  // Modals for adding cottage / facility
  const [showAddCottage, setShowAddCottage] = useState(false);
  const [editingCottageId, setEditingCottageId] = useState<string | null>(null);
  const [uploadingCottageImage, setUploadingCottageImage] = useState(false);
  const [createdCottageDuringUpload, setCreatedCottageDuringUpload] = useState(false);
  const [savingCottage, setSavingCottage] = useState(false);
  const [cottageModalStatus, setCottageModalStatus] = useState<ModalStatus | null>(null);
  const [cottageFieldErrors, setCottageFieldErrors] = useState<{ name?: string; price?: string }>({});
  const [cottagePhotos, setCottagePhotos] = useState<CottagePhotoDraft[]>([]);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [viewingCottagePhotos, setViewingCottagePhotos] = useState<CottageItem | null>(null);
  const [viewingFacility, setViewingFacility] = useState<FacilityItem | null>(null);
  const cottageStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cottageUploadAbortControllerRef = useRef<AbortController | null>(null);
  const cottageUploadCompletionRef = useRef<Promise<void> | null>(null);
  const cottageUploadCompletionResolveRef = useRef<(() => void) | null>(null);
  const cottageSessionPhotoIdsRef = useRef<Set<string>>(new Set());
  const cottageAllSessionPhotoIdsRef = useRef<Set<string>>(new Set());
  const cottageSessionStoragePathsRef = useRef<Map<string, string | null>>(new Map());
  const cottageStagedRemovalIdsRef = useRef<Set<string>>(new Set());
  const cottageEditorIdRef = useRef<string | null>(null);
  const createdCottageIdRef = useRef<string | null>(null);
  const cottageOriginalSnapshotRef = useRef<CottageItem | null>(null);
  const cottageNeedsLegacyRestoreRef = useRef(false);
  const requestCloseCottageEditorRef = useRef<() => void>(() => {});
  const cottageHasChangesRef = useRef(false);
  const cottageDiscardingRef = useRef(false);
  const [newCottage, setNewCottage] = useState<Partial<CottageItem>>({
    name: '',
    price: '',
    capacity: '',
    description: '',
    image_url: '',
  });

  const [showAddFacility, setShowAddFacility] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [facilityPhotos, setFacilityPhotos] = useState<FacilityPhotoDraft[]>([]);
  const [facilityModalStatus, setFacilityModalStatus] = useState<ModalStatus | null>(null);
  const [facilityFieldError, setFacilityFieldError] = useState('');
  const [facilityRateAmounts, setFacilityRateAmounts] = useState<Record<string, string>>({});
  const [customFacilityRates, setCustomFacilityRates] = useState<FacilityRateDraft[]>([]);
  const [facilityRateErrors, setFacilityRateErrors] = useState<Record<string, string>>({});
  const [uploadingFacilityPhotos, setUploadingFacilityPhotos] = useState(false);
  const [savingFacility, setSavingFacility] = useState(false);
  const [showDiscardFacilityConfirmation, setShowDiscardFacilityConfirmation] = useState(false);
  const facilityUploadAbortControllerRef = useRef<AbortController | null>(null);
  const facilityUploadCompletionRef = useRef<Promise<void> | null>(null);
  const facilityUploadCompletionResolveRef = useRef<(() => void) | null>(null);
  const facilitySessionPhotosRef = useRef<Map<string, string | null>>(new Map());
  const facilityStagedRemovalIdsRef = useRef<Set<string>>(new Set());
  const facilityOriginalSnapshotRef = useRef<FacilityItem | null>(null);
  const facilityCreatedIdRef = useRef<string | null>(null);
  const facilityHasChangesRef = useRef(false);
  const facilityDiscardingRef = useRef(false);
  const facilityCloseRef = useRef<() => void>(() => {});
  const [newFacility, setNewFacility] = useState<Partial<FacilityItem>>({
    title: '',
    category: 'parking',
    price: '',
    description: '',
    image_url: '',
  });

  // Do's & Don'ts Rules State
  const [rules, setRules] = useState<ResortRuleItem[]>([]);
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
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState('');
  const [isGalleryDragActive, setIsGalleryDragActive] = useState(false);

  useEffect(() => {
    if (!galleryPreview) return;
    return () => URL.revokeObjectURL(galleryPreview);
  }, [galleryPreview]);

  // 360 Virtual Tour Recapture Modal State
  const [showRecaptureModal, setShowRecaptureModal] = useState(false);
  const [recaptureReason, setRecaptureReason] = useState('New cottage/building added');
  const [recaptureNotes, setRecaptureNotes] = useState('');
  const [submittingRecapture, setSubmittingRecapture] = useState(false);
  const [showTourPreview, setShowTourPreview] = useState(false);

  // Photos Sub-Category: 'branding' | 'posts'
  const [photoSubTab, setPhotoSubTab] = useState<'branding' | 'posts'>('branding');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasMapPin = Boolean(getValidBeachCoordinates(formData.latitude, formData.longitude));
  const locationParts = formData.location.split(',').map((part) => part.trim()).filter(Boolean);
  const hasLocationAddressWarning = Boolean(
    formData.location.trim() &&
    (formData.location.trim().toLowerCase() === formData.name.trim().toLowerCase() ||
      locationParts.length < 3)
  );
  const validFacilities = facilities.filter((facility) => facility != null);

  // Load existing beach data
  useEffect(() => {
    fetch('/api/owner/beach', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then(async (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const b = data[0];
          setBeach(b);
          const catalogResponse = await fetch(
            `/api/owner/beach/catalog?beach_id=${encodeURIComponent(b.id)}`,
            { cache: 'no-store' }
          );
          const catalogData = await catalogResponse.json();
          if (!catalogResponse.ok) {
            throw new Error(catalogData.error || 'Failed to load cottages, facilities, and posts.');
          }
          setCottages(catalogData.items?.cottage || []);
          const facilityItems = catalogData.items?.facility;
          setFacilities(Array.isArray(facilityItems)
            ? facilityItems.filter((facility: unknown): facility is FacilityItem =>
                typeof facility === 'object'
                && facility !== null
                && 'id' in facility
                && typeof facility.id === 'string'
                && 'title' in facility
                && typeof facility.title === 'string'
              )
            : []);
          setResortPosts(catalogData.items?.post || []);

          let feeAdults = '';
          let feeChildren = '';
          let feeSenior = '';
          if (b.entrance_fee != null) {
            const parts = String(b.entrance_fee).split('|');
            feeAdults = (parts[0] || '').replace(/[^\d.]/g, '');
            feeChildren = (parts[1] || '').replace(/[^\d.]/g, '');
            feeSenior = (parts[2] || '').replace(/[^\d.]/g, '');
          }
          if (b.entrance_fee_adults != null) feeAdults = String(b.entrance_fee_adults);
          if (b.entrance_fee_children != null) feeChildren = String(b.entrance_fee_children);
          if (b.entrance_fee_senior != null) feeSenior = String(b.entrance_fee_senior);

          // Strip +63 or non-digits for phone
          let cleanPhone = b.contact_phone || '';
          cleanPhone = cleanPhone.replace(/^\+63\s*/, '').replace(/\D/g, '').slice(0, 10);

          setFormData({
            id: b.id || '',
            name: b.name || '',
            description: b.description || '',
            location: b.location || '',
            latitude: b.latitude != null ? String(b.latitude) : '',
            longitude: b.longitude != null ? String(b.longitude) : '',
            cover_image: b.cover_image || b.cover_image_url || '',
            profile_image: b.profile_image || b.profile_image_url || '',
            virtual_tour_url: b.virtual_tour_url || '',
            contact_phone: cleanPhone,
            contact_email: b.contact_email || '',
            facebook_url: b.facebook_url || '',
            instagram_url: b.instagram_url || '',
            peak_days: b.peak_days || '',
            peak_hours: b.peak_hours || '',
            best_visiting_time: b.best_visiting_time || '',
            entrance_fee_adults: feeAdults,
            entrance_fee_children: feeChildren,
            entrance_fee_senior: feeSenior,
            cottage_fee: b.cottage_fee || '',
            images: Array.isArray(b.images) ? b.images : [],
          });

          if (b.rules) {
            try {
              const parsedRules = typeof b.rules === 'string' ? JSON.parse(b.rules) : b.rules;
              setRules(Array.isArray(parsedRules) ? parsedRules : []);
            } catch (error) {
              console.error('Failed to load beach guidelines:', error);
              setRules([]);
            }
          } else {
            setRules([]);
          }

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
                    nextSched[day] = { isOpen: false, openTime: '', closeTime: '' };
                  } else {
                    const times = String(val).split('–').map((t) => t.trim());
                    nextSched[day] = {
                      isOpen: true,
                      openTime: times[0] || '',
                      closeTime: times[1] || '',
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
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load beach information.' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const saveCatalogItem = async <T,>(type: 'cottage' | 'facility' | 'post', item: object): Promise<T> => {
    const response = await fetch('/api/owner/beach/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beach_id: formData.id, type, ...item }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save listing.');
    return data.item as T;
  };

  const deleteCatalogItem = async (type: 'cottage' | 'facility' | 'post', id: string) => {
    const params = new URLSearchParams({ type, id, beach_id: formData.id });
    const response = await fetch(`/api/owner/beach/catalog?${params}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to remove listing.');
  };

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
      } else if (!item.openTime || !item.closeTime) {
        hours[day] = '';
      } else {
        hours[day] = `${item.openTime} – ${item.closeTime}`;
      }
    });
    return hours;
  };

  // Silent rule save helper (does NOT trigger main form saving state)
  const saveRulesSilently = async (rulesToSave: ResortRuleItem[]): Promise<boolean> => {
    try {
      const payload = {
        ...formData,
        contact_phone: formData.contact_phone ? `+63 ${formData.contact_phone}` : '',
        opening_hours: formatSchedulePayload(),
        rules: JSON.stringify(rulesToSave),
      };
      const res = await fetch('/api/owner/beach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // Save changes handler
  const handleSave = async (rulesToSave: ResortRuleItem[] = rules): Promise<boolean> => {
    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please correct the highlighted errors.' });
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        contact_phone: formData.contact_phone ? `+63 ${formData.contact_phone}` : '',
        opening_hours: formatSchedulePayload(),
        rules: JSON.stringify(rulesToSave),
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

      if (data.beach) {
        setBeach(data.beach);
        setFormData((current) => ({
          ...current,
          id: data.beach.id || current.id,
          latitude: data.beach.latitude == null ? '' : String(data.beach.latitude),
          longitude: data.beach.longitude == null ? '' : String(data.beach.longitude),
          entrance_fee_adults: data.beach.entrance_fee_adults == null
            ? ''
            : String(data.beach.entrance_fee_adults),
          entrance_fee_children: data.beach.entrance_fee_children == null
            ? ''
            : String(data.beach.entrance_fee_children),
          entrance_fee_senior: data.beach.entrance_fee_senior == null
            ? ''
            : String(data.beach.entrance_fee_senior),
        }));
      }

      setToast({
        type: 'success',
        message: 'Changes saved successfully.',
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes.';
      setToast({ type: 'error', message: msg });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Upload helper for PNG / JPG only
  const uploadImageFile = async (file: File): Promise<string> => {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type.toLowerCase())) {
      throw new Error('Please upload an image in PNG or JPG format only.');
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Image file size must be 20 GB or less.');
    }

    return uploadBeachImage(file, formData.id);
  };

  const uploadCottagePhotoDraft = async (photo: CottagePhotoDraft, cottageId: string): Promise<boolean> => {
    if (!photo.file) return false;
    const timer = setInterval(() => {
      setCottagePhotos((current) => current.map((item) => item.localId === photo.localId
        ? { ...item, progress: Math.min(90, item.progress + 5), status: 'uploading' }
        : item));
    }, 200);

    try {
      const uploaded = await uploadBeachImageWithPath(
        photo.file,
        formData.id,
        'cottages',
        cottageUploadAbortControllerRef.current?.signal
      );
      cottageSessionStoragePathsRef.current.set(uploaded.storagePath, null);
      if (cottageDiscardingRef.current) {
        await removeBeachImageByPath(uploaded.storagePath);
        return false;
      }
      const loadedImage = new window.Image();
      loadedImage.src = uploaded.imageUrl;
      await loadedImage.decode();
      if (cottageDiscardingRef.current) {
        await removeBeachImageByPath(uploaded.storagePath);
        return false;
      }
      const response = await fetch('/api/owner/beach/cottage-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beach_id: formData.id,
          cottage_id: cottageId,
          storage_path: uploaded.storagePath,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save cottage photo.');

      cottageSessionPhotoIdsRef.current.add(data.photo.id);
      cottageAllSessionPhotoIdsRef.current.add(data.photo.id);
      cottageSessionStoragePathsRef.current.set(uploaded.storagePath, data.photo.id);
      setCottagePhotos((current) => current.map((item) => item.localId === photo.localId
        ? {
            ...item,
            ...data.photo,
            localId: photo.localId,
            previewUrl: undefined,
            file: undefined,
            error: undefined,
            progress: 100,
            status: 'saved',
          }
        : item));
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      setCottages((current) => current.map((item) => {
        if (item.id !== cottageId) return item;
        const photos = [...(item.photos || []), data.photo]
          .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0));
        return { ...item, image_url: photos[0]?.image_url || '', photos };
      }));
      if (data.photo.sort_order === 0) {
        setNewCottage((current) => ({ ...current, image_url: data.photo.image_url }));
      }
      return true;
    } catch (error) {
      if (!cottageDiscardingRef.current) {
        setCottagePhotos((current) => current.map((item) => item.localId === photo.localId
          ? {
              ...item,
              status: 'error',
              error: error instanceof Error ? error.message : 'Failed to upload photo.',
            }
          : item));
        setCottageModalStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to upload cottage photo.',
        });
      }
      return false;
    } finally {
      clearInterval(timer);
    }
  };

  const handleCottagePhotoFiles = async (files: File[]) => {
    if (!files.length) return;
    if (cottagePhotos.length + files.length > 10) {
      setCottageModalStatus({ type: 'error', message: 'A cottage can have up to 10 photos.' });
      return;
    }

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setCottageModalStatus({ type: 'error', message: 'Choose JPG, PNG, or WebP photos only.' });
        return;
      }
      if (file.size < 1 || file.size > MAX_IMAGE_SIZE_BYTES) {
        setCottageModalStatus({ type: 'error', message: 'Choose an image smaller than 20 GB.' });
        return;
      }
    }

    const name = (newCottage.name || '').trim();
    if (!name || newCottage.price === '') {
      const fieldErrors = {
        ...(!name ? { name: 'Cottage name is required.' } : {}),
        ...(newCottage.price === '' ? { price: 'Daily rate is required.' } : {}),
      };
      setCottageFieldErrors(fieldErrors);
      setCottageModalStatus({
        type: 'error',
        message: 'Enter the cottage name and daily rate before adding photos.',
      });
      return;
    }

    setCottageModalStatus(null);
    setCottageFieldErrors({});
    cottageHasChangesRef.current = true;
    cottageDiscardingRef.current = false;
    const abortController = new AbortController();
    cottageUploadAbortControllerRef.current = abortController;
    cottageUploadCompletionRef.current = new Promise<void>((resolve) => {
      cottageUploadCompletionResolveRef.current = resolve;
    });
    setUploadingCottageImage(true);
    const newPhotos = files.map((file): CottagePhotoDraft => {
      const previewUrl = URL.createObjectURL(file);
      return {
        localId: generateUUID(),
        image_url: '',
        previewUrl,
        file,
        storage_path: '',
        progress: 0,
        status: 'uploading',
      };
    });
    setCottagePhotos((current) => [...current, ...newPhotos]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    let cottageId = editingCottageId;

    try {
      if (cottageDiscardingRef.current) return;
      if (!cottageId) {
        const newItem = await saveCatalogItem<CottageItem>('cottage', {
          name,
          price: newCottage.price || '',
          capacity: newCottage.capacity || '',
          description: newCottage.description || '',
          image_url: '',
        });
        cottageId = newItem.id;
        cottageEditorIdRef.current = newItem.id;
        createdCottageIdRef.current = newItem.id;
        setEditingCottageId(newItem.id);
        setCreatedCottageDuringUpload(true);
        setCottages((current) => [...current, newItem]);
      }
      if (cottageDiscardingRef.current) return;

      let uploadFailed = false;
      for (const photo of newPhotos) {
        if (cottageDiscardingRef.current) break;
        if (!await uploadCottagePhotoDraft(photo, cottageId)) uploadFailed = true;
      }
      if (!uploadFailed) setCottageModalStatus({ type: 'success', message: 'Photos uploaded and saved.' });
    } catch (error) {
      for (const photo of newPhotos) {
        if (photo.previewUrl) {
          setCottagePhotos((current) => current.map((item) => item.localId === photo.localId
            ? {
                ...item,
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to save cottage before uploading.',
              }
            : item));
        }
      }
      if (!cottageDiscardingRef.current) {
        setCottageModalStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to upload cottage photo.',
        });
      }
    } finally {
      setUploadingCottageImage(false);
      cottageUploadAbortControllerRef.current = null;
      cottageUploadCompletionResolveRef.current?.();
      cottageUploadCompletionResolveRef.current = null;
      cottageUploadCompletionRef.current = null;
    }
  };

  const removeCottagePhoto = async (photo: CottagePhotoDraft) => {
    if (!photo.id) {
      cottageHasChangesRef.current = true;
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      setCottagePhotos((current) => current.filter((item) => item.localId !== photo.localId));
      return;
    }
    cottageHasChangesRef.current = true;
    cottageStagedRemovalIdsRef.current.add(photo.id);
    const next = cottagePhotos.filter((item) => item.id !== photo.id);
    setCottagePhotos(next);
    setNewCottage((current) => ({ ...current, image_url: next[0]?.image_url || '' }));
    setCottageModalStatus(null);
  };

  const retryCottagePhoto = async (photo: CottagePhotoDraft) => {
    if (!photo.file) return;
    setUploadingCottageImage(true);
    cottageHasChangesRef.current = true;
    cottageDiscardingRef.current = false;
    cottageUploadAbortControllerRef.current = new AbortController();
    cottageUploadCompletionRef.current = new Promise<void>((resolve) => {
      cottageUploadCompletionResolveRef.current = resolve;
    });
    setCottageModalStatus(null);
    setCottagePhotos((current) => current.map((item) => item.localId === photo.localId
      ? { ...item, progress: 0, status: 'uploading', error: undefined }
      : item));
    try {
      let cottageId = editingCottageId;
      if (!cottageId) {
        const newItem = await saveCatalogItem<CottageItem>('cottage', {
          name: (newCottage.name || '').trim(),
          price: newCottage.price || '',
          capacity: newCottage.capacity || '',
          description: newCottage.description || '',
          image_url: '',
        });
        cottageId = newItem.id;
        cottageEditorIdRef.current = newItem.id;
        createdCottageIdRef.current = newItem.id;
        setEditingCottageId(newItem.id);
        setCreatedCottageDuringUpload(true);
        setCottages((current) => [...current, newItem]);
      }
      if (cottageDiscardingRef.current) return;
      if (cottageDiscardingRef.current) return;
      if (await uploadCottagePhotoDraft(photo, cottageId)) {
        setCottageModalStatus({ type: 'success', message: 'Photo uploaded and saved.' });
      }
    } catch (error) {
      setCottagePhotos((current) => current.map((item) => item.localId === photo.localId
        ? {
            ...item,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to save cottage before uploading.',
          }
        : item));
      setCottageModalStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to retry cottage photo upload.',
      });
    } finally {
      setUploadingCottageImage(false);
      cottageUploadAbortControllerRef.current = null;
      cottageUploadCompletionResolveRef.current?.();
      cottageUploadCompletionResolveRef.current = null;
      cottageUploadCompletionRef.current = null;
    }
  };

  const makeCottagePhotoCover = async (photo: CottagePhotoDraft) => {
    if (!photo.id || !editingCottageId) return;
    const next = [...cottagePhotos].sort((left, right) =>
      Number(left.id !== photo.id) - Number(right.id !== photo.id)
    );
    cottageHasChangesRef.current = true;
    const sorted = next.map((item, index) => ({ ...item, sort_order: index }));
    setCottagePhotos(sorted);
    setNewCottage((current) => ({ ...current, image_url: sorted[0]?.image_url || '' }));
    setCottageModalStatus(null);
  };

  const resetCottageEditor = () => {
    if (cottageStatusTimerRef.current) clearTimeout(cottageStatusTimerRef.current);
    cottageStatusTimerRef.current = null;
    cottagePhotos.forEach((photo) => {
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    });
    setShowAddCottage(false);
    setEditingCottageId(null);
    setCreatedCottageDuringUpload(false);
    setSavingCottage(false);
    setCottageModalStatus(null);
    setCottageFieldErrors({});
    setCottagePhotos([]);
    setShowDiscardConfirmation(false);
    setNewCottage({ name: '', price: '', capacity: '', description: '', image_url: '' });
    cottageSessionPhotoIdsRef.current.clear();
    cottageAllSessionPhotoIdsRef.current.clear();
    cottageSessionStoragePathsRef.current.clear();
    cottageStagedRemovalIdsRef.current.clear();
    cottageEditorIdRef.current = null;
    createdCottageIdRef.current = null;
    cottageOriginalSnapshotRef.current = null;
    cottageNeedsLegacyRestoreRef.current = false;
    cottageHasChangesRef.current = false;
    cottageDiscardingRef.current = false;
  };

  const discardCottageEditor = async () => {
    if (savingCottage) return;
    if (cottageDiscardingRef.current) return;
    cottageDiscardingRef.current = true;
    cottageUploadAbortControllerRef.current?.abort();
    await cottageUploadCompletionRef.current;

    try {
      const cottageId = cottageEditorIdRef.current || editingCottageId;
      const createdCottageId = createdCottageIdRef.current || (createdCottageDuringUpload ? editingCottageId : null);
      const sessionPhotoIds = new Set(cottageAllSessionPhotoIdsRef.current);
      if (createdCottageId) {
        await deleteCatalogItem('cottage', createdCottageId);
        setCottages((current) => current.filter((cottage) => cottage.id !== createdCottageId));
        createdCottageIdRef.current = null;
        cottageEditorIdRef.current = null;
        setEditingCottageId(null);
        setCreatedCottageDuringUpload(false);
      } else if (cottageId && cottageSessionPhotoIdsRef.current.size) {
        cottageNeedsLegacyRestoreRef.current = Boolean(cottageOriginalSnapshotRef.current);
        for (const photoId of cottageSessionPhotoIdsRef.current) {
          const params = new URLSearchParams({
            beach_id: formData.id,
            cottage_id: cottageId,
            photo_id: photoId,
          });
          const response = await fetch(`/api/owner/beach/cottage-photos?${params}`, { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to discard uploaded cottage photos.');
          cottageSessionPhotoIdsRef.current.delete(photoId);
        }
      }
      if (cottageNeedsLegacyRestoreRef.current && cottageOriginalSnapshotRef.current) {
        const original = cottageOriginalSnapshotRef.current;
        await saveCatalogItem('cottage', {
          id: original.id,
          name: original.name,
          price: original.price,
          capacity: original.capacity,
          description: original.description,
          image_url: original.image_url,
        });
        cottageNeedsLegacyRestoreRef.current = false;
      }
      if (cottageId && cottageSessionPhotoIdsRef.current.size === 0) {
        setCottages((current) => current.map((cottage) => cottage.id === cottageId
          ? {
            ...cottage,
            photos: cottage.photos.filter((photo) => !photo.id || !sessionPhotoIds.has(photo.id)),
            image_url: cottage.photos.find((photo) => !photo.id || !sessionPhotoIds.has(photo.id))?.image_url
              || cottageOriginalSnapshotRef.current?.image_url
              || '',
          }
          : cottage));
      }
      for (const [storagePath, photoId] of cottageSessionStoragePathsRef.current) {
        if (!photoId) await removeBeachImageByPath(storagePath);
      }
      resetCottageEditor();
    } catch (error) {
      cottageDiscardingRef.current = false;
      setCottageModalStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to discard cottage changes.',
      });
    }
  };

  const requestCloseCottageEditor = () => {
    if (savingCottage) return;
    if (cottageHasChangesRef.current || uploadingCottageImage) {
      setShowDiscardConfirmation(true);
      return;
    }
    void discardCottageEditor();
  };
  requestCloseCottageEditorRef.current = requestCloseCottageEditor;

  useEffect(() => {
    if (!showAddCottage || savingCottage) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showDiscardConfirmation) setShowDiscardConfirmation(false);
        else requestCloseCottageEditorRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddCottage, savingCottage, showDiscardConfirmation]);

  const resetFacilityEditor = () => {
    facilityPhotos.forEach((photo) => {
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    });
    setShowAddFacility(false);
    setEditingFacilityId(null);
    setFacilityPhotos([]);
    setFacilityModalStatus(null);
    setFacilityFieldError('');
    setFacilityRateAmounts({});
    setCustomFacilityRates([]);
    setFacilityRateErrors({});
    setUploadingFacilityPhotos(false);
    setSavingFacility(false);
    setShowDiscardFacilityConfirmation(false);
    setNewFacility({ title: '', category: 'parking', price: '', description: '', image_url: '' });
    facilitySessionPhotosRef.current.clear();
    facilityStagedRemovalIdsRef.current.clear();
    facilityOriginalSnapshotRef.current = null;
    facilityCreatedIdRef.current = null;
    facilityHasChangesRef.current = false;
    facilityDiscardingRef.current = false;
  };

  const startFacilityEditor = (facility?: FacilityItem) => {
    facilityDiscardingRef.current = false;
    facilityHasChangesRef.current = false;
    facilitySessionPhotosRef.current.clear();
    facilityStagedRemovalIdsRef.current.clear();
    facilityCreatedIdRef.current = null;
    facilityOriginalSnapshotRef.current = facility || null;
    setEditingFacilityId(facility?.id || null);
    setFacilityModalStatus(null);
    setFacilityFieldError('');
    const applicableRateOptions = facility?.category === 'comfort_room' || facility?.category === 'parking'
      ? FACILITY_RATE_OPTIONS[facility.category]
      : [];
    const savedRates = facility?.rates || [];
    setFacilityRateAmounts(Object.fromEntries(
      savedRates
        .filter((rate) => rate.key !== 'custom' && applicableRateOptions.some((option) => option.key === rate.key))
        .map((rate) => [rate.key, formatFacilityRateInput(rate.amount)])
    ));
    setCustomFacilityRates(savedRates
      .filter((rate) => rate.key === 'custom' && applicableRateOptions.length > 0)
      .map((rate) => ({ localId: generateUUID(), label: rate.label, amount: formatFacilityRateInput(rate.amount) })));
    setFacilityRateErrors({});
    setFacilityPhotos((facility?.photos || (facility?.image_url
      ? [{ image_url: facility.image_url, storage_path: '', sort_order: 0 }]
      : []
    )).map((photo, index) => ({
      ...photo,
      localId: photo.id || `existing-${facility?.id || 'new'}-${index}`,
      progress: 100,
      status: 'saved' as const,
    })));
    setNewFacility(facility
      ? {
          title: facility.title,
          category: facility.category,
          price: facility.price,
          description: facility.description,
          image_url: facility.image_url,
        }
      : { title: '', category: 'parking', price: '', description: '', image_url: '' });
    setShowAddFacility(true);
  };

  const collectFacilityRates = (): FacilityRate[] | null => {
    const category = newFacility.category;
    if (category !== 'comfort_room' && category !== 'parking') {
      setFacilityRateErrors({});
      return [];
    }

    const options = FACILITY_RATE_OPTIONS[category];
    const selectedOptions = options.filter((option) => Object.prototype.hasOwnProperty.call(facilityRateAmounts, option.key));
    const nextErrors: Record<string, string> = {};
    const rates: FacilityRate[] = [];

    if (!selectedOptions.length) {
      nextErrors.selection = category === 'parking'
        ? 'Select Car or Motorcycle and enter its rate.'
        : 'Select at least one usage type and enter its rate.';
    }

    for (const option of selectedOptions) {
      const amount = parseFacilityRateAmount(facilityRateAmounts[option.key] || '');
      if (amount === undefined) {
        nextErrors[option.key] = 'Enter a number of 0 or more, or Free.';
      } else {
        rates.push({ key: option.key, label: option.label, amount });
      }
    }

    for (const customRate of customFacilityRates) {
      const label = customRate.label.trim();
      const amount = parseFacilityRateAmount(customRate.amount);
      if (!label) nextErrors[`custom_${customRate.localId}_label`] = 'Enter a label for this rate.';
      if (amount === undefined) nextErrors[`custom_${customRate.localId}_amount`] = 'Enter a number of 0 or more, or Free.';
      if (label && amount !== undefined) rates.push({ key: 'custom', label, amount });
    }

    setFacilityRateErrors(nextErrors);
    return Object.keys(nextErrors).length ? null : rates;
  };

  const saveFacilityPhotoDraft = async (photo: FacilityPhotoDraft, facilityId: string): Promise<boolean> => {
    if (!photo.file) return false;
    const timer = setInterval(() => {
      setFacilityPhotos((current) => current.map((item) => item.localId === photo.localId
        ? { ...item, progress: Math.min(90, item.progress + 5), status: 'uploading' }
        : item));
    }, 200);
    try {
      const uploaded = await uploadBeachImageWithPath(
        photo.file,
        formData.id,
        'facilities',
        facilityUploadAbortControllerRef.current?.signal
      );
      facilitySessionPhotosRef.current.set(uploaded.storagePath, null);
      if (facilityDiscardingRef.current) {
        await removeBeachImageByPath(uploaded.storagePath);
        return false;
      }
      const loadedImage = new window.Image();
      loadedImage.src = uploaded.imageUrl;
      await loadedImage.decode();
      if (facilityDiscardingRef.current) {
        await removeBeachImageByPath(uploaded.storagePath);
        return false;
      }
      const response = await fetch('/api/owner/beach/facility-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beach_id: formData.id,
          facility_id: facilityId,
          storage_path: uploaded.storagePath,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save facility photo.');
      facilitySessionPhotosRef.current.set(uploaded.storagePath, data.photo.id);
      setFacilityPhotos((current) => current.map((item) => item.localId === photo.localId
        ? {
            ...item,
            ...data.photo,
            localId: photo.localId,
            previewUrl: undefined,
            file: undefined,
            error: undefined,
            progress: 100,
            status: 'saved',
          }
        : item));
      setNewFacility((current) => ({ ...current, image_url: facilityPhotos[0]?.image_url || data.photo.image_url }));
      setFacilities((current) => current.map((facility) => facility.id === facilityId
        ? {
            ...facility,
            image_url: facility.photos?.length ? facility.image_url : data.photo.image_url,
            photos: [...(facility.photos || []), data.photo].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
          }
        : facility));
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      return true;
    } catch (error) {
      if (!facilityDiscardingRef.current) {
        const message = error instanceof Error ? error.message : 'Failed to upload facility photo.';
        setFacilityPhotos((current) => current.map((item) => item.localId === photo.localId
          ? { ...item, status: 'error', error: message }
          : item));
        setFacilityModalStatus({ type: 'error', message });
      }
      return false;
    } finally {
      clearInterval(timer);
    }
  };

  const handleFacilityPhotoFiles = async (files: File[]) => {
    if (!files.length) return;
    if (facilityPhotos.length + files.length > 10) {
      setFacilityModalStatus({ type: 'error', message: 'A facility can have up to 10 photos.' });
      return;
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setFacilityModalStatus({ type: 'error', message: 'Choose JPG, PNG, or WebP photos only.' });
      return;
    }
    if (files.some((file) => file.size < 1 || file.size > MAX_IMAGE_SIZE_BYTES)) {
      setFacilityModalStatus({ type: 'error', message: 'Choose a non-empty image under 20 GB; photos are optimized to 5 MB.' });
      return;
    }
    if (!newFacility.title?.trim()) {
      setFacilityFieldError('Facility name is required before adding photos.');
      return;
    }

    facilityHasChangesRef.current = true;
    facilityDiscardingRef.current = false;
    const controller = new AbortController();
    facilityUploadAbortControllerRef.current = controller;
    facilityUploadCompletionRef.current = new Promise<void>((resolve) => {
      facilityUploadCompletionResolveRef.current = resolve;
    });
    setFacilityModalStatus(null);
    setFacilityFieldError('');
    setUploadingFacilityPhotos(true);
    const drafts = files.map((file): FacilityPhotoDraft => ({
      localId: generateUUID(),
      image_url: '',
      previewUrl: URL.createObjectURL(file),
      file,
      storage_path: '',
      progress: 0,
      status: 'uploading',
    }));
    setFacilityPhotos((current) => [...current, ...drafts]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    try {
      let facilityId = editingFacilityId;
      if (facilityDiscardingRef.current) return;
      if (!facilityId) {
        const item = await saveCatalogItem<FacilityItem>('facility', {
          title: newFacility.title.trim(),
          category: newFacility.category || 'amenity',
          price: newFacility.price || '',
          description: newFacility.description || '',
          image_url: newFacility.image_url || '',
        });
        facilityId = item.id;
        facilityCreatedIdRef.current = item.id;
        setEditingFacilityId(item.id);
        setFacilities((current) => [...current, item]);
      }
      for (const draft of drafts) {
        if (facilityDiscardingRef.current) break;
        await saveFacilityPhotoDraft(draft, facilityId);
      }
    } catch (error) {
      if (!facilityDiscardingRef.current) {
        const message = error instanceof Error ? error.message : 'Failed to prepare facility photo upload.';
        setFacilityPhotos((current) => current.map((photo) => drafts.some((draft) => draft.localId === photo.localId)
          ? { ...photo, status: 'error', error: message }
          : photo));
        setFacilityModalStatus({ type: 'error', message });
      }
    } finally {
      setUploadingFacilityPhotos(false);
      facilityUploadAbortControllerRef.current = null;
      facilityUploadCompletionResolveRef.current?.();
      facilityUploadCompletionResolveRef.current = null;
      facilityUploadCompletionRef.current = null;
    }
  };

  const retryFacilityPhoto = async (photo: FacilityPhotoDraft) => {
    if (!photo.file || uploadingFacilityPhotos) return;
    const controller = new AbortController();
    facilityUploadAbortControllerRef.current = controller;
    facilityUploadCompletionRef.current = new Promise<void>((resolve) => {
      facilityUploadCompletionResolveRef.current = resolve;
    });
    setUploadingFacilityPhotos(true);
    setFacilityModalStatus(null);
    setFacilityPhotos((current) => current.map((item) => item.localId === photo.localId
      ? { ...item, progress: 0, status: 'uploading', error: undefined }
      : item));
    try {
      const createdFacility = editingFacilityId
        ? null
        : await saveCatalogItem<FacilityItem>('facility', {
          title: newFacility.title?.trim() || '',
          category: newFacility.category || 'amenity',
          price: newFacility.price || '',
          description: newFacility.description || '',
          image_url: newFacility.image_url || '',
        });
      const facilityId = editingFacilityId || createdFacility?.id;
      if (!facilityId) throw new Error('Facility listing could not be prepared for photo upload.');
      if (createdFacility) {
        facilityCreatedIdRef.current = createdFacility.id;
        setEditingFacilityId(createdFacility.id);
        setFacilities((current) => [...current, createdFacility]);
      }
      await saveFacilityPhotoDraft(photo, facilityId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry facility photo upload.';
      setFacilityPhotos((current) => current.map((item) => item.localId === photo.localId
        ? { ...item, status: 'error', error: message }
        : item));
      setFacilityModalStatus({ type: 'error', message });
    } finally {
      setUploadingFacilityPhotos(false);
      facilityUploadAbortControllerRef.current = null;
      facilityUploadCompletionResolveRef.current?.();
      facilityUploadCompletionResolveRef.current = null;
      facilityUploadCompletionRef.current = null;
    }
  };

  const removeFacilityPhoto = async (photo: FacilityPhotoDraft) => {
    facilityHasChangesRef.current = true;
    if (!photo.id) {
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      setFacilityPhotos((current) => current.filter((item) => item.localId !== photo.localId));
      return;
    }
    const uploadedThisSession = [...facilitySessionPhotosRef.current.values()].includes(photo.id);
    if (uploadedThisSession && editingFacilityId) {
      try {
        const params = new URLSearchParams({
          beach_id: formData.id,
          facility_id: editingFacilityId,
          photo_id: photo.id,
        });
        const response = await fetch(`/api/owner/beach/facility-photos?${params}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to remove facility photo.');
        for (const [path, id] of facilitySessionPhotosRef.current) {
          if (id === photo.id) facilitySessionPhotosRef.current.delete(path);
        }
      } catch (error) {
        setFacilityModalStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to remove facility photo.',
        });
        return;
      }
    } else {
      facilityStagedRemovalIdsRef.current.add(photo.id);
    }
    setFacilityPhotos((current) => current.filter((item) => item.localId !== photo.localId));
    setNewFacility((current) => ({ ...current, image_url: facilityPhotos.filter((item) => item.localId !== photo.localId)[0]?.image_url || '' }));
  };

  const makeFacilityPhotoCover = (photo: FacilityPhotoDraft) => {
    facilityHasChangesRef.current = true;
    const sorted = [photo, ...facilityPhotos.filter((item) => item.localId !== photo.localId)]
      .map((item, index) => ({ ...item, sort_order: index }));
    setFacilityPhotos(sorted);
    setNewFacility((current) => ({ ...current, image_url: sorted[0]?.image_url || '' }));
  };

  const discardFacilityEditor = async () => {
    if (savingFacility || facilityDiscardingRef.current) return;
    facilityDiscardingRef.current = true;
    facilityUploadAbortControllerRef.current?.abort();
    await facilityUploadCompletionRef.current;
    try {
      if (facilityCreatedIdRef.current) {
        await deleteCatalogItem('facility', facilityCreatedIdRef.current);
        for (const [path, photoId] of facilitySessionPhotosRef.current) {
          if (!photoId) await removeBeachImageByPath(path);
        }
        setFacilities((current) => current.filter((facility) => facility.id !== facilityCreatedIdRef.current));
      } else if (editingFacilityId) {
        for (const [path, photoId] of facilitySessionPhotosRef.current) {
          if (photoId) {
            const params = new URLSearchParams({
              beach_id: formData.id,
              facility_id: editingFacilityId,
              photo_id: photoId,
            });
            const response = await fetch(`/api/owner/beach/facility-photos?${params}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to discard uploaded facility photos.');
          } else {
            await removeBeachImageByPath(path);
          }
        }
        if (facilityOriginalSnapshotRef.current) {
          setFacilities((current) => current.map((facility) => facility.id === editingFacilityId
            ? facilityOriginalSnapshotRef.current!
            : facility));
        }
      } else {
        for (const [path] of facilitySessionPhotosRef.current) await removeBeachImageByPath(path);
      }
      resetFacilityEditor();
    } catch (error) {
      facilityDiscardingRef.current = false;
      setFacilityModalStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to discard facility changes.',
      });
    }
  };

  const requestCloseFacilityEditor = () => {
    if (savingFacility) return;
    if (facilityHasChangesRef.current || uploadingFacilityPhotos) {
      setShowDiscardFacilityConfirmation(true);
      return;
    }
    void discardFacilityEditor();
  };
  facilityCloseRef.current = requestCloseFacilityEditor;

  useEffect(() => {
    if (!showAddFacility || savingFacility) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showDiscardFacilityConfirmation) setShowDiscardFacilityConfirmation(false);
        else facilityCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddFacility, savingFacility, showDiscardFacilityConfirmation]);

  const handleGalleryFileSelection = (file?: File) => {
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type.toLowerCase())) {
      setToast({ type: 'error', message: 'Please upload an image in PNG or JPG format only.' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setToast({ type: 'error', message: 'Image file size must be 20 GB or less.' });
      return;
    }

    setGalleryFile(file);
    setGalleryPreview(URL.createObjectURL(file));
  };

  // Upload the selected gallery image after its preview is confirmed.
  const handlePhotoUpload = async () => {
    if (!galleryFile) return;

    setUploadingImage(true);
    try {
      const newImageUrl = await uploadImageFile(galleryFile);
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
          caption: galleryFile.name.replace(/\.[^/.]+$/, ''),
          photo_url: newImageUrl,
          created_at: new Date().toISOString(),
        },
      ];

      setFormData((prev) => ({ ...prev, images: nextImages }));
      setGalleryFile(null);
      setGalleryPreview('');
      setToast({ type: 'success', message: 'Photo uploaded and added to resort gallery!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploadingImage(false);
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

    try {
      const post = await saveCatalogItem<ResortPost>('post', {
        caption: newPostCaption.trim(),
        image_url: newPostImage || '',
      });
      setResortPosts((current) => [post, ...current]);
      setNewPostCaption('');
      setNewPostImage(null);
      setToast({ type: 'success', message: 'Update posted to resort feed!' });
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed to publish update.' });
    }
  };

  // Photo Delete Handler
  const handleDeletePhoto = (index: number) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: updated }));
    setToast({ type: 'delete', message: 'Photo deleted.' });
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
    <div className="space-y-5 max-w-5xl mx-auto pb-20">
      
      {/* ── Floating Message Banner (Centered, slim, standard production level) ── */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-lg max-w-[90vw] animate-in fade-in slide-in-from-top-3 duration-300 text-white font-semibold text-xs tracking-wide text-center pointer-events-none ${
            toast.type === 'delete'
              ? 'bg-rose-600'
              : toast.type === 'success'
              ? 'bg-emerald-600'
              : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
          ) : toast.type === 'delete' ? (
            <Trash2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
          )}
          <span className="truncate">{toast.message}</span>
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

      {/* ── Horizontally Scrollable Category Tab Pills ── */}
      <div className="flex items-center gap-1.5 pb-2 overflow-x-auto no-scrollbar flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { key: 'basic', label: 'Basic Info' },
          { key: 'cottages', label: 'Cottages' },
          { key: 'facilities', label: 'Facilities & Parkings' },
          { key: 'hours', label: 'Operating Schedule' },
          { key: 'photos', label: 'Resort Updates' },
          { key: 'dos', label: "Do's & Don'ts" },
          { key: 'tour', label: '360° Virtual Tour' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`shrink-0 whitespace-nowrap min-h-9 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
              <div className="flex items-center w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-[#1F3F74]/20 focus-within:border-[#1F3F74] transition-all">
                <span className="px-4 py-2.5 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm border-r border-slate-200 dark:border-neutral-700 select-none">
                  +63
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={formData.contact_phone}
                  onChange={(e) => {
                    let cleaned = e.target.value.replace(/\D/g, '');
                    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
                    cleaned = cleaned.slice(0, 10);
                    setFormData({ ...formData, contact_phone: cleaned });
                  }}
                  placeholder="917 123 4567"
                  className="w-full min-w-0 px-4 py-2.5 text-xs sm:text-sm bg-transparent placeholder:italic placeholder:text-slate-400 font-normal text-slate-900 dark:text-white focus:outline-none"
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
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Binongkalan, Catmon, Cebu"
                className={`w-full rounded-full border bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:italic placeholder:text-slate-400 focus:outline-none transition-all ${
                  errors.location
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-slate-300 dark:border-neutral-700 focus:border-[#1F3F74] focus:ring-2 focus:ring-[#1F3F74]/20'
                }`}
              />
              <p className="pl-3 text-[11px] text-slate-500 dark:text-neutral-400">
                For better search results, use a location with barangay, municipality, and province separated by commas.
              </p>
              {errors.location && (
                <p className="text-[11px] text-red-500 font-medium pl-3">{errors.location}</p>
              )}
            </div>

            <div className="space-y-3 sm:col-span-2 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">Beach Map Coordinates</h3>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-neutral-400">
                    Set the pin on the map so visitors can find your beach.
                    {formData.id && hasMapPin && ' Coordinate changes require admin approval.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="inline-flex items-center justify-center rounded-full bg-[#1F3F74] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#183460] cursor-pointer shadow-xs"
                >
                  {!hasMapPin ? 'Set Map Pin' : formData.id ? 'Request Map Pin Change' : 'Choose on Map'}
                </button>
              </div>
              {!hasMapPin && (
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Your beach will not appear on the map until you set a pin.
                  {formData.id && ' Your first pin will be sent to an admin for approval.'}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="beach-latitude" className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-300">
                    Latitude
                  </label>
                  <input
                    id="beach-latitude"
                    type="text"
                    value={formData.latitude}
                    readOnly
                    placeholder="Not set"
                    className="w-full rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2.5 text-xs font-mono text-slate-700 dark:text-neutral-200 placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="beach-longitude" className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-300">
                    Longitude
                  </label>
                  <input
                    id="beach-longitude"
                    type="text"
                    value={formData.longitude}
                    readOnly
                    placeholder="Not set"
                    className="w-full rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2.5 text-xs font-mono text-slate-700 dark:text-neutral-200 placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>
              </div>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  Children Entrance Fee
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Senior Citizen Entrance Fee
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                  <input
                    type="number"
                    value={formData.entrance_fee_senior}
                    onChange={(e) => setFormData({ ...formData, entrance_fee_senior: e.target.value })}
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
                onClick={() => {
                  setEditingCottageId(null);
                    cottageEditorIdRef.current = null;
                    createdCottageIdRef.current = null;
                    cottageOriginalSnapshotRef.current = null;
                    cottageNeedsLegacyRestoreRef.current = false;
                    cottageSessionPhotoIdsRef.current.clear();
                    cottageAllSessionPhotoIdsRef.current.clear();
                    cottageSessionStoragePathsRef.current.clear();
                    cottageStagedRemovalIdsRef.current.clear();
                    cottageHasChangesRef.current = false;
                    cottageDiscardingRef.current = false;
                    setCottageModalStatus(null);
                  setCottageFieldErrors({});
                  setCottagePhotos([]);
                  setNewCottage({ name: '', price: '', capacity: '', description: '', image_url: '' });
                  setShowAddCottage(true);
                }}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Cottage</span>
              </button>
            </div>

            {/* Cottage Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {cottages.map((item) => (
                <CottageCard
                  key={item.id}
                  name={item.name}
                  imageUrl={item.image_url}
                  photoCount={item.photos?.length || 0}
                  price={item.price}
                  priceSuffix="/ day"
                  capacity={item.capacity}
                  description={item.description}
                  onView={() => setViewingCottagePhotos(item)}
                  onEdit={() => {
                    setEditingCottageId(item.id);
                    cottageEditorIdRef.current = item.id;
                    createdCottageIdRef.current = null;
                    cottageOriginalSnapshotRef.current = item;
                    cottageNeedsLegacyRestoreRef.current = false;
                    cottageSessionPhotoIdsRef.current.clear();
                    cottageAllSessionPhotoIdsRef.current.clear();
                    cottageSessionStoragePathsRef.current.clear();
                    cottageStagedRemovalIdsRef.current.clear();
                    cottageHasChangesRef.current = false;
                    cottageDiscardingRef.current = false;
                    setCottageModalStatus(null);
                    setCottageFieldErrors({});
                    setCottagePhotos((item.photos?.length
                      ? item.photos
                      : item.image_url
                        ? [{ image_url: item.image_url, storage_path: '', sort_order: 0 }]
                        : []
                    ).map((photo, index) => ({
                      ...photo,
                      localId: photo.id || `existing-${item.id}-${index}`,
                      progress: 100,
                      status: 'saved' as const,
                    })));
                    setNewCottage({
                      name: item.name,
                      price: item.price,
                      capacity: item.capacity,
                      description: item.description,
                      image_url: item.image_url || '',
                    });
                    setShowAddCottage(true);
                  }}
                  onDelete={async () => {
                    if (!window.confirm('Are you sure you want to delete this cottage?')) return;
                    try {
                      await deleteCatalogItem('cottage', item.id);
                      setCottages((current) => current.filter((c) => c.id !== item.id));
                      setToast({ type: 'delete', message: 'Cottage deleted.' });
                    } catch (error) {
                      setToast({ type: 'error', message: 'Failed to delete cottage.' });
                    }
                  }}
                />
              ))}
              {cottages.length === 0 && (
                <p className="md:col-span-2 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 p-6 text-center text-xs text-slate-500 dark:text-neutral-400">
                  No cottages added yet.
                </p>
              )}
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
              onClick={() => startFacilityEditor()}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Facility</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {validFacilities.map((fac) => (
              <FacilityCard
                key={fac.id}
                name={fac.title}
                category={fac.category}
                imageUrl={fac.photos?.[0]?.image_url || fac.image_url}
                description={fac.description}
                basePrice={fac.price}
                rates={fac.rates}
                editable
                onView={() => setViewingFacility(fac)}
                onEdit={() => startFacilityEditor(fac)}
                onDelete={async () => {
                  if (!window.confirm('Are you sure you want to delete this facility?')) return;
                  try {
                    await deleteCatalogItem('facility', fac.id);
                    setFacilities((current) => current.filter((facility) => facility.id !== fac.id));
                    setToast({ type: 'delete', message: 'Facility deleted.' });
                  } catch (error) {
                    setToast({ type: 'error', message: 'Failed to delete facility.' });
                  }
                }}
              />
            ))}
            {validFacilities.length === 0 && (
              <p className="md:col-span-2 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 p-6 text-center text-xs text-slate-500 dark:text-neutral-400">
                No facilities added yet.
              </p>
            )}
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
          {/* Sub-Tabs: Cover Banner, Resort Updates */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-3">
            {[
              { key: 'branding', label: 'Cover Banner' },
              { key: 'posts', label: 'Resort Updates' },
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
                      High-resolution landscape photo shown at the top of your public beach profile. PNG or JPG, up to 20 GB.
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
                    <span>Attach Photo (PNG/JPG, max 20 GB)</span>
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
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to delete this post?')) return;
                          try {
                            await deleteCatalogItem('post', post.id);
                            setResortPosts((current) => current.filter((p) => p.id !== post.id));
                            setToast({ type: 'delete', message: 'Post deleted.' });
                          } catch (error) {
                            setToast({ type: 'error', message: 'Failed to delete post.' });
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete post"
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
                {resortPosts.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 p-6 text-center text-xs text-slate-500 dark:text-neutral-400">
                    No resort updates posted yet.
                  </p>
                )}
              </div>
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
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete this guideline?')) return;
                        const nextRules = rules.filter((r) => r.id !== rule.id);
                        const ok = await saveRulesSilently(nextRules);
                        if (ok) {
                          setRules(nextRules);
                          setToast({ type: 'delete', message: 'Guideline deleted.' });
                        } else {
                          setToast({ type: 'error', message: 'Failed to delete guideline.' });
                        }
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
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete this restriction?')) return;
                        const nextRules = rules.filter((r) => r.id !== rule.id);
                        const ok = await saveRulesSilently(nextRules);
                        if (ok) {
                          setRules(nextRules);
                          setToast({ type: 'delete', message: 'Restriction deleted.' });
                        } else {
                          setToast({ type: 'error', message: 'Failed to delete restriction.' });
                        }
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
      <div className="pt-6 border-t border-slate-200 dark:border-neutral-800 flex justify-center">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="rounded-full px-8 py-3 bg-[#1F3F74] hover:bg-[#183460] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {viewingCottagePhotos && (
        <PhotoViewerModal
          item={{
            name: viewingCottagePhotos.name,
            price: viewingCottagePhotos.price,
            capacity: viewingCottagePhotos.capacity,
            description: viewingCottagePhotos.description,
            photos: viewingCottagePhotos.photos?.length
              ? viewingCottagePhotos.photos
              : viewingCottagePhotos.image_url
                ? [{ image_url: viewingCottagePhotos.image_url }]
                : [],
          }}
          onClose={() => setViewingCottagePhotos(null)}
        />
      )}
      {viewingFacility && (
        <PhotoViewerModal
          item={{
            name: viewingFacility.title,
            photos: viewingFacility.photos?.length
              ? [...viewingFacility.photos].sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0))
              : viewingFacility.image_url
                ? [{ image_url: viewingFacility.image_url }]
                : [],
            description: viewingFacility.description,
            infoLabel: getFacilityCategoryLabel(viewingFacility.category),
            price: null,
            priceLabel: 'Fee',
            priceUnit: '',
            feeItems: getFacilityFeeItems(viewingFacility.rates?.length ? viewingFacility.rates : viewingFacility.price),
          }}
          onClose={() => setViewingFacility(null)}
        />
      )}

      {/* ── MODAL: ADD COTTAGE (PNG/JPG Upload Only, Built-in ₱) ── */}
      {showAddCottage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) requestCloseCottageEditor();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans">
                {editingCottageId ? 'Edit Resort Cottage' : 'Add New Resort Cottage'}
              </h3>
              <button
                type="button"
                aria-label="Close cottage editor"
                onClick={requestCloseCottageEditor}
                disabled={savingCottage}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const cottageName = (newCottage.name || '').trim();
                const errors = {
                  ...(!cottageName ? { name: 'Cottage name is required.' } : {}),
                  ...(newCottage.price === '' ? { price: 'Daily rate is required.' } : {}),
                };
                if (Object.keys(errors).length > 0) {
                  setCottageFieldErrors(errors);
                  setCottageModalStatus({
                    type: 'error',
                    message: 'Cottage name and daily rate are required.',
                  });
                  return;
                }
                setCottageFieldErrors({});
                setCottageModalStatus(null);
                setSavingCottage(true);
                try {
                  for (const [storagePath, photoId] of cottageSessionStoragePathsRef.current) {
                    if (!photoId) await removeBeachImageByPath(storagePath);
                  }
                  const item = await saveCatalogItem<CottageItem>('cottage', {
                    ...(editingCottageId ? { id: editingCottageId } : {}),
                    name: cottageName,
                    price: newCottage.price,
                    capacity: newCottage.capacity || '',
                    description: newCottage.description || '',
                    image_url: newCottage.image_url || '',
                  });
                  for (const photoId of cottageStagedRemovalIdsRef.current) {
                    const params = new URLSearchParams({
                      beach_id: formData.id,
                      cottage_id: item.id,
                      photo_id: photoId,
                    });
                    const response = await fetch(`/api/owner/beach/cottage-photos?${params}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Failed to remove a cottage photo.');
                  }
                  const orderedPhotoIds = cottagePhotos.flatMap((photo) => photo.id ? [photo.id] : []);
                  if (orderedPhotoIds.length) {
                    const response = await fetch('/api/owner/beach/cottage-photos', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        beach_id: formData.id,
                        cottage_id: item.id,
                        photo_ids: orderedPhotoIds,
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Failed to save the cottage photo order.');
                  }
                  setCottages((current) => editingCottageId
                    ? current.map((cottage) => cottage.id === item.id
                      ? {
                        ...item,
                        image_url: cottagePhotos.length
                          ? cottagePhotos.find((photo) => photo.id)?.image_url || item.image_url
                          : '',
                        photos: cottagePhotos.filter((photo) => photo.id),
                      }
                      : cottage)
                    : [...current, {
                      ...item,
                      image_url: cottagePhotos.length
                        ? cottagePhotos.find((photo) => photo.id)?.image_url || item.image_url
                        : '',
                      photos: cottagePhotos.filter((photo) => photo.id),
                    }]);
                  setCottageModalStatus({
                    type: 'success',
                    message: editingCottageId ? 'Cottage updated successfully.' : 'Cottage added successfully.',
                  });
                  cottageStatusTimerRef.current = setTimeout(() => {
                    resetCottageEditor();
                  }, 1200);
                } catch (error) {
                  setCottageModalStatus({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to save cottage.',
                  });
                  setSavingCottage(false);
                }
              }}
              className="space-y-4"
            >
              <ModalStatusBanner status={cottageModalStatus} />

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Cottage Name / Type *
                </label>
                <input
                  type="text"
                  value={newCottage.name}
                  onChange={(e) => {
                    cottageHasChangesRef.current = true;
                    setNewCottage({ ...newCottage, name: e.target.value });
                    setCottageFieldErrors((current) => ({ ...current, name: undefined }));
                    if (cottageModalStatus?.type === 'error') setCottageModalStatus(null);
                  }}
                  placeholder="e.g. Seafront Mahogany Cottage"
                  aria-invalid={Boolean(cottageFieldErrors.name)}
                  aria-describedby={cottageFieldErrors.name ? 'cottage-name-error' : undefined}
                  className={`w-full rounded-full border bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74] ${
                    cottageFieldErrors.name ? 'border-rose-500' : 'border-slate-300 dark:border-neutral-700'
                  }`}
                />
                {cottageFieldErrors.name && (
                  <p id="cottage-name-error" className="text-xs text-rose-600 dark:text-rose-400">
                    {cottageFieldErrors.name}
                  </p>
                )}
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
                      value={newCottage.price}
                      onChange={(e) => {
                        cottageHasChangesRef.current = true;
                        setNewCottage({ ...newCottage, price: e.target.value });
                        setCottageFieldErrors((current) => ({ ...current, price: undefined }));
                        if (cottageModalStatus?.type === 'error') setCottageModalStatus(null);
                      }}
                      placeholder="700"
                      aria-invalid={Boolean(cottageFieldErrors.price)}
                      aria-describedby={cottageFieldErrors.price ? 'cottage-rate-error' : undefined}
                      className={`w-full rounded-full border bg-white dark:bg-neutral-950 py-2.5 pl-8 pr-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74] ${
                        cottageFieldErrors.price ? 'border-rose-500' : 'border-slate-300 dark:border-neutral-700'
                      }`}
                    />
                  </div>
                  {cottageFieldErrors.price && (
                    <p id="cottage-rate-error" className="text-xs text-rose-600 dark:text-rose-400">
                      {cottageFieldErrors.price}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Guest Capacity
                  </label>
                  <input
                    type="text"
                    value={newCottage.capacity}
                    onChange={(e) => {
                      cottageHasChangesRef.current = true;
                      setNewCottage({ ...newCottage, capacity: e.target.value });
                    }}
                    placeholder="e.g. 10 - 15 persons"
                    className="w-full rounded-full border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 py-2.5 px-4 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                  />
                </div>
              </div>

              {/* Persistent cottage image upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Cottage Photos (up to 10; JPG, PNG, or WebP, optimized to 1600px and 5 MB each)
                </label>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {cottagePhotos.map((photo, index) => (
                    <div key={photo.localId} className="w-24 shrink-0 space-y-1.5">
                      <div className={`relative aspect-[4/3] overflow-hidden rounded-none border border-slate-200 dark:border-neutral-700 ${
                        photo.status === 'uploading' ? 'opacity-80' : 'opacity-100'
                      }`}>
                        <Image
                          src={photo.previewUrl || photo.image_url}
                          alt=""
                          aria-hidden="true"
                          fill
                          unoptimized
                          className="pointer-events-none scale-110 object-cover blur-xl brightness-90"
                        />
                        <Image
                          src={photo.previewUrl || photo.image_url}
                          alt={`Cottage photo ${index + 1}`}
                          fill
                          unoptimized
                          className="relative z-10 object-contain"
                        />
                        <button
                          type="button"
                          aria-label={`Remove photo ${index + 1}`}
                          disabled={uploadingCottageImage}
                          onClick={() => void removeCottagePhoto(photo)}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {photo.id && photo.sort_order === 0 ? (
                        <span className="block text-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Cover</span>
                      ) : (
                        <button
                          type="button"
                          disabled={uploadingCottageImage || !photo.id}
                          onClick={() => void makeCottagePhotoCover(photo)}
                          className="block w-full text-center text-[10px] font-semibold text-[#1F3F74] disabled:opacity-50 dark:text-[#4987BA]"
                        >
                          Make cover
                        </button>
                      )}
                      <div
                        className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-700"
                        role="progressbar"
                        aria-label={`Photo ${index + 1} upload progress`}
                        aria-valuenow={photo.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full transition-[width] duration-200 ${photo.status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${photo.progress}%` }}
                        />
                      </div>
                      {photo.status === 'uploading' && (
                        <span className="block text-center text-[10px] text-slate-500">Uploading...</span>
                      )}
                      {photo.status === 'saved' && (
                        <span className="block text-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Saved photo</span>
                      )}
                      {photo.status === 'error' && (
                        <div className="space-y-1">
                          <span className="block text-center text-[10px] text-rose-600" role="alert">
                            {photo.error || 'Upload failed'}
                          </span>
                          <button
                            type="button"
                            disabled={uploadingCottageImage}
                            onClick={() => void retryCottagePhoto(photo)}
                            className="block w-full text-center text-[10px] font-bold text-[#1F3F74] disabled:opacity-50 dark:text-[#4987BA]"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    aria-disabled={cottagePhotos.length >= 10}
                    className={`px-4 py-2 rounded-full border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 text-xs font-semibold text-slate-700 dark:text-neutral-300 inline-flex items-center gap-1.5 ${
                      cottagePhotos.length >= 10
                        ? 'pointer-events-none opacity-50'
                        : 'hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{cottagePhotos.length ? 'Add more photos' : 'Add Photos'}</span>
                    {cottagePhotos.length > 0 && <span className="text-slate-500">{cottagePhotos.length} / 10</span>}
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      multiple
                      disabled={uploadingCottageImage || cottagePhotos.length >= 10}
                      onChange={(e) => {
                        const files = Array.from(e.currentTarget.files || []);
                        void handleCottagePhotoFiles(files);
                        e.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {cottagePhotos.length >= 10 && (
                    <span className="text-xs text-slate-500">The 10-photo limit has been reached.</span>
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
                  onChange={(e) => {
                    cottageHasChangesRef.current = true;
                    setNewCottage({ ...newCottage, description: e.target.value });
                  }}
                  placeholder="Details about shade, grilling area, table setup..."
                  className="w-full rounded-2xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-xs text-slate-900 dark:text-white placeholder:italic focus:outline-none focus:border-[#1F3F74]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={requestCloseCottageEditor}
                  disabled={savingCottage}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCottage || uploadingCottageImage}
                  className="rounded-full px-6 py-2 bg-[#1F3F74] hover:bg-[#183460] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingCottage ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                      {editingCottageId ? 'Saving...' : 'Adding...'}
                    </span>
                  ) : editingCottageId ? 'Save Cottage' : 'Add Cottage'}
                </button>
              </div>
            </form>
          </div>
          {showDiscardConfirmation && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setShowDiscardConfirmation(false);
              }}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="discard-cottage-title"
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900"
              >
                <h4 id="discard-cottage-title" className="font-bold text-slate-900 dark:text-white">
                  Discard changes?
                </h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                  Your cottage edits and any photos still uploading will be discarded.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirmation(false)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-neutral-700 dark:text-neutral-200"
                  >
                    Keep editing
                  </button>
                  <button
                    type="button"
                    onClick={() => void discardCottageEditor()}
                    className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: ADD FACILITY (PNG/JPG Upload Only, Built-in ₱) ── */}
      {showAddFacility && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) requestCloseFacilityEditor();
          }}
        >
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-7">
            <button
              type="button"
              onClick={requestCloseFacilityEditor}
              disabled={savingFacility}
              aria-label="Close facility editor"
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="pr-10 text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">
              {facilityOriginalSnapshotRef.current ? 'Edit Facility or Equipment' : 'Add Facility or Equipment'}
            </h3>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!newFacility.title?.trim()) {
                  setFacilityFieldError('Facility name is required.');
                  return;
                }
                if (uploadingFacilityPhotos || facilityPhotos.some((photo) => photo.status === 'error')) {
                  setFacilityModalStatus({
                    type: 'error',
                    message: 'Wait for photo uploads to finish or retry/remove failed photos before saving.',
                  });
                  return;
                }
                const rates = collectFacilityRates();
                if (!rates) return;
                setSavingFacility(true);
                setFacilityModalStatus(null);
                try {
                  const wasEditing = Boolean(facilityOriginalSnapshotRef.current);
                  let item = await saveCatalogItem<FacilityItem>('facility', {
                    ...(editingFacilityId ? { id: editingFacilityId } : {}),
                    title: newFacility.title.trim(),
                    category: newFacility.category || 'amenity',
                    price: newFacility.price || '',
                    description: newFacility.description || '',
                    image_url: facilityPhotos[0]?.image_url || '',
                    rates,
                  });
                  if (!editingFacilityId) {
                    facilityCreatedIdRef.current = item.id;
                    setEditingFacilityId(item.id);
                    setFacilities((current) => [...current, item]);
                  }
                  for (const photoId of facilityStagedRemovalIdsRef.current) {
                    const params = new URLSearchParams({
                      beach_id: formData.id,
                      facility_id: item.id,
                      photo_id: photoId,
                    });
                    const response = await fetch(`/api/owner/beach/facility-photos?${params}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Failed to remove a facility photo.');
                  }
                  const orderedPhotoIds = facilityPhotos.flatMap((photo) => photo.id ? [photo.id] : []);
                  if (orderedPhotoIds.length) {
                    const response = await fetch('/api/owner/beach/facility-photos', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        beach_id: formData.id,
                        facility_id: item.id,
                        photo_ids: orderedPhotoIds,
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Failed to save the facility photo order.');
                  }
                  item = {
                    ...item,
                    image_url: facilityPhotos[0]?.image_url || '',
                    rates,
                    photos: facilityPhotos.filter((photo) => photo.id),
                  };
                  setFacilities((current) => editingFacilityId
                    ? current.map((facility) => facility.id === item.id ? item : facility)
                    : current.some((facility) => facility.id === item.id)
                      ? current.map((facility) => facility.id === item.id ? item : facility)
                      : [...current, item]);
                  setFacilityModalStatus({
                    type: 'success',
                    message: wasEditing ? 'Facility updated successfully.' : 'Facility added successfully.',
                  });
                  window.setTimeout(resetFacilityEditor, 800);
                } catch (error) {
                  setFacilityModalStatus({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to save facility.',
                  });
                  setSavingFacility(false);
                }
              }}
              className="mt-5 space-y-4"
            >
              <ModalStatusBanner status={facilityModalStatus} />
              {facilityFieldError && (
                <p className="text-xs text-rose-600" role="alert">{facilityFieldError}</p>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Facility / Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFacility.title}
                  onChange={(event) => {
                    facilityHasChangesRef.current = true;
                    setNewFacility({ ...newFacility, title: event.target.value });
                    setFacilityFieldError('');
                    if (facilityModalStatus?.type === 'error') setFacilityModalStatus(null);
                  }}
                  placeholder="e.g. Secured Gated Parking"
                  className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:italic focus:border-[#1F3F74] focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </div>

              <div className={`grid gap-3 ${newFacility.category === 'comfort_room' || newFacility.category === 'parking' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">Category</label>
                  <div className="relative">
                    <select
                      value={newFacility.category}
                      onChange={(event) => {
                        const category = event.target.value as FacilityItem['category'];
                        facilityHasChangesRef.current = true;
                        if (category !== newFacility.category) {
                          setFacilityRateAmounts({});
                          setCustomFacilityRates([]);
                          setFacilityRateErrors({});
                        }
                        setNewFacility({ ...newFacility, category });
                      }}
                      className="w-full appearance-none rounded-full border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-xs text-slate-900 focus:border-[#1F3F74] focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    >
                      {Object.entries(FACILITY_CATEGORY_CONFIG)
                        .filter(([, option]) => !('selectable' in option) || option.selectable !== false)
                        .map(([value, option]) => (
                          <option key={value} value={value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                {newFacility.category !== 'comfort_room' && newFacility.category !== 'parking' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">Rental Rate / Fee</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                      <input
                        type="text"
                        value={newFacility.price}
                        onChange={(event) => {
                          facilityHasChangesRef.current = true;
                          setNewFacility({ ...newFacility, price: event.target.value });
                        }}
                        placeholder="Free or 100"
                        className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-xs text-slate-900 placeholder:italic focus:border-[#1F3F74] focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {(newFacility.category === 'comfort_room' || newFacility.category === 'parking') && (
                <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-950">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    {newFacility.category === 'parking' ? 'Vehicle Type and Rates' : 'Usage Type and Rates'}
                  </h4>
                  <div className="space-y-3">
                    {FACILITY_RATE_OPTIONS[newFacility.category].map((option) => {
                      const selected = Object.prototype.hasOwnProperty.call(facilityRateAmounts, option.key);
                      const error = facilityRateErrors[option.key];
                      return (
                        <div key={option.key} className="space-y-2">
                          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selected
                              ? 'border-[#1F3F74] bg-[#1F3F74] text-white'
                              : 'border-slate-300 bg-white text-slate-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
                          }`}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                facilityHasChangesRef.current = true;
                                setFacilityRateAmounts((current) => {
                                  if (event.target.checked) return { ...current, [option.key]: '' };
                                  const next = { ...current };
                                  delete next[option.key];
                                  return next;
                                });
                                setFacilityRateErrors((current) => {
                                  const next = { ...current };
                                  delete next[option.key];
                                  delete next.selection;
                                  return next;
                                });
                              }}
                              className="h-3.5 w-3.5 accent-[#1F3F74]"
                            />
                            {option.label}
                          </label>
                          {selected && (
                            <div className="space-y-1">
                              <label htmlFor={`facility-rate-${option.key}`} className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
                                {option.label} Rate / Fee
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                                <input
                                  id={`facility-rate-${option.key}`}
                                  type="text"
                                  inputMode="decimal"
                                  value={facilityRateAmounts[option.key]}
                                  onChange={(event) => {
                                    facilityHasChangesRef.current = true;
                                    setFacilityRateAmounts((current) => ({ ...current, [option.key]: event.target.value }));
                                    setFacilityRateErrors((current) => {
                                      const next = { ...current };
                                      delete next[option.key];
                                      return next;
                                    });
                                  }}
                                  placeholder="Free or 10"
                                  aria-invalid={Boolean(error)}
                                  className={`w-full rounded-full border bg-white py-2.5 pl-8 pr-4 text-xs text-slate-900 placeholder:italic focus:outline-none dark:bg-neutral-900 dark:text-white ${error ? 'border-rose-500' : 'border-slate-300 dark:border-neutral-700'}`}
                                />
                              </div>
                              {error && <p className="text-xs text-rose-600" role="alert">{error}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {facilityRateErrors.selection && (
                      <p className="text-xs text-rose-600" role="alert">{facilityRateErrors.selection}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {customFacilityRates.map((rate) => {
                      const labelError = facilityRateErrors[`custom_${rate.localId}_label`];
                      const amountError = facilityRateErrors[`custom_${rate.localId}_amount`];
                      return (
                        <div key={rate.localId} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
                          <div className="space-y-1">
                            <label htmlFor={`custom-rate-label-${rate.localId}`} className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">Rate label</label>
                            <input
                              id={`custom-rate-label-${rate.localId}`}
                              type="text"
                              value={rate.label}
                              onChange={(event) => {
                                facilityHasChangesRef.current = true;
                                setCustomFacilityRates((current) => current.map((item) => item.localId === rate.localId ? { ...item, label: event.target.value } : item));
                                setFacilityRateErrors((current) => {
                                  const next = { ...current };
                                  delete next[`custom_${rate.localId}_label`];
                                  return next;
                                });
                              }}
                              placeholder="e.g. Towel rental"
                              aria-invalid={Boolean(labelError)}
                              className={`w-full rounded-xl border bg-white px-3 py-2.5 text-xs text-slate-900 focus:outline-none dark:bg-neutral-900 dark:text-white ${labelError ? 'border-rose-500' : 'border-slate-300 dark:border-neutral-700'}`}
                            />
                            {labelError && <p className="text-xs text-rose-600" role="alert">{labelError}</p>}
                          </div>
                          <div className="space-y-1">
                            <label htmlFor={`custom-rate-amount-${rate.localId}`} className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">Rate / Fee</label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA]">₱</span>
                              <input
                                id={`custom-rate-amount-${rate.localId}`}
                                type="text"
                                inputMode="decimal"
                                value={rate.amount}
                                onChange={(event) => {
                                  facilityHasChangesRef.current = true;
                                  setCustomFacilityRates((current) => current.map((item) => item.localId === rate.localId ? { ...item, amount: event.target.value } : item));
                                  setFacilityRateErrors((current) => {
                                    const next = { ...current };
                                    delete next[`custom_${rate.localId}_amount`];
                                    return next;
                                  });
                                }}
                                placeholder="Free or 10"
                                aria-invalid={Boolean(amountError)}
                                className={`w-full rounded-xl border bg-white py-2.5 pl-7 pr-3 text-xs text-slate-900 focus:outline-none dark:bg-neutral-900 dark:text-white ${amountError ? 'border-rose-500' : 'border-slate-300 dark:border-neutral-700'}`}
                              />
                            </div>
                            {amountError && <p className="text-xs text-rose-600" role="alert">{amountError}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              facilityHasChangesRef.current = true;
                              setCustomFacilityRates((current) => current.filter((item) => item.localId !== rate.localId));
                              setFacilityRateErrors((current) => {
                                const next = { ...current };
                                delete next[`custom_${rate.localId}_label`];
                                delete next[`custom_${rate.localId}_amount`];
                                return next;
                              });
                            }}
                            aria-label={`Remove ${rate.label || 'custom'} rate`}
                            className="mt-6 flex h-9 w-9 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      facilityHasChangesRef.current = true;
                      setCustomFacilityRates((current) => [...current, { localId: generateUUID(), label: '', amount: '' }]);
                    }}
                    className="text-xs font-semibold text-[#1F3F74] hover:underline dark:text-[#4987BA]"
                  >
                    + Add other rate
                  </button>
                </section>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Photos (up to 10; JPG, PNG, or WebP, optimized to 1600px and 5 MB each)
                </label>
                {facilityPhotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {facilityPhotos.map((photo, index) => {
                      const source = photo.previewUrl || photo.image_url;
                      return (
                        <div key={photo.localId} className="min-w-0 space-y-1.5">
                          <div className="relative aspect-[4/3] overflow-hidden border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800">
                            {source && (
                              <Image
                                src={source}
                                alt={`Facility photo ${index + 1}`}
                                fill
                                unoptimized
                                className="object-contain"
                              />
                            )}
                            <button
                              type="button"
                              aria-label={`Remove photo ${index + 1}`}
                              disabled={savingFacility}
                              onClick={() => void removeFacilityPhoto(photo)}
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {photo.id && photo.sort_order === 0 ? (
                            <span className="block text-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Cover</span>
                          ) : (
                            <button
                              type="button"
                              disabled={uploadingFacilityPhotos || savingFacility || !photo.id}
                              onClick={() => makeFacilityPhotoCover(photo)}
                              className="block w-full text-center text-[10px] font-semibold text-[#1F3F74] disabled:opacity-50 dark:text-[#4987BA]"
                            >
                              Make cover
                            </button>
                          )}
                          <div
                            className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-700"
                            role="progressbar"
                            aria-label={`Photo ${index + 1} upload progress`}
                            aria-valuenow={photo.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`h-full transition-[width] duration-200 ${photo.status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${photo.progress}%` }}
                            />
                          </div>
                          {photo.status === 'uploading' && <span className="block text-center text-[10px] text-slate-500">Uploading...</span>}
                          {photo.status === 'saved' && <span className="block text-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Saved photo</span>}
                          {photo.status === 'error' && (
                            <div className="space-y-1">
                              <span className="block text-center text-[10px] text-rose-600" role="alert">
                                {photo.error || 'Upload failed'}
                              </span>
                              <button
                                type="button"
                                disabled={uploadingFacilityPhotos || savingFacility}
                                onClick={() => void retryFacilityPhoto(photo)}
                                className="block w-full text-center text-[10px] font-bold text-[#1F3F74] disabled:opacity-50 dark:text-[#4987BA]"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 ${
                    facilityPhotos.length >= 10 || uploadingFacilityPhotos || savingFacility
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer hover:bg-slate-100'
                  }`}>
                    <Upload className="h-3.5 w-3.5" />
                    <span>{facilityPhotos.length ? 'Add more photos' : 'Add Photos'}</span>
                    {facilityPhotos.length > 0 && <span className="text-slate-500">{facilityPhotos.length} / 10</span>}
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      multiple
                      disabled={facilityPhotos.length >= 10 || uploadingFacilityPhotos || savingFacility}
                      onChange={(event) => {
                        const files = Array.from(event.currentTarget.files || []);
                        void handleFacilityPhotoFiles(files);
                        event.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {facilityPhotos.length >= 10 && (
                    <span className="text-xs text-slate-500">The 10-photo limit has been reached.</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">Description</label>
                <textarea
                  rows={2}
                  value={newFacility.description}
                  onChange={(event) => {
                    facilityHasChangesRef.current = true;
                    setNewFacility({ ...newFacility, description: event.target.value });
                  }}
                  placeholder="Description of the facility, capacity, fee if any..."
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:italic focus:border-[#1F3F74] focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={requestCloseFacilityEditor}
                  disabled={savingFacility}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFacility || uploadingFacilityPhotos}
                  className="rounded-full bg-[#1F3F74] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#183460] disabled:opacity-50"
                >
                  {savingFacility ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : facilityOriginalSnapshotRef.current ? 'Save Changes' : 'Add Facility'}
                </button>
              </div>
            </form>
          </div>
          {showDiscardFacilityConfirmation && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setShowDiscardFacilityConfirmation(false);
              }}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="discard-facility-title"
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900"
              >
                <h4 id="discard-facility-title" className="font-bold text-slate-900 dark:text-white">Discard changes?</h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                  Your facility edits and any photos still uploading will be discarded.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDiscardFacilityConfirmation(false)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-neutral-700 dark:text-neutral-200"
                  >
                    Keep editing
                  </button>
                  <button
                    type="button"
                    onClick={() => void discardFacilityEditor()}
                    className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
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
              onSubmit={async (e) => {
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
                const nextRules = [...rules, item];
                if (await handleSave(nextRules)) {
                  setRules(nextRules);
                  setShowAddRule(false);
                  setNewRule({ type: 'do', title: '', description: '', category: 'Safety' });
                  setToast({ type: 'success', message: 'New resort rule added successfully!' });
                }
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

      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        beachName={formData.name}
        location={formData.location || 'Barangay Binongkalan, Catmon, Cebu'}
        latitude={formData.latitude}
        longitude={formData.longitude}
        requireApprovalNotice={Boolean(formData.id)}
        submitButtonText={formData.id ? 'Request Pin Approval' : 'Set Map Pin'}
        onSave={async (coordinates) => {
          if (formData.id) {
            const response = await fetch('/api/owner/beach/coordinate-request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                beach_id: formData.id,
                requested_latitude: Number(coordinates.latitude),
                requested_longitude: Number(coordinates.longitude),
                requested_location: coordinates.location,
                requester_note: coordinates.note,
              }),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || 'Failed to submit map location request.');
            }
            setToast({ type: 'success', message: data.message || 'Map location request sent for admin approval.' });
            return;
          }

          setFormData((current) => ({
            ...current,
            location: coordinates.location,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }));
          setErrors((current) => {
            const next = { ...current };
            delete next.coordinates;
            delete next.location;
            return next;
          });
        }}
      />

    </div>
  );
}
