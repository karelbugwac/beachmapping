'use client';

import React from 'react';
import { Search, Star, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRating: number | null;
  onRatingFilterChange: (rating: number | null) => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  selectedRating,
  onRatingFilterChange,
}: SearchBarProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3 transition-colors duration-200">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by beach name, location, or activity..."
          className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Star Rating Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-zinc-400 font-semibold mr-1">Minimum Rating:</span>
        {[5, 4, 3].map((stars) => {
          const isSelected = selectedRating === stars;
          return (
            <button
              key={stars}
              type="button"
              onClick={() => onRatingFilterChange(isSelected ? null : stars)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Star className={`w-3 h-3 ${isSelected ? 'fill-white' : 'fill-amber-400 text-amber-400'}`} />
              <span>{stars}+ Stars</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
