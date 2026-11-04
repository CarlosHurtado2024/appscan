import { boundsOf, fullQuad } from './geometry';
import { blobToRaster, MAX_ORIGINAL_SIDE, rasterToCanvas } from './image';
import { cropRaster, rotateRaster } from './raster';
import type { Annotation, Box, Page, Quad, Raster } from './types';
import { vision, VisionUnavailableError } from './vision/client';

const THUMB_SIDE = 320;
const RETRY_SIDE = 2000;
const JPEG_QUALITY = 0.85;
/** Removes the sliver of table that survives a straightened edge and would print as a dark line. */
const EDGE_TRIM = 0.0075;

export type RenderInput = Pick<Page, 'original' | 'corners' | 'rotation' | 'filter' | 'annotations'>;

const isFull = (q: Quad) => JSON.stringify(q) === JSON.stringify(fullQuad());

async function straighten(src: Raster, q: Quad): Promise<Raster> {
  if (isFull(q)) return src;
  try {
    const m = EDGE_TRIM;
    return cropRaster(await vision.warp(src, q), { x: m, y: m, w: 1 - 2 * m, h: 1 - 2 * m });
  } catch (e) {
    if (e instanceof VisionUnavailableError) return cropRaster(src, boundsOf(q));
    throw e;
  }
}

function placeContained(box: Box, w: number, h: number, srcW: number, srcH: number) {
  const bw = box.w * w, bh = box.h * h;
  const scale = Math.min(bw / srcW, bh / srcH);
  const dw = srcW * scale, dh = srcH * scale;
  return { x: box.x * w + (bw - dw) / 2, y: box.y * h + (bh - dh) / 2, w: dw, h: dh };
}

/** Stroke `width` is in thousandths of the page's longest side, so it looks the same at any resolution. */
async function drawAnnotations(
  ctx: OffscreenCanvasRenderingContext2D,
  list: Annotation[],
  w: number,
  h: number,
  signatures: Map<string, Blob>,
) {
  for (const a of list) {
    if (a.type === 'stroke') {
      ctx.strokeStyle = a.color;
      ctx.lineWidth = (a.width / 1000) * Math.max(w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      a.points.forEach((p, i) => (i ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h)));
      ctx.stroke();
    } else if (a.type === 'text') {
      const px = a.box.h * h * 0.8;
      ctx.fillStyle = a.color;
      ctx.font = `${px}px system-ui, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(a.text, a.box.x * w, (a.box.y + a.box.h / 2) * h, a.box.w * w);
    } else {
      const blob = signatures.get(a.signatureId);
      if (!blob) continue;
      const bitmap = await createImageBitmap(blob);
      const r = placeContained(a.box, w, h, bitmap.width, bitmap.height);
      ctx.drawImage(bitmap, r.x, r.y, r.w, r.h);
      bitmap.close();
    }
  }
}

async function renderAt(p: RenderInput, signatures: Map<string, Blob>, maxSide: number) {
  const src = await blobToRaster(p.original, maxSide);
  const straight = await straighten(src, p.corners);
  const filtered = await vision.filter(rotateRaster(straight, p.rotation), p.filter);
  const canvas = rasterToCanvas(filtered);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new RangeError('Sin memoria para la imagen');
  await drawAnnotations(ctx, p.annotations, canvas.width, canvas.height, signatures);

  const rendered = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  const scale = Math.min(1, THUMB_SIDE / Math.max(canvas.width, canvas.height));
  const small = new OffscreenCanvas(Math.max(1, Math.round(canvas.width * scale)), Math.max(1, Math.round(canvas.height * scale)));
  small.getContext('2d')!.drawImage(canvas, 0, 0, small.width, small.height);
  return { rendered, thumb: await small.convertToBlob({ type: 'image/jpeg', quality: 0.7 }) };
}

export async function renderPage(p: RenderInput, signatures: Map<string, Blob> = new Map()) {
  try {
    return await renderAt(p, signatures, MAX_ORIGINAL_SIDE);
  } catch (e) {
    if (e instanceof RangeError) return renderAt(p, signatures, RETRY_SIDE);
    throw e;
  }
}
