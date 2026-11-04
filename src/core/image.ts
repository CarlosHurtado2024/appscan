import { resizeRaster } from './raster';
import type { Raster } from './types';

export const MAX_ORIGINAL_SIDE = 4000;

export class UnsupportedImageError extends Error {
  constructor() {
    super('Este archivo no se puede abrir como imagen.');
    this.name = 'UnsupportedImageError';
  }
}

async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new UnsupportedImageError();
  }
}

function fit(w: number, h: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

function drawn(bitmap: CanvasImageSource & { width: number; height: number }, maxSide: number) {
  const { width, height } = fit(bitmap.width, bitmap.height, maxSide);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new RangeError('Sin memoria para la imagen');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, ctx, width, height };
}

/** Bakes in EXIF orientation and the size limit, so everything downstream can ignore them. */
export async function normalizeImage(file: Blob): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new UnsupportedImageError();
    }
    const source = Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
    const { canvas, width, height } = drawn(source, MAX_ORIGINAL_SIDE);
    return { blob: await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 }), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function blobToRaster(blob: Blob, maxSide = MAX_ORIGINAL_SIDE): Promise<Raster> {
  const bitmap = await decode(blob);
  try {
    const { ctx, width, height } = drawn(bitmap, maxSide);
    return { width, height, data: ctx.getImageData(0, 0, width, height).data };
  } finally {
    bitmap.close();
  }
}

export function rasterToCanvas(r: Raster): OffscreenCanvas {
  const canvas = new OffscreenCanvas(r.width, r.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new RangeError('Sin memoria para la imagen');
  ctx.putImageData(new ImageData(new Uint8ClampedArray(r.data), r.width, r.height), 0, 0);
  return canvas;
}

export function rasterToBlob(r: Raster, quality = 0.85): Promise<Blob> {
  return rasterToCanvas(r).convertToBlob({ type: 'image/jpeg', quality });
}

export { resizeRaster };
