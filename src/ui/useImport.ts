import { fullQuad } from '../core/geometry';
import { blobToRaster, normalizeImage, UnsupportedImageError } from '../core/image';
import { renderPage } from '../core/render';
import type { Doc, Page, Quad } from '../core/types';
import { vision } from '../core/vision/client';
import { addPage, createDoc, getDoc, type PageInput } from '../storage/db';

const DETECT_SIDE = 1000;

export function defaultTitle(now = new Date()): string {
  const date = now.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return `Documento ${date} ${time}`;
}

/** Never blocks: if the sheet is not found or OpenCV is missing, the whole image is proposed. */
export async function proposeCorners(image: Blob): Promise<Quad> {
  try {
    return (await vision.detect(await blobToRaster(image, DETECT_SIDE))) ?? fullQuad();
  } catch {
    return fullQuad();
  }
}

export async function buildPageInput(file: Blob): Promise<PageInput> {
  const { blob } = await normalizeImage(file);
  const corners = await proposeCorners(blob);
  const params = { original: blob, corners, rotation: 0 as const, filter: 'enhanced' as const, annotations: [] };
  return { ...params, ...(await renderPage(params)) };
}

export async function savePhoto(file: Blob, docId: string): Promise<Page> {
  return addPage(docId, await buildPageInput(file));
}

/** Saves what it can. Files that cannot be opened are reported by name and do not stop the others. */
export async function importFiles(files: File[], docId?: string): Promise<{ doc: Doc | null; failed: string[] }> {
  let doc = docId ? (await getDoc(docId)) ?? null : null;
  const failed: string[] = [];
  for (const file of files) {
    try {
      const input = await buildPageInput(file);
      doc ??= await createDoc(defaultTitle());
      await addPage(doc.id, input);
    } catch (e) {
      if (e instanceof UnsupportedImageError) failed.push(file.name);
      else throw e;
    }
  }
  return { doc, failed };
}
