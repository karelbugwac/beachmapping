'use client';

import { useEffect, useState } from 'react';
import { getOpeningStatus, type OpeningHours, type OpeningStatus } from '@/lib/utils/opening-status';

const statusClasses = {
  open: 'text-emerald-700 dark:text-emerald-400',
  closing_soon: 'text-amber-700 dark:text-amber-400',
  closed: 'text-rose-700 dark:text-rose-400',
};

export function OpeningStatusPill({ hours }: { hours: OpeningHours }) {
  const [status, setStatus] = useState<OpeningStatus | null>(null);

  useEffect(() => {
    const updateStatus = () => setStatus(getOpeningStatus(hours, new Date()));
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateStatus();
    };

    updateStatus();
    const intervalId = window.setInterval(updateStatus, 30_000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hours]);

  if (!status || status.state === 'unknown') return null;

  return (
    <div aria-live="polite" aria-atomic="true" className="flex min-w-0 flex-col items-start gap-1 transition-colors duration-300 sm:items-end">
      <span className={`text-[11px] font-bold transition-colors duration-300 ${statusClasses[status.state]}`}>
        {status.label}
      </span>
      {status.detail && <span className="text-[11px] text-slate-500 dark:text-neutral-400">{status.detail}</span>}
    </div>
  );
}
