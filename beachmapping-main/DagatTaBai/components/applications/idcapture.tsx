'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Camera, Loader2, SwitchCamera, X } from 'lucide-react';

export interface IdCaptureHandle {
  open: () => void;
}

interface IdCaptureProps {
  hasPreview: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onCapture: (file: File) => void;
}

type CameraStatus = 'idle' | 'starting' | 'active' | 'error';

const IdCapture = forwardRef<IdCaptureHandle, IdCaptureProps>(function IdCapture(
  { hasPreview, disabled, invalid, onCapture },
  ref
) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const openCamera = useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

  useImperativeHandle(ref, () => ({ open: openCamera }), [openCamera]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus('starting');
    setErrorMessage(null);
    stopCamera();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage('Camera requires a secure (HTTPS) connection. Please reopen this page and try again.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
        setStatus('active');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage('Camera unavailable. Please allow camera access and try again.');
        }
      });
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, facingMode, stopCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], 'valid-id.jpg', { type: 'image/jpeg' }));
      setOpen(false);
    }, 'image/jpeg', 0.92);
  }, [onCapture]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  if (open) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display text-sm font-bold text-brand-navy-500 dark:text-brand-teal-300">
              Capture Valid ID
            </h3>
            <button
              type="button"
              onClick={close}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
              title="Close camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[78%] aspect-[1.6] rounded-2xl border-2 border-dashed border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" />
            </div>
            {status === 'active' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold text-white">
                Position the ID inside the frame
              </div>
            )}
          </div>

          {status === 'error' && (
            <p className="font-display text-center text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
          )}

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={close}
              className="px-5 py-2.5 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capture}
              disabled={status !== 'active'}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F4BF3E] hover:bg-[#e0a92e] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              {status === 'starting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Capture
            </button>
            <button
              type="button"
              onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
              disabled={status !== 'active'}
              className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 flex items-center justify-center disabled:opacity-50 cursor-pointer"
              title="Switch camera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasPreview) return null;

  return (
    <div
      onClick={openCamera}
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all space-y-2.5 group ${
        invalid
          ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20'
          : 'border-[#1F3F74]/40 dark:border-[#4987BA]/40 hover:border-[#1F3F74] dark:hover:border-[#4987BA] bg-white/50 dark:bg-neutral-900/40 hover:bg-brand-navy-50/20'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="font-display w-11 h-11 rounded-full bg-brand-navy-50 dark:bg-brand-navy-900/70 text-brand-navy-500 dark:text-brand-teal-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
        <Camera className="w-5 h-5 stroke-[2]" />
      </div>
      <div className="space-y-0.5">
        <span className="font-display block text-xs sm:text-[11px] font-semibold text-slate-800 dark:text-white">
          Tap to capture your ID
        </span>
        <span className="font-display block text-[11px] text-slate-400">Position ID inside the frame</span>
      </div>
    </div>
  );
});

export default IdCapture;
