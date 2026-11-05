'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
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
    let timer: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      setProgress(100);
      timer = window.setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 350);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (timer !== undefined) window.clearTimeout(timer);
    };
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
        setProgress(25);
        timers.current = [
          window.setTimeout(() => setProgress(60), 180),
          window.setTimeout(() => setProgress(85), 600),
        ];
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      clearTimers();
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-[#1F3F74] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
