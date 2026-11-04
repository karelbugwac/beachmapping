'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  X,
  Loader2,
  ExternalLink,
  Navigation,
  Compass,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/components/ui/feedback-toasts';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';
import { matchesBeachSearch } from '@/lib/utils/beach-search';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  beachName: string;
  location: string;
  latitude: string | number | null;
  longitude: string | number | null;
  publicMapSlug?: string;
  onSave: (data: { location: string; latitude: string; longitude: string; note?: string }) => Promise<void>;
  requireApprovalNotice?: boolean;
  submitButtonText?: string;
}

const BINONGKALAN_CENTER = { latitude: 10.6341356, longitude: 124.0278661 };

interface OSMPlace {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  osmUrl: string;
}

type PlacesStatus = 'loading' | 'loaded' | 'unavailable';

interface DatabaseBeachListing {
  id: string;
  name: string;
  slug: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
}

export function LocationPickerModal({
  isOpen,
  onClose,
  beachName,
  location,
  latitude,
  longitude,
  publicMapSlug,
  onSave,
  requireApprovalNotice = false,
  submitButtonText,
}: LocationPickerModalProps) {
  const [tempLocation, setTempLocation] = useState(location || '');
  const [tempLat, setTempLat] = useState(
    getValidBeachCoordinates(latitude, longitude)?.latitude.toString() || ''
  );
  const [tempLng, setTempLng] = useState(
    getValidBeachCoordinates(latitude, longitude)?.longitude.toString() || ''
  );
  const [requesterNote, setRequesterNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<OSMPlace[]>([]);
  const [placesStatus, setPlacesStatus] = useState<PlacesStatus>('loading');
  const [databaseBeaches, setDatabaseBeaches] = useState<DatabaseBeachListing[]>([]);
  const [databaseBeachesError, setDatabaseBeachesError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const placesLayerRef = useRef<any>(null);
  const databaseBeachesLayerRef = useRef<any>(null);
  const matchingDatabaseBeaches = useMemo(
    () => databaseBeaches.filter((beach) => matchesBeachSearch(beach, tempLocation)),
    [databaseBeaches, tempLocation]
  );

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const loadDatabaseBeaches = async () => {
      try {
        const response = await fetch('/api/beaches', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || 'Failed to load database beach listings.');
        }
        if (active) {
          setDatabaseBeaches(data);
          setDatabaseBeachesError(null);
        }
      } catch (error: unknown) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Failed to load database beach listings.';
        console.error('Unable to load database beaches in the location picker:', error);
        setDatabaseBeachesError(message);
      }
    };

    void loadDatabaseBeaches();
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const map = leafletMapRef.current;
    const L = LRef.current;
    if (!isOpen || !mapLoaded || !map || !L) return;

    const layer = L.layerGroup().addTo(map);
    databaseBeachesLayerRef.current = layer;
    databaseBeaches.forEach((beach) => {
      const coordinates = getValidBeachCoordinates(beach.latitude, beach.longitude);
      if (!coordinates) return;

      const marker = L.circleMarker([coordinates.latitude, coordinates.longitude], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: '#1f3f74',
        fillOpacity: 1,
      }).addTo(layer);
      marker.bindTooltip(beach.name);
      marker.on('click', () => {
        map.setView([coordinates.latitude, coordinates.longitude], 17, { animate: true });
      });
    });

    return () => {
      layer.remove();
      if (databaseBeachesLayerRef.current === layer) {
        databaseBeachesLayerRef.current = null;
      }
    };
  }, [isOpen, mapLoaded, databaseBeaches]);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const hasCoordinates = Boolean(getValidBeachCoordinates(latitude, longitude));
      setTempLocation(location || '');
      setTempLat(hasCoordinates ? String(latitude) : '');
      setTempLng(hasCoordinates ? String(longitude) : '');
      setRequesterNote('');
      setPinConfirmed(hasCoordinates);
    }
  }, [isOpen, location, latitude, longitude]);

  // Initialize or update Leaflet map when modal is open
  useEffect(() => {
    if (!isOpen) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
      setMapLoaded(false);
      return;
    }

    let isSubscribed = true;
    const placesController = new AbortController();

    import('leaflet').then((leafletModule) => {
      if (!isSubscribed) return;
      const L = leafletModule.default;
      LRef.current = L;

      const savedCoordinates = getValidBeachCoordinates(latitude, longitude);
      const hasSavedCoordinates = Boolean(savedCoordinates);
      const initialLat = savedCoordinates?.latitude ?? BINONGKALAN_CENTER.latitude;
      const initialLng = savedCoordinates?.longitude ?? BINONGKALAN_CENTER.longitude;

      if (!mapContainerRef.current) return;

      // Clean up previous map if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }

      // Create SVG beach pin icon
      const pinIcon = L.divIcon({
        className: 'owner-picker-pin',
        html: `
          <div style="transform: translate(-50%, -100%); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
            <svg width="36" height="46" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 42 16.2 43.6C16.65 44.05 17.35 44.05 17.8 43.6C19.5 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#0284c7" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
              <circle cx="17" cy="17" r="8.5" fill="#FFFFFF"/>
              <path d="M10.5 16.5C10.5 12.91 13.41 10 17 10C20.59 10 23.5 12.91 23.5 16.5H10.5Z" fill="#0284c7"/>
              <path d="M17 10V16.5M13.5 12C14.5 13.5 14.8 15 14.8 16.5M20.5 12C19.5 13.5 19.2 15 19.2 16.5" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round"/>
              <path d="M17 16.5V22C17 22.8 16.3 23.5 15.5 23.5" stroke="#0284c7" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: hasSavedCoordinates ? 16 : 15,
        zoomControl: true,
      });

      L.tileLayer('https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>',
      }).addTo(map);

      // Add draggable marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);
      const placesLayer = L.layerGroup().addTo(map);
      placesLayerRef.current = placesLayer;

      marker.bindPopup(`<b>${beachName || 'Your Beach'}</b><br/>Drag pin or click map to move`).openPopup();

      // On Drag End
      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setTempLat(pos.lat.toFixed(6));
        setTempLng(pos.lng.toFixed(6));
        setPinConfirmed(true);
      });

      // On Click anywhere on map
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setTempLat(e.latlng.lat.toFixed(6));
        setTempLng(e.latlng.lng.toFixed(6));
        setPinConfirmed(true);
      });

      leafletMapRef.current = map;
      leafletMarkerRef.current = marker;
      setMapLoaded(true);
      setPlacesStatus('loading');
      setNearbyPlaces([]);

      fetch('/api/maps/binongkalan-pois', { signal: placesController.signal })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to load nearby OpenStreetMap places.');
          }
          return data as { places: OSMPlace[]; available: boolean };
        })
        .then(({ places, available }) => {
          if (!isSubscribed) return;
          setNearbyPlaces(places);
          setPlacesStatus(available ? 'loaded' : 'unavailable');

          places.forEach((place) => {
            const placeMarker = L.circleMarker([place.latitude, place.longitude], {
              radius: 5,
              color: '#ffffff',
              weight: 1.5,
              fillColor: place.category === 'Beach' ? '#0891b2' : '#f97316',
              fillOpacity: 0.95,
              bubblingMouseEvents: false,
            }).addTo(placesLayer);
            placeMarker.bindTooltip(place.name, {
              permanent: true,
              direction: 'top',
              offset: [0, -4],
              className: 'osm-place-label',
            });

            const popup = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = place.name;
            const category = document.createElement('div');
            category.textContent = place.category;
            const link = document.createElement('a');
            link.href = place.osmUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View OpenStreetMap record';
            popup.append(title, category, link);
            placeMarker.bindPopup(popup);
          });
        })
        .catch(() => {
          if (!isSubscribed || placesController.signal.aborted) return;
          setPlacesStatus('unavailable');
        });

      // Invalidate size to guarantee tiles render inside modal
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 250);
    });

    return () => {
      isSubscribed = false;
      placesController.abort();
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
        placesLayerRef.current = null;
      }
    };
  }, [isOpen, beachName, latitude, longitude]);

  // Update map pin when inputs change manually
  const updateMapMarker = (latStr: string, lngStr: string, zoom?: number) => {
    const coordinates = getValidBeachCoordinates(latStr, lngStr);
    if (coordinates && leafletMapRef.current && leafletMarkerRef.current) {
      leafletMarkerRef.current.setLatLng([coordinates.latitude, coordinates.longitude]);
      leafletMapRef.current.setView(
        [coordinates.latitude, coordinates.longitude],
        zoom ?? leafletMapRef.current.getZoom(),
        {
        animate: true,
        }
      );
    }
  };

  // 1. Get GPS Location
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setTempLat(lat);
        setTempLng(lng);
        updateMapMarker(lat, lng);
        setPinConfirmed(true);
        setIsLocating(false);
        showToast('🎯 GPS coordinates detected and pin placed!');
      },
      (err) => {
        setIsLocating(false);
        showToast(`Could not acquire GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 2. Geocode from Address
  const handleGeocodeAddress = async () => {
    if (!tempLocation.trim()) {
      showToast('Please type an address or location name first.', 'error');
      return;
    }
    setIsGeocoding(true);
    try {
      const response = await fetch(`/api/maps/geocode?q=${encodeURIComponent(tempLocation.trim())}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OpenStreetMap address search failed.');
      }

      const result = data.results?.[0] as
        | { latitude: number; longitude: number; label: string; precision?: 'area' | 'place' }
        | undefined;
      if (!result || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
        const firstBeachWithCoordinates = matchingDatabaseBeaches.find((beach) =>
          getValidBeachCoordinates(beach.latitude, beach.longitude)
        );
        const coordinates = firstBeachWithCoordinates
          ? getValidBeachCoordinates(firstBeachWithCoordinates.latitude, firstBeachWithCoordinates.longitude)
          : null;
        if (coordinates) {
          leafletMapRef.current?.setView([coordinates.latitude, coordinates.longitude], 16, {
            animate: true,
          });
          showToast(
            `Found ${matchingDatabaseBeaches.length} matching database beach listing(s). Their verified markers are shown separately.`
          );
          return;
        }
        if (matchingDatabaseBeaches.length > 0) {
          showToast(
            `Found ${matchingDatabaseBeaches.length} matching database listing(s), but none have verified coordinates yet.`,
            'error'
          );
          return;
        }
        showToast(
          'No matching mapped place was found in Catmon. Search for Binongkalan, Catmon, or click the map to place your exact pin.',
          'error'
        );
        return;
      }

      if (result.precision === 'area') {
        const lat = result.latitude.toFixed(6);
        const lng = result.longitude.toFixed(6);
        setTempLat(lat);
        setTempLng(lng);
        updateMapMarker(lat, lng, 15);
        setPinConfirmed(false);
        showToast(
          `Located ${result.label}. Matching Dagat Ta Bai listings are shown separately; choose your exact resort entrance before saving.`
        );
      } else {
        const lat = result.latitude.toFixed(6);
        const lng = result.longitude.toFixed(6);
        setTempLat(lat);
        setTempLng(lng);
        updateMapMarker(lat, lng, 17);
        setPinConfirmed(false);
        showToast('Address found. Verify the exact beach entrance before saving.');
      }
    } catch (error: unknown) {
      showToast(
        error instanceof Error
          ? error.message
          : 'OpenStreetMap search failed. You can still place the pin directly on the map.',
        'error'
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  // 3. Save Coordinates & Location
  const handleSave = async () => {
    const parsedLat = parseFloat(tempLat);
    const parsedLng = parseFloat(tempLng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      showToast('Please enter a valid Latitude between -90 and 90.', 'error');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      showToast('Please enter a valid Longitude between -180 and 180.', 'error');
      return;
    }
    if (!tempLocation.trim()) {
      showToast('Please enter a location address.', 'error');
      return;
    }
    if (!pinConfirmed) {
      showToast('Move the pin to your actual beach or resort entrance before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        location: tempLocation.trim(),
        latitude: parsedLat.toFixed(6),
        longitude: parsedLng.toFixed(6),
        note: requesterNote.trim() || undefined,
      });
      showToast(
        requireApprovalNotice
          ? 'Coordinates request submitted to Admin for approval!'
          : 'Beach coordinates & location saved! Pin updated on the map.'
      );
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save location coordinates.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MapPin size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {requireApprovalNotice ? 'Request Coordinates & Map Location Update' : 'Set Beach Map Pin & Coordinates'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {requireApprovalNotice
                  ? 'Position your beach pin on the map. The Admin will review and verify your coordinates.'
                  : 'Position your beach pin on the interactive map so guests can find you.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {requireApprovalNotice && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Admin Approval Required for Coordinates</p>
                <p className="text-amber-700 dark:text-amber-300">
                  Beach owners cannot directly alter live coordinates or map pin locations. Submitting this form sends a request to the Dagat Ta Bai Admin for approval on <strong>Manage Beaches</strong>.
                </p>
              </div>
            </div>
          )}
          {/* Tip Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3.5 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-semibold">How to set your beach location:</p>
              <p className="text-blue-700 dark:text-blue-300">
                Click anywhere on the map or drag the blue marker to your shoreline. You can also type exact coordinates or click <strong>Use GPS Location</strong> if you are currently at your resort.
              </p>
            </div>
          </div>

          {/* Interactive Leaflet Map Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Compass size={14} className="text-blue-600" />
                Interactive Pin Picker Map
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Click map or drag the blue marker to your actual beach
              </span>
            </div>
            <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border-2 border-blue-500/30 dark:border-blue-500/20 shadow-inner bg-gray-100 dark:bg-gray-800">
              <div ref={mapContainerRef} className="w-full h-full" />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading interactive map...</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {pinConfirmed
                ? 'The blue pin shows the current coordinates. Check that it marks your actual beach or resort entrance; nearby labels are real OpenStreetMap records.'
                : 'Map opens at the verified Binongkalan village center. Move the blue pin to your actual beach or resort entrance; nearby labels are real OpenStreetMap records.'}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400" aria-live="polite">
              {placesStatus === 'loading' && 'Loading nearby mapped beaches, resorts, and landmarks...'}
              {placesStatus === 'loaded' && nearbyPlaces.length > 0 &&
                `${nearbyPlaces.length} named OpenStreetMap places shown within about 8 km.`}
              {placesStatus === 'loaded' && nearbyPlaces.length === 0 &&
                'No named beach, resort, or landmark records were found nearby in OpenStreetMap. Roads and coastline remain visible on the map.'}
              {placesStatus === 'unavailable' &&
                'Nearby place labels are temporarily unavailable. The map and pin picker still work normally.'}
            </p>
            {placesStatus === 'loaded' && nearbyPlaces.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-600" />
                  Beaches
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Resorts and landmarks
                </span>
              </div>
            )}
            {databaseBeaches.length > 0 && (
              <p className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                <span className="h-2 w-2 rounded-full bg-[#1f3f74]" />
                {databaseBeaches.length} active Dagat Ta Bai database listing(s) are marked on this map.
              </p>
            )}
          </div>

          {/* Coordinates Inputs & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latitude input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Latitude (°N)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={tempLat}
                  onChange={(e) => {
                    setTempLat(e.target.value);
                    setPinConfirmed(Boolean(getValidBeachCoordinates(e.target.value, tempLng)));
                    updateMapMarker(e.target.value, tempLng);
                  }}
                  placeholder="e.g. 10.634800"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
                  LAT
                </span>
              </div>
              {tempLocation.trim() && (
                <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <p className="sticky top-0 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {databaseBeachesError
                      ? `Database listings unavailable: ${databaseBeachesError}`
                      : `${matchingDatabaseBeaches.length} matching database beach listing(s)`}
                  </p>
                  {matchingDatabaseBeaches.map((beach) => {
                    const coordinates = getValidBeachCoordinates(beach.latitude, beach.longitude);
                    return (
                      <button
                        key={beach.id}
                        type="button"
                        disabled={!coordinates}
                        onClick={() => {
                          if (!coordinates) return;
                          leafletMapRef.current?.setView(
                            [coordinates.latitude, coordinates.longitude],
                            17,
                            { animate: true }
                          );
                        }}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 disabled:cursor-default dark:hover:bg-gray-700"
                      >
                        <span>
                          <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100">
                            {beach.name}
                          </span>
                          <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                            {beach.location || 'Address not provided'}
                          </span>
                        </span>
                        <span className={`shrink-0 text-[10px] font-semibold ${coordinates ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          {coordinates ? 'Verified marker' : 'Coordinates missing'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Longitude input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Longitude (°E)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={tempLng}
                  onChange={(e) => {
                    setTempLng(e.target.value);
                    setPinConfirmed(Boolean(getValidBeachCoordinates(tempLat, e.target.value)));
                    updateMapMarker(tempLat, e.target.value);
                  }}
                  placeholder="e.g. 124.027500"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
                  LNG
                </span>
              </div>
            </div>
          </div>

          {/* Location Address input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Location Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  placeholder="e.g. Binongkalan, Catmon, Cebu, Philippines"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={isGeocoding}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
                title="Search coordinates for this address"
              >
                {isGeocoding ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <Search size={14} />
                )}
                <span>Lookup Address</span>
              </button>
            </div>
          </div>

          {/* Quick Helper Tools */}
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 space-y-2.5">
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Quick Positioning Tools
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {/* GPS Button */}
              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {isLocating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Navigation size={13} />
                )}
                <span>🎯 Use My Current GPS Location</span>
              </button>

              <span className="text-[11px] text-gray-500 dark:text-gray-400 self-center">
                Use the map, address lookup, or GPS for the exact beach location.
              </span>
            </div>
          </div>

          {requireApprovalNotice && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Message / Reason for Admin (Optional)
              </label>
              <textarea
                rows={2}
                value={requesterNote}
                onChange={(e) => setRequesterNote(e.target.value)}
                placeholder="e.g. Moved pin to our main shoreline entrance gate and beachfront parking area."
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>Coordinates:</span>
            <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
              {tempLat && tempLng ? `${tempLat}, ${tempLng}` : 'No pin selected'}
            </span>
            {publicMapSlug && (
              <Link
                href={`/map?beach=${publicMapSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Preview on Map</span>
                <ExternalLink size={12} />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !pinConfirmed}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{requireApprovalNotice ? 'Submitting Request...' : 'Saving Pin...'}</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{submitButtonText || (requireApprovalNotice ? 'Submit for Admin Approval' : 'Save Map Location')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
