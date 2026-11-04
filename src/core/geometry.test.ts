import { boundsOf, fullQuad, isValidQuad, orderCorners, outputSize } from './geometry';
import type { Point, Quad } from './types';

const p = (x: number, y: number): Point => ({ x, y });

test('orderCorners sorts any input order to TL,TR,BR,BL', () => {
  const tl = p(0.1, 0.1), tr = p(0.9, 0.15), br = p(0.85, 0.9), bl = p(0.15, 0.85);
  expect(orderCorners([br, tl, bl, tr])).toEqual([tl, tr, br, bl]);
});

test('fullQuad is the unit square and valid', () => {
  expect(fullQuad()).toEqual([p(0, 0), p(1, 0), p(1, 1), p(0, 1)]);
  expect(isValidQuad(fullQuad())).toBe(true);
});

test('isValidQuad rejects a crossed quad', () => {
  expect(isValidQuad([p(0, 0), p(1, 1), p(1, 0), p(0, 1)])).toBe(false);
});

test('isValidQuad rejects concave quads', () => {
  expect(isValidQuad([p(0, 0), p(1, 0), p(0.3, 0.3), p(0, 1)])).toBe(false);
});

test('isValidQuad rejects area below 2% of the image', () => {
  expect(isValidQuad([p(0.1, 0.1), p(0.2, 0.1), p(0.2, 0.2), p(0.1, 0.2)])).toBe(false);
});

test('isValidQuad rejects points outside 0..1', () => {
  expect(isValidQuad([p(-0.1, 0), p(1, 0), p(1, 1), p(0, 1)])).toBe(false);
});

test('outputSize uses longest opposite edges in pixels', () => {
  expect(outputSize(fullQuad(), 2000, 1000)).toEqual({ width: 2000, height: 1000 });
  const q: Quad = [p(0, 0), p(0.5, 0), p(1, 1), p(0, 1)];
  expect(outputSize(q, 1000, 1000).width).toBe(1000);
});

test('boundsOf returns the enclosing box', () => {
  const b = boundsOf([p(0.2, 0.1), p(0.8, 0.2), p(0.7, 0.9), p(0.1, 0.8)]);
  expect(b.x).toBeCloseTo(0.1);
  expect(b.y).toBeCloseTo(0.1);
  expect(b.w).toBeCloseTo(0.7);
  expect(b.h).toBeCloseTo(0.8);
});
