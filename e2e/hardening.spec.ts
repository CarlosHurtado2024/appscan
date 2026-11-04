import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { disableSystemShare, fixture, importAndOpen, openLibrary } from './helpers';

const b64 = (name: string) => readFileSync(fixture(name)).toString('base64');
const BLOB = `(b64) => new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'image/jpeg' })`;
const QUAD = [{ x: 0.18, y: 0.12 }, { x: 0.84, y: 0.17 }, { x: 0.9, y: 0.86 }, { x: 0.11, y: 0.9 }];

test('a failed OpenCV load can be retried once the network is back', async ({ page }) => {
  await openLibrary(page);
  await page.route(/opencv/, (route) => route.abort());
  await page.reload();
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await importAndOpen(page);
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('link', { name: 'Recortar' }).click();
  await expect(page.getByText('detección automática no está disponible')).toBeVisible();
  await page.unroute(/opencv/);
  await page.getByRole('button', { name: 'Volver a detectar' }).click();
  await expect(page.getByText('detección automática no está disponible')).toHaveCount(0);
  await expect.poll(async () => Number(await page.getByTestId('handle-0').getAttribute('data-x'))).toBeGreaterThan(0.1);
});

test('an OpenCV load that never finishes does not block importing', async ({ page }) => {
  test.setTimeout(80_000);
  await openLibrary(page);
  await page.route(/opencv/, () => { /* never answers */ });
  await page.reload();
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await page.getByTestId('import-input').setInputFiles(fixture('document.jpg'));
  await expect(page.getByTestId('page-tile')).toHaveCount(1, { timeout: 60_000 });
});

test('a warp failure in the worker is reported as out of memory, so rendering retries smaller', async ({ page }) => {
  await openLibrary(page);
  const name = await page.evaluate(async (quad) => {
    const { vision } = await import('/appscan/src/core/vision/client.ts' as string);
    const bad = { width: 10, height: 10, data: new Uint8ClampedArray(99_999) };
    return vision.warp(bad, quad).then(() => 'ok', (e: Error) => e.name);
  }, QUAD);
  expect(name).toBe('RangeError');
});

test('if the worker dies during a warp, the page is still cropped', async ({ page }) => {
  await openLibrary(page);
  const result = await page.evaluate(async ({ data, toBlob, quad }) => {
    const { vision, VisionUnavailableError } = await import('/appscan/src/core/vision/client.ts' as string);
    const { renderPage } = await import('/appscan/src/core/render.ts' as string);
    vision.warp = async (raster: { data: Uint8ClampedArray }) => {
      structuredClone(raster.data.buffer, { transfer: [raster.data.buffer as ArrayBuffer] });
      throw new VisionUnavailableError('murió');
    };
    const out = await renderPage({ original: eval(toBlob)(data), corners: quad, rotation: 0, filter: 'gray', annotations: [] });
    return out.rendered.size;
  }, { data: b64('document.jpg'), toBlob: BLOB, quad: QUAD });
  expect(result).toBeGreaterThan(1000);
});

test('a photo is kept even when rendering fails, and the batch continues', async ({ page }) => {
  await openLibrary(page);
  const r = await page.evaluate(async ({ data, toBlob }) => {
    const { vision } = await import('/appscan/src/core/vision/client.ts' as string);
    const { importFiles } = await import('/appscan/src/ui/useImport.ts' as string);
    const { getPages } = await import('/appscan/src/storage/db.ts' as string);
    vision.filter = async () => { throw new RangeError('sin memoria'); };
    const blob = eval(toBlob)(data);
    const files = [new File([blob], 'a.jpg', { type: 'image/jpeg' }), new File([blob], 'b.jpg', { type: 'image/jpeg' })];
    const { doc, failed } = await importFiles(files);
    const pages = await getPages(doc.id);
    return { failed, count: pages.length, rendered: pages[0].rendered.size };
  }, { data: b64('document.jpg'), toBlob: BLOB });
  expect(r.failed).toEqual([]);
  expect(r.count).toBe(2);
  expect(r.rendered).toBeGreaterThan(1000);
});

test('export decodes one page at a time', async ({ page }) => {
  await page.addInitScript(() => {
    const real = window.createImageBitmap.bind(window) as (...a: unknown[]) => Promise<ImageBitmap>;
    const stats = { open: 0, peak: 0 };
    (window as unknown as { __bitmaps: typeof stats }).__bitmaps = stats;
    (window as unknown as { createImageBitmap: unknown }).createImageBitmap = async (...args: unknown[]) => {
      const bitmap = await real(...args);
      stats.open++;
      stats.peak = Math.max(stats.peak, stats.open);
      const close = bitmap.close.bind(bitmap);
      bitmap.close = () => { stats.open--; close(); };
      return bitmap;
    };
  });
  await openLibrary(page);
  await page.getByTestId('import-input').setInputFiles([fixture('document.jpg'), fixture('blank.jpg'), fixture('text-es.jpg')]);
  await expect(page.getByTestId('page-tile')).toHaveCount(3);
  await page.evaluate(() => { (window as unknown as { __bitmaps: { peak: number } }).__bitmaps.peak = 0; });
  await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Compartir PDF' }).click()]);
  expect(await page.evaluate(() => (window as unknown as { __bitmaps: { peak: number } }).__bitmaps.peak)).toBe(1);
});

test('when the browser blocks sharing after building the PDF, one more tap shares it', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        calls++;
        (window as unknown as { __shares: number }).__shares = calls;
        if (calls === 1) throw new DOMException('sin gesto', 'NotAllowedError');
      },
    });
  });
  await page.goto('./');
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await importAndOpen(page);
  await page.getByRole('button', { name: 'Compartir PDF' }).click();
  await page.getByRole('button', { name: 'Compartir ahora' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shares: number }).__shares)).toBe(2);
  await expect(page.getByRole('button', { name: 'Compartir PDF' })).toBeVisible();
});

test('ID mode with the camera unavailable still builds a card document from two photos', async ({ page }) => {
  await disableSystemShare(page);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotFoundError'));
  });
  await page.goto('./#/scan?mode=id');
  await page.reload();
  await page.getByTestId('system-camera-input').setInputFiles(fixture('document.jpg'));
  await expect(page.getByText('Reverso')).toBeVisible();
  await page.getByTestId('system-camera-input').setInputFiles(fixture('blank.jpg'));
  await expect(page.getByTestId('page-tile')).toHaveCount(2);
  await expect(page.getByText('dos caras a tamaño real')).toBeVisible();
});

test('in ID mode a capture can also be adjusted right away', async ({ page }) => {
  await page.goto('./#/scan?mode=id');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Capturar' })).toBeEnabled();
  await page.getByRole('button', { name: 'Capturar' }).click();
  await page.getByRole('link', { name: 'Ajustar recorte' }).click();
  await page.getByTestId('handle-0').waitFor();
});
