'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { BeachRecord } from '@/lib/db/beaches';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const ZoomControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.ZoomControl),
  { ssr: false }
);

// Curated Coastal Palette: strictly brand-aligned (Dive Blue, Sky Blue, Golden Amber, Sea Teal)
// Strictly NO purple!
export const PIN_PALETTE = [
  '#1F3F74', // Signature Dive Blue
  '#0284C7', // Ocean Sky Blue
  '#EAB308', // Sunburst Amber Gold
  '#0D9488', // Deep Lagoon Teal
  '#2563EB', // Vibrant Coastal Blue
  '#0891B2', // Tropical Cyan
  '#16A34A', // Coastal Palm Emerald
  '#0369A1', // Deep Marina Blue
];

export function getBeachPinColorByIndex(index: number): string {
  return PIN_PALETTE[index % PIN_PALETTE.length];
}

export function getBeachPinColor(id: string, beaches?: BeachRecord[]): string {
  if (beaches && beaches.length > 0) {
    const idx = beaches.findIndex((b) => b.id === id);
    if (idx !== -1) return PIN_PALETTE[idx % PIN_PALETTE.length];
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return PIN_PALETTE[Math.abs(hash) % PIN_PALETTE.length];
}

// Senior Frontend Custom SVG Marker: Ultra-crisp, elegant coastal palm teardrop with micro-elevation & selection pulse
function createTeardropPinSvg(color: string, isSelected: boolean): string {
  const scale = isSelected ? 1.16 : 1.0;
  const width = Math.round(36 * scale);
  const height = Math.round(48 * scale);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 5px 10px rgba(15,23,42,0.36)); overflow: visible;">
      ${
        isSelected
          ? `
        <!-- Dynamic Pulse Halo Ring on Selection -->
        <circle cx="18" cy="17" r="19" fill="${color}" fill-opacity="0.22">
          <animate attributeName="r" values="17;22;17" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="fill-opacity" values="0.28;0.05;0.28" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="18" cy="17" r="18" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
      `
          : ''
      }

      <!-- Teardrop Pin Silhouette with Pure White Bezel -->
      <path d="M18 1.5C9.49 1.5 2.5 8.49 2.5 17C2.5 28.2 16.5 45.2 17.3 46.2C17.7 46.7 18.3 46.7 18.7 46.2C19.5 45.2 33.5 28.2 33.5 17C33.5 8.49 26.51 1.5 18 1.5Z"
        fill="${color}"
        stroke="#FFFFFF"
        stroke-width="2.4"
            stroke-linejoin="round" />

      <!-- Inner Crisp White Disc Badge -->
      <circle cx="18" cy="17" r="9.3" fill="#FFFFFF" />

      <!-- High-Fidelity Coastal Palm Tree Silhouette -->
      <g fill="${color}">
        <!-- Gentle Curved Trunk -->
        <path d="M17.2 23.5H18.9C18.6 19.8 18.3 17.5 18 15.8H17.2C17 17.5 16.9 19.8 17.2 23.5Z" />
        <!-- Top Center Frond -->
        <path d="M17.6 15.8C17.6 12.8 19 10.5 21.2 9.8C20 11.8 19.2 13.8 17.6 15.8Z" />
        <!-- Top Left Frond -->
        <path d="M17.6 15.8C15.6 13.2 13.5 11.2 11 12.2C13 13.8 15.2 15 17.6 15.8Z" />
        <!-- Bottom Left Frond -->
        <path d="M17.6 16C15 15.2 12.4 16 11.2 18.2C13.5 17.6 15.8 17 17.6 16Z" />
        <!-- Top Right Frond -->
        <path d="M18 15.8C20.2 13.2 22.5 11.5 25 12.5C23 14 20.8 15.2 18 15.8Z" />
        <!-- Bottom Right Frond -->
        <path d="M18 16C20.5 15.2 23.2 16.2 24.5 18.5C22.2 17.8 19.8 17.2 18 16Z" />
        <!-- Coconuts at crown -->
        <circle cx="16.9" cy="16.2" r="1" fill="${color}" stroke="#FFFFFF" stroke-width="0.3"/>
        <circle cx="18.9" cy="16.2" r="1" fill="${color}" stroke="#FFFFFF" stroke-width="0.3"/>
      </g>
    </svg>
  `;
}

interface MapViewProps {
  beaches: BeachRecord[];
  userLocation?: { lat: number; lng: number } | null;
  onSelectBeach?: (beach: BeachRecord) => void;
  selectedBeachId?: string | null;
  routeActive?: boolean;
  routeCoordinates?: [number, number][] | null;
  travelMode?: 'car' | 'motorcycle' | 'commute' | 'walking';
  center?: [number, number];
  zoom?: number;
}

export function MapView({
  beaches,
  userLocation,
  onSelectBeach,
  selectedBeachId,
  routeActive = false,
  routeCoordinates = null,
  travelMode = 'car',
  center = [10.6348, 124.0275],
  zoom = 15,
}: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any>(null);

  // Traveling marker animation state
  const [travelIndex, setTravelIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!isClient || !L || !mapRef.current) return;
    mapRef.current.setView(center, zoom, { animate: true });
  }, [center, zoom, isClient, L]);

  // Animate the traveling vehicle / walker along the route coordinates
  useEffect(() => {
    if (!routeActive || !routeCoordinates || routeCoordinates.length < 2) {
      setTravelIndex(0);
      return;
    }

    setTravelIndex(0);
    let currentIndex = 0;
    const totalPoints = routeCoordinates.length;

    // Smooth movement pacing: completes whole route in ~4 to 6 seconds
    const intervalMs = Math.max(45, Math.min(120, Math.floor(4500 / totalPoints)));

    const interval = setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= totalPoints) {
        clearInterval(interval);
        // Pause at destination, then repeat smoothly
        setTimeout(() => {
          if (routeActive) {
            setTravelIndex(0);
          }
        }, 1800);
        return;
      }
      setTravelIndex(currentIndex);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [routeActive, routeCoordinates]);

  // When route mode is active, display ONLY the selected destination beach
  const visibleBeaches = useMemo(() => {
    const candidates = routeActive && selectedBeachId
      ? beaches.filter((beach) => beach.id === selectedBeachId)
      : beaches;
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();

    return candidates.filter((beach) => {
      if (beach.latitude === null || beach.longitude === null) return false;
      if (!getValidBeachCoordinates(beach.latitude, beach.longitude)) return false;
      const slug = beach.slug.toLowerCase();
      if (seenIds.has(beach.id) || (slug && seenSlugs.has(slug))) return false;
      seenIds.add(beach.id);
      if (slug) seenSlugs.add(slug);
      return true;
    });
  }, [beaches, routeActive, selectedBeachId]);

  // Memoize User GPS marker icon
  const userLocationIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: 'user-loc-marker',
      html: `<div style="background-color: #1F3F74; width: 20px; height: 20px; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 14px rgba(31,63,116,0.9);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, [L]);

  // Memoize Moving Vehicle / Pedestrian Marker icon
  const movingTravelerIcon = useMemo(() => {
    if (!L) return null;
    const vehicleSvg =
      travelMode === 'motorcycle'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`
        : travelMode === 'commute'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4-.2-.8-.6-.9l-1.2-.3"/><path d="M4 18H2"/><path d="m2 5 1.5 13h16l1.5-13Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`
        : travelMode === 'walking'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.5v2"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.5v2"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

    return L.divIcon({
      className: 'moving-traveler-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #1F3F74;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 14px rgba(31,63,116,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.08s linear;
        ">
          ${vehicleSvg}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, [L, travelMode]);

  // Memoize beach pin icons so route animation ticks don't recreate DOM icons
  const beachMarkersData = useMemo(() => {
    if (!L) return [];
    return visibleBeaches.map((beach, index) => {
      const isSelected = selectedBeachId === beach.id;
      const pinColor = getBeachPinColorByIndex(index);
      const coordinates = getValidBeachCoordinates(beach.latitude, beach.longitude);
      if (!coordinates) return null;
      const iconHtml = createTeardropPinSvg(pinColor, isSelected);
      const customIcon = L.divIcon({
        className: 'beach-pin-marker',
        html: iconHtml,
        iconSize: isSelected ? [42, 56] : [36, 48],
        iconAnchor: isSelected ? [21, 56] : [18, 48],
      });
      const labelDirection: 'right' | 'left' = index % 2 === 0 ? 'right' : 'left';
      return {
        beach,
        pinColor,
        customIcon,
        labelDirection,
        position: [coordinates.latitude, coordinates.longitude] as [number, number],
      };
    });
  }, [L, visibleBeaches, selectedBeachId]);

  // Smoothly center the map view when destination beach changes
  useEffect(() => {
    if (mapRef.current && center) {
      try {
        mapRef.current.flyTo(center, zoom, { duration: 0.8 });
      } catch {}
    }
  }, [center, zoom]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-black text-slate-500">
        <div className="flex flex-col items-center gap-2 text-xs">
          <div className="w-6 h-6 border-2 border-[#1F3F74] border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Anchoring Catmon Shoreline Map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>'
          url="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />

        {/* Real SOLID Road Route Polyline (No Broken Lines) */}
        {routeActive && routeCoordinates && routeCoordinates.length > 0 && (
          <>
            {/* Ambient Shadow Layer */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: '#1F3F74',
                weight: 10,
                opacity: 0.22,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
            {/* Solid Main Road Line */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: '#1F3F74',
                weight: 5.5,
                opacity: 0.95,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </>
        )}

        {/* Real-time Moving Vehicle / Traveler Marker traveling along the road */}
        {routeActive &&
          routeCoordinates &&
          routeCoordinates.length > 0 &&
          movingTravelerIcon &&
          travelIndex < routeCoordinates.length && (
            <Marker
              position={routeCoordinates[travelIndex]}
              icon={movingTravelerIcon}
              zIndexOffset={1000}
            />
          )}

        {/* User GPS location marker */}
        {userLocation && userLocationIcon && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              Your Detected GPS Location
            </Tooltip>
          </Marker>
        )}

        {/* Strictly Alternating Beach Pin Markers with matching text color */}
        {beachMarkersData.map((markerData) => markerData && (
          <Marker
            key={markerData.beach.id}
            position={markerData.position}
            icon={markerData.customIcon}
            eventHandlers={{
              click: () => onSelectBeach?.(markerData.beach),
            }}
          >
            <Tooltip
              permanent
              direction={markerData.labelDirection}
              offset={markerData.labelDirection === 'right' ? [14, -22] : [-14, -22]}
              className="beach-map-label"
            >
              <span
                style={{
                  color: markerData.pinColor,
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '-0.01em',
                }}
              >
                {markerData.beach.name}
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
