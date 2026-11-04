import { expect, test, type Page } from '@playwright/test';
import { importAndOpen, openLibrary } from './helpers';

async function openOcr(page: Page) {
  await importAndOpen(page, 'text-es.jpg');
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
}

test.beforeEach(async ({ page }) => {
  await openLibrary(page);
});

test('OCR extracts Spanish text, with accents, from a rendered fixture', async ({ page }) => {
  await openOcr(page);
  await page.getByRole('button', { name: 'Extraer texto' }).click();
  const text = page.getByLabel('Texto reconocido');
  await expect(text).toHaveValue(/Factura número 1234/, { timeout: 80_000 });
  await expect(text).toHaveValue(/Señor Muñoz/);
  await expect(text).toHaveValue(/Dirección/);
});

test('recognized text is saved on the page and can be copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openOcr(page);
  await page.getByRole('button', { name: 'Extraer texto' }).click();
  await expect(page.getByLabel('Texto reconocido')).toHaveValue(/Factura/, { timeout: 80_000 });
  await page.getByRole('button', { name: 'Copiar texto' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Factura');
  await page.reload();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  await expect(page.getByLabel('Texto reconocido')).toHaveValue(/Factura/);
});

test('OCR shows progress during the first download', async ({ page }) => {
  await openOcr(page);
  await page.getByRole('button', { name: 'Extraer texto' }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.getByLabel('Texto reconocido')).toBeVisible({ timeout: 80_000 });
});

test('OCR while offline before download shows a message and leaves the page intact', async ({ page }) => {
  await openOcr(page);
  await page.route(/\/ocr\//, (route) => route.abort());
  await page.getByRole('button', { name: 'Extraer texto' }).click();
  await expect(page.getByRole('alert')).toContainText('conexión', { timeout: 60_000 });
  await expect(page.getByTestId('page-preview')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Extraer texto' })).toBeEnabled();
});

test('OCR requests only same-origin URLs', async ({ page }) => {
  const origin = new URL(page.url()).origin;
  const outside: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (/^https?:/.test(url) && !url.startsWith(origin)) outside.push(url);
  });
  await openOcr(page);
  await page.getByRole('button', { name: 'Extraer texto' }).click();
  await expect(page.getByLabel('Texto reconocido')).toHaveValue(/Factura/, { timeout: 80_000 });
  expect(outside).toEqual([]);
});
