import type { FilterName, Raster } from './types';

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

function toGray(src: Raster): Float32Array {
  const out = new Float32Array(src.width * src.height);
  for (let i = 0, j = 0; j < out.length; i += 4, j++) {
    out[j] = luma(src.data[i], src.data[i + 1], src.data[i + 2]);
  }
  return out;
}

function gray(src: Raster): Raster {
  const g = toGray(src);
  const data = new Uint8ClampedArray(src.data.length);
  for (let j = 0, i = 0; j < g.length; j++, i += 4) {
    data[i] = data[i + 1] = data[i + 2] = g[j];
    data[i + 3] = src.data[i + 3];
  }
  return { width: src.width, height: src.height, data };
}

/** Bradley adaptive threshold: each pixel is compared to its local mean. */
function bw(src: Raster): Raster {
  const { width: w, height: h } = src;
  const g = toGray(src);
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += g[y * w + x];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
    }
  }
  const half = Math.max(1, Math.floor(Math.max(w, h) / 16));
  const data = new Uint8ClampedArray(src.data.length);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - half), y1 = Math.min(h, y + half + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half), x1 = Math.min(w, x + half + 1);
      const sum = integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1]
        - integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const v = g[y * w + x] < mean * 0.85 ? 0 : 255;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = src.data[i + 3];
    }
  }
  return { width: w, height: h, data };
}

const BG_CELLS = 24;

/** Estimates page brightness per channel on a coarse grid, using a high percentile so text is ignored. */
function backgroundGrid(src: Raster, cw: number, ch: number): Float32Array {
  const { width: w, height: h, data } = src;
  const grid = new Float32Array(cw * ch * 3);
  const hist = new Uint32Array(256);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    const x0 = Math.floor((cx * w) / cw), x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * w) / cw));
    const y0 = Math.floor((cy * h) / ch), y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * h) / ch));
    const count = (x1 - x0) * (y1 - y0);
    for (let c = 0; c < 3; c++) {
      hist.fill(0);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) hist[data[(y * w + x) * 4 + c]]++;
      let seen = 0, v = 255;
      for (; v > 0; v--) { seen += hist[v]; if (seen >= count * 0.1) break; }
      grid[(cy * cw + cx) * 3 + c] = Math.max(1, v);
    }
  }
  return grid;
}

function bilinear(grid: Float32Array, cw: number, ch: number, fx: number, fy: number, c: number): number {
  const gx = Math.min(cw - 1, Math.max(0, fx * cw - 0.5));
  const gy = Math.min(ch - 1, Math.max(0, fy * ch - 0.5));
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const x1 = Math.min(cw - 1, x0 + 1), y1 = Math.min(ch - 1, y0 + 1);
  const tx = gx - x0, ty = gy - y0;
  const at = (x: number, y: number) => grid[(y * cw + x) * 3 + c];
  return (at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) + (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty;
}

/** Evens out lighting by dividing by the estimated background, then stretches contrast (1%–99%). */
function enhanced(src: Raster): Raster {
  const { width: w, height: h } = src;
  const cw = Math.min(BG_CELLS, w), ch = Math.min(BG_CELLS, h);
  const grid = backgroundGrid(src, cw, ch);
  const data = new Uint8ClampedArray(src.data.length);
  const hist = new Uint32Array(256);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    let sum = 0;
    for (let c = 0; c < 3; c++) {
      const v = Math.min(255, (src.data[i + c] / bilinear(grid, cw, ch, (x + 0.5) / w, (y + 0.5) / h, c)) * 255);
      data[i + c] = v;
      sum += v;
    }
    data[i + 3] = src.data[i + 3];
    hist[Math.round(sum / 3)]++;
  }
  const total = w * h;
  let lo = 0, hi = 255, seen = 0;
  for (let v = 0; v < 256; v++) { seen += hist[v]; if (seen >= total * 0.01) { lo = v; break; } }
  seen = 0;
  for (let v = 255; v >= 0; v--) { seen += hist[v]; if (seen >= total * 0.01) { hi = v; break; } }
  if (hi - lo < 16) return { width: w, height: h, data };
  const scale = 255 / (hi - lo);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) data[i + c] = (data[i + c] - lo) * scale;
  }
  return { width: w, height: h, data };
}

export function applyFilter(src: Raster, filter: FilterName): Raster {
  switch (filter) {
    case 'gray': return gray(src);
    case 'bw': return bw(src);
    case 'enhanced': return enhanced(src);
    default: return { width: src.width, height: src.height, data: src.data.slice() };
  }
}
