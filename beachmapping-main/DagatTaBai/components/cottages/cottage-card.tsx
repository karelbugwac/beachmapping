'use client';

import Image from 'next/image';
import { Camera, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CottageCardProps {
  name: string;
  imageUrl?: string | null;
  photoCount?: number;
  price?: string | null;
  priceSuffix?: string;
  capacity?: string | null;
  description?: string | null;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CottageCard({
  name,
  imageUrl,
  photoCount = 0,
  price,
  priceSuffix,
  capacity,
  description,
  onView,
  onEdit,
  onDelete,
}: CottageCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = Boolean(imageUrl && failedImageUrl === imageUrl);
  const canView = Boolean(onView);

  const viewButtonClasses = 'group flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:focus-visible:ring-[#4987BA]';
  const details = (
    <>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{name}</h3>
        {price && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-[#1F3F74] dark:bg-neutral-800 dark:text-[#4987BA]">
            ₱{price}{priceSuffix ? ` ${priceSuffix}` : ''}
          </span>
        )}
      </div>
      {capacity && (
        <p className="mt-1 truncate text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Capacity: {capacity}
        </p>
      )}
      {description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-neutral-400">
          {description}
        </p>
      )}
    </>
  );

  return (
    <article className="group relative flex min-h-[130px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-none transition hover:border-[#1F3F74]/35 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-[#4987BA]/40">
      {canView ? (
        <button type="button" onClick={onView} aria-label={`View photos of ${name}`} className={viewButtonClasses}>
          <span className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
            {imageUrl && !imageFailed ? (
              <>
                <Image
                  src={imageUrl}
                  alt=""
                  aria-hidden="true"
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="(max-width: 640px) 112px, 144px"
                  className="pointer-events-none scale-110 object-cover blur-xl brightness-90"
                />
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="(max-width: 640px) 112px, 144px"
                  className="relative z-10 object-contain"
                  onError={() => setFailedImageUrl(imageUrl)}
                />
              </>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-neutral-800">
                <Camera className="h-7 w-7" />
              </span>
            )}
            {photoCount > 1 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white">
                {photoCount} photos
              </span>
            )}
          </span>
          <div className={`flex min-h-[104px] min-w-0 flex-1 flex-col justify-center ${onEdit || onDelete ? 'pb-7' : ''}`}>
            {details}
          </div>
        </button>
      ) : (
        <>
          <span className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
            {imageUrl && !imageFailed ? (
              <>
                <Image
                  src={imageUrl}
                  alt=""
                  aria-hidden="true"
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="(max-width: 640px) 112px, 144px"
                  className="pointer-events-none scale-110 object-cover blur-xl brightness-90"
                />
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="(max-width: 640px) 112px, 144px"
                  className="relative z-10 object-contain"
                  onError={() => setFailedImageUrl(imageUrl)}
                />
              </>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-neutral-800">
                <Camera className="h-7 w-7" />
              </span>
            )}
            {photoCount > 1 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white">
                {photoCount} photos
              </span>
            )}
          </span>
          <div className={`flex min-h-[104px] min-w-0 flex-1 flex-col justify-center ${onEdit || onDelete ? 'pb-7' : ''}`}>
            {details}
          </div>
        </>
      )}

      {(onEdit || onDelete) && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              title={`Edit ${name}`}
              aria-label={`Edit ${name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#1F3F74] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:text-[#4987BA] dark:hover:bg-neutral-800"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              title={`Delete ${name}`}
              aria-label={`Delete ${name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
