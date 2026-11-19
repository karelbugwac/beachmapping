import { Suspense } from 'react';
import MapPageClient from './map-client';

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-[70vh] animate-pulse bg-slate-100"
          role="status"
          aria-label="Loading map"
        />
      }
    >
      <MapPageClient />
    </Suspense>
  );
}
