import { detectCorners, warpPerspective } from './detect';
import { loadCv, type Cv } from './loadCv';
import { orderCorners } from '../geometry';
import type { Point, Quad, Raster } from '../types';

let cv: Cv;
beforeAll(async () => {
  cv = await loadCv();
});

/** Seeded so a failure reproduces. */
function rng(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function inside(q: Quad, x: number, y: number): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4];
    const s = Math.sign((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x));
    if (s === 0) continue;
    if (sign !== 0 && s !== sign) return false;
    sign = s;
  }
  return true;
}

function scene(opts: { w: number; h: number; quad?: Quad; sheet: number; table: number; noise?: number; seed?: number }): Raster {
  const { w, h, quad, sheet, table, noise = 4, seed = 7 } = opts;
  const rand = rng(seed);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const base = quad && inside(quad, x / w, y / h) ? sheet : table;
    const v = base + (rand() - 0.5) * noise;
    const i = (y * w + x) * 4;
    data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
  }
  return { width: w, height: h, data };
}

function maxError(found: Quad, expected: Quad, w: number, h: number): number {
  const longest = Math.max(w, h);
  return Math.max(...found.map((p, i) => Math.hypot((p.x - expected[i].x) * w, (p.y - expected[i].y) * h))) / longest;
}

const P = (x: number, y: number): Point => ({ x, y });
const QUAD: Quad = [P(0.18, 0.12), P(0.84, 0.17), P(0.9, 0.86), P(0.11, 0.9)];

test('detects a white sheet with perspective on a dark table within 3% of the longest side', () => {
  const found = detectCorners(cv, scene({ w: 800, h: 1000, quad: QUAD, sheet: 235, table: 50 }));
  expect(found).not.toBeNull();
  expect(maxError(found!, QUAD, 800, 1000)).toBeLessThan(0.03);
});

test('detects a white sheet on a mid-gray table within 3%', () => {
  const found = detectCorners(cv, scene({ w: 1000, h: 750, quad: QUAD, sheet: 225, table: 140 }));
  expect(found).not.toBeNull();
  expect(maxError(found!, QUAD, 1000, 750)).toBeLessThan(0.03);
});

test('returns corners in TL,TR,BR,BL order', () => {
  const found = detectCorners(cv, scene({ w: 600, h: 800, quad: QUAD, sheet: 235, table: 50 }))!;
  expect(found).toEqual(orderCorners(found));
});

test('returns null on uniform noise, without throwing', () => {
  expect(detectCorners(cv, scene({ w: 400, h: 400, sheet: 0, table: 128, noise: 12 }))).toBeNull();
});

test('returns null when the largest shape covers under 20% of the frame', () => {
  const small: Quad = [P(0.4, 0.4), P(0.6, 0.4), P(0.6, 0.6), P(0.4, 0.6)];
  expect(detectCorners(cv, scene({ w: 500, h: 500, quad: small, sheet: 235, table: 50 }))).toBeNull();
});

test('warp rectifies a known quad: output corners match the sheet color', () => {
  const src = scene({ w: 800, h: 1000, quad: QUAD, sheet: 235, table: 50, noise: 0 });
  const out = warpPerspective(cv, src, QUAD, { width: 400, height: 500 });
  expect([out.width, out.height]).toEqual([400, 500]);
  const at = (x: number, y: number) => out.data[(y * out.width + x) * 4];
  for (const [x, y] of [[6, 6], [393, 6], [393, 493], [6, 493], [200, 250]]) {
    expect(at(x, y)).toBeGreaterThan(200);
  }
});

test('repeated calls do not leak OpenCV matrices', () => {
  const src = scene({ w: 300, h: 300, quad: QUAD, sheet: 235, table: 50 });
  const heapBefore = cv.HEAPU8.length;
  for (let i = 0; i < 30; i++) detectCorners(cv, src);
  expect(cv.HEAPU8.length).toBe(heapBefore);
});
