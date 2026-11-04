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

test('rotating a box keeps it inside 0..1 and swaps w and h', () => {
  const [r] = rotateAnnotations([box], 90) as Extract<Annotation, { type: 'signature' }>[];
  expect(r.box.w).toBeCloseTo(0.1);
  expect(r.box.h).toBeCloseTo(0.3);
  expect(r.box.x).toBeGreaterThanOrEqual(0);
  expect(r.box.x + r.box.w).toBeLessThanOrEqual(1);
  expect(r.box.y + r.box.h).toBeLessThanOrEqual(1);
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
