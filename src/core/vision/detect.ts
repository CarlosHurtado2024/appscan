import { isValidQuad, orderCorners } from '../geometry';
import type { Point, Quad, Raster } from '../types';
import type { Cv } from './loadCv';

const DETECT_SIDE = 500;
const MIN_COVERAGE = 0.2;
const EPSILONS = [0.02, 0.03, 0.05];

/** Runs `fn` with a tracker that frees every OpenCV object it was given, even on error. */
function scoped<T>(fn: (track: <M extends { delete(): void }>(m: M) => M) => T): T {
  const owned: { delete(): void }[] = [];
  try {
    return fn((m) => {
      owned.push(m);
      return m;
    });
  } finally {
    for (const m of owned) m.delete();
  }
}

/** An outline matching the image border carries no information; callers then propose the full image anyway. */
function hugsFrame(q: Quad): boolean {
  const near = (v: number, target: number) => Math.abs(v - target) < 0.015;
  return near(q[0].x, 0) && near(q[0].y, 0) && near(q[1].x, 1) && near(q[1].y, 0)
    && near(q[2].x, 1) && near(q[2].y, 1) && near(q[3].x, 0) && near(q[3].y, 1);
}

/** Finds the largest convex four-sided outline in a binary image, in that image's relative coordinates. */
function largestQuad(cv: Cv, binary: Cv, width: number, height: number, minCoverage: number): Quad | null {
  return scoped((track) => {
    const contours = track(new cv.MatVector());
    const hierarchy = track(new cv.Mat());
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let best: Quad | null = null;
    let bestArea = minCoverage * width * height;
    for (let i = 0; i < contours.size(); i++) {
      const contour = track(contours.get(i));
      const area = cv.contourArea(contour);
      if (area < bestArea) continue;
      const perimeter = cv.arcLength(contour, true);
      for (const eps of EPSILONS) {
        const approx = track(new cv.Mat());
        cv.approxPolyDP(contour, approx, eps * perimeter, true);
        if (approx.rows !== 4) continue;
        const pts: Point[] = [];
        for (let r = 0; r < 4; r++) {
          pts.push({ x: approx.data32S[r * 2] / width, y: approx.data32S[r * 2 + 1] / height });
        }
        const quad = orderCorners(pts);
        if (isValidQuad(quad) && !hugsFrame(quad)) {
          best = quad;
          bestArea = area;
          break;
        }
      }
    }
    return best;
  });
}

export function detectCorners(cv: Cv, src: Raster, minCoverage = MIN_COVERAGE): Quad | null {
  return scoped((track) => {
    const rgba = track(cv.matFromArray(src.height, src.width, cv.CV_8UC4, []));
    rgba.data.set(src.data);
    const scale = Math.min(1, DETECT_SIDE / Math.max(src.width, src.height));
    const small = track(new cv.Mat());
    cv.resize(rgba, small, new cv.Size(Math.round(src.width * scale), Math.round(src.height * scale)), 0, 0, cv.INTER_AREA);
    const gray = track(new cv.Mat());
    cv.cvtColor(small, gray, cv.COLOR_RGBA2GRAY);
    const blurred = track(new cv.Mat());
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    const edges = track(new cv.Mat());
    cv.Canny(blurred, edges, 40, 120);
    const kernel = track(cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3)));
    const dilated = track(new cv.Mat());
    cv.dilate(edges, dilated, kernel);
    const fromEdges = largestQuad(cv, dilated, small.cols, small.rows, minCoverage);
    if (fromEdges) return fromEdges;

    const otsu = track(new cv.Mat());
    cv.threshold(blurred, otsu, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    return largestQuad(cv, otsu, small.cols, small.rows, minCoverage);
  });
}

export function warpPerspective(cv: Cv, src: Raster, q: Quad, size: { width: number; height: number }): Raster {
  return scoped((track) => {
    const rgba = track(cv.matFromArray(src.height, src.width, cv.CV_8UC4, []));
    rgba.data.set(src.data);
    const from = track(cv.matFromArray(4, 1, cv.CV_32FC2, q.flatMap((p) => [p.x * src.width, p.y * src.height])));
    const { width: w, height: h } = size;
    const to = track(cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]));
    const matrix = track(cv.getPerspectiveTransform(from, to));
    const out = track(new cv.Mat());
    cv.warpPerspective(rgba, out, matrix, new cv.Size(w, h), cv.INTER_LINEAR, cv.BORDER_REPLICATE);
    return { width: w, height: h, data: new Uint8ClampedArray(out.data) };
  });
}
