'use client';

import Image from 'next/image';
import { Camera, Pencil, Trash2 } from 'lucide-react';
import type { FacilityRate } from '@/lib/db/beaches';
import { getFacilityCategoryLabel, getFacilityCategoryStyle } from '@/lib/utils/facility-categories';
import { formatFacilityFeeAmount, getFacilityFeeItems } from '@/lib/utils/facility-pricing';

export interface FacilityCardPhoto {
  id?: string;
  image_url: string;
  storage_path?: string;
  sort_order?: number;
}

interface FacilityCardProps {
  name: string;
  category: string;
  imageUrl?: string | null;
  description?: string | null;
  basePrice?: string | null;
  rates?: FacilityRate[];
  editable?: boolean;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FacilityCard({
  name,
  category,
  imageUrl,
  description,
  basePrice,
  rates = [],
  editable = false,
  onView,
  onEdit,
  onDelete,
}: FacilityCardProps) {
  const feeItems = getFacilityFeeItems(rates.length ? rates : basePrice);
  const rateSummary = feeItems.map((item) => `${item.label}: ${formatFacilityFeeAmount(item.amount)}`).join(' · ');

  return (
    <article className="flex min-w-0 flex-col gap-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onView}
          aria-label={`View ${name}`}
          className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:focus-visible:ring-[#4987BA]"
        >
          <span className="relative h-18 w-20 sm:h-[88px] sm:w-[120px] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-neutral-800">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                unoptimized
                loading="lazy"
                sizes="(max-width: 640px) 80px, 120px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-slate-400">
                <Camera className="h-5 w-5 sm:h-7 sm:w-7" />
              </span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1F3F74] dark:text-[#4987BA] truncate max-w-full">
              {getFacilityCategoryLabel(category)}
            </span>
            <span className="max-w-full truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {name}
            </span>
            {description && (
              <span className="line-clamp-2 text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 leading-snug">
                {description}
              </span>
            )}
          </span>
        </button>

        {editable && (
          <div className="flex shrink-0 items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                aria-label={`Edit ${name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#1F3F74] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:text-[#4987BA] dark:hover:bg-neutral-800"
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
                aria-label={`Delete ${name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {feeItems.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-neutral-800">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2">
            {feeItems.map((item, index) => {
              const isFree = item.amount === null || item.amount === 0;
              return (
                <div key={`${item.label}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-neutral-900">
                  <div className="text-xs text-slate-500 dark:text-neutral-400">{item.label}</div>
                  <div className={`text-[15px] font-medium ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatFacilityFeeAmount(item.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
