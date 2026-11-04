import type { Box, Raster, Rotation } from './types';

export function rotateRaster(src: Raster, rotation: Rotation): Raster {
  if (rotation === 0) return src;
  const { width: w, height: h, data } = src;
  const swap = rotation !== 180;
  const outW = swap ? h : w, outH = swap ? w : h;
  const from = new Uint32Array(data.buffer, data.byteOffset, w * h);
  const to = new Uint32Array(outW * outH);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = from[y * w + x];
    if (rotation === 90) to[x * outW + (h - 1 - y)] = v;
    else if (rotation === 180) to[(h - 1 - y) * outW + (w - 1 - x)] = v;
    else to[(w - 1 - x) * outW + y] = v;
  }
  return { width: outW, height: outH, data: new Uint8ClampedArray(to.buffer) };
}

export function cropRaster(src: Raster, box: Box): Raster {
  const x0 = Math.min(src.width - 1, Math.max(0, Math.round(box.x * src.width)));
  const y0 = Math.min(src.height - 1, Math.max(0, Math.round(box.y * src.height)));
  const w = Math.max(1, Math.min(src.width - x0, Math.round(box.w * src.width)));
  const h = Math.max(1, Math.min(src.height - y0, Math.round(box.h * src.height)));
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const start = ((y0 + y) * src.width + x0) * 4;
    data.set(src.data.subarray(start, start + w * 4), y * w * 4);
  }
  return { width: w, height: h, data };
}

/** Nearest-neighbour: only used for fast previews and analysis, never for final pages. */
export function resizeRaster(src: Raster, maxSide: number): Raster {
  const scale = maxSide / Math.max(src.width, src.height);
  if (scale >= 1) return src;
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const from = new Uint32Array(src.data.buffer, src.data.byteOffset, src.width * src.height);
  const to = new Uint32Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(src.height - 1, Math.floor(y / scale));
    for (let x = 0; x < w; x++) to[y * w + x] = from[sy * src.width + Math.min(src.width - 1, Math.floor(x / scale))];
  }
  return { width: w, height: h, data: new Uint8ClampedArray(to.buffer) };
}
