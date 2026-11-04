import { applyFilter } from './filters';
import type { FilterName, Raster } from './types';

const W = 200, H = 300;
const isBar = (x: number, y: number) => y % 30 >= 10 && y % 30 < 16 && x >= 20 && x < W - 20;

function page(): Raster {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bg = 180 + (60 * x) / W;
    const v = isBar(x, y) ? 30 : bg;
    const i = (y * W + x) * 4;
    data[i] = v; data[i + 1] = v - 3; data[i + 2] = v - 6; data[i + 3] = 255;
  }
  return { width: W, height: H, data };
}

function stats(r: Raster) {
  let bg = 0, bgN = 0, bar = 0, barN = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = r.data[(y * W + x) * 4];
    if (isBar(x, y)) { bar += v; barN++; } else { bg += v; bgN++; }
  }
  return { bg: bg / bgN, bar: bar / barN };
}

const ALL: FilterName[] = ['original', 'enhanced', 'gray', 'bw'];

test('original returns equal pixels', () => {
  const src = page();
  expect(applyFilter(src, 'original').data).toEqual(src.data);
});

test('no filter mutates its input', () => {
  for (const f of ALL) {
    const src = page();
    const before = src.data.slice();
    applyFilter(src, f);
    expect(src.data).toEqual(before);
  }
});

test('gray output has R=G=B and same dimensions', () => {
  const r = applyFilter(page(), 'gray');
  expect([r.width, r.height]).toEqual([W, H]);
  for (let i = 0; i < r.data.length; i += 4) {
    expect(r.data[i]).toBe(r.data[i + 1]);
    expect(r.data[i]).toBe(r.data[i + 2]);
  }
});

test('bw output contains only 0 and 255', () => {
  const r = applyFilter(page(), 'bw');
  for (let i = 0; i < r.data.length; i += 4) expect([0, 255]).toContain(r.data[i]);
});

test('bw keeps >95% of background white under uneven lighting', () => {
  const r = applyFilter(page(), 'bw');
  expect(stats(r).bg).toBeGreaterThan(255 * 0.95);
});

test('bw keeps >90% of the bar pixels black', () => {
  const r = applyFilter(page(), 'bw');
  expect(stats(r).bar).toBeLessThan(255 * 0.1);
});

test('enhanced raises background brightness above 235 on average', () => {
  expect(stats(applyFilter(page(), 'enhanced')).bg).toBeGreaterThan(235);
});

test('enhanced keeps bars darker than 100 on average', () => {
  expect(stats(applyFilter(page(), 'enhanced')).bar).toBeLessThan(100);
});

test('all filters handle a 1x1 raster', () => {
  for (const f of ALL) {
    const r = applyFilter({ width: 1, height: 1, data: new Uint8ClampedArray([10, 20, 30, 255]) }, f);
    expect(r.data.length).toBe(4);
    expect(r.data[3]).toBe(255);
  }
});

test('all filters handle a uniform raster without NaN', () => {
  for (const f of ALL) {
    const data = new Uint8ClampedArray(40 * 40 * 4).fill(128);
    const r = applyFilter({ width: 40, height: 40, data }, f);
    expect(r.data.every((v) => Number.isFinite(v))).toBe(true);
    expect(r.data[0]).toBeGreaterThan(100);
  }
});
