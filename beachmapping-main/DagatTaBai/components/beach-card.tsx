'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Clock, ArrowRight } from 'lucide-react';
import type { BeachRecord } from '@/lib/db/beaches';

function parseOpeningHoursForCard(openingHours: string | Record<string, string>): string {
  if (typeof openingHours === 'string') {
    return openingHours;
  }
  if (typeof openingHours === 'object' && openingHours !== null) {
    const hours = Object.values(openingHours).filter(h => h && h !== 'CLOSE');
    if (hours.length > 0) {
      return String(hours[0]); // Show first available day's hours
    }
    return 'Closed';
  }
  return 'Not set';
}

export function BeachCard({ beach }: { beach: BeachRecord | { id: string; slug?: string; name: string; location: string; description: string; cover_image?: string | null; average_rating: number; activities?: string[]; amenities?: string[]; opening_hours: string | Record<string, string> } }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Cover Image */}
        <div className="relative h-48 sm:h-52 w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          {beach.cover_image ? (
            <Image
              src={beach.cover_image}
              alt={beach.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              No image available
            </div>
          )}

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1 shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{beach.average_rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
              {beach.name}
            </h3>
            <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
              <span className="truncate">{beach.location}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
            {beach.description}
          </p>

          {/* Amenities & Activities Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {beach.activities?.slice(0, 2).map((act: string) => (
              <span
                key={act}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
              >
                {act}
              </span>
            ))}
            {beach.amenities?.slice(0, 1).map((amen: string) => (
              <span
                key={amen}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
              >
                {amen}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px]">{parseOpeningHoursForCard(beach.opening_hours)}</span>
        </div>

        <Link
          href={`/beaches/${beach.slug || beach.id}`}
          className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
