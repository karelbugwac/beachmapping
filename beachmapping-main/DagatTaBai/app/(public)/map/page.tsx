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
  Clock,
  Star,
  Loader2,
  Car,
  Bike,
  Footprints,
  MapPin,
  Coins,
  Home,
  CircleDot,
} from 'lucide-react';
import { MapView, getBeachPinColor } from '@/components/map/map-view';
import type { BeachRecord } from '@/lib/db/beaches';
import type { RouteResult } from '@/lib/db/routing';
import { SeaRoute, ShorelineMarker } from '@/components/ui/coastal-icons';

// Helper functions for parsing beach data
function parseOpeningHours(openingHours: string | any): { isOpen: boolean; status: string } {
  try {
    const hours = typeof openingHours === 'string' ? JSON.parse(openingHours) : openingHours;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = days[new Date().getDay()];
    const todayHours = hours?.[today];
    
    if (!todayHours) {
      return { isOpen: false, status: 'Closed' };
    }
    
    // Extract closing time
    const closingMatch = todayHours.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
    const closingTime = closingMatch ? closingMatch[1] : '';
    
    return {
      isOpen: true,
      status: closingTime ? `Open now · closes ${closingTime}` : 'Open now'
    };
  } catch {
    return { isOpen: false, status: 'Closed' };
  }
}

function parseEntranceFee(entranceFee: string | null, adults: string | null | undefined, children: string | null | undefined): string {
  if (adults && children) {
    return `Adults ₱${adults}, Children ₱${children}`;
  }
  if (!entranceFee) return 'Not set';
  if (entranceFee.includes('|')) {
    const [adults, children] = entranceFee.split('|');
    return `Adults ₱${adults}, Children ₱${children}`;
  }
  return `₱${entranceFee}`;
}

function parseCottageFee(cottageFee: string | null): string {
  if (!cottageFee) return '';
  const num = parseFloat(cottageFee.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return `₱${cottageFee}`;
  return `From ₱${num.toLocaleString()}`;
}

function parseOpeningHoursFull(openingHours: string | any): { day: string; time: string }[] {
  try {
    const hours = typeof openingHours === 'string' ? JSON.parse(openingHours) : openingHours;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Group consecutive days with same time
    const groups: { time: string; days: string[] }[] = [];
    let currentGroup: { time: string; days: string[] } | null = null;
    
    days.forEach(day => {
      const time = hours?.[day] || 'Closed';
      if (!currentGroup || currentGroup.time !== time) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { time, days: [day] };
      } else {
        currentGroup.days.push(day);
      }
    });
    if (currentGroup) groups.push(currentGroup);
    
    // Convert groups to day ranges
    return groups.map(group => {
      const dayRange = group.days.length === 1 
        ? group.days[0] 
        : `${group.days[0]} - ${group.days[group.days.length - 1]}`;
      return { day: dayRange, time: group.time };
    });
  } catch {
    return [];
  }
}

export default function InteractiveMapPage() {
  const searchParams = useSearchParams();
  const beachIdFromUrl = searchParams.get('beach');

  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [loadingBeaches, setLoadingBeaches] = useState(true);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedBeach, setSelectedBeach] = useState<BeachRecord | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Routing state
  const [routeActive, setRouteActive] = useState(false);
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<'car' | 'motorcycle' | 'walking'>('car');

  // 1. Fetch real beaches from database API
  useEffect(() => {
    const fetchBeaches = () => {
      fetch('/api/beaches')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setBeaches(data);
          }
        })
        .catch((err) => {
          console.error('Failed to load beaches:', err);
        })
        .finally(() => {
          setLoadingBeaches(false);
        });
    };

    fetchBeaches();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchBeaches, 10000);

    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBeaches();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-select beach from URL parameter (supports both UUID id and human-readable slug)
  useEffect(() => {
    if (beachIdFromUrl && beaches.length > 0) {
      const beach = beaches.find(
        (b) => b.id === beachIdFromUrl || b.slug === beachIdFromUrl
      );
      if (beach) {
        setSelectedBeach(beach);
      }
    }
  }, [beachIdFromUrl, beaches]);

  // Update selectedBeach when beaches data changes (for real-time updates)
  useEffect(() => {
    if (selectedBeach && beaches.length > 0) {
      const updatedBeach = beaches.find((b) => b.id === selectedBeach.id);
      console.log('Map page - Checking for update:', {
        selectedBeachId: selectedBeach.id,
        foundUpdatedBeach: !!updatedBeach,
        currentEntranceFee: selectedBeach.entrance_fee_adults,
        newEntranceFee: updatedBeach?.entrance_fee_adults,
        currentOpeningHours: selectedBeach.opening_hours,
        newOpeningHours: updatedBeach?.opening_hours,
      });
      if (updatedBeach) {
        setSelectedBeach(updatedBeach);
      }
    }
  }, [beaches]);

  // 2. Geolocation handler with real-time tracking
  const handleLocateMe = (onSuccess?: (loc: { lat: number; lng: number }) => void) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    // Stop existing watch if any
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    setLocating(true);
    setLocationError(null);

    // Use watchPosition for real-time tracking
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocating(false);
        if (onSuccess) {
          onSuccess(loc);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let errorMsg = 'Unable to detect location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out. Please try again.';
            break;
          default:
            errorMsg = 'Unable to detect location. Please check your browser location permissions.';
        }
        
        setLocationError(errorMsg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    setWatchId(id);
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // 3. Real road route calculation using OSRM engine
  const executeRouteCalculation = async (
    originLoc: { lat: number; lng: number },
    destBeach: BeachRecord
  ) => {
    setRoutingLoading(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originLoc,
          destination: {
            lat: destBeach.latitude,
            lng: destBeach.longitude,
          },
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

  // Auto-calculate route when beach is selected (if GPS is available)
  useEffect(() => {
    if (selectedBeach && userLocation && !routeActive) {
      executeRouteCalculation(userLocation, selectedBeach);
    }
  }, [selectedBeach?.id, userLocation]);

  // Recalculate route when GPS location changes (if route is active)
  useEffect(() => {
    if (routeActive && selectedBeach && userLocation) {
      executeRouteCalculation(userLocation, selectedBeach);
    }
  }, [userLocation]);

  const handleCalculateRoute = () => {
    if (!selectedBeach) return;

    if (userLocation) {
      executeRouteCalculation(userLocation, selectedBeach);
    } else {
      handleLocateMe((loc) => {
        executeRouteCalculation(loc, selectedBeach);
      });
    }
  };

  const handleClearRoute = () => {
    setRouteActive(false);
    setRouteData(null);
  };

  // Filter beaches by search query
  const filteredBeaches = useMemo(() => {
    if (!searchQuery.trim()) return beaches;
    const q = searchQuery.toLowerCase();
    return beaches.filter(
      (b) => b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q)
    );
  }, [beaches, searchQuery]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden flex flex-col bg-sand-100 dark:bg-ocean-950">
      {/* 1. TOP FLOATING SEARCH & ACTION BAR */}
      <div className="absolute top-3 sm:top-4 left-3 right-3 sm:left-6 sm:right-6 z-30 pointer-events-none">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Search Input Box */}
          <div className="relative flex-1 pointer-events-auto bg-sand-50/95 dark:bg-ocean-900/95 backdrop-blur-md rounded-xl shadow-sm border border-sand-300 dark:border-ocean-800 flex items-center px-3.5 py-2">
            <Search className="w-4 h-4 text-sand-500 dark:text-sand-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Binongkalan beaches or resorts..."
              className="w-full bg-transparent text-xs sm:text-sm text-ocean-950 dark:text-sand-50 placeholder:text-sand-500 dark:placeholder:text-sand-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-sand-500 hover:text-ocean-950 dark:hover:text-white ml-2"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Locate Me (GPS) Button */}
          <button
            type="button"
            onClick={() => handleLocateMe()}
            disabled={locating}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-ocean-900 hover:bg-ocean-950 dark:bg-ocean-700 dark:hover:bg-ocean-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex-shrink-0"
            title="Detect Current GPS Location"
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{userLocation ? 'GPS Located' : 'Locate Me'}</span>
          </button>
        </div>
      </div>

      {/* Geolocation Notice if Error */}
      {locationError && (
        <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] bg-amber-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
          <button type="button" onClick={() => setLocationError(null)} aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. ROUTE MODE BANNER: Displays real distance, drive time, and clear button */}
      {routeActive && selectedBeach && routeData && (
        <div className="absolute top-20 left-3 right-3 sm:left-6 sm:right-6 z-30 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto bg-ocean-950/95 text-sand-50 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-ocean-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                <SeaRoute size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Active Route · {routeData.travelMode}
                </div>
                <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white">
                  <span>GPS Origin</span>
                  <span className="text-sky-400">&rarr;</span>
                  <span>{selectedBeach.name}</span>
                </div>
                <div className="text-xs text-sand-300 flex items-center gap-3 pt-0.5">
                  <span>
                    Distance: <strong className="text-white">{routeData.distanceKm} km</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Est. Travel Time: <strong className="text-white">{routeData.durationFormatted}</strong>
                    {routeData.durationIsEstimated && <span className="ml-1 text-sand-300">(estimated)</span>}
                  </span>
                </div>
                {routeData.provider === 'Geodesic Calculation' && (
                  <p className="text-[11px] text-amber-200">Road routing is unavailable. Distance is straight-line and travel time is approximate.</p>
                )}
                {routeData.durationIsEstimated && routeData.provider !== 'Geodesic Calculation' && routeData.travelMode === 'Motorcycle' && (
                  <p className="text-[11px] text-sky-100">Motorcycle travel time is estimated from routed road distance.</p>
                )}
                {routeData.durationIsEstimated && routeData.provider !== 'Geodesic Calculation' && routeData.travelMode === 'Walking' && (
                  <p className="text-[11px] text-sky-100">Walking time is estimated from routed distance.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearRoute}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-ocean-900 hover:bg-ocean-800 text-sand-200 text-xs font-semibold rounded-xl border border-ocean-700 transition-colors flex-shrink-0"
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
          center={selectedBeach ? [selectedBeach.latitude, selectedBeach.longitude] : [10.6348, 124.0275]}
          zoom={selectedBeach ? 16 : 15}
        />
      </div>

      {/* 4. SINGLE CLEAR SELECTED BEACH INTERACTION CARD */}
      {selectedBeach && !routeActive && (
        <div className="absolute bottom-6 left-3 right-3 sm:left-6 sm:right-auto sm:w-[380px] z-30 pointer-events-auto">
          <div className="bg-sand-50/98 dark:bg-ocean-900/98 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-sand-300 dark:border-ocean-800 space-y-3">
            {/* Relevant Beach Image */}
            {selectedBeach.cover_image && (
              <div className="relative w-full h-36 overflow-hidden bg-sand-200 dark:bg-ocean-950">
                <Image
                  src={selectedBeach.cover_image}
                  alt={selectedBeach.name}
                  fill
                  className="object-cover"
                  sizes="380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: getBeachPinColor(selectedBeach.id) }}
                    />
                    <span className="text-xs font-semibold drop-shadow-sm">{selectedBeach.location}</span>
                  </div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1 drop-shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>{selectedBeach.average_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 pt-1 space-y-3">
              {/* Header & Close */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-base text-ocean-950 dark:text-sand-50 font-sans flex-1">
                  {selectedBeach.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedBeach(null)}
                  className="text-sand-500 hover:text-ocean-950 dark:hover:text-sand-100 p-1"
                  aria-label="Close destination preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info box with Entrance only */}
              <div className="rounded-xl border border-sand-200 dark:border-ocean-800 p-3 space-y-2">
                {selectedBeach.entrance_fee && (
                  <div className="flex items-center gap-3 text-xs">
                    <Coins className="w-4 h-4 text-ocean-700 dark:text-ocean-400 flex-shrink-0" />
                    <span className="w-16 font-semibold text-ocean-950 dark:text-sand-200">Entrance</span>
                    <span className="text-sand-600 dark:text-sand-400">{parseEntranceFee(selectedBeach.entrance_fee, selectedBeach.entrance_fee_adults, selectedBeach.entrance_fee_children)}</span>
                  </div>
                )}
              </div>

              {/* Opening hours with two-column grid */}
              <div className="rounded-xl border border-sand-200 dark:border-ocean-800 p-3">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                  {parseOpeningHoursFull(selectedBeach.opening_hours).map((item) => (
                    <React.Fragment key={item.day}>
                      <span className="text-xs font-semibold text-ocean-950 dark:text-sand-200">{item.day}</span>
                      <span className="text-xs text-sand-600 dark:text-sand-400 text-right">{item.time}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Travel mode with icons */}
              <div className="flex items-center gap-2" role="group" aria-label="Travel mode">
                <button
                  type="button"
                  onClick={() => setTravelMode('car')}
                  aria-pressed={travelMode === 'car'}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${travelMode === 'car' ? 'border-ocean-900 bg-ocean-900 text-white' : 'border-sand-300 text-ocean-900 dark:text-sand-100'}`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Car</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode('motorcycle')}
                  aria-pressed={travelMode === 'motorcycle'}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${travelMode === 'motorcycle' ? 'border-ocean-900 bg-ocean-900 text-white' : 'border-sand-300 text-ocean-900 dark:text-sand-100'}`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motorcycle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode('walking')}
                  aria-pressed={travelMode === 'walking'}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${travelMode === 'walking' ? 'border-ocean-900 bg-ocean-900 text-white' : 'border-sand-300 text-ocean-900 dark:text-sand-100'}`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Walking</span>
                </button>
              </div>

              {/* Result strip - shows only after route calculation */}
              {routeActive && routeData && (
                <div className="rounded-xl bg-ocean-900/95 text-sand-50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SeaRoute size={16} />
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
                        {routeData.travelMode}
                      </div>
                      <div className="text-xs font-bold">
                        {routeData.distanceKm} km · {routeData.durationFormatted}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearRoute}
                    className="text-sand-400 hover:text-white p-1"
                    aria-label="Clear route"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action row with two equal buttons */}
              <div className="flex items-center gap-2 pt-1">
                {/* View Details button (secondary/outlined) */}
                <Link
                  href={`/beaches/${selectedBeach.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 border border-ocean-900 bg-transparent hover:bg-sand-100 dark:border-sand-100 dark:hover:bg-ocean-800 text-ocean-900 dark:text-sand-100 text-xs font-bold rounded-xl transition-colors text-center"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {/* Calculate Route button (primary/filled) */}
                <button
                  type="button"
                  onClick={handleCalculateRoute}
                  disabled={routingLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-ocean-900 hover:bg-ocean-950 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  {routingLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <SeaRoute size={14} />
                  )}
                  <span>{routingLoading ? 'Calculating...' : 'Calculate Route'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
