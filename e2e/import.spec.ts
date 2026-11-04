import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const b64 = (name: string) => readFileSync(`e2e/fixtures/${name}`).toString('base64');

/** Runs code in the browser with the real source modules, via the dev server. */
const BLOB = `(b64) => new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'image/jpeg' })`;

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('normalizeImage returns a portrait image from an EXIF-rotated JPEG', async ({ page }) => {
  const size = await page.evaluate(async ({ data, toBlob }) => {
    const { normalizeImage } = await import('/appscan/src/core/image.ts' as string);
    const r = await normalizeImage(eval(toBlob)(data));
    return [r.width, r.height, r.blob.type];
  }, { data: b64('exif-portrait.jpg'), toBlob: BLOB });
  expect(size).toEqual([900, 1200, 'image/jpeg']);
});

test('EXIF-rotated photo is upright: the dark table band stays at the left edge', async ({ page }) => {
  const upright = await page.evaluate(async ({ a, b, toBlob }) => {
    const { blobToRaster, normalizeImage } = await import('/appscan/src/core/image.ts' as string);
    const mk = eval(toBlob);
    const ra = await blobToRaster((await normalizeImage(mk(a))).blob);
    const rb = await blobToRaster((await normalizeImage(mk(b))).blob);
    let diff = 0;
    for (let i = 0; i < ra.data.length; i += 4000) diff += Math.abs(ra.data[i] - rb.data[i]);
    return diff / (ra.data.length / 4000);
  }, { a: b64('exif-portrait.jpg'), b: b64('document.jpg'), toBlob: BLOB });
  expect(upright).toBeLessThan(12);
});

test('normalizeImage rejects a corrupt file with UnsupportedImageError', async ({ page }) => {
  const name = await page.evaluate(async ({ data, toBlob }) => {
    const { normalizeImage } = await import('/appscan/src/core/image.ts' as string);
    return normalizeImage(eval(toBlob)(data)).then(() => 'ok', (e: Error) => e.name);
  }, { data: b64('corrupt.jpg'), toBlob: BLOB });
  expect(name).toBe('UnsupportedImageError');
});

test('the worker detects corners on a real JPEG', async ({ page }) => {
  const quad = await page.evaluate(async ({ data, toBlob }) => {
    const { blobToRaster } = await import('/appscan/src/core/image.ts' as string);
    const { vision } = await import('/appscan/src/core/vision/client.ts' as string);
    return vision.detect(await blobToRaster(eval(toBlob)(data), 1000));
  }, { data: b64('document.jpg'), toBlob: BLOB });
  expect(quad).not.toBeNull();
  const expected = [[0.18, 0.12], [0.84, 0.17], [0.9, 0.86], [0.11, 0.9]];
  quad.forEach((p: { x: number; y: number }, i: number) => {
    expect(Math.abs(p.x - expected[i][0])).toBeLessThan(0.03);
    expect(Math.abs(p.y - expected[i][1])).toBeLessThan(0.03);
  });
});

test('renderPage straightens the sheet and returns JPEGs of the expected size', async ({ page }) => {
  const r = await page.evaluate(async ({ data, toBlob }) => {
    const { blobToRaster } = await import('/appscan/src/core/image.ts' as string);
    const { renderPage } = await import('/appscan/src/core/render.ts' as string);
    const corners = [{ x: 0.18, y: 0.12 }, { x: 0.84, y: 0.17 }, { x: 0.9, y: 0.86 }, { x: 0.11, y: 0.9 }];
    const out = await renderPage({ original: eval(toBlob)(data), corners, rotation: 90, filter: 'bw', annotations: [] });
    const img = await blobToRaster(out.rendered);
    const thumb = await blobToRaster(out.thumb);
    return { w: img.width, h: img.height, thumbMax: Math.max(thumb.width, thumb.height), type: out.rendered.type, corner: img.data[0] };
  }, { data: b64('document.jpg'), toBlob: BLOB });
  expect(r.type).toBe('image/jpeg');
  expect(r.w).toBeGreaterThan(r.h); // sheet is taller than wide; rotated 90° it becomes wider than tall
  expect(r.thumbMax).toBe(320);
  expect(r.corner).toBeGreaterThan(200); // the table was cropped away: the corner is paper
});

test('annotations are burned into the rendered page', async ({ page }) => {
  const r = await page.evaluate(async ({ data, toBlob }) => {
    const { blobToRaster } = await import('/appscan/src/core/image.ts' as string);
    const { fullQuad } = await import('/appscan/src/core/geometry.ts' as string);
    const { renderPage } = await import('/appscan/src/core/render.ts' as string);
    const stroke = { type: 'stroke', color: '#ff0000', width: 20, points: [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }] };
    const out = await renderPage({ original: eval(toBlob)(data), corners: fullQuad(), rotation: 0, filter: 'bw', annotations: [stroke] });
    const img = await blobToRaster(out.rendered);
    const i = (Math.floor(img.height / 2) * img.width + Math.floor(img.width / 2)) * 4;
    return [img.data[i], img.data[i + 1]];
  }, { data: b64('blank.jpg'), toBlob: BLOB });
  expect(r[0]).toBeGreaterThan(200);
  expect(r[1]).toBeLessThan(80);
});
