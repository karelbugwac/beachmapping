import React from 'react';
import Image from 'next/image';
import { User, Calendar, Trash2 } from 'lucide-react';
import { StarRating } from './star-rating';

interface ReviewCardItem {
  id: string;
  rating: number;
  comment: string;
  created_at?: string;
  user_name?: string;
  photos?: string[];
  review_type?: string;
}

interface ReviewCardProps {
  review: ReviewCardItem;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

export function ReviewCard({ review, canDelete = false, onDelete }: ReviewCardProps) {
  const formattedDate = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">
              {review.user_name || 'Verified Visitor'}
            </h4>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
              {review.review_type && <span className="ml-2 uppercase">{review.review_type.replace('_', ' ')}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete?.(review.id)}
              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
              title="Delete review"
              aria-label="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed mb-3">{review.comment}</p>

      {review.photos && review.photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {review.photos.map((photoUrl, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200 bg-slate-100"
            >
              <Image
                src={photoUrl}
                alt={`Review photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
