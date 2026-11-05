'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, ChevronLeft, ChevronRight, Info, UsersRound, X } from 'lucide-react';

export interface CottagePhoto {
  id?: string;
  image_url: string;
  storage_path?: string;
  sort_order?: number;
}

export interface PhotoViewerItem {
  name: string;
  photos: CottagePhoto[];
  description?: string | null;
  infoLabel?: string | null;
  capacity?: string | null;
  price?: string | null;
  priceUnit?: string;
  priceLabel?: string;
}

interface PhotoViewerModalProps {
  item: PhotoViewerItem;
  initialPhotoIndex?: number;
  onClose: () => void;
}

export function PhotoViewerModal({
  item,
  initialPhotoIndex = 0,
  onClose,
}: PhotoViewerModalProps) {
  const { name, photos, description, infoLabel, capacity, price, priceUnit = 'day', priceLabel = 'Rate' } = item;
  const [selectedIndex, setSelectedIndex] = useState(() =>
    photos.length ? Math.min(Math.max(initialPhotoIndex, 0), photos.length - 1) : 0
  );
  const [loadedMainPhotoKey, setLoadedMainPhotoKey] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedPhoto = photos[selectedIndex];
  const selectedPhotoKey = selectedPhoto?.id || selectedPhoto?.image_url || '';
  const hasMultiplePhotos = photos.length > 1;
  const resolvedRate = price;
  const formattedRate = (() => {
    if (!resolvedRate?.trim()) return '';
    if (resolvedRate.toLowerCase() === 'free') return 'Free';
    const amountText = resolvedRate.match(/-?\d[\d,]*(?:\.\d+)?/)?.[0]?.replace(/,/g, '');
    if (!amountText) return resolvedRate;
    const amount = Number(amountText);
    if (!Number.isFinite(amount)) return resolvedRate;
    return `₱${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(amount)}`;
  })();
  const capacityText = infoLabel?.trim() || (capacity?.trim()
    ? (() => {
      const values = capacity.match(/\d[\d,]*/g)?.map((value) => Number(value.replace(/,/g, '')));
      if (values?.length && values.every(Number.isFinite)) {
        return `Fits ${values.join('–')} ${values.length === 1 ? 'guest' : 'guests'}`;
      }
      return `Capacity ${capacity.trim()}`;
    })()
    : '');

  const showPrevious = () => {
    setSelectedIndex((current) => (current - 1 + photos.length) % photos.length);
  };
  const showNext = () => {
    setSelectedIndex((current) => (current + 1) % photos.length);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (hasMultiplePhotos && event.key === 'ArrowLeft') {
        setSelectedIndex((current) => (current - 1 + photos.length) % photos.length);
      }
      if (hasMultiplePhotos && event.key === 'ArrowRight') {
        setSelectedIndex((current) => (current + 1) % photos.length);
      }
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultiplePhotos, onClose, photos.length]);

  useEffect(() => {
    if (hasMultiplePhotos) {
      thumbnailRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [hasMultiplePhotos, selectedIndex]);

  const markPhotoFailed = (photoKey: string) => {
    setFailedPhotos((current) => new Set(current).add(photoKey));
  };

  const photoViewer = (
    <>
      <div
        className="relative flex min-h-[260px] max-h-[60vh] aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-none bg-slate-900"
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStartX === null || !hasMultiplePhotos) return;
          const delta = event.changedTouches[0]?.clientX - touchStartX;
          if (delta > 50) showPrevious();
          if (delta < -50) showNext();
          setTouchStartX(null);
        }}
      >
        {selectedPhoto ? (
          failedPhotos.has(selectedPhotoKey) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-300">
              <Camera className="h-8 w-8" />
              <span>Photo unavailable</span>
            </div>
          ) : (
            <>
              {loadedMainPhotoKey !== selectedPhotoKey && (
                <div
                  className="absolute inset-0 animate-pulse bg-slate-800 motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              <Image
                key={selectedPhotoKey}
                src={selectedPhoto.image_url}
                alt={`${name}, image ${selectedIndex + 1}`}
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 560px"
                className={`rounded-none object-contain transition-opacity duration-200 motion-reduce:transition-none ${
                  loadedMainPhotoKey === selectedPhotoKey ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setLoadedMainPhotoKey(selectedPhotoKey)}
                onError={() => markPhotoFailed(selectedPhotoKey)}
              />
            </>
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-300">
            <Camera className="h-8 w-8" />
            <span>No photos yet</span>
          </div>
        )}

        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2 left-2 z-20 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-md">
              {selectedIndex + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {hasMultiplePhotos && (
        <div className="flex justify-start gap-0.5 overflow-x-auto bg-slate-900 px-1 pb-1">
          {photos.map((photo, index) => {
            const photoKey = photo.id || photo.image_url || String(index);
            return (
              <button
                key={photoKey}
                ref={(element) => { thumbnailRefs.current[index] = element; }}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={selectedIndex === index}
                className={`relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-none border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] ${
                  selectedIndex === index ? 'border-[#1F3F74] dark:border-[#4987BA]' : 'border-transparent'
                }`}
              >
                {failedPhotos.has(photoKey) ? (
                  <span className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <Camera className="h-4 w-4" />
                  </span>
                ) : (
                  <Image
                    src={photo.image_url}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="64px"
                    className="rounded-none object-cover"
                    onError={() => markPhotoFailed(photoKey)}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-0"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${name} photos`}
        className="relative mx-4 max-h-[85vh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl outline-none dark:bg-neutral-900"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close photos"
          className="absolute right-2 top-2 z-20 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-slate-700 shadow-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid max-h-[85vh] grid-cols-1 items-start overflow-y-auto md:grid-cols-[1.1fr_1fr]">
          <div className="flex min-w-0 flex-col bg-slate-900">
            {photoViewer}
          </div>

          <div className="flex min-w-0 flex-col gap-4 p-6">
            <h2 className="pr-10 text-xl font-semibold text-slate-900 dark:text-white">{name}</h2>
            {capacityText && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {capacity ? (
                  <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {capacityText}
              </div>
            )}
            {description?.trim() && (
              <section className="border-t border-slate-200 pt-4 dark:border-neutral-800">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Description</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-neutral-200">
                  {description}
                </p>
              </section>
            )}
            {formattedRate && (
              <section className="border-t border-slate-200 pt-4 dark:border-neutral-800">
                <div className="text-xs text-slate-500 dark:text-neutral-400">{priceLabel}</div>
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-2xl font-semibold text-[#1F3F74] dark:text-[#4987BA]">
                    {formattedRate}
                  </span>
                  {priceUnit && resolvedRate?.trim() && resolvedRate.toLowerCase() !== 'free' && (
                    <span className="text-sm text-slate-500 dark:text-neutral-400">/ {priceUnit}</span>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
