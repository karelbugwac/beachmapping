'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Compass, X, ExternalLink, Maximize2, Minimize2, Loader2, Sparkles, HelpCircle } from 'lucide-react';

import { extractTourEmbedUrl } from '@/lib/utils/tourEmbed';
export { extractTourEmbedUrl };

interface VirtualTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourUrl: string | null | undefined;
  beachName?: string;
}

export function VirtualTourModal({
  isOpen,
  onClose,
  tourUrl,
  beachName = 'Beach',
}: VirtualTourModalProps) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const embedUrl = extractTourEmbedUrl(tourUrl);

  // Reset loading when tourUrl changes
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
    }
  }, [isOpen, tourUrl]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isFullscreen, onClose]);

  // Toggle fullscreen mode
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 lg:p-6 transition-all"
      role="dialog"
      aria-modal="true"
      aria-label={`${beachName} 360° Virtual Tour`}
    >
      <div
        ref={containerRef}
        className={`relative flex flex-col bg-zinc-950 text-white rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl transition-all ${
          isFullscreen
            ? 'w-screen h-screen rounded-none border-none'
            : 'w-full max-w-6xl h-[92vh] sm:h-[88vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Sparkles className="w-3 h-3" />
                  360° Virtual Tour
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {beachName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {embedUrl && (
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 transition-colors inline-flex items-center gap-1.5"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open in Tab</span>
              </a>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-colors"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tour Viewer Area */}
        <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
          {embedUrl ? (
            <>
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-300 z-10 space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                  <p className="text-sm font-medium">Loading 360° interactive tour...</p>
                  <p className="text-xs text-zinc-500">Preparing panorama and viewport controls</p>
                </div>
              )}
              <iframe
                src={embedUrl}
                title={`${beachName} 360 Virtual Tour`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; vr; xr-spatial-tracking"
                allowFullScreen
                onLoad={() => setLoading(false)}
              />
            </>
          ) : (
            <div className="p-8 text-center max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No 360° Tour Available</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The resort owner has not yet configured a 360° virtual tour link or embed code for this beach.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Helper Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/90 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Interactive 360° View</span>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <span className="hidden sm:inline">Click & drag to look around or use arrow keys</span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Supports VR &amp; Gyroscope on mobile
          </span>
        </div>
      </div>
    </div>
  );
}
