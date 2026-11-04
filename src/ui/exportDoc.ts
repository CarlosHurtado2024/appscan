import { buildIdCardSheet, buildPdf, type PdfImage } from '../core/pdf';
import { sharePdf } from '../core/share';
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

export async function exportDoc(doc: Doc, pages: Page[], pageSize: 'a4' | 'fit') {
  const images = await Promise.all(pages.map(toPdfImage));
  const bytes = doc.kind === 'id-card' && images.length === 2
    ? await buildIdCardSheet(images[0], images[1])
    : await buildPdf(images, { pageSize });
  return sharePdf(bytes, doc.title);
}
