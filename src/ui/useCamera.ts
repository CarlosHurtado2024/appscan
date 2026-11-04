import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'starting' | 'ready' | 'denied' | 'unavailable';

const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
};

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>('starting');

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('', 'NotFoundError');
        stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
        // The user may have left while the permission prompt was open.
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (!cancelled) setStatus('ready');
      } catch (e) {
        if (!cancelled) setStatus((e as DOMException).name === 'NotAllowedError' ? 'denied' : 'unavailable');
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(async (): Promise<Blob> => {
    const video = videoRef.current!;
    const canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
  }, []);

  return { videoRef, status, capture };
}
