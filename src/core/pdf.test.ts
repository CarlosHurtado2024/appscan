import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { buildIdCardSheet, buildPdf, fitInside, idCardLayout, safeFilename, type PdfImage } from './pdf';

async function jpeg(width: number, height: number): Promise<PdfImage> {
  const buf = await sharp({ create: { width, height, channels: 3, background: { r: 240, g: 240, b: 240 } } }).jpeg().toBuffer();
  return { bytes: new Uint8Array(buf), width, height };
}

const sizes = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((p) => p.getSize());

test('buildPdf has one page per image', async () => {
  const pdf = await buildPdf([await jpeg(100, 140), await jpeg(100, 140), await jpeg(100, 140)], { pageSize: 'a4' });
  expect(await sizes(pdf)).toHaveLength(3);
});

test('a4 pages measure 595.28 x 841.89 points', async () => {
  const [s] = await sizes(await buildPdf([await jpeg(100, 140)], { pageSize: 'a4' }));
  expect(s.width).toBeCloseTo(595.28, 1);
  expect(s.height).toBeCloseTo(841.89, 1);
});

test('a landscape image gets a landscape A4 page', async () => {
  const [s] = await sizes(await buildPdf([await jpeg(140, 100)], { pageSize: 'a4' }));
  expect(s.width).toBeCloseTo(841.89, 1);
  expect(s.height).toBeCloseTo(595.28, 1);
});

test('fit pages match the image aspect ratio', async () => {
  const [s] = await sizes(await buildPdf([await jpeg(300, 100)], { pageSize: 'fit' }));
  expect(s.width / s.height).toBeCloseTo(3, 2);
});

test('buildPdf rejects an empty list', async () => {
  await expect(buildPdf([], { pageSize: 'a4' })).rejects.toThrow();
});

test('idCardLayout sizes are 242.65 x 153.07 points, centred, not overlapping', () => {
  const { front, back } = idCardLayout();
  for (const b of [front, back]) {
    expect(b.w).toBeCloseTo(242.65, 1);
    expect(b.h).toBeCloseTo(153.07, 1);
    expect(b.x + b.w / 2).toBeCloseTo(595.28 / 2, 1);
  }
  const top = Math.max(front.y, back.y), bottom = Math.min(front.y, back.y);
  expect(top).toBeGreaterThanOrEqual(bottom + front.h);
});

test('a photo that is not card-shaped fits inside the card box without stretching', () => {
  const box = { x: 10, y: 20, w: 242.65, h: 153.07 };
  const r = fitInside({ width: 900, height: 1600 }, box);
  expect(r.w / r.h).toBeCloseTo(900 / 1600, 3);
  expect(r.h).toBeCloseTo(153.07, 1);
  expect(r.x + r.w / 2).toBeCloseTo(box.x + box.w / 2, 3);
});

test('buildIdCardSheet returns one A4 page', async () => {
  const s = await sizes(await buildIdCardSheet(await jpeg(428, 270), await jpeg(428, 270)));
  expect(s).toHaveLength(1);
  expect(s[0].width).toBeCloseTo(595.28, 1);
});

test('safeFilename strips forbidden characters and adds .pdf', () => {
  expect(safeFilename('Factura 3/4: "final"?')).toBe('Factura 3 4 final.pdf');
});

test('safeFilename keeps accents', () => {
  expect(safeFilename('Cédula Muñoz')).toBe('Cédula Muñoz.pdf');
});

test('safeFilename falls back to documento', () => {
  expect(safeFilename('  /// ')).toBe('documento.pdf');
});
