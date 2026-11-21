'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showScore?: boolean;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showScore = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="inline-flex items-center space-x-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= Math.round(rating);

        return (
          <button
            key={index}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(starValue)}
            className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 transition-colors ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
            aria-label={`${starValue} out of ${maxStars} stars`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled
                  ? 'fill-brand-sun-400 text-brand-sun-700'
                  : 'fill-transparent text-slate-300'
              }`}
            />
          </button>
        );
      })}

      {showScore && (
        <span className="ml-1 text-sm font-semibold text-slate-700">
          {rating > 0 ? rating.toFixed(1) : 'No reviews'}
        </span>
      )}
    </div>
  );
}
