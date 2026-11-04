'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface CottagePhoto {
  id?: string;
  image_url: string;
  storage_path?: string;
  sort_order?: number;
}

interface CottagePhotosModalProps {
  name: string;
  price?: string | null;
  capacity?: string | null;
  photos: CottagePhoto[];
  onClose: () => void;
}

export function CottagePhotosModal({
  name,
  price,
  capacity,
  photos,
  onClose,
}: CottagePhotosModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const closeViewer = () => setSelectedIndex(null);
  const showPrevious = () => setSelectedIndex((current) =>
    current === null ? null : (current - 1 + photos.length) % photos.length
  );
  const showNext = () => setSelectedIndex((current) =>
    current === null ? null : (current + 1) % photos.length
  );

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedIndex(null);
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((current) => current === null ? null : (current - 1 + photos.length) % photos.length);
      }
      if (event.key === 'ArrowRight') {
        setSelectedIndex((current) => current === null ? null : (current + 1) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, photos.length]);

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} photos`}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-6 dark:border-neutral-800">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">{name}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
                {[price ? `₱${price} / day` : null, capacity].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close photos" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800">
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="overflow-y-auto p-3 sm:p-5">
            {photos.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id || `${photo.image_url}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`View image ${index + 1} of ${photos.length}`}
                    className="relative aspect-4/3 overflow-hidden rounded-xl bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1F3F74] dark:bg-neutral-800"
                  >
                    {failedPhotos.has(index) ? (
                      <span className="flex h-full flex-col items-center justify-center gap-2 text-xs text-slate-500">
                        <Camera className="h-6 w-6" />
                        Photo unavailable
                      </span>
                    ) : (
                      <Image
                        src={photo.image_url}
                        alt={`${name}, photo ${index + 1}`}
                        fill
                        unoptimized
                        className="object-contain"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onError={() => setFailedPhotos((current) => new Set(current).add(index))}
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex aspect-4/3 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 dark:bg-neutral-800">
                No photos available.
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedIndex !== null && photos[selectedIndex] && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Full-size photo viewer"
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStartX === null) return;
            const delta = event.changedTouches[0]?.clientX - touchStartX;
            if (delta > 50) showPrevious();
            if (delta < -50) showNext();
            setTouchStartX(null);
          }}
        >
          <button type="button" onClick={closeViewer} aria-label="Close full-size photo" className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/75">
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={showPrevious} aria-label="Previous photo" className="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 sm:left-6">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" onClick={showNext} aria-label="Next photo" className="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 sm:right-6">
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          {failedPhotos.has(selectedIndex) ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white">
              <Camera className="h-12 w-12" />
              <span>Photo unavailable</span>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <Image
                src={photos[selectedIndex].image_url}
                alt={`${name}, photo ${selectedIndex + 1} of ${photos.length}`}
                fill
                priority
                unoptimized
                className="object-contain"
                onError={() => setFailedPhotos((current) => new Set(current).add(selectedIndex))}
              />
            </div>
          )}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            Image {selectedIndex + 1} of {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
