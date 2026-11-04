import { applyFilter } from '../filters';
import type { FilterName, Quad, Raster } from '../types';
import type { VisionRequest, VisionResponse } from './vision.worker';

export class VisionUnavailableError extends Error {
  constructor(cause?: string) {
    super(cause ?? 'La detección automática no está disponible.');
    this.name = 'VisionUnavailableError';
  }
}

type Pending = { resolve: (r: VisionResponse) => void; reject: (e: Error) => void };
type NewRequest = VisionRequest extends infer R ? (R extends { id: number } ? Omit<R, 'id'> : never) : never;

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();
let loaded: Promise<void> | null = null;

/** A load that never finishes must not hold up scanning: manual crop is always available. */
const LOAD_TIMEOUT_MS = 30_000;

function failAll(message: string) {
  worker?.terminate();
  worker = null;
  loaded = null;
  for (const p of pending.values()) p.reject(new VisionUnavailableError(message));
  pending.clear();
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./vision.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<VisionResponse>) => {
      const p = pending.get(e.data.id);
      pending.delete(e.data.id);
      p?.resolve(e.data);
    };
    worker.onerror = (e) => failAll(e.message);
  }
  return worker;
}

function send(req: NewRequest, transfer: Transferable[] = []): Promise<VisionResponse> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...req, id }, { transfer });
  });
}

/**
 * Rejects before any pixels are handed over, so callers still own their raster and can fall back.
 * A failed import stays cached inside a worker, so retrying needs a new worker: failAll discards it.
 */
function ensureLoaded(): Promise<void> {
  if (loaded) return loaded;
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new VisionUnavailableError('OpenCV tardó demasiado en cargar.')), LOAD_TIMEOUT_MS);
  });
  const attempt = Promise.race([send({ op: 'load' }), timeout]).then((r) => {
    if (!r.ok) throw new VisionUnavailableError(r.error);
  });
  loaded = attempt;
  attempt.catch((e: Error) => failAll(e.message));
  return attempt;
}

const buffer = (r: Raster) => r.data.buffer as ArrayBuffer;

/** Each call takes ownership of the raster passed in; it must not be used afterward. */
export const vision = {
  async detect(raster: Raster, minCoverage?: number): Promise<Quad | null> {
    await ensureLoaded();
    const r = await send({ op: 'detect', raster, minCoverage }, [buffer(raster)]);
    if (!r.ok) throw new VisionUnavailableError(r.error);
    return r.quad ?? null;
  },

  async warp(raster: Raster, quad: Quad): Promise<Raster> {
    await ensureLoaded();
    const r = await send({ op: 'warp', raster, quad }, [buffer(raster)]);
    // Failing on a valid request almost always means the image did not fit in memory.
    if (!r.ok || !r.raster) throw new RangeError(r.ok ? 'Sin resultado' : r.error);
    return r.raster;
  },

  /** Filters need no OpenCV. They run off the main thread when possible, and on it otherwise. */
  async filter(raster: Raster, filter: FilterName): Promise<Raster> {
    if (filter === 'original') return raster;
    try {
      const copy = { ...raster, data: raster.data.slice() };
      const r = await send({ op: 'filter', raster: copy, filter }, [buffer(copy)]);
      if (r.ok && r.raster) return r.raster;
    } catch { /* worker unavailable */ }
    return applyFilter(raster, filter);
  },
};
