import { buildIdCardSheet, buildPdf, type PdfImage } from '../core/pdf';
import type { Doc, Page } from '../core/types';

async function toPdfImage(page: Page): Promise<PdfImage> {
  const bitmap = await createImageBitmap(page.rendered);
  const image = {
    bytes: new Uint8Array(await page.rendered.arrayBuffer()),
    width: bitmap.width,
    height: bitmap.height,
  };
  bitmap.close();
  return image;
}

/** One page at a time: a phone cannot hold twenty decoded photos in memory at once. */
export async function buildDocPdf(doc: Doc, pages: Page[], pageSize: 'a4' | 'fit'): Promise<Uint8Array> {
  const images: PdfImage[] = [];
  for (const page of pages) images.push(await toPdfImage(page));
  return doc.kind === 'id-card' && images.length === 2
    ? buildIdCardSheet(images[0], images[1])
    : buildPdf(images, { pageSize });
}
