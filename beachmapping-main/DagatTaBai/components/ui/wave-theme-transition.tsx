'use client';

import React, { useEffect, useState } from 'react';
import { Waves, Moon, Sun, Sparkles } from 'lucide-react';

interface WaveThemeTransitionProps {
  active: boolean;
  targetTheme: 'light' | 'dark' | null;
}

export function WaveThemeTransition({ active, targetTheme }: WaveThemeTransitionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !active || !targetTheme) return null;

  const isNight = targetTheme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden select-none"
    >
      {/* Wave Container that sweeps across the entire viewport */}
      <div
        className={`absolute -left-[50vw] w-[200vw] h-[220vh] ${
          isNight ? 'animate-wave-surge-up' : 'animate-wave-surge-down'
        }`}
      >
        {isNight ? (
          /* ========================================================
             LIGHT -> DARK: RISING NIGHT TIDE (Surging from Bottom Up)
             ======================================================== */
          <div className="relative w-full h-full flex flex-col justify-start">
            {/* Undulating SVG Wave Crests at the leading top edge */}
            <div className="relative w-full h-44 sm:h-56 md:h-72 flex-shrink-0 overflow-hidden">
              {/* Layer 1: Back Deep Swell (Cyan / Oceanic Teal) */}
              <svg
                viewBox="0 0 2880 320"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 w-full h-full opacity-40 animate-wave-drift-b"
              >
                <path
                  d="M0,140 C360,240 720,40 1080,140 C1440,240 1800,40 2160,140 C2520,240 2880,40 2880,140 L2880,320 L0,320 Z"
                  fill="#0369a1"
                />
              </svg>

              {/* Layer 2: Mid Water Body (Midnight Blue) */}
              <svg
                viewBox="0 0 2880 320"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 w-full h-full opacity-75 animate-wave-drift-a"
              >
                <path
                  d="M0,190 C360,80 720,280 1080,190 C1440,80 1800,280 2160,190 C2520,80 2880,280 2880,190 L2880,320 L0,320 Z"
                  fill="#0f172a"
                />
              </svg>

              {/* Layer 3: Front Wave & Frothy Luminous Crest (Deep Black/Navy) */}
              <svg
                viewBox="0 0 2880 320"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 w-full h-full animate-wave-drift-b"
              >
                <path
                  d="M0,160 C360,260 720,60 1080,160 C1440,260 1800,60 2160,160 C2520,260 2880,60 2880,160 L2880,320 L0,320 Z"
                  fill="#020617"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  className="filter drop-shadow-[0_-6px_12px_rgba(56,189,248,0.45)]"
                />
              </svg>

              {/* Animated Seafoam Sprays & Bubbles along Crest */}
              <div className="absolute inset-x-0 top-1/2 flex justify-around animate-wave-spray px-10">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-300/80 shadow-[0_0_8px_#38bdf8]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_6px_#ffffff]" />
                <span className="w-3 h-3 rounded-full bg-sky-200/70 shadow-[0_0_10px_#38bdf8]" />
                <span className="w-2 h-2 rounded-full bg-cyan-100/90 shadow-[0_0_8px_#38bdf8]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_6px_#ffffff]" />
                <span className="w-2.5 h-2.5 rounded-full bg-sky-300/80 shadow-[0_0_8px_#38bdf8]" />
              </div>
            </div>

            {/* Solid Ocean Body (Fills behind the wave with dark theme background) */}
            <div className="flex-1 w-full bg-[#020617] relative flex items-center justify-center">
              {/* Subtle Coastal Radial Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,116,144,0.18)_0%,_transparent_70%)]" />

              {/* Ocean Theme Badge (Visible at peak surge) */}
              <div className="relative -mt-32 px-5 py-2.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-white shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-wave-badge">
                <div className="w-7 h-7 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-300 border border-cyan-500/40">
                  <Moon className="w-4 h-4 fill-cyan-400/20" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-cyan-100 tracking-wide flex items-center gap-1.5">
                    High Tide
                    <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  </span>
                  <span className="text-[10px] text-cyan-300/70 font-medium">Night Theme</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================================
             DARK -> LIGHT: SUNLIT WAVE (Sweeping Downward like Fresh Surf)
             ========================================================== */
          <div className="relative w-full h-full flex flex-col justify-end">
            {/* Solid Light Beach Body (Fills ahead of the receding crest) */}
            <div className="flex-1 w-full bg-[#f8fafc] relative flex items-center justify-center">
              {/* Subtle Sunlit Shimmer */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.15)_0%,_transparent_70%)]" />

              {/* Sunlit Shore Badge (Visible at peak surge) */}
              <div className="relative -mb-32 px-5 py-2.5 rounded-full bg-white/95 border border-sky-300/60 text-slate-800 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-wave-badge">
                <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-300/50">
                  <Sun className="w-4 h-4 fill-amber-400/30" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#1F3F74] tracking-wide flex items-center gap-1.5">
                    Sunlit Shore
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Light Theme</span>
                </div>
              </div>
            </div>

            {/* Undulating SVG Wave Crest at the bottom leading edge */}
            <div className="relative w-full h-44 sm:h-56 md:h-72 flex-shrink-0 overflow-hidden">
              {/* Layer 1: Back Daylight Swell (Light Turquoise Aqua) */}
              <svg
                viewBox="0 0 2880 320"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-0 w-full h-full opacity-45 animate-wave-drift-b"
              >
                <path
                  d="M0,0 L2880,0 L2880,180 C2520,80 2160,280 1800,180 C1440,80 1080,280 720,180 C360,80 0,280 0,180 Z"
                  fill="#38bdf8"
                />
              </svg>

              {/* Layer 2: Mid Tropical Surf (Frothy Sky Blue) */}
              <svg
                viewBox="0 0 2880 320"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-0 w-full h-full opacity-75 animate-wave-drift-a"
              >
                <path
                  d="M0,0 L2880,0 L2880,130 C2520,240 2160,40 1800,130 C1440,240 1080,40 720,130 C360,240 0,40 0,130 Z"
                  fill="#bae6fd"
                />
              </svg>

              {/* Layer 3: Front Crest Line with Seafoam Outline (Crisp Slate/White) */}
              <svg
                viewBox="0 0 2880 320"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-0 w-full h-full animate-wave-drift-b"
              >
                <path
                  d="M0,0 L2880,0 L2880,160 C2520,60 2160,260 1800,160 C1440,60 1080,260 720,160 C360,60 0,260 0,160 Z"
                  fill="#f8fafc"
                  stroke="#ffffff"
                  strokeWidth="4"
                  className="filter drop-shadow-[0_8px_16px_rgba(56,189,248,0.5)]"
                />
              </svg>

              {/* Animated Sunlit Seafoam Sparkles along Crest */}
              <div className="absolute inset-x-0 bottom-1/2 flex justify-around animate-wave-spray px-10">
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#bae6fd]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#fde047]" />
                <span className="w-3 h-3 rounded-full bg-sky-200 shadow-[0_0_10px_#38bdf8]" />
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_6px_#bae6fd]" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_8px_#fde047]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
