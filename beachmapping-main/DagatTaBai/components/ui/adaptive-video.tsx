'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface AdaptiveVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  hlsSrc?: string;
  fallbackMp4: string;
  poster: string;
  className?: string;
  objectPosition?: string;
}

/**
 * Adaptive Video Component with HLS.js streaming.
 * Automatically adapts resolution (360p -> 720p -> 1080p) based on network conditions
 * ("anam-anamon niya ang resolution if hinay ang network").
 * Detects cellular 2G/3G or Data-Saver to prevent mobile data drain.
 */
export function AdaptiveVideo({
  hlsSrc,
  fallbackMp4,
  poster,
  className = 'w-full h-full object-cover',
  objectPosition = 'center center',
  ...rest
}: AdaptiveVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  useEffect(() => {
    // Detect mobile data saver / 2G / 3G
    if (typeof navigator !== 'undefined') {
      const nav = navigator as unknown as {
        connection?: { saveData?: boolean; effectiveType?: string };
        mozConnection?: { saveData?: boolean; effectiveType?: string };
        webkitConnection?: { saveData?: boolean; effectiveType?: string };
      };
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
      if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === '3g') {
        setIsSlowNetwork(true);
        return; // Don't heavy-stream on 2G/3G connections
      }
    }

    const video = videoRef.current;
    if (!video) return;

    let hlsInstance: Hls | null = null;

    if (hlsSrc && Hls.isSupported()) {
      hlsInstance = new Hls({
        capLevelToPlayerSize: true, // Only download resolution matching screen size
        maxBufferLength: 10,        // Cache at most 10 seconds ahead
        maxMaxBufferLength: 20,
        enableWorker: true,
        startLevel: -1,             // Adaptive start level based on bandwidth probe
      });

      hlsInstance.loadSource(hlsSrc);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hlsInstance?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hlsInstance?.recoverMediaError();
              break;
            default:
              hlsInstance?.destroy();
              break;
          }
        }
      });
    } else if (hlsSrc && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS Native HLS engine
      video.src = hlsSrc;
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [hlsSrc]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      preload="none"
      muted
      loop
      playsInline
      autoPlay={!isSlowNetwork}
      className={className}
      style={{ objectPosition }}
      {...rest}
    >
      <source src={fallbackMp4} type="video/mp4" />
    </video>
  );
}
