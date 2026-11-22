'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const timers = useRef<number[]>([]);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRoute = useRef(routeKey);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => {
    if (previousRoute.current === routeKey) return;
    previousRoute.current = routeKey;
    if (!loading) return;

    clearTimers();
    const timer = window.setTimeout(() => {
      setVisible(false);
      setLoading(false);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [routeKey, loading]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest('a') : null;
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.startsWith('/#') &&
        targetAttr !== '_blank' &&
        href !== `${pathname}${window.location.search}` &&
        href !== pathname
      ) {
        clearTimers();
        setLoading(true);
        setVisible(true);
        timers.current = [
          window.setTimeout(() => setVisible(true), 50),
        ];
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      clearTimers();
    };
  }, [pathname]);

  if (!loading && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <Image
            src="/logo.png"
            alt="Loading"
            fill
            className="object-contain animate-spin"
          />
        </div>
        <div className="w-8 h-8 border-2 border-brand-navy-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
