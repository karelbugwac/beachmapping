'use client';

import React, { Suspense } from 'react';
import { UserModerationHub } from '@/components/admin/user-moderation-hub';
import { Loader2 } from 'lucide-react';

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <span className="text-xs text-slate-400 mt-2">Loading Review Moderation Console...</span>
        </div>
      }
    >
      <UserModerationHub initialTab="reviews" />
    </Suspense>
  );
}
