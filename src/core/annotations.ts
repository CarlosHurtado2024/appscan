import type { Annotation, Box, Point } from './types';

const rotatePoint = (p: Point): Point => ({ x: 1 - p.y, y: p.x });
const rotateBox = (b: Box): Box => ({ x: 1 - (b.y + b.h), y: b.x, w: b.h, h: b.w });

function rotate90(a: Annotation): Annotation {
  if (a.type === 'stroke') return { ...a, points: a.points.map(rotatePoint) };
  return { ...a, box: rotateBox(a.box) };
}

/** Marks stay on the same page content; text and signatures remain upright when drawn. */
export function rotateAnnotations(list: Annotation[], delta: 90 | 180 | 270): Annotation[] {
  let out = list;
  for (let i = 0; i < delta / 90; i++) out = out.map(rotate90);
  return out;
}
