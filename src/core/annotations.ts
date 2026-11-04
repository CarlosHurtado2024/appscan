import type { Annotation, Box, Point } from './types';

const rotatePoint = (p: Point): Point => ({ x: 1 - p.y, y: p.x });

/**
 * Text and signatures stay upright, so what must survive a turn is their size on screen, not their
 * relative width and height. `aspect` is the page's width over height before this turn.
 */
function rotateBox(b: Box, aspect: number): Box {
  const cx = 1 - (b.y + b.h / 2);
  const cy = b.x + b.w / 2;
  let w = b.w * aspect;
  let h = b.h / aspect;
  const shrink = Math.min(1, 1 / Math.max(w, h));
  w *= shrink;
  h *= shrink;
  return {
    x: Math.min(1 - w, Math.max(0, cx - w / 2)),
    y: Math.min(1 - h, Math.max(0, cy - h / 2)),
    w,
    h,
  };
}

function rotate90(a: Annotation, aspect: number): Annotation {
  if (a.type === 'stroke') return { ...a, points: a.points.map(rotatePoint) };
  return { ...a, box: rotateBox(a.box, aspect) };
}

/** Marks stay on the same page content. `aspect` is the page's width over height before turning. */
export function rotateAnnotations(list: Annotation[], delta: 90 | 180 | 270, aspect = 1): Annotation[] {
  let out = list;
  for (let i = 0; i < delta / 90; i++) {
    const current = i % 2 === 0 ? aspect : 1 / aspect;
    out = out.map((a) => rotate90(a, current));
  }
  return out;
}
