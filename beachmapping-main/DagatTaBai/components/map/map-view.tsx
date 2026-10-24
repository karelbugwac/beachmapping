'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Navigation } from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';
import { ShorelineMarker } from '@/components/ui/coastal-icons';

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

export const BEACH_COLORS: Record<string, string> = {
  '33333333-3333-3333-3333-333333333301': '#0284c7', // Majestique → Ocean Blue
  '33333333-3333-3333-3333-333333333302': '#ec4899', // Rañola → Coral Pink
  '33333333-3333-3333-3333-333333333303': '#f59e0b', // Lite Bay → Warm Amber
  '33333333-3333-3333-3333-333333333304': '#10b981', // Turtle Point → Marine Emerald
  '33333333-3333-3333-3333-333333333305': '#8b5cf6', // Hinagdan → Royal Amethyst
};

export function getBeachPinColor(id: string): string {
  return BEACH_COLORS[id] || '#0284c7';
}

function createTeardropPinSvg(color: string, isSelected: boolean): string {
  const scale = isSelected ? 1.15 : 1.0;
  const width = Math.round(34 * scale);
  const height = Math.round(44 * scale);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.35)); overflow: visible;">
      <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 42 16.2 43.6C16.65 44.05 17.35 44.05 17.8 43.6C19.5 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${color}" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="17" cy="17" r="8.5" fill="#FFFFFF"/>
      <path d="M10.5 16.5C10.5 12.91 13.41 10 17 10C20.59 10 23.5 12.91 23.5 16.5H10.5Z" fill="${color}"/>
      <path d="M17 10V16.5M13.5 12C14.5 13.5 14.8 15 14.8 16.5M20.5 12C19.5 13.5 19.2 15 19.2 16.5" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round"/>
      <path d="M17 16.5V22C17 22.8 16.3 23.5 15.5 23.5" stroke="${color}" stroke-width="1.3" stroke-linecap="round"/>
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
  center = [10.6348, 124.0275],
  zoom = 15,
}: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // When route mode is active, display ONLY the selected destination beach
  const visibleBeaches = useMemo(() => {
    if (routeActive && selectedBeachId) {
      return beaches.filter((b) => b.id === selectedBeachId);
    }
    return beaches;
  }, [beaches, routeActive, selectedBeachId]);

  // Adjust camera to fit route or fly back to center
  useEffect(() => {
    if (!mapRef.current || !L) return;

    if (routeActive && routeCoordinates && routeCoordinates.length >= 2) {
      const bounds = L.latLngBounds(routeCoordinates);
      mapRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16,
      });
    } else if (!routeActive) {
      mapRef.current.flyTo(center, zoom, { duration: 0.8 });
    }
  }, [routeActive, routeCoordinates, center, zoom, L]);

  // Center map on user location when it updates (if route is active)
  useEffect(() => {
    if (!mapRef.current || !L || !userLocation || !routeActive) return;
    
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
      duration: 1,
    });
  }, [userLocation, routeActive, L]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full min-h-[400px] bg-sand-100 dark:bg-ocean-950 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-sand-700 dark:text-sand-400 text-sm">
          <ShorelineMarker size={22} className="animate-bounce text-ocean-700 dark:text-ocean-400" />
          <span className="font-medium">Anchoring Catmon Shoreline Map...</span>
        </div>
      </div>
    );
  }

  // User detected GPS marker icon
  const userLocationIcon = L.divIcon({
    className: 'user-loc-marker',
    html: `<div style="background-color: #0284c7; width: 18px; height: 18px; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 12px rgba(2,132,199,0.9);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
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

        {/* Real Blue Road Route Polyline */}
        {routeActive && routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#0284c7',
              weight: 5,
              opacity: 0.95,
              lineJoin: 'round',
            }}
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

        {/* Permanent Immutable Beach Pin Markers anchored at exact tip (17, 44) */}
        {visibleBeaches.map((beach, index) => {
          const isSelected = selectedBeachId === beach.id;
          const pinColor = getBeachPinColor(beach.id);
          const iconHtml = createTeardropPinSvg(pinColor, isSelected);

          const customIcon = L.divIcon({
            className: 'beach-pin-marker',
            html: iconHtml,
            iconSize: isSelected ? [39, 50] : [34, 44],
            iconAnchor: isSelected ? [19.5, 50] : [17, 44],
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
                {beach.name}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
