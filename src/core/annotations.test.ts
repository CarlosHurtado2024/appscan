import { rotateAnnotations } from './annotations';
import type { Annotation } from './types';

const stroke: Annotation = { type: 'stroke', points: [{ x: 0.2, y: 0.3 }, { x: 0.6, y: 0.9 }], color: '#000', width: 2 };
const box: Annotation = { type: 'signature', signatureId: 's', box: { x: 0.1, y: 0.2, w: 0.3, h: 0.1 } };

test('rotating a stroke 90° four times returns the original points', () => {
  let a: Annotation[] = [stroke];
  for (let i = 0; i < 4; i++) a = rotateAnnotations(a, 90);
  const pts = (a[0] as Extract<Annotation, { type: 'stroke' }>).points;
  expect(pts[0].x).toBeCloseTo(0.2);
  expect(pts[1].y).toBeCloseTo(0.9);
});

test('rotating 90° maps relative point (x,y) to (1-y,x)', () => {
  const [r] = rotateAnnotations([stroke], 90) as Extract<Annotation, { type: 'stroke' }>[];
  expect(r.points[0].x).toBeCloseTo(0.7);
  expect(r.points[0].y).toBeCloseTo(0.2);
});

test('a box stays upright: its size on screen does not change when the page turns', () => {
  // A 300x400 page holding a 90x40 box becomes a 400x300 page holding a 90x40 box.
  const [r] = rotateAnnotations([box], 90, 0.75) as Extract<Annotation, { type: 'signature' }>[];
  expect(r.box.w * 400).toBeCloseTo(90);
  expect(r.box.h * 300).toBeCloseTo(40);
});

test('a box keeps its center on the same content', () => {
  const [r] = rotateAnnotations([box], 90, 0.75) as Extract<Annotation, { type: 'signature' }>[];
  expect(r.box.x + r.box.w / 2).toBeCloseTo(1 - 0.25);
  expect(r.box.y + r.box.h / 2).toBeCloseTo(0.25);
});

test('a box too wide for the turned page shrinks proportionally and stays inside', () => {
  const wide: Annotation = { type: 'text', text: 'x', color: '#000', box: { x: 0.05, y: 0.4, w: 0.9, h: 0.1 } };
  const [r] = rotateAnnotations([wide], 90, 2) as Extract<Annotation, { type: 'text' }>[];
  expect(r.box.x).toBeGreaterThanOrEqual(0);
  expect(r.box.y).toBeGreaterThanOrEqual(0);
  expect(r.box.x + r.box.w).toBeLessThanOrEqual(1.0001);
  expect(r.box.y + r.box.h).toBeLessThanOrEqual(1.0001);
  // Originally 1.8 by 0.1 in page-height units: the proportions survive the fit.
  expect((r.box.w * 1) / (r.box.h * 2)).toBeCloseTo(1.8 / 0.1, 1);
});

test('rotating a box four times returns it to where it started', () => {
  let a: Annotation[] = [box];
  for (let i = 0; i < 4; i++) a = rotateAnnotations(a, 90, i % 2 === 0 ? 0.75 : 1 / 0.75);
  const b = (a[0] as Extract<Annotation, { type: 'signature' }>).box;
  expect(b.x).toBeCloseTo(0.1);
  expect(b.y).toBeCloseTo(0.2);
  expect(b.w).toBeCloseTo(0.3);
  expect(b.h).toBeCloseTo(0.1);
});

test('a 180° rotation mirrors a box through the center', () => {
  const [r] = rotateAnnotations([box], 180) as Extract<Annotation, { type: 'signature' }>[];
  expect(r.box.x).toBeCloseTo(0.6);
  expect(r.box.y).toBeCloseTo(0.7);
});

test('rotateAnnotations leaves the input array unchanged', () => {
  const input: Annotation[] = [stroke];
  const copy = JSON.stringify(input);
  rotateAnnotations(input, 270);
  expect(JSON.stringify(input)).toBe(copy);
});
