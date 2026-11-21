'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type Theme = 'light' | 'dark';

export const WAVE_DURATION = 5000; // 5 seconds - calm and smooth

export interface WaveFrame {
  rootClip: string;
  seaClip: string;
  foamClip: string;
  boatTransform: string;
}

/**
 * ONE shared function frameAt(t) that computes the wave line
 * AND the boat position/rotation so they always match perfectly.
 * 
 * @param t Progress from 0 (bottom of screen) to 1 (top of screen)
 * @param W Window width in pixels
 * @param H Window height in pixels
 */
export function frameAt(t: number, W: number, H: number): WaveFrame {
  // Responsive wave dimensions
  const isMobile = W < 640;
  const amplitude = isMobile
    ? Math.min(30, Math.max(18, H * 0.035))
    : Math.min(46, Math.max(26, H * 0.045));

  const seaThickness = isMobile
    ? Math.min(26, Math.max(18, W * 0.04))
    : Math.min(36, Math.max(24, W * 0.024));

  const foamThickness = isMobile ? 3.5 : 4.5;
  const boatHeight = isMobile ? 54 : 64;

  // Single vertical wave sweep: from below viewport to above viewport
  const startBaseY = H + amplitude + boatHeight + 35;
  const endBaseY = -(amplitude + seaThickness + 45);
  const baseY = startBaseY + (endBaseY - startBaseY) * t;

  // Horizontal wave geometry
  const wavelength = Math.max(isMobile ? 280 : 360, W * 0.82);
  const k = (2 * Math.PI) / wavelength;

  // Gentle wave travel: creates natural crest bobbing as wave rises
  const phaseSpeed = 2 * Math.PI * 2.2;
  const phase = phaseSpeed * t;

  // Analytical wave height y(x) at any horizontal position x
  const waveY = (x: number): number => {
    const theta = k * x - phase;
    return baseY + amplitude * Math.sin(theta) + (amplitude * 0.16) * Math.sin(2 * theta + 0.4);
  };

  // Exact spatial derivative dy/dx for physical boat tilt
  const waveSlope = (x: number): number => {
    const theta = k * x - phase;
    return amplitude * k * Math.cos(theta) + (amplitude * 0.16) * (2 * k) * Math.cos(2 * theta + 0.4);
  };

  // 44 points along the wave line from x = 0 to x = W
  const N = 44;
  const wavePoints: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const x = Math.round((i / N) * W);
    const y = Math.round(waveY(x));
    wavePoints.push({ x, y });
  }

  const bottomY = Math.round(H + 120);

  // 1. Root clip-path polygon (Reveals new theme BELOW the wave line down to bottom corners)
  const rootPoly = [
    `0px ${wavePoints[0].y}px`,
    ...wavePoints.map(p => `${p.x}px ${p.y}px`),
    `${W}px ${bottomY}px`,
    `0px ${bottomY}px`
  ].join(', ');

  // 2. Sea ribbon polygon (Teal water band directly beneath wave crest)
  const seaPoly = [
    ...wavePoints.map(p => `${p.x}px ${p.y}px`),
    ...wavePoints.slice().reverse().map(p => `${p.x}px ${Math.round(p.y + seaThickness)}px`)
  ].join(', ');

  // 3. Foam ribbon polygon (Thin white seafoam line along the crest)
  const foamPoly = [
    ...wavePoints.map(p => `${p.x}px ${Math.round(p.y - foamThickness)}px`),
    ...wavePoints.slice().reverse().map(p => `${p.x}px ${p.y}px`)
  ].join(', ');

  // 4. Boat rides the crest, bobbing with height, tilting with slope, sailing left to right
  const boatStartX = W * 0.08;
  const boatEndX = W * 0.92;
  const boatX = Math.round(boatStartX + (boatEndX - boatStartX) * t);
  const boatY = Math.round(waveY(boatX));
  const slope = waveSlope(boatX);
  const angleDeg = Math.atan(slope) * (180 / Math.PI);

  return {
    rootClip: `polygon(${rootPoly})`,
    seaClip: `polygon(${seaPoly})`,
    foamClip: `polygon(${foamPoly})`,
    boatTransform: `translate3d(${boatX}px, ${boatY}px, 0px) rotate(${angleDeg.toFixed(1)}deg) translate(-50%, -78%)`
  };
}

/**
 * Creates the SVG sailboat element
 */
function createBoatElement(isMobile: boolean): HTMLElement {
  const boatEl = document.createElement('div');
  boatEl.className = 'wave-transition-boat';
  boatEl.setAttribute('aria-hidden', 'true');
  const size = isMobile ? 54 : 64;
  boatEl.style.width = `${size}px`;
  boatEl.style.height = `${size}px`;

  boatEl.innerHTML = `<svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Brown Wood Mast -->
    <line x1="31" y1="8" x2="31" y2="44" stroke="#3e2723" stroke-width="2" stroke-linecap="round"/>
    <!-- Red Pennant Flag -->
    <polygon points="31,8 41,11 31,14" fill="#e05344"/>
    <!-- Main Sail (Left, White/Ivory) -->
    <polygon points="29,12 29,42 11,42" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.18))"/>
    <!-- Jib Sail (Right, Sunlit Amber/Yellow) -->
    <polygon points="33,16 33,42 50,42" fill="#fbc02d" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.18))"/>
    <!-- Hull (Coral Red) -->
    <polygon points="9,44 55,44 47,56 17,56" fill="#e05344"/>
    <!-- Hull Deck Line -->
    <line x1="8" y1="44" x2="56" y2="44" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.95"/>
  </svg>`;
  return boatEl;
}

/**
 * Directly applies the theme to DOM and localStorage without triggering animation
 */
export function applyThemeToDOM(targetTheme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', targetTheme);
  if (targetTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  try {
    localStorage.setItem('dtb_theme', targetTheme);
  } catch {}
}

export function useWaveThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTransitioningRef = useRef(false);
  const activeAnimationsRef = useRef<Animation[]>([]);

  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('dtb_theme') as Theme | null;
    const initialTheme: Theme =
      savedTheme === 'dark' || savedTheme === 'light'
        ? savedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    setThemeState(initialTheme);
    applyThemeToDOM(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('dtb_theme') && !isTransitioningRef.current) {
        const autoTheme: Theme = e.matches ? 'dark' : 'light';
        setThemeState(autoTheme);
        applyThemeToDOM(autoTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      // Clean up any remaining animations on unmount
      activeAnimationsRef.current.forEach(a => {
        try { a.cancel(); } catch {}
      });
      activeAnimationsRef.current = [];
    };
  }, []);

  const setThemeWithTransition = useCallback(async (nextTheme: Theme) => {
    if (isTransitioningRef.current) return; // Prevent rapid clicking while running
    if (nextTheme === theme && mounted) return;

    // Check fallback: missing View Transitions API or prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const supportsViewTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as unknown as { startViewTransition: unknown }).startViewTransition === 'function';

    if (!supportsViewTransition || prefersReducedMotion || !mounted) {
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      return;
    }

    isTransitioningRef.current = true;
    setIsTransitioning(true);

    // Cancel any previous residual animations to prevent memory/CPU leaks
    activeAnimationsRef.current.forEach(a => {
      try { a.cancel(); } catch {}
    });
    activeAnimationsRef.current = [];

    // Remove any leftover helper elements before starting
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.wave-transition-sea, .wave-transition-foam, .wave-transition-boat').forEach(el => el.remove());
      // Temporarily disable CSS background-color transitions during the wave reveal
      document.documentElement.classList.add('wave-transitioning');
    }

    const W = window.innerWidth;
    const H = window.innerHeight;
    const isMobile = W < 640;

    // Precompute keyframes at ~1 frame per 40ms with linear easing
    const frameIntervalMs = 40;
    const totalFrames = Math.ceil(WAVE_DURATION / frameIntervalMs);

    const rootKeyframes: Keyframe[] = [];
    const seaKeyframes: Keyframe[] = [];
    const foamKeyframes: Keyframe[] = [];
    const boatKeyframes: Keyframe[] = [];

    for (let i = 0; i <= totalFrames; i++) {
      const t = i / totalFrames;
      const frame = frameAt(t, W, H);
      rootKeyframes.push({ clipPath: frame.rootClip });
      seaKeyframes.push({ clipPath: frame.seaClip });
      foamKeyframes.push({ clipPath: frame.foamClip });
      // Including clipPath on boat keyframes ensures the boat animation runs
      // in lockstep on the exact same main-thread timeline as clip-path,
      // preventing the compositor thread from moving the boat ahead of the wave!
      boatKeyframes.push({
        transform: frame.boatTransform,
        clipPath: 'inset(0)'
      });
    }

    // Create helper elements only while transition runs
    const seaEl = document.createElement('div');
    seaEl.className = 'wave-transition-sea';
    seaEl.setAttribute('aria-hidden', 'true');

    const foamEl = document.createElement('div');
    foamEl.className = 'wave-transition-foam';
    foamEl.setAttribute('aria-hidden', 'true');

    const boatEl = createBoatElement(isMobile);

    try {
      const transition = (document as unknown as {
        startViewTransition: (callback: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      }).startViewTransition(() => {
        // 1. Helper elements injected into DOM for view-transition capture
        document.body.appendChild(seaEl);
        document.body.appendChild(foamEl);
        document.body.appendChild(boatEl);

        // 2. Apply the new theme to DOM and state
        setThemeState(nextTheme);
        applyThemeToDOM(nextTheme);
      });

      await transition.ready;

      // Animate clip-path on ::view-transition-new(root)
      const animRoot = document.documentElement.animate(rootKeyframes, {
        pseudoElement: '::view-transition-new(root)',
        duration: WAVE_DURATION,
        easing: 'linear',
        fill: 'none'
      });

      // Animate sea ribbon
      const animSea = document.documentElement.animate(seaKeyframes, {
        pseudoElement: '::view-transition-new(sea)',
        duration: WAVE_DURATION,
        easing: 'linear',
        fill: 'none'
      });

      // Animate foam ribbon
      const animFoam = document.documentElement.animate(foamKeyframes, {
        pseudoElement: '::view-transition-new(foam)',
        duration: WAVE_DURATION,
        easing: 'linear',
        fill: 'none'
      });

      // Animate sailboat transform via ::view-transition-group(boat)
      const animBoat = document.documentElement.animate(boatKeyframes, {
        pseudoElement: '::view-transition-group(boat)',
        duration: WAVE_DURATION,
        easing: 'linear',
        fill: 'none'
      });

      activeAnimationsRef.current = [animRoot, animSea, animFoam, animBoat];

      // Wait for View Transition and animations to complete
      await Promise.all([
        transition.finished.catch(() => {}),
        animRoot.finished.catch(() => {}),
        animSea.finished.catch(() => {}),
        animFoam.finished.catch(() => {}),
        animBoat.finished.catch(() => {})
      ]);
    } catch {
      // Fail-safe cleanup
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
    } finally {
      // Clean up all animations immediately to prevent compounding CPU/memory lag
      activeAnimationsRef.current.forEach(a => {
        try { a.cancel(); } catch {}
      });
      activeAnimationsRef.current = [];

      // Clean up helper elements from DOM
      try { seaEl.remove(); } catch {}
      try { foamEl.remove(); } catch {}
      try { boatEl.remove(); } catch {}
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('wave-transitioning');
      }

      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    void setThemeWithTransition(nextTheme);
  }, [theme, setThemeWithTransition]);

  const setTheme = useCallback((newTheme: Theme) => {
    void setThemeWithTransition(newTheme);
  }, [setThemeWithTransition]);

  return {
    theme,
    toggleTheme,
    setTheme,
    isTransitioning,
    mounted
  };
}
