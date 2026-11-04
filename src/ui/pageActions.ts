import { rotateAnnotations } from '../core/annotations';
import { renderPage } from '../core/render';
import type { Page, Rotation } from '../core/types';
import { getSignature, updatePage, type PageInput } from '../storage/db';

async function signaturesFor(page: Pick<Page, 'annotations'>) {
  const blobs = new Map<string, Blob>();
  for (const a of page.annotations) {
    if (a.type !== 'signature' || blobs.has(a.signatureId)) continue;
    const sig = await getSignature(a.signatureId);
    if (sig) blobs.set(a.signatureId, sig.image);
  }
  return blobs;
}

/** Applies parameter changes and regenerates the output from the untouched original. */
export async function editPage(page: Page, patch: Partial<PageInput>): Promise<Page> {
  const next = { ...page, ...patch };
  const output = await renderPage(next, await signaturesFor(next));
  return updatePage(page.id, { ...patch, ...output });
}

export function rotatePage(page: Page): Promise<Page> {
  return editPage(page, {
    rotation: ((page.rotation + 90) % 360) as Rotation,
    annotations: rotateAnnotations(page.annotations, 90),
  });
}
