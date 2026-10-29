'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/owner/AppShell';
import type { BeachRecord } from '@/lib/db/beaches';

function parseOpeningHours(hours: any): string {
  if (!hours) return '8:00 AM – 6:00 PM';
  if (typeof hours === 'string') return hours;
  if (typeof hours === 'object') {
    const list = Object.values(hours).filter((h: any) => h && h !== 'CLOSE' && h !== 'Closed');
    if (list.length > 0) return String(list[0]);
  }
  return '8:00 AM – 6:00 PM';
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [beach, setBeach] = useState<BeachRecord | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  // If on login page, render plain full-screen login card without sidebar
  const isLoginPage = pathname === '/owner/login';

  useEffect(() => {
    if (isLoginPage) return;

    // Fetch operator beach and review count for shell
    Promise.all([
      fetch('/api/owner/beach', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : [])),
      fetch('/api/owner/reviews', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([beaches, reviews]) => {
        if (Array.isArray(beaches) && beaches.length > 0) {
          setBeach(beaches[0]);
        }
        if (reviews && typeof reviews.totalReviews === 'number') {
          setReviewCount(reviews.totalReviews);
        }
      })
      .catch(() => {
        // Fallback gracefully if database or network is warming up
      });
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AppShell
      operatorName={beach?.name ? `${beach.name} Staff` : 'Resort Staff'}
      beachName={beach?.name || 'Catmon Beach Resort'}
      beachSlug={beach?.slug || beach?.id}
      isOpenNow={true}
      openingHours={parseOpeningHours(beach?.opening_hours)}
      reviewCount={reviewCount}
      unreadNotifications={0}
    >
      {children}
    </AppShell>
  );
}
