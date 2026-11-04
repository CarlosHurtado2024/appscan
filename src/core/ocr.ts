import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';

export class OcrUnavailableError extends Error {
  constructor() {
    super('No se pudo preparar el reconocimiento de texto. Necesitas conexión la primera vez que lo usas.');
    this.name = 'OcrUnavailableError';
  }
}

const base = () => `${import.meta.env.BASE_URL}ocr/`;

let workerPromise: Promise<TesseractWorker> | null = null;
let onProgress: (p: number) => void = () => {};

function getWorker(): Promise<TesseractWorker> {
  workerPromise ??= createWorker('spa', 1, {
    // Every path is ours, so nothing is ever requested from a CDN.
    workerPath: `${base()}worker.min.js`,
    corePath: `${base()}`,
    langPath: `${base()}`,
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress(0.3 + m.progress * 0.7);
      else onProgress(Math.min(0.3, m.progress * 0.3));
    },
    errorHandler: () => {},
  }).catch((e) => {
    workerPromise = null;
    throw e;
  });
  return workerPromise;
}

/** Downloads its files on first use; progress goes from 0 to 1. */
export async function recognize(image: Blob, progress: (p: number) => void): Promise<string> {
  onProgress = progress;
  let worker: TesseractWorker;
  try {
    worker = await getWorker();
  } catch {
    throw new OcrUnavailableError();
  }
  const { data } = await worker.recognize(image);
  return data.text.trim();
}
