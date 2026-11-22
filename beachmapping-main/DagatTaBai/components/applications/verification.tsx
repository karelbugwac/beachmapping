'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Check, CheckCircle2, Loader2, RefreshCw, SwitchCamera } from 'lucide-react';
import {
  analyzeFrame,
  completeChallenge,
  failChallengeAttempt,
  isFrozenFrame,
  LIVE_VERIFICATION_MESSAGES,
  LIVE_VERIFICATION_THRESHOLDS,
  type ChallengeProgress,
  type LiveChallenge,
} from '@/lib/verification/liveVerification';

interface LiveVerificationProps {
  onVerified: (nonce: string) => void;
}

interface VerificationSession {
  nonce: string;
  challenges: LiveChallenge[];
  attempts: number;
}

interface ChallengeEvidence {
  challenge: LiveChallenge;
  completed: true;
  durationMs: number;
}

const challengePrompts: Record<LiveChallenge, string> = {
  blink: 'Blink twice',
  turn_left: 'Turn your head to the left',
  turn_right: 'Turn your head to the right',
  smile: 'Smile',
  open_mouth: 'Open your mouth',
};

function getCameraError(error: unknown) {
  if (!window.isSecureContext) return LIVE_VERIFICATION_MESSAGES.insecureContext;
  if (!navigator.mediaDevices?.getUserMedia) return LIVE_VERIFICATION_MESSAGES.noCamera;
  const errorName = error && typeof error === 'object' && 'name' in error && typeof error.name === 'string'
    ? error.name
    : '';
  if (errorName === 'NotAllowedError' || errorName === 'SecurityError') return LIVE_VERIFICATION_MESSAGES.permissionDenied;
  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') return LIVE_VERIFICATION_MESSAGES.noCamera;
  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') return LIVE_VERIFICATION_MESSAGES.cameraBusy;
  if (errorName === 'OverconstrainedError') {
    return LIVE_VERIFICATION_MESSAGES.cameraSettings;
  }
  return LIVE_VERIFICATION_MESSAGES.cameraEnded;
}

function categoryScore(categories: Array<{ categoryName?: string; score?: number }>, name: string) {
  return categories.find((category) => category.categoryName === name)?.score || 0;
}

export default function LiveVerification({ onVerified }: LiveVerificationProps) {
  const [consented, setConsented] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [status, setStatus] = useState('Starting camera...');
  const [session, setSession] = useState<VerificationSession | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<LiveChallenge[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [verified, setVerified] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const disposedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<import('@mediapipe/tasks-vision').FaceDetector | null>(null);
  const landmarkerRef = useRef<import('@mediapipe/tasks-vision').FaceLandmarker | null>(null);
  const lastDetectionAtRef = useRef(0);
  const lastHashRef = useRef<{ hash: string; since: number } | null>(null);
  const badFrameSinceRef = useRef(0);
  const faceSinceRef = useRef(0);
  const noFaceSinceRef = useRef(0);
  const faceHistoryRef = useRef<number[][]>([]);
  const movementStartedAtRef = useRef(0);
  const priorBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const blinkStateRef = useRef({ closed: false, count: 0 });
  const capturePendingRef = useRef(false);
  const captureReadyAtRef = useRef(0);
  const challengeResultsRef = useRef<ChallengeEvidence[]>([]);
  const challengeStartedAtRef = useRef(0);
  const flaggedReasonsRef = useRef<string[]>([]);
  const attemptRef = useRef(0);
  const startDetectionRef = useRef<() => Promise<void>>(async () => undefined);
  const finishVerificationRef = useRef<() => Promise<void>>(async () => undefined);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    const handleVisibility = () => {
      if (document.hidden) {
        stopCamera();
        if (!verified) setCameraError(LIVE_VERIFICATION_MESSAGES.cameraEnded);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      disposedRef.current = true;
      stopCamera();
      detectorRef.current?.close();
      landmarkerRef.current?.close();
    };
  }, [stopCamera, verified]);

  const beginSession = useCallback(async (deviceIdOverride?: string) => {
    setCameraError(null);
    setStatus('Starting camera...');
    if (!window.isSecureContext) {
      setCameraError(LIVE_VERIFICATION_MESSAGES.insecureContext);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(LIVE_VERIFICATION_MESSAGES.noCamera);
      return;
    }

    try {
      const deviceId = deviceIdOverride || selectedDeviceId;
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (disposedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setCameraActive(true);
      const videoTrack = stream.getVideoTracks()[0];
      const label = videoTrack?.label || '';
      if (/obs|virtual|manycam|snap camera/i.test(label)) flaggedReasonsRef.current = ['Virtual camera'];
      else flaggedReasonsRef.current = [];
      videoTrack?.addEventListener('ended', () => setCameraError(LIVE_VERIFICATION_MESSAGES.cameraEnded));
      videoTrack?.addEventListener('mute', () => setCameraError(LIVE_VERIFICATION_MESSAGES.cameraEnded));

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      setCameraDevices(cameras);
      if (videoTrack?.getSettings().deviceId) setSelectedDeviceId(videoTrack.getSettings().deviceId);

      const video = videoRef.current;
      if (!video) throw new Error(LIVE_VERIFICATION_MESSAGES.cameraEnded);
      video.srcObject = stream;
      await video.play();
      await new Promise<void>((resolve, reject) => {
        const check = () => {
          if (video.readyState >= 2 && video.videoWidth > 0) resolve();
          else if (!stream.active) reject(new Error(LIVE_VERIFICATION_MESSAGES.cameraEnded));
          else requestAnimationFrame(check);
        };
        check();
      });
      const sessionResponse = await fetch('/api/applications/live-session', {
        method: 'POST',
        cache: 'no-store',
      });
      const sessionData = await sessionResponse.json();
      if (!sessionResponse.ok) throw new Error(sessionData.error || LIVE_VERIFICATION_MESSAGES.serverRejected);
      const nextSession: VerificationSession = {
        nonce: sessionData.nonce,
        challenges: sessionData.challenges,
        attempts: sessionData.attempts,
      };
      setSession(nextSession);
      sessionRef.current = nextSession;
      setCompletedChallenges([]);
      completedRef.current = [];
      currentChallengeRef.current = null;
      challengeResultsRef.current = [];
      capturePendingRef.current = false;
      captureReadyAtRef.current = 0;
      const initialProgress: ChallengeProgress = {
        challenges: nextSession.challenges,
        completed: [],
        attempts: attemptRef.current,
        status: 'pending',
      };
      progressRef.current = initialProgress;
      setCameraActive(true);
      lastDetectionAtRef.current = 0;
      faceSinceRef.current = 0;
      noFaceSinceRef.current = 0;
      movementStartedAtRef.current = 0;
      faceHistoryRef.current = [];
      lastHashRef.current = null;
      badFrameSinceRef.current = 0;
      setStatus('Face the camera');
      void startDetectionRef.current();
    } catch (error) {
      stopCamera();
      const message = error instanceof DOMException
        ? getCameraError(error)
        : error instanceof Error &&
          Object.values(LIVE_VERIFICATION_MESSAGES).some((candidate) => candidate === error.message)
          ? error.message
          : error && typeof error === 'object' && 'name' in error
            ? getCameraError(error)
            : LIVE_VERIFICATION_MESSAGES.serverRejected;
      setCameraError(message);
      setStatus(message);
    }
  }, [selectedDeviceId, stopCamera]);

  const submitFailure = useCallback(async (nonce: string, challenges: LiveChallenge[], attempts: number) => {
    const formData = new FormData();
    formData.set('nonce', nonce);
    formData.set('challenge_results', JSON.stringify([]));
    formData.set('failure', 'true');
    formData.set('flaggedreasons', JSON.stringify(flaggedReasonsRef.current));
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video?.videoWidth && video.videoHeight && canvas) {
      const scale = Math.min(640 / video.videoWidth, 480 / video.videoHeight, 1);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshot = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        );
        if (snapshot) formData.set('snapshot', snapshot, 'verification.jpg');
      }
    }
    try {
      const response = await fetch('/api/applications/live-result', { method: 'POST', body: formData });
      if (response.status >= 500) setCameraError(LIVE_VERIFICATION_MESSAGES.serverRejected);
    } catch {
      setCameraError(LIVE_VERIFICATION_MESSAGES.serverRejected);
    }
    setAttemptCount(attempts);
  }, []);

  const startDetection = useCallback(async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      if (disposedRef.current || !streamRef.current?.active) return;
      const fileset = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm', false);
      if (!detectorRef.current) {
        detectorRef.current = await vision.FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: '/models/face_detector.tflite' },
          runningMode: 'VIDEO',
          minDetectionConfidence: LIVE_VERIFICATION_THRESHOLDS.faceConfidence,
        });
      }
      if (!landmarkerRef.current) {
        landmarkerRef.current = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: '/models/face_landmarker.task' },
          runningMode: 'VIDEO',
          numFaces: 2,
          minFaceDetectionConfidence: LIVE_VERIFICATION_THRESHOLDS.faceConfidence,
          minFacePresenceConfidence: LIVE_VERIFICATION_THRESHOLDS.faceConfidence,
          minTrackingConfidence: LIVE_VERIFICATION_THRESHOLDS.faceConfidence,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });
      }
      const detector = detectorRef.current;
      const landmarker = landmarkerRef.current;
      if (disposedRef.current || !streamRef.current?.active) {
        detector.close();
        landmarker.close();
        detectorRef.current = null;
        landmarkerRef.current = null;
        return;
      }
      let priorFrameAt = performance.now();
      let priorFrameHash = '';
      const handleChallengeTimeout = (now: number) => {
        const currentProgress = progressRef.current;
        if (!currentProgress) {
          setCameraError(LIVE_VERIFICATION_MESSAGES.serverRejected);
          stopCamera();
          return true;
        }
        const failedProgress = failChallengeAttempt(currentProgress);
        const attempts = attemptRef.current + 1;
        attemptRef.current = attempts;
        const nextProgress = attempts >= LIVE_VERIFICATION_THRESHOLDS.maximumAttempts
          ? failedProgress
          : { ...failedProgress, status: 'pending' as const };
        progressRef.current = nextProgress;
        setAttemptCount(attempts);
        if (attempts >= LIVE_VERIFICATION_THRESHOLDS.maximumAttempts) {
          setStatus(LIVE_VERIFICATION_MESSAGES.tooManyAttempts);
          setCameraError(LIVE_VERIFICATION_MESSAGES.tooManyAttempts);
          const activeSession = sessionRef.current;
          if (activeSession) void submitFailure(activeSession.nonce, activeSession.challenges, attempts);
          stopCamera();
          return true;
        }
        setStatus(LIVE_VERIFICATION_MESSAGES.challengeTimeout);
        completedRef.current = [];
        challengeResultsRef.current = [];
        setCompletedChallenges([]);
        currentChallengeRef.current = null;
        challengeStartedAtRef.current = now;
        blinkStateRef.current = { closed: false, count: 0 };
        return false;
      };
      const checkFrame = (now: number) => {
        if (!streamRef.current?.active || !videoRef.current || !canvasRef.current || document.hidden) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (!track || track.readyState === 'ended' || track.muted) {
          setCameraError(LIVE_VERIFICATION_MESSAGES.cameraEnded);
          stopCamera();
          return;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState < 2 || video.videoWidth === 0 || now - lastDetectionAtRef.current < LIVE_VERIFICATION_THRESHOLDS.detectionIntervalMs) {
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        if (
          currentChallengeRef.current &&
          now - challengeStartedAtRef.current > LIVE_VERIFICATION_THRESHOLDS.challengeTimeoutMs &&
          handleChallengeTimeout(now)
        ) return;
        lastDetectionAtRef.current = now;
        canvas.width = LIVE_VERIFICATION_THRESHOLDS.sampleWidth;
        canvas.height = LIVE_VERIFICATION_THRESHOLDS.sampleHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          setCameraError(LIVE_VERIFICATION_MESSAGES.noSignal);
          stopCamera();
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = analyzeFrame(context.getImageData(0, 0, canvas.width, canvas.height));
        if (!frame.valid) {
          badFrameSinceRef.current ||= now;
          const message = frame.meanLuminance < 5
            ? LIVE_VERIFICATION_MESSAGES.noSignal
            : frame.tooDark
            ? LIVE_VERIFICATION_MESSAGES.tooDark
            : frame.tooBright
              ? 'Too bright'
              : frame.blurry
                ? LIVE_VERIFICATION_MESSAGES.blurry
                : LIVE_VERIFICATION_MESSAGES.noSignal;
          setStatus(message);
          if (now - badFrameSinceRef.current >= LIVE_VERIFICATION_THRESHOLDS.frameCheckDurationMs) {
            setCameraError(frame.meanLuminance < 5
              ? LIVE_VERIFICATION_MESSAGES.noSignal
              : frame.tooDark
                ? LIVE_VERIFICATION_MESSAGES.tooDark
              : frame.tooBright
                ? LIVE_VERIFICATION_MESSAGES.tooBright
                : frame.blurry
                  ? LIVE_VERIFICATION_MESSAGES.blurry
                : LIVE_VERIFICATION_MESSAGES.noSignal);
            stopCamera();
            return;
          }
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        badFrameSinceRef.current = 0;
        if (lastHashRef.current?.hash === frame.hash) {
          if (isFrozenFrame(lastHashRef.current.hash, frame.hash, now - lastHashRef.current.since)) {
            setCameraError(LIVE_VERIFICATION_MESSAGES.suspectedPhoto);
            stopCamera();
            return;
          }
        } else {
          lastHashRef.current = { hash: frame.hash, since: now };
        }

        if (now - priorFrameAt >= LIVE_VERIFICATION_THRESHOLDS.frameCheckDurationMs &&
          priorFrameHash && priorFrameHash === frame.hash) {
          setCameraError(LIVE_VERIFICATION_MESSAGES.suspectedPhoto);
          stopCamera();
          return;
        }
        if (now - priorFrameAt >= LIVE_VERIFICATION_THRESHOLDS.frameCheckDurationMs) {
          priorFrameAt = now;
          priorFrameHash = frame.hash;
        }

        let frameResult;
        try {
          frameResult = {
            detections: detector.detectForVideo(video, now).detections,
            landmarks: landmarker.detectForVideo(video, now),
          };
        } catch {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Live verification stopped because a camera frame could not be processed.');
          }
          setCameraError(LIVE_VERIFICATION_MESSAGES.detectionFailed);
          setStatus(LIVE_VERIFICATION_MESSAGES.detectionFailed);
          stopCamera();
          return;
        }
        const { detections, landmarks: landmarkResult } = frameResult;
        if (detections.length > 1 || landmarkResult.faceLandmarks.length > 1) {
          setStatus('Only one person should be in the frame');
          faceSinceRef.current = 0;
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        const detection = detections[0];
        const box = detection?.boundingBox;
        const confidence = detection?.categories[0]?.score || 0;
        const face = landmarkResult.faceLandmarks[0];
        if (!detection || !box || !face || confidence < LIVE_VERIFICATION_THRESHOLDS.faceConfidence) {
          if (!noFaceSinceRef.current) noFaceSinceRef.current = now;
          setStatus(now - noFaceSinceRef.current > LIVE_VERIFICATION_THRESHOLDS.missingFaceMessageDelayMs
            ? LIVE_VERIFICATION_MESSAGES.noFace
            : 'Face the camera');
          faceSinceRef.current = 0;
          priorBoxRef.current = null;
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        noFaceSinceRef.current = 0;
        const widthRatio = box.width / video.videoWidth;
        const centerX = (box.originX + box.width / 2) / video.videoWidth;
        const centerY = (box.originY + box.height / 2) / video.videoHeight;
        if (widthRatio < LIVE_VERIFICATION_THRESHOLDS.minimumFaceWidthRatio) {
          setStatus('Move closer');
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        if (centerX < 0.3 || centerX > 0.7 || centerY < 0.25 || centerY > 0.75) {
          setStatus('Move back a little');
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }

        const normalizedBox = { x: centerX, y: centerY, width: widthRatio, height: box.height / video.videoHeight };
        if (priorBoxRef.current) {
          const jump = Math.abs(normalizedBox.x - priorBoxRef.current.x) +
            Math.abs(normalizedBox.y - priorBoxRef.current.y) +
            Math.abs(normalizedBox.width - priorBoxRef.current.width);
          if (jump > 0.45) {
            setCameraError(LIVE_VERIFICATION_MESSAGES.suspectedPhoto);
            stopCamera();
            return;
          }
        }
        priorBoxRef.current = normalizedBox;
        faceSinceRef.current ||= now;

        const points = face.flatMap((point: any) => [point.x, point.y]);
        const history = faceHistoryRef.current;
        if (history.length) {
          const previous = history[history.length - 1];
          const jitter = points.reduce((sum: number, value: number, index: number) => sum + Math.abs(value - previous[index]), 0) / points.length;
          if (jitter > 0.00015) {
            history.push(points);
            movementStartedAtRef.current = now;
          }
        } else {
          history.push(points);
          movementStartedAtRef.current = now;
        }
        if (history.length > 20) history.shift();
        if (now - movementStartedAtRef.current > 3000) {
          setCameraError(LIVE_VERIFICATION_MESSAGES.suspectedPhoto);
          stopCamera();
          return;
        }
        if (history.length < 3) {
          setStatus('Hold still');
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        const yaw = face[1] && face[33] && face[263]
          ? (face[1].x - (face[33].x + face[263].x) / 2) / Math.max(0.01, Math.abs(face[33].x - face[263].x))
          : 0;
        if (capturePendingRef.current) {
          if (Math.abs(yaw) <= 0.08) {
            captureReadyAtRef.current ||= now;
            setStatus('Hold still while we take your selfie');
            if (now - captureReadyAtRef.current >= 500) {
              capturePendingRef.current = false;
              void finishVerificationRef.current();
              return;
            }
          } else {
            captureReadyAtRef.current = 0;
            setStatus('Face the camera for your selfie');
          }
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        if (now - faceSinceRef.current < LIVE_VERIFICATION_THRESHOLDS.faceStableDurationMs) {
          setStatus('Hold still');
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }

        const blendshapes = landmarkResult.faceBlendshapes[0]?.categories || [];
        const challenge = currentChallengeRef.current;
        if (!challenge) {
          const nextChallenge = sessionRef.current?.challenges[completedRef.current.length];
          if (nextChallenge) {
            currentChallengeRef.current = nextChallenge;
            challengeStartedAtRef.current = now;
          }
          setStatus(nextChallenge ? challengePrompts[nextChallenge] : 'Hold still');
          rafRef.current = requestAnimationFrame(checkFrame);
          return;
        }
        let done = false;
        switch (challenge) {
          case 'blink': {
            const blink = Math.min(categoryScore(blendshapes, 'eyeBlinkLeft'), categoryScore(blendshapes, 'eyeBlinkRight'));
            if (blink > 0.55) blinkStateRef.current.closed = true;
            else if (blinkStateRef.current.closed) {
              blinkStateRef.current.closed = false;
              blinkStateRef.current.count += 1;
            }
            done = blinkStateRef.current.count >= 2;
            break;
          }
          case 'turn_left': done = yaw > 0.12; break;
          case 'turn_right': done = yaw < -0.12; break;
          case 'smile':
            done = categoryScore(blendshapes, 'mouthSmileLeft') > 0.5 &&
              categoryScore(blendshapes, 'mouthSmileRight') > 0.5;
            break;
          case 'open_mouth': done = categoryScore(blendshapes, 'jawOpen') > 0.35; break;
        }
        if (done) {
          const currentProgress = progressRef.current;
          if (!currentProgress) {
            setCameraError(LIVE_VERIFICATION_MESSAGES.serverRejected);
            stopCamera();
            return;
          }
          const nextProgress = completeChallenge(currentProgress, challenge, true);
          progressRef.current = nextProgress;
          const completed = nextProgress.completed;
          challengeResultsRef.current = [
            ...challengeResultsRef.current,
            { challenge, completed: true, durationMs: now - challengeStartedAtRef.current },
          ];
          completedRef.current = completed;
          setCompletedChallenges(completed);
          currentChallengeRef.current = null;
          blinkStateRef.current = { closed: false, count: 0 };
          if (completed.length === (sessionRef.current?.challenges.length || 0)) {
            capturePendingRef.current = true;
            captureReadyAtRef.current = 0;
            setStatus('Face the camera for your selfie');
          } else {
            setStatus('Check complete');
          }
        }
        rafRef.current = requestAnimationFrame(checkFrame);
      };
      rafRef.current = requestAnimationFrame(checkFrame);
    } catch {
      setCameraError(LIVE_VERIFICATION_MESSAGES.serverRejected);
      stopCamera();
    }
  }, [stopCamera, submitFailure]);

  const sessionRef = useRef<VerificationSession | null>(null);
  const currentChallengeRef = useRef<LiveChallenge | null>(null);
  const completedRef = useRef<LiveChallenge[]>([]);
  const progressRef = useRef<ChallengeProgress | null>(null);
  const finishVerification = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const activeSession = sessionRef.current;
    if (!video || !canvas || !activeSession) return;
    const snapshotScale = Math.min(640 / video.videoWidth, 480 / video.videoHeight, 1);
    canvas.width = Math.round(video.videoWidth * snapshotScale);
    canvas.height = Math.round(video.videoHeight * snapshotScale);
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError(LIVE_VERIFICATION_MESSAGES.noSignal);
      stopCamera();
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    if (!blob) {
      setCameraError(LIVE_VERIFICATION_MESSAGES.serverRejected);
      stopCamera();
      return;
    }
    const body = new FormData();
    body.set('nonce', activeSession.nonce);
    body.set('challenge_results', JSON.stringify(challengeResultsRef.current));
    body.set('flaggedreasons', JSON.stringify(flaggedReasonsRef.current));
    body.set('snapshot', blob, 'verification.jpg');
    try {
      const response = await fetch('/api/applications/live-result', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || LIVE_VERIFICATION_MESSAGES.serverRejected);
      setVerified(true);
      setStatus('Verified');
      setAttemptCount(result.attempts);
      onVerified(activeSession.nonce);
      stopCamera();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      const safeMessage = Object.values(LIVE_VERIFICATION_MESSAGES)
        .find((message) => message === errorMessage);
      setCameraError(safeMessage || LIVE_VERIFICATION_MESSAGES.serverRejected);
      stopCamera();
    }
  }, [onVerified, stopCamera]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    startDetectionRef.current = startDetection;
    finishVerificationRef.current = finishVerification;
  }, [finishVerification, startDetection]);

  useEffect(() => {
    completedRef.current = completedChallenges;
  }, [completedChallenges]);

  const continueWithConsent = () => {
    setConsented(true);
    void beginSession();
  };

  const retry = () => {
    setSession(null);
    sessionRef.current = null;
    currentChallengeRef.current = null;
    completedRef.current = [];
    challengeResultsRef.current = [];
    capturePendingRef.current = false;
    captureReadyAtRef.current = 0;
    setCompletedChallenges([]);
    setCameraError(null);
    setVerified(false);
    void beginSession();
  };

  const switchCamera = () => {
    if (cameraDevices.length < 2) return;
    const currentIndex = cameraDevices.findIndex((device) => device.deviceId === selectedDeviceId);
    const next = cameraDevices[(currentIndex + 1) % cameraDevices.length];
    stopCamera();
    setSelectedDeviceId(next.deviceId);
    void beginSession(next.deviceId);
  };

  const challengeCount = session?.challenges.length || 0;

  return (
    <section className="space-y-3 pt-2" aria-label="Live person verification">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-brand-navy-500 dark:text-brand-teal-300" />
          <h3 className="font-display text-xs sm:text-sm font-bold text-brand-navy-500 dark:text-brand-teal-300">
            Live Verification <span className="text-red-500">*</span>
          </h3>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
            <Check className="w-3.5 h-3.5" />
            Verified
          </span>
        )}
      </div>

      {!consented ? (
        <div className="rounded-2xl border border-[#1F3F74]/40 dark:border-[#4987BA]/40 bg-white dark:bg-black p-5 space-y-3">
          <p className="font-display text-center text-xs text-slate-700 dark:text-neutral-200">
            A live selfie is required before you can submit your application.
          </p>
          <button type="button" onClick={continueWithConsent} className="font-display flex mx-auto min-h-11 items-center gap-2 px-6 py-3 rounded-full bg-[#F4BF3E] hover:bg-[#e0a92e] text-black text-xs font-medium">
            <Camera className="w-4 h-4" /> I agree and continue
          </button>
        </div>
      ) : (
        <>
          {!cameraError && !verified && (
            <div className="relative rounded-2xl overflow-hidden border-2 border-brand-navy-500 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-72 sm:h-88 object-cover -scale-x-100" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-56 rounded-[50%] border-2 border-white/80 border-dashed shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
              </div>
              <div className="absolute top-3 left-3 right-3 flex justify-between">
                <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">LIVE</span>
                {cameraDevices.length > 1 && (
                  <button type="button" onClick={switchCamera} aria-label="Switch camera" className="rounded-full bg-black/70 p-2 text-white">
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
              </div>
              {challengeCount > 0 && (
                <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2">
                  {session?.challenges.map((challenge, index) => (
                    <span key={`${challenge}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[10px] text-white">
                      {completedChallenges.includes(challenge) ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <span>{index + 1}</span>}
                      {challengePrompts[challenge]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <p aria-live="polite" className="font-display min-h-6 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
            {cameraActive && !cameraError && status === 'Starting camera...' ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
            {cameraError || status}
          </p>
          {cameraError && (
            <div className="font-display flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {cameraError === LIVE_VERIFICATION_MESSAGES.permissionDenied
                  ? 'Open this site’s camera permissions in your browser settings, allow access, then try again.'
                  : 'Check your camera and browser settings, then try again.'}
              </span>
              {attemptCount < LIVE_VERIFICATION_THRESHOLDS.maximumAttempts ? (
                <button type="button" onClick={retry} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-navy-500 px-5 py-2 text-white">
                  <RefreshCw className="h-4 w-4" /> Try Again
                </button>
              ) : (
                <span className="font-semibold">{LIVE_VERIFICATION_MESSAGES.tooManyAttempts}</span>
              )}
            </div>
          )}
          {verified && <p className="font-display text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">Your live check is complete.</p>}
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
      {attemptCount > 0 && <p className="font-display text-center text-[11px] text-slate-500">Attempts: {attemptCount}</p>}
    </section>
  );
}
