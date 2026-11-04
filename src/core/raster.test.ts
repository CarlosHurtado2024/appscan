import { cropRaster, resizeRaster, rotateRaster } from './raster';
import type { Raster } from './types';

/** 3x2 image where each pixel's red value is its index. */
function grid(): Raster {
  const data = new Uint8ClampedArray(3 * 2 * 4);
  for (let i = 0; i < 6; i++) { data[i * 4] = i; data[i * 4 + 3] = 255; }
  return { width: 3, height: 2, data };
}
const reds = (r: Raster) => Array.from({ length: r.width * r.height }, (_, i) => r.data[i * 4]);

test('rotate 0 returns the same pixels', () => {
  expect(reds(rotateRaster(grid(), 0))).toEqual([0, 1, 2, 3, 4, 5]);
});

test('rotate 90 clockwise swaps dimensions and moves pixels', () => {
  const r = rotateRaster(grid(), 90);
  expect([r.width, r.height]).toEqual([2, 3]);
  expect(reds(r)).toEqual([3, 0, 4, 1, 5, 2]);
});

test('rotate 180 reverses pixels', () => {
  expect(reds(rotateRaster(grid(), 180))).toEqual([5, 4, 3, 2, 1, 0]);
});

test('rotate 270 swaps dimensions the other way', () => {
  const r = rotateRaster(grid(), 270);
  expect([r.width, r.height]).toEqual([2, 3]);
  expect(reds(r)).toEqual([2, 5, 1, 4, 0, 3]);
});

test('crop with relative box extracts the region', () => {
  const r = cropRaster(grid(), { x: 1 / 3, y: 0, w: 2 / 3, h: 1 });
  expect([r.width, r.height]).toEqual([2, 2]);
  expect(reds(r)).toEqual([1, 2, 4, 5]);
});

test('crop never returns an empty image', () => {
  const r = cropRaster(grid(), { x: 0.5, y: 0.5, w: 0, h: 0 });
  expect(r.width).toBeGreaterThanOrEqual(1);
  expect(r.height).toBeGreaterThanOrEqual(1);
});

test('resize keeps proportions and caps the longest side', () => {
  const big: Raster = { width: 100, height: 50, data: new Uint8ClampedArray(100 * 50 * 4).fill(200) };
  const r = resizeRaster(big, 20);
  expect([r.width, r.height]).toEqual([20, 10]);
  expect(r.data[0]).toBe(200);
});

test('resize never enlarges', () => {
  const r = resizeRaster(grid(), 100);
  expect([r.width, r.height]).toEqual([3, 2]);
});
