'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress whenever route finishes changing
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Global click listener on internal links to provide instant feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Only trigger for internal links that don't open in a new tab and aren't hash anchors
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        targetAttr !== '_blank' &&
        href !== pathname
      ) {
        setLoading(true);
        setProgress(35);

        // Gradually advance progress while route is loading/compiling
        const p1 = setTimeout(() => setProgress(65), 150);
        const p2 = setTimeout(() => setProgress(85), 450);

        return () => {
          clearTimeout(p1);
          clearTimeout(p2);
        };
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#1F3F74] via-[#4987BA] to-sky-400 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(73,135,186,0.8)]"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
