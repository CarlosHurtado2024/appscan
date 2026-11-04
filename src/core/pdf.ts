import { PDFDocument, type PDFPage } from 'pdf-lib';
import type { Box } from './types';

export type PdfImage = { bytes: Uint8Array; width: number; height: number };

const A4 = { short: 595.28, long: 841.89 };
const MM = 72 / 25.4;
const CARD = { w: 85.6 * MM, h: 54 * MM };
const CARD_GAP = 10 * MM;
const FIT_DPI = 200;

async function draw(pdf: PDFDocument, page: PDFPage, img: PdfImage, box: Box) {
  const embedded = await pdf.embedJpg(img.bytes);
  page.drawImage(embedded, { x: box.x, y: box.y, width: box.w, height: box.h });
}

function contain(img: PdfImage, pageW: number, pageH: number): Box {
  const scale = Math.min(pageW / img.width, pageH / img.height);
  const w = img.width * scale, h = img.height * scale;
  return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
}

export async function buildPdf(images: PdfImage[], opts: { pageSize: 'a4' | 'fit' }): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('El documento no tiene páginas.');
  const pdf = await PDFDocument.create();
  for (const img of images) {
    let w: number, h: number;
    if (opts.pageSize === 'fit') {
      w = (img.width * 72) / FIT_DPI;
      h = (img.height * 72) / FIT_DPI;
    } else {
      const landscape = img.width > img.height;
      w = landscape ? A4.long : A4.short;
      h = landscape ? A4.short : A4.long;
    }
    await draw(pdf, pdf.addPage([w, h]), img, contain(img, w, h));
  }
  return pdf.save();
}

/** Both faces at real size, stacked and centred on A4. PDF coordinates start at the bottom left. */
export function idCardLayout(): { front: Box; back: Box } {
  const x = (A4.short - CARD.w) / 2;
  const totalH = CARD.h * 2 + CARD_GAP;
  const bottom = (A4.long - totalH) / 2;
  return {
    front: { x, y: bottom + CARD.h + CARD_GAP, w: CARD.w, h: CARD.h },
    back: { x, y: bottom, w: CARD.w, h: CARD.h },
  };
}

export async function buildIdCardSheet(front: PdfImage, back: PdfImage): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.short, A4.long]);
  const layout = idCardLayout();
  await draw(pdf, page, front, layout.front);
  await draw(pdf, page, back, layout.back);
  return pdf.save();
}

export function safeFilename(title: string): string {
  const clean = title.replace(/[/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return `${clean || 'documento'}.pdf`;
}
