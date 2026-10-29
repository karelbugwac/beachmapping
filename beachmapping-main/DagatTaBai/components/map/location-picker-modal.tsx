'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/components/ui/feedback-toasts';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  beachName: string;
  location: string;
  latitude: string | number;
  longitude: string | number;
  publicMapSlug?: string;
  onSave: (data: { location: string; latitude: string; longitude: string }) => Promise<void>;
}

// Preset locations along Catmon coast for quick reference
const CATMON_PRESETS = [
  { name: 'Binongkalan Center', lat: '10.634800', lng: '124.027500' },
  { name: 'North Shoreline (LiteBay)', lat: '10.642500', lng: '124.030200' },
  { name: 'Hinagdan Point', lat: '10.638800', lng: '124.029200' },
  { name: 'Majestique Cove', lat: '10.646800', lng: '124.031500' },
];

export function LocationPickerModal({
  isOpen,
  onClose,
  beachName,
  location,
  latitude,
  longitude,
  publicMapSlug,
  onSave,
}: LocationPickerModalProps) {
  const [tempLocation, setTempLocation] = useState(location || '');
  const [tempLat, setTempLat] = useState(String(latitude || '10.634800'));
  const [tempLng, setTempLng] = useState(String(longitude || '124.027500'));
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setTempLocation(location || '');
      setTempLat(String(latitude || '10.634800'));
      setTempLng(String(longitude || '124.027500'));
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

    import('leaflet').then((leafletModule) => {
      if (!isSubscribed) return;
      const L = leafletModule.default;
      LRef.current = L;

      const initialLat = parseFloat(tempLat) || 10.6348;
      const initialLng = parseFloat(tempLng) || 124.0275;

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
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Add draggable marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      marker.bindPopup(`<b>${beachName || 'Your Beach'}</b><br/>Drag pin or click map to move`).openPopup();

      // On Drag End
      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setTempLat(pos.lat.toFixed(6));
        setTempLng(pos.lng.toFixed(6));
      });

      // On Click anywhere on map
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setTempLat(e.latlng.lat.toFixed(6));
        setTempLng(e.latlng.lng.toFixed(6));
      });

      leafletMapRef.current = map;
      leafletMarkerRef.current = marker;
      setMapLoaded(true);

      // Invalidate size to guarantee tiles render inside modal
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 250);
    });

    return () => {
      isSubscribed = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
    };
  }, [isOpen, beachName]);

  // Update map pin when inputs change manually
  const updateMapMarker = (latStr: string, lngStr: string) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng) && leafletMapRef.current && leafletMarkerRef.current) {
      leafletMarkerRef.current.setLatLng([lat, lng]);
      leafletMapRef.current.setView([lat, lng], leafletMapRef.current.getZoom(), {
        animate: true,
      });
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
      const q = encodeURIComponent(`${tempLocation.trim()}, Catmon, Cebu, Philippines`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        setTempLat(lat);
        setTempLng(lng);
        updateMapMarker(lat, lng);
        showToast('📍 Found coordinates from address!');
      } else {
        // Fallback search with raw text
        const res2 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(tempLocation.trim())}&limit=1`
        );
        const data2 = await res2.json();
        if (data2 && data2.length > 0) {
          const lat = parseFloat(data2[0].lat).toFixed(6);
          const lng = parseFloat(data2[0].lon).toFixed(6);
          setTempLat(lat);
          setTempLng(lng);
          updateMapMarker(lat, lng);
          showToast('📍 Found coordinates from address!');
        } else {
          showToast('Address not found on OpenStreetMap. You can click on the map directly.', 'error');
        }
      }
    } catch {
      showToast('Error looking up address. You can click on the map to set pin.', 'error');
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

    setIsSaving(true);
    try {
      await onSave({
        location: tempLocation.trim(),
        latitude: parsedLat.toFixed(6),
        longitude: parsedLng.toFixed(6),
      });
      showToast('Beach coordinates & location saved! Pin updated on the map.');
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
                Set Beach Map Pin & Coordinates
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Position your beach pin on the interactive map so guests can find you.
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
                Click map or drag marker to set coordinates
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
                    updateMapMarker(e.target.value, tempLng);
                  }}
                  placeholder="e.g. 10.634800"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 dark:text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
                  LAT
                </span>
              </div>
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

              {/* Presets */}
              {CATMON_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setTempLat(preset.lat);
                    setTempLng(preset.lng);
                    updateMapMarker(preset.lat, preset.lng);
                    showToast(`📍 Set coordinates to ${preset.name}`);
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-xs transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>Coordinates:</span>
            <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
              {tempLat}, {tempLng}
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
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Pin...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Map Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
