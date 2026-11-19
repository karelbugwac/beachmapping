'use client';

import React, { useState } from 'react';
import { Eye, Compass, Waves, AlertTriangle, ShieldCheck, Maximize2 } from 'lucide-react';

interface VirtualTour360Props {
  beachName: string;
  virtualTourUrl?: string | null;
}

export function VirtualTour360({ beachName, virtualTourUrl }: VirtualTour360Props) {
  const isRanola =
    beachName.toLowerCase().includes('ranola') ||
    beachName.toLowerCase().includes('rañola') ||
    Boolean(virtualTourUrl && virtualTourUrl.includes('panoee.net'));

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Request device orientation permissions for mobile gyro / VR if needed
  const handleRequestMotion = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any)?.requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          console.log('Device orientation granted for Panoee tour.');
        }
      } catch (err) {
        console.warn('Device motion permission prompt error:', err);
      }
    }
  };

  if (!isRanola && !virtualTourUrl) {
    return (
      <div className="w-full rounded-2xl p-8 sm:p-12 bg-brand-sand-100 dark:bg-brand-navy-900 border border-brand-sand-300 dark:border-brand-navy-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-sun-100 dark:bg-brand-navy-900/60 text-brand-navy-700 dark:text-brand-sun-400 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-extrabold text-lg text-brand-navy-900 dark:text-brand-sand-50 font-heading">
            360° Virtual Tour — Under Maintenance
          </h3>
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            The immersive 360° panoramic virtual tour for <strong>{beachName}</strong> is currently being mapped by local field surveyors. Verified imagery will be released soon.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sand-200/80 dark:bg-brand-navy-900 text-brand-navy-700 dark:text-brand-sand-300 text-[11px] font-semibold">
          <Waves size={13} className="text-brand-teal-600 dark:text-brand-teal-300" />
          <span>Coastal Photogrammetry In Progress</span>
        </div>
      </div>
    );
  }

  // Exact Panoee embed for Rañola Beach Resort
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-brand-teal-100 dark:bg-brand-teal-700/60 text-brand-teal-700 dark:text-brand-teal-300 text-[11px] font-semibold flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Panoee 360° Photosphere</span>
          </div>
          <span className="text-slate-500 dark:text-neutral-400 hidden sm:inline">&bull;</span>
          <span className="text-slate-600 dark:text-neutral-300 hidden sm:inline">
            Drag or tilt mobile device to look around
          </span>
        </div>

        <button
          type="button"
          onClick={handleRequestMotion}
          className="self-start sm:self-auto text-[11px] font-semibold text-brand-teal-700 dark:text-brand-teal-300 hover:underline inline-flex items-center gap-1"
        >
          <Compass size={13} />
          <span>Calibrate Device Motion</span>
        </button>
      </div>

      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-brand-sand-300 dark:border-brand-navy-800 shadow-md bg-black ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'h-[400px] sm:h-[480px]'
        }`}
      >
        <iframe
          id="tour-embeded"
          name="Raniola"
          src="https://tour.panoee.net/iframe/69c122dd0b3ba72d3e32cbc1"
          frameBorder="0"
          width="100%"
          height="100%"
          scrolling="no"
          allow="vr; xr; accelerometer; gyroscope; autoplay; fullscreen"
          allowFullScreen={false}
          loading="lazy"
          className="w-full h-full"
        />

        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-black/70 backdrop-blur-md text-white rounded-lg text-xs font-semibold hover:bg-black/90 transition-colors"
          >
            Exit Fullscreen
          </button>
        )}
      </div>
    </div>
  );
}
