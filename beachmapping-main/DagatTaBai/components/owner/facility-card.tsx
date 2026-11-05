'use client';

import Image from 'next/image';
import { Camera, Pencil, Trash2 } from 'lucide-react';

export interface FacilityCardPhoto {
  id?: string;
  image_url: string;
  storage_path?: string;
  sort_order?: number;
}

interface FacilityCardProps {
  name: string;
  category: string;
  photos: FacilityCardPhoto[];
  price?: string | null;
  description?: string | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FacilityCard({
  name,
  category,
  photos,
  price,
  description,
  onView,
  onEdit,
  onDelete,
}: FacilityCardProps) {
  const cover = photos[0]?.image_url;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`View ${name}`}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView();
        }
      }}
      className="flex min-h-[130px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-[#1F3F74]/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-[#4987BA]/40"
    >
      <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-none bg-slate-100 sm:w-36 dark:bg-neutral-800">
        {cover ? (
          <Image
            src={cover}
            alt={name}
            fill
            unoptimized
            loading="lazy"
            sizes="(max-width: 640px) 112px, 144px"
            className="rounded-none object-contain"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-slate-400">
            <Camera className="h-7 w-7" />
          </span>
        )}
        {photos.length > 1 && (
          <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {photos.length} photos
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col self-stretch py-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{name}</h3>
          {price && (
            <span className="shrink-0 bg-slate-100 px-2 py-1 text-[10px] font-bold text-[#1F3F74] dark:bg-neutral-800 dark:text-[#4987BA]">
              {price.toLowerCase() === 'free' ? 'Free' : `₱${price}`}
            </span>
          )}
        </div>
        <span className="mt-1 w-fit bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          {category}
        </span>
        {description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
            {description}
          </p>
        )}
        <div className="mt-auto flex justify-end gap-1 pt-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            aria-label={`Edit ${name}`}
            className="flex h-7 w-7 items-center justify-center text-[#1F3F74] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:text-[#4987BA] dark:hover:bg-neutral-800"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${name}`}
            className="flex h-7 w-7 items-center justify-center text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
