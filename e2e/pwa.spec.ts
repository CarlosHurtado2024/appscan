import { expect, test, type Page } from '@playwright/test';
import { disableSystemShare, fixture } from './helpers';

/** Loads the app until the service worker controls it and OpenCV is cached for offline use. */
async function installed(page: Page) {
  await disableSystemShare(page);
  await page.goto('./');
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(() => page.evaluate(async () => {
    const names = await caches.keys();
    for (const name of names) {
      const keys = await (await caches.open(name)).keys();
      if (keys.some((r) => /opencv/i.test(r.url))) return true;
    }
    return false;
  }), { timeout: 60_000 }).toBe(true);
}

async function scanToPdf(page: Page) {
  await page.getByTestId('import-input').setInputFiles(fixture('document.jpg'));
  await page.getByTestId('page-tile').first().waitFor();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Compartir PDF' }).click(),
  ]);
  return download;
}

test('manifest has name, start_url, scope /appscan/, standalone display, 192 and 512 icons incl. maskable', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const manifest = await (await request.get(new URL(href!, page.url()).href)).json();
  expect(manifest.name).toBe('AppScan');
  expect(manifest.lang).toBe('es');
  expect(manifest.start_url).toBe('/appscan/');
  expect(manifest.scope).toBe('/appscan/');
  expect(manifest.display).toBe('standalone');
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  const maskable = manifest.icons.filter((i: { purpose?: string }) => i.purpose === 'maskable');
  expect(maskable.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(maskable[0].src).not.toBe(manifest.icons.find((i: { purpose?: string }) => i.purpose !== 'maskable').src);
  for (const icon of manifest.icons) {
    expect((await request.get(new URL(icon.src, page.url()).href)).status()).toBe(200);
  }
});

test('OpenCV is cached as soon as the service worker is ready, even on a first visit', async ({ page, context }) => {
  await disableSystemShare(page);
  await page.goto('./');
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  const cached = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    for (const name of await caches.keys()) {
      const keys = await (await caches.open(name)).keys();
      if (keys.some((r) => /opencv/i.test(r.url))) return true;
    }
    return false;
  });
  expect(cached).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByTestId('import-input').setInputFiles(fixture('document.jpg'));
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('link', { name: 'Recortar' }).click();
  await page.getByTestId('handle-0').waitFor();
  expect(Number(await page.getByTestId('handle-0').getAttribute('data-x'))).toBeGreaterThan(0.1);
});

test('service worker activates and controls the page after reload', async ({ page }) => {
  await installed(page);
});

test('after first load, offline: app opens and an imported image reaches a PDF', async ({ page, context }) => {
  await installed(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  const download = await scanToPdf(page);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});

test('corners are still detected offline', async ({ page, context }) => {
  await installed(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByTestId('import-input').setInputFiles(fixture('document.jpg'));
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('link', { name: 'Recortar' }).click();
  await page.getByTestId('handle-0').waitFor();
  expect(Number(await page.getByTestId('handle-0').getAttribute('data-x'))).toBeGreaterThan(0.1);
});

test('after first OCR, offline: OCR still works', async ({ page, context }) => {
  await installed(page);
  await page.getByTestId('import-input').setInputFiles(fixture('text-es.jpg'));
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('button', { name: 'Extraer texto' }).click();
  await expect(page.getByLabel('Texto reconocido')).toHaveValue(/Factura/, { timeout: 80_000 });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  await page.getByRole('button', { name: 'Volver a extraer texto' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByLabel('Texto reconocido')).toHaveValue(/Factura/, { timeout: 80_000 });
});

test('no request leaves our origin during a full scan-to-PDF flow', async ({ page }) => {
  const outside: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (/^https?:/.test(url) && !url.startsWith('http://localhost:4173/')) outside.push(url);
  });
  await installed(page);
  await scanToPdf(page);
  expect(outside).toEqual([]);
});

test('all features work under the CSP, with no violations in the console', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (/Content.Security.Policy|Refused to/i.test(m.text())) problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await installed(page);
  await expect(page.locator('meta[http-equiv=Content-Security-Policy]')).toHaveCount(1);
  await scanToPdf(page);
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('button', { name: 'Extraer texto' }).click();
  await expect(page.getByLabel('Texto reconocido')).toBeVisible({ timeout: 80_000 });
  expect(problems).toEqual([]);
});

test('the update prompt appears on a new version and does not reload by itself', async ({ page }) => {
  await installed(page);
  let navigations = 0;
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) navigations++; });
  await page.evaluate(() => window.dispatchEvent(new Event('appscan:update-ready')));
  await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible();
  await page.waitForTimeout(500);
  expect(navigations).toBe(0);
});

