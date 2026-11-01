'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { BeachRecord } from '@/lib/db/beaches';

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

// Curated Coastal Palette: strictly alternating so adjacent pins never share the same color
export const PIN_PALETTE = [
  '#1F3F74', // Signature Dive Blue
  '#F59E0B', // Sunburst Amber
  '#E11D48', // Coral Crimson
  '#059669', // Tropical Emerald
  '#7C3AED', // Royal Amethyst
  '#0284C7', // Ocean Cerulean
  '#F97316', // Sunset Tangerine
  '#0D9488', // Deep Lagoon Teal
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

// Unmistakable, prominent Tropical Palm Tree Teardrop Pin
function createTeardropPinSvg(color: string, isSelected: boolean): string {
  const scale = isSelected ? 1.18 : 1.0;
  const width = Math.round(36 * scale);
  const height = Math.round(46 * scale);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.38)); overflow: visible;">
      <!-- Teardrop Pin Body -->
      <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 42 16.2 43.6C16.65 44.05 17.35 44.05 17.8 43.6C19.5 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${color}" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"/>
      <!-- Inner White Background Disc -->
      <circle cx="17" cy="17" r="8.8" fill="#FFFFFF"/>
      <!-- Bold Prominent Tropical Palm Tree Silhouette -->
      <g fill="${color}">
        <!-- Palm Trunk -->
        <path d="M15.4 23.5H18.6L17.5 15.8H16.2L15.4 23.5Z" />
        <path d="M15.4 23.5C15.4 23.5 16.8 24 18.6 23.5" stroke="#FFFFFF" stroke-width="0.6"/>
        <!-- Top Palm Frond -->
        <path d="M16.8 15.8C16.8 13.5 17.5 10 20 9.2C18.8 12 17.8 13.8 16.8 15.8Z" />
        <!-- Top-Left Frond -->
        <path d="M16.8 15.8C14.5 13 12.2 10.5 9.5 11.8C12 13.5 14.5 14.8 16.8 15.8Z" />
        <!-- Lower-Left Frond -->
        <path d="M16.8 15.8C13.5 15 10.5 15.8 9.2 18.5C11.8 17.8 14.5 17 16.8 15.8Z" />
        <!-- Top-Right Frond -->
        <path d="M16.8 15.8C19.5 13 22 11 24.5 12.5C22 14.2 19.5 15 16.8 15.8Z" />
        <!-- Lower-Right Frond -->
        <path d="M16.8 15.8C20 15.2 23 16 24.8 18.8C22.2 18 19.5 17.2 16.8 15.8Z" />
        <!-- Coconuts at crown -->
        <circle cx="15.8" cy="15.2" r="1.1" fill="${color}" stroke="#FFFFFF" stroke-width="0.4"/>
        <circle cx="17.8" cy="15.4" r="1.1" fill="${color}" stroke="#FFFFFF" stroke-width="0.4"/>
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
  travelMode?: 'car' | 'motorcycle' | 'walking';
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
    const intervalMs = Math.max(30, Math.min(120, Math.floor(4500 / totalPoints)));

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
    if (routeActive && selectedBeachId) {
      return beaches.filter((b) => b.id === selectedBeachId);
    }
    return beaches;
  }, [beaches, routeActive, selectedBeachId]);

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

  // User detected GPS marker icon
  const userLocationIcon = L.divIcon({
    className: 'user-loc-marker',
    html: `<div style="background-color: #1F3F74; width: 20px; height: 20px; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 14px rgba(31,63,116,0.9);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Moving Vehicle / Pedestrian Marker traveling along the route
  const vehicleSvg =
    travelMode === 'motorcycle'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`
      : travelMode === 'walking'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.5v2"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.5v2"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

  const movingTravelerIcon = L.divIcon({
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          travelIndex < routeCoordinates.length && (
            <Marker
              position={routeCoordinates[travelIndex]}
              icon={movingTravelerIcon}
              zIndexOffset={1000}
            />
          )}

        {/* User GPS location marker */}
        {userLocation && (
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
        {visibleBeaches.map((beach, index) => {
          const isSelected = selectedBeachId === beach.id;
          const pinColor = getBeachPinColorByIndex(index);
          const iconHtml = createTeardropPinSvg(pinColor, isSelected);

          const customIcon = L.divIcon({
            className: 'beach-pin-marker',
            html: iconHtml,
            iconSize: isSelected ? [42, 54] : [36, 46],
            iconAnchor: isSelected ? [21, 54] : [18, 46],
          });

          const labelDirection = index % 2 === 0 ? 'right' : 'left';

          return (
            <Marker
              key={beach.id}
              position={[beach.latitude, beach.longitude]}
              icon={customIcon}
              eventHandlers={{
                click: () => onSelectBeach?.(beach),
              }}
            >
              <Tooltip
                permanent
                direction={labelDirection}
                offset={labelDirection === 'right' ? [14, -22] : [-14, -22]}
                className="beach-map-label"
              >
                <span
                  style={{
                    color: pinColor,
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {beach.name}
                </span>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
