'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Navigation,
  ArrowRight,
  AlertCircle,
  Search,
  X,
  RotateCcw,
  Star,
  Loader2,
  Car,
  Bike,
  Footprints,
  Coins,
  Clock,
  MapPin,
  Bus,
  Phone,
  Mail,
} from 'lucide-react';
import { MapView } from '@/components/map/map-view';
import type { BeachRecord } from '@/lib/db/beaches';
import type { RouteResult } from '@/lib/db/routing';
import { SeaRoute } from '@/components/ui/coastal-icons';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';
import { matchesBeachSearch } from '@/lib/utils/beach-search';

function parseEntranceFee(
  entranceFee: string | null,
  adults?: string | null | undefined,
  children?: string | null | undefined,
  senior?: string | null | undefined
): string {
  let a = adults;
  let c = children;
  let s = senior;

  if (entranceFee && entranceFee.includes('|')) {
    const parts = entranceFee.split('|');
    if (!a && parts[0]) a = parts[0];
    if (!c && parts[1]) c = parts[1];
    if (!s && parts[2]) s = parts[2];
  }

  const chunks: string[] = [];
  if (a) chunks.push(`Adults ₱${a}`);
  if (c) chunks.push(`Children ₱${c}`);
  if (s) chunks.push(`Senior ₱${s}`);

  if (chunks.length > 0) return chunks.join(' · ');
  if (!entranceFee) return 'Contact resort';
  return `₱${entranceFee}`;
}

function parseOpeningHoursSummary(openingHours: string | any): string {
  try {
    const hours = typeof openingHours === 'string' ? JSON.parse(openingHours) : openingHours;
    if (!hours) return '6:00 AM - 7:00 PM';
    const sample = hours['Mon'] || hours['Sun'] || Object.values(hours)[0];
    return sample ? `Daily · ${sample}` : '6:00 AM - 7:00 PM';
  } catch {
    return 'Daily · 6:00 AM - 7:00 PM';
  }
}

export default function MapPage() {
  const searchParams = useSearchParams();
  const selectedSlugFromUrl = searchParams.get('beach');

  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [selectedBeach, setSelectedBeach] = useState<BeachRecord | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'mapped' | 'missing'>('all');
  const [beachLoadError, setBeachLoadError] = useState<string | null>(null);
  const [beachReloadTrigger, setBeachReloadTrigger] = useState(0);
  const [searchMapCenter, setSearchMapCenter] = useState<[number, number] | null>(null);
  const [travelMode, setTravelMode] = useState<'car' | 'motorcycle' | 'commute' | 'walking'>('car');
  const [showFullAbout, setShowFullAbout] = useState(false);

  // Route calculation states
  const [routeActive, setRouteActive] = useState(false);
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Refresh from the database so owner edits appear without redeploying or reloading the map.
  useEffect(() => {
    let active = true;
    const refreshBeaches = async () => {
      try {
        const response = await fetch('/api/beaches', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || 'Unable to load beach listings.');
        }
        if (!active) return;

        const latestBeaches = data as BeachRecord[];
        setBeaches(latestBeaches);
        setBeachLoadError(null);
        setSelectedBeach((current) => {
          if (current) {
            return latestBeaches.find((beach) => beach.id === current.id) || null;
          }
          if (selectedSlugFromUrl) {
            return latestBeaches.find(
              (beach) => beach.slug === selectedSlugFromUrl || beach.id === selectedSlugFromUrl
            ) || null;
          }
          return null;
        });
      } catch (error: unknown) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load beach listings.';
        console.error('Error fetching beaches:', error);
        setBeachLoadError(message);
      }
    };

    void refreshBeaches();
    const intervalId = window.setInterval(() => void refreshBeaches(), 30_000);
    window.addEventListener('focus', refreshBeaches);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshBeaches);
    };
  }, [selectedSlugFromUrl, beachReloadTrigger]);

  useEffect(() => {
    if (!/\b(binongkalan|catmon)\b/i.test(searchQuery)) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/maps/geocode?q=${encodeURIComponent(searchQuery.trim())}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to locate the searched area.');
        const result = data.results?.[0];
        if (
          result &&
          Number.isFinite(result.latitude) &&
          Number.isFinite(result.longitude)
        ) {
          setSearchMapCenter([result.latitude, result.longitude]);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        console.error('Unable to center the map on the searched area:', error);
      }
    }, 750);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  // 2. Geolocation with Real-time GPS Watching
  const handleLocateMe = (onSuccess?: (loc: { lat: number; lng: number }) => void) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    setLocating(true);
    setLocationError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocating(false);
        if (onSuccess) onSuccess(loc);
      },
      (error) => {
        let errorMsg = 'Unable to detect location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access in browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out. Please try again.';
            break;
          default:
            errorMsg = 'Unable to detect location. Please check your permissions.';
        }
        setLocationError(errorMsg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    setWatchId(id);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  // 3. Real road route calculation using OSRM engine
  // STRICT RULE: Only executed when user explicitly clicks "Calculate Route"! NEVER AUTOMATICALLY!
  const executeRouteCalculation = async (
    originLoc: { lat: number; lng: number },
    destBeach: BeachRecord
  ) => {
    const coordinates = getValidBeachCoordinates(destBeach.latitude, destBeach.longitude);
    if (!coordinates) {
      setLocationError('This beach does not have verified map coordinates yet.');
      return;
    }

    setRoutingLoading(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originLoc,
          destination: { lat: coordinates.latitude, lng: coordinates.longitude },
          travelMode,
        }),
      });

      if (!res.ok) {
        throw new Error('Routing service could not calculate route.');
      }

      const data: RouteResult = await res.json();
      setRouteData(data);
      setRouteActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Route calculation failed.';
      setLocationError(msg);
    } finally {
      setRoutingLoading(false);
    }
  };

  // Explicit User Action: Calculate Route
  const handleCalculateRoute = () => {
    if (!selectedBeach) return;
    if (!getValidBeachCoordinates(selectedBeach.latitude, selectedBeach.longitude)) {
      setLocationError('This beach does not have verified map coordinates yet.');
      return;
    }

    if (userLocation) {
      executeRouteCalculation(userLocation, selectedBeach);
    } else {
      handleLocateMe((loc) => {
        executeRouteCalculation(loc, selectedBeach);
      });
    }
  };

  // Explicit User Action: Clear Route - stays cleared permanently
  const handleClearRoute = () => {
    setRouteActive(false);
    setRouteData(null);
  };

  // Search all active listings, including those that cannot yet be pinned.
  const filteredBeaches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return beaches.filter(
      (beach) => {
        const hasCoordinates = Boolean(
          getValidBeachCoordinates(beach.latitude, beach.longitude)
        );
        if (locationFilter === 'mapped' && !hasCoordinates) return false;
        if (locationFilter === 'missing' && hasCoordinates) return false;
        if (!q) return true;
        return matchesBeachSearch(beach, q);
      }
    );
  }, [beaches, searchQuery, locationFilter]);

  const selectedBeachImages = useMemo(() => {
    if (!selectedBeach) return [];
    return Array.from(new Set([
      selectedBeach.cover_image,
      ...selectedBeach.images.map((image) => image.photo_url),
    ].filter((image): image is string => Boolean(image))));
  }, [selectedBeach]);
  const selectedBeachCoordinates = selectedBeach
    ? getValidBeachCoordinates(selectedBeach.latitude, selectedBeach.longitude)
    : null;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden flex flex-col bg-slate-100 dark:bg-black">
      {/* 1. TOP FLOATING SEARCH & ACTION BAR (OBLONG / ROUNDED-FULL, Shifts smoothly on desktop when Sidebar docks) */}
      <div className={`absolute top-3 sm:top-4 left-3 right-3 transition-all duration-300 ${selectedBeach && !routeActive ? 'sm:left-[445px]' : 'sm:left-6'} sm:right-6 z-30 pointer-events-none`}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Oblong Search Input Box */}
          <div className="relative flex-1 pointer-events-auto bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-full shadow-md border border-slate-200 dark:border-neutral-800 flex items-center px-4 py-2.5">
            <Search className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA] mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSelectedBeach(null);
                setSearchMapCenter(null);
                setSearchQuery(e.target.value);
              }}
              placeholder="Search beaches or resorts..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:italic focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white ml-2 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Oblong Locate Me (GPS) Button */}
          <button
            type="button"
            onClick={() => handleLocateMe()}
            disabled={locating}
            className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-md transition-colors flex-shrink-0 cursor-pointer"
            title="Detect Current GPS Location"
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{userLocation ? 'GPS Located' : 'Locate Me'}</span>
          </button>
        </div>
        {(searchQuery.trim() || locationFilter !== 'all') && (
          <div className="max-w-2xl mx-auto mt-2 max-h-[45vh] overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95 pointer-events-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 px-2 py-1.5 text-[11px] text-slate-600 dark:bg-neutral-900/95 dark:text-neutral-300">
              <span>{filteredBeaches.length} matching beach listings</span>
              <label className="flex items-center gap-2">
                <span>Map filter</span>
                <select
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value as typeof locationFilter)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="all">All listings</option>
                  <option value="mapped">With map location</option>
                  <option value="missing">Needs map location</option>
                </select>
              </label>
            </div>
            {filteredBeaches.length > 0 ? (
              filteredBeaches.map((beach) => {
                const hasCoordinates = Boolean(
                  getValidBeachCoordinates(beach.latitude, beach.longitude)
                );
                return (
                  <button
                    key={beach.id}
                    type="button"
                    onClick={() => setSelectedBeach(beach)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-neutral-800"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                        {beach.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-neutral-400">
                        {beach.location || 'Address not provided'}
                      </span>
                    </span>
                    <span className={`shrink-0 text-[10px] font-semibold ${hasCoordinates ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {hasCoordinates ? 'Mapped' : 'Map location missing'}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-center text-xs text-slate-500 dark:text-neutral-400">
                No listings match this search and filter.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Geolocation Notice if Error (Oblong) */}
      {beachLoadError && (
        <div className="absolute top-20 left-1/2 z-30 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-red-700 px-4 py-3 text-xs font-medium text-white shadow-lg pointer-events-auto">
          <span>Beach listings could not be loaded: {beachLoadError}</span>
          <button
            type="button"
            onClick={() => setBeachReloadTrigger((value) => value + 1)}
            className="shrink-0 underline"
          >
            Retry
          </button>
        </div>
      )}
      {locationError && (
        <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] bg-red-600 text-white text-xs font-medium px-5 py-2.5 rounded-full shadow-lg flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
          <button type="button" onClick={() => setLocationError(null)} aria-label="Dismiss error" className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. ACTIVE ROUTE BANNER (White in light mode, Dark in dark mode, Flat corners rounded-none, No blinking green light, Dive button) */}
      {routeActive && selectedBeach && routeData && (
        <div className="absolute top-20 left-3 right-3 sm:left-6 sm:right-6 z-30 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto bg-white/95 dark:bg-black/95 text-slate-900 dark:text-white backdrop-blur-md p-4 rounded-none shadow-2xl border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0 text-[#1F3F74] dark:text-[#4987BA] shadow-sm">
                {travelMode === 'motorcycle' ? (
                  <Bike className="w-5 h-5" />
                ) : travelMode === 'commute' ? (
                  <Bus className="w-5 h-5" />
                ) : travelMode === 'walking' ? (
                  <Footprints className="w-5 h-5" />
                ) : (
                  <Car className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <span>Your Location</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#4987BA]" />
                  <span>{selectedBeach.name}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-neutral-400 flex items-center gap-2 pt-0.5">
                  <span>Distance: <strong className="text-slate-900 dark:text-white">{routeData.distanceKm} km</strong></span>
                  <span>&bull;</span>
                  <span>Est. Time: <strong className="text-slate-900 dark:text-white">{routeData.durationFormatted}</strong></span>
                </div>
              </div>
            </div>

            {/* Clear Route Oblong Button: Solid Dive Blue */}
            <button
              type="button"
              onClick={handleClearRoute}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] text-white text-xs font-bold rounded-full transition-colors self-end sm:self-center cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Route</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. FULL-VIEWPORT INTERACTIVE MAP */}
      <div className="w-full h-full">
        <MapView
          beaches={filteredBeaches}
          userLocation={userLocation}
          onSelectBeach={(b) => setSelectedBeach(b)}
          selectedBeachId={selectedBeach?.id}
          routeActive={routeActive}
          routeCoordinates={routeData?.coordinates || null}
          travelMode={travelMode}
          center={selectedBeachCoordinates
            ? [selectedBeachCoordinates.latitude, selectedBeachCoordinates.longitude]
            : searchMapCenter || [10.6348, 124.0275]}
          zoom={selectedBeachCoordinates ? 16 : 15}
        />
      </div>

      {/* 4. DOCKED SIDEBAR (Desktop) & BOTTOM-SHEET DRAWER (Mobile) FOR BEACH DETAILS */}
      {selectedBeach && !routeActive && (
        <aside
          aria-label={`${selectedBeach.name} beach details`}
          className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] rounded-t-3xl bg-white/98 dark:bg-[#0c1424]/98 backdrop-blur-xl border-t border-slate-200/90 dark:border-neutral-800 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-bottom duration-300 overflow-hidden sm:fixed-none sm:absolute sm:inset-auto sm:top-0 sm:left-0 sm:bottom-0 sm:h-full sm:max-h-full sm:w-[410px] md:w-[430px] sm:rounded-none sm:border-t-0 sm:border-r sm:slide-in-from-left"
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700 mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

          {/* Sidebar Top Header: Title, Location & Close Action (No card background, no border-b) */}
          <div className="px-4 pt-3 pb-2 sm:px-5 sm:pt-4 sm:pb-2.5 flex items-start justify-between gap-3 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-lg sm:text-xl text-[#1F3F74] dark:text-[#38BDF8] font-sans truncate tracking-tight">
                {selectedBeach.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                <Navigation className="w-3 h-3 text-[#1F3F74] dark:text-[#38BDF8] flex-shrink-0" />
                <span>{selectedBeach.location || 'Binongkalan, Catmon, Cebu'}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBeach(null)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white cursor-pointer transition-colors shrink-0"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body: Virtual Tour Preview, Entrance Fee, Hours, Travel Mode, Description */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {/* 360 Virtual Tour / Cover Image Preview Banner (Flat corners / rounded-none as requested) */}
            <div className="relative w-full h-48 sm:h-52 rounded-none overflow-hidden bg-slate-950 shadow-md border border-slate-200/80 dark:border-neutral-800 flex-shrink-0">
              {selectedBeach.virtual_tour_url ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={selectedBeach.virtual_tour_url}
                    title={`${selectedBeach.name} 360 Virtual Tour`}
                    className="w-full h-full border-0 pointer-events-auto"
                    allow="accelerometer; gyroscope; magnetometer; fullscreen"
                    loading="lazy"
                  />
                </div>
              ) : selectedBeach.cover_image || selectedBeach.images?.[0]?.photo_url ? (
                <div className="relative w-full h-full">
                  <Image
                    src={selectedBeach.cover_image || selectedBeach.images[0].photo_url}
                    alt={selectedBeach.name}
                    fill
                    className="object-cover"
                    sizes="430px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1F3F74] to-[#0f213d] text-white p-4 text-center">
                  <Navigation className="w-8 h-8 text-sky-300 mb-1" />
                  <span className="text-xs font-bold text-white tracking-wide">{selectedBeach.name}</span>
                  <span className="text-[10px] text-blue-200">
                    {selectedBeach.location || 'Location not provided'}
                  </span>
                </div>
              )}

              {/* Floating Rating Pill Top-Right */}
              {selectedBeach.average_rating > 0 && (
                <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-white/10 shadow-sm z-10 pointer-events-none">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{selectedBeach.average_rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* 1. About Description (with See more / See less) */}
            {selectedBeach.description && (
              <div className="pt-1">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  About
                </span>
                <p className={`text-xs text-slate-600 dark:text-neutral-300 leading-relaxed ${showFullAbout ? '' : 'line-clamp-3'}`}>
                  {selectedBeach.description}
                </p>
                {selectedBeach.description.length > 130 && (
                  <button
                    type="button"
                    onClick={() => setShowFullAbout(!showFullAbout)}
                    className="mt-1 text-[11px] font-bold text-[#1F3F74] dark:text-[#38BDF8] hover:underline cursor-pointer"
                  >
                    {showFullAbout ? 'See less' : 'See more'}
                  </button>
                )}
              </div>
            )}

            {/* 2. Official Contact Information */}
            {(selectedBeach.contact_phone || selectedBeach.contact_email) && (
              <div className="space-y-1.5 pt-0.5 text-xs">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  Contact Information
                </span>
                {selectedBeach.contact_phone && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#38BDF8] shrink-0" />
                    <span>+63 {selectedBeach.contact_phone}</span>
                  </div>
                )}
                {selectedBeach.contact_email && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-[#1F3F74] dark:text-[#38BDF8] shrink-0" />
                    <span className="truncate">{selectedBeach.contact_email}</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. Operating Hours */}
            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200/90 dark:border-neutral-800 rounded-xl text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1F3F74] dark:text-[#38BDF8]" />
                <span>Operating Hours</span>
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {parseOpeningHoursSummary(selectedBeach.opening_hours)}
              </span>
            </div>

            {/* 4. Entrance Fee */}
            {selectedBeach.entrance_fee && (
              <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200/90 dark:border-neutral-800 rounded-xl text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Entrance Fee
                </span>
                <span className="font-extrabold text-[#1F3F74] dark:text-[#38BDF8]">
                  {parseEntranceFee(selectedBeach.entrance_fee, selectedBeach.entrance_fee_adults, selectedBeach.entrance_fee_children, selectedBeach.entrance_fee_senior)}
                </span>
              </div>
            )}

            {/* 5. Travel Mode Vector Selector (Car, Motorcycle, Commute, Walking) */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Travel Mode
              </span>
              <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Travel mode">
                <button
                  type="button"
                  onClick={() => setTravelMode('car')}
                  aria-pressed={travelMode === 'car'}
                  className={`rounded-full border py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    travelMode === 'car'
                      ? 'border-[#1F3F74] bg-[#1F3F74] text-white shadow-xs'
                      : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Car</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode('motorcycle')}
                  aria-pressed={travelMode === 'motorcycle'}
                  className={`rounded-full border py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    travelMode === 'motorcycle'
                      ? 'border-[#1F3F74] bg-[#1F3F74] text-white shadow-xs'
                      : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode('commute')}
                  aria-pressed={travelMode === 'commute'}
                  className={`rounded-full border py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    travelMode === 'commute'
                      ? 'border-[#1F3F74] bg-[#1F3F74] text-white shadow-xs'
                      : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>Commute</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode('walking')}
                  aria-pressed={travelMode === 'walking'}
                  className={`rounded-full border py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    travelMode === 'walking'
                      ? 'border-[#1F3F74] bg-[#1F3F74] text-white shadow-xs'
                      : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Walk</span>
                </button>
              </div>
            </div>

            {!selectedBeachCoordinates && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                No verified map coordinates are available for this listing, so it is not shown as a marker.
                <Link href="/owner/beach" className="ml-1 font-bold underline">
                  Owners can update its map location.
                </Link>
              </div>
            )}
            {selectedBeachImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Beach photos">
                {selectedBeachImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={image}
                      alt={`${selectedBeach.name} photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Bar: View Details & Calculate Route */}
          <div className="p-4 sm:p-5 bg-white/95 dark:bg-[#0c1424]/95 border-t border-slate-100 dark:border-neutral-800/80 flex items-center gap-2.5 flex-shrink-0">
            {/* View Details button (Oblong secondary) */}
            <Link
              href={`/beaches/${selectedBeach.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 border-2 border-[#1F3F74] dark:border-[#38BDF8] bg-transparent hover:bg-slate-50 dark:hover:bg-neutral-900 text-[#1F3F74] dark:text-[#38BDF8] text-xs font-bold rounded-full transition-colors text-center cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Calculate Route button (Oblong primary Dive Blue) */}
            <button
              type="button"
              onClick={handleCalculateRoute}
              disabled={routingLoading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] disabled:opacity-50 text-white text-xs font-bold rounded-full transition-colors shadow-md cursor-pointer"
            >
              {routingLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SeaRoute size={14} />
              )}
              <span>{routingLoading ? 'Calculating...' : 'Calculate Route'}</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
