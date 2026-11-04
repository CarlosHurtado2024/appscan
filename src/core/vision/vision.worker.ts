/// <reference lib="webworker" />
import { applyFilter } from '../filters';
import type { FilterName, Quad, Raster } from '../types';
import { outputSize } from '../geometry';
import { detectCorners, warpPerspective } from './detect';
import { loadCv, type Cv } from './loadCv';

export type VisionRequest =
  | { id: number; op: 'load' }
  | { id: number; op: 'detect'; raster: Raster; minCoverage?: number }
  | { id: number; op: 'warp'; raster: Raster; quad: Quad }
  | { id: number; op: 'filter'; raster: Raster; filter: FilterName };

export type VisionResponse =
  | { id: number; ok: true; quad?: Quad | null; raster?: Raster }
  | { id: number; ok: false; error: string };

let cvPromise: Promise<Cv> | null = null;
const getCv = () => (cvPromise ??= loadCv());

async function handle(req: VisionRequest): Promise<VisionResponse> {
  switch (req.op) {
    case 'load':
      await getCv();
      return { id: req.id, ok: true };
    case 'detect':
      return { id: req.id, ok: true, quad: detectCorners(await getCv(), req.raster, req.minCoverage) };
    case 'warp': {
      const size = outputSize(req.quad, req.raster.width, req.raster.height);
      return { id: req.id, ok: true, raster: warpPerspective(await getCv(), req.raster, req.quad, size) };
    }
    case 'filter':
      return { id: req.id, ok: true, raster: applyFilter(req.raster, req.filter) };
  }
}

// Jobs run one at a time: a phone cannot afford two full-size images in memory.
let queue: Promise<unknown> = Promise.resolve();

self.onmessage = (event: MessageEvent<VisionRequest>) => {
  queue = queue.then(async () => {
    let res: VisionResponse;
    try {
      res = await handle(event.data);
    } catch (e) {
      res = { id: event.data.id, ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    const transfer = res.ok && res.raster ? [res.raster.data.buffer as ArrayBuffer] : [];
    self.postMessage(res, { transfer });
  });
};
