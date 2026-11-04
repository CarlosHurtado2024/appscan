import { fullQuad } from '../core/geometry';
import { blobToRaster, normalizeImage } from '../core/image';
import { renderPage } from '../core/render';
import type { Doc, Page, Quad } from '../core/types';
import { vision } from '../core/vision/client';
import { StorageFullError, addPage, createDoc, getDoc, type PageInput } from '../storage/db';

const DETECT_SIDE = 1000;

/** A card fills much less of the frame than a sheet does. */
export const ID_MIN_COVERAGE = 0.08;

type DetectOptions = { minCoverage?: number };

export function defaultTitle(now = new Date()): string {
  const date = now.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return `Documento ${date} ${time}`;
}

/** Never blocks: if the sheet is not found or OpenCV is missing, the whole image is proposed. */
export async function proposeCorners(image: Blob, opts: DetectOptions = {}): Promise<Quad> {
  try {
    return (await vision.detect(await blobToRaster(image, DETECT_SIDE), opts.minCoverage)) ?? fullQuad();
  } catch {
    return fullQuad();
  }
}

export async function buildPageInput(file: Blob, opts: DetectOptions = {}): Promise<PageInput> {
  const { blob } = await normalizeImage(file);
  const corners = await proposeCorners(blob, opts);
  const params = { original: blob, corners, rotation: 0 as const, filter: 'enhanced' as const, annotations: [] };
  try {
    return { ...params, ...(await renderPage(params)) };
  } catch {
    // Never lose a capture: keep the photo as it is, and it can be edited again later.
    return { ...params, corners: fullQuad(), filter: 'original', rendered: blob, thumb: blob };
  }
}

export async function savePhoto(file: Blob, docId: string, opts: DetectOptions = {}): Promise<Page> {
  return addPage(docId, await buildPageInput(file, opts));
}

/** Saves what it can. Files that cannot be opened are reported by name and do not stop the others. */
export async function importFiles(files: File[], docId?: string, opts: DetectOptions = {}): Promise<{ doc: Doc | null; failed: string[] }> {
  let doc = docId ? (await getDoc(docId)) ?? null : null;
  const failed: string[] = [];
  for (const file of files) {
    try {
      const input = await buildPageInput(file, opts);
      doc ??= await createDoc(defaultTitle());
      await addPage(doc.id, input);
    } catch (e) {
      if (e instanceof StorageFullError) throw e;
      failed.push(file.name);
    }
  }
  return { doc, failed };
}
