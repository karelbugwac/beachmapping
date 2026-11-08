'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/owner/AppShell';
import type { BeachRecord } from '@/lib/db/beaches';
import { useRealtimeSync } from '@/lib/realtime-sync';

function parseOpeningHours(hours: any): string {
  if (!hours) return 'Hours not provided';
  if (typeof hours === 'string') return hours;
  if (typeof hours === 'object') {
    const list = Object.values(hours).filter((h: any) => h && h !== 'CLOSE' && h !== 'Closed');
    if (list.length > 0) return String(list[0]);
  }
  return 'Hours not provided';
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

  const fetchShellData = () => {
    if (isLoginPage) return;

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
  };

  useEffect(() => {
    fetchShellData();
  }, [isLoginPage]);

  useRealtimeSync(() => {
    fetchShellData();
  }, { enabled: !isLoginPage });

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AppShell
      beachName={beach?.name || 'Your Beach'}
      beachSlug={beach?.slug || beach?.id}
      openingHours={parseOpeningHours(beach?.opening_hours)}
      reviewCount={reviewCount}
      unreadNotifications={0}
    >
      {children}
    </AppShell>
  );
}
