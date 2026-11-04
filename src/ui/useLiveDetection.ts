import { useEffect, useState, type RefObject } from 'react';
import type { Quad } from '../core/types';
import { vision } from '../core/vision/client';

const FRAME_SIDE = 500;
const INTERVAL_MS = 250;

/** Outlines the sheet about four times a second, and skips frames rather than queueing them. */
export function useLiveDetection(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean): Quad | null {
  const [quad, setQuad] = useState<Quad | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let running = false;

    const timer = window.setInterval(async () => {
      const video = videoRef.current;
      if (running || !video?.videoWidth || document.hidden) return;
      running = true;
      try {
        const scale = Math.min(1, FRAME_SIDE / Math.max(video.videoWidth, video.videoHeight));
        const width = Math.max(1, Math.round(video.videoWidth * scale));
        const height = Math.max(1, Math.round(video.videoHeight * scale));
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(video, 0, 0, width, height);
        const found = await vision.detect({ width, height, data: ctx.getImageData(0, 0, width, height).data });
        if (!stopped) setQuad(found);
      } catch {
        // The outline is a guide only; scanning works without it.
        window.clearInterval(timer);
      } finally {
        running = false;
      }
    }, INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [videoRef, enabled]);

  return quad;
}
