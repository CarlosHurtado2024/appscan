import type { Box, Point, Quad } from './types';

const MIN_AREA = 0.02;

export function fullQuad(): Quad {
  return [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
}

export function orderCorners(pts: Point[]): Quad {
  const by = (score: (p: Point) => number) =>
    pts.reduce((best, p) => (score(p) < score(best) ? p : best));
  return [
    by((p) => p.x + p.y),
    by((p) => p.y - p.x),
    by((p) => -(p.x + p.y)),
    by((p) => p.x - p.y),
  ];
}

export function isValidQuad(q: Quad): boolean {
  if (q.some((p) => !(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1))) return false;
  let sign = 0;
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross === 0 || (sign !== 0 && Math.sign(cross) !== sign)) return false;
    sign = Math.sign(cross);
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2 >= MIN_AREA;
}

export function outputSize(q: Quad, srcW: number, srcH: number): { width: number; height: number } {
  const dist = (a: Point, b: Point) => Math.hypot((a.x - b.x) * srcW, (a.y - b.y) * srcH);
  return {
    width: Math.round(Math.max(dist(q[0], q[1]), dist(q[3], q[2]))),
    height: Math.round(Math.max(dist(q[0], q[3]), dist(q[1], q[2]))),
  };
}

export function boundsOf(q: Quad): Box {
  const xs = q.map((p) => p.x), ys = q.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
