import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { openLibrary } from './helpers';

const capture = async (page: Page) => {
  const count = await page.getByTestId('captured-count').textContent();
  await page.getByRole('button', { name: 'Capturar' }).click();
  await expect(page.getByTestId('captured-count')).not.toHaveText(count ?? '');
};

async function openScan(page: Page, query = '') {
  await page.goto(`./#/scan${query}`);
  await page.reload();
  await page.getByRole('button', { name: 'Capturar' }).waitFor();
  await expect(page.getByRole('button', { name: 'Capturar' })).toBeEnabled();
}

test.beforeEach(async ({ page }) => {
  await openLibrary(page);
});

test('capture creates a page and offers to review it', async ({ page }) => {
  await openScan(page);
  await capture(page);
  await page.getByRole('link', { name: 'Terminar' }).click();
  await expect(page.getByTestId('page-tile')).toHaveCount(1);
});

test('after a capture, its crop can be adjusted right away', async ({ page }) => {
  await openScan(page);
  await capture(page);
  await page.getByRole('link', { name: 'Ajustar recorte' }).click();
  await page.getByTestId('handle-0').waitFor();
});

test('multi-page mode adds pages to the same document in order', async ({ page }) => {
  await openScan(page);
  await capture(page);
  await capture(page);
  await capture(page);
  await page.getByRole('link', { name: 'Terminar' }).click();
  await expect(page.getByTestId('page-tile')).toHaveCount(3);
});

test('scanning more from a document adds to it', async ({ page }) => {
  await openScan(page);
  await capture(page);
  await page.getByRole('link', { name: 'Terminar' }).click();
  await page.getByRole('link', { name: 'Escanear más' }).click();
  await page.getByRole('button', { name: 'Capturar' }).waitFor();
  await expect(page.getByRole('button', { name: 'Capturar' })).toBeEnabled();
  await capture(page);
  await page.getByRole('link', { name: 'Terminar' }).click();
  await expect(page.getByTestId('page-tile')).toHaveCount(2);
});

test('reloading mid-scan keeps pages already captured', async ({ page }) => {
  await openScan(page);
  await capture(page);
  await capture(page);
  await page.goto('./#/');
  await page.reload();
  await expect(page.getByTestId('doc-stub')).toHaveCount(1);
  await expect(page.getByTestId('doc-stub')).toContainText('2 páginas');
});

test('camera denied shows instructions and a gallery option', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotAllowedError'));
  });
  await page.goto('./#/scan');
  await page.reload();
  await expect(page.getByText('AppScan no tiene permiso para usar la cámara')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Elegir de la galería' })).toBeVisible();
  await expect(page.getByTestId('system-camera-input')).toHaveCount(1);
});

test('a photo from the system camera fallback is saved as a page', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotFoundError'));
  });
  await page.goto('./#/scan');
  await page.reload();
  await page.getByTestId('system-camera-input').setInputFiles('e2e/fixtures/document.jpg');
  await expect(page.getByTestId('page-tile')).toHaveCount(1);
});

test('leaving the scan screen stops all camera tracks', async ({ page }) => {
  await page.addInitScript(() => {
    const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (c) => {
      const stream = await real(c);
      (window as unknown as { __tracks: MediaStreamTrack[] }).__tracks = stream.getTracks();
      return stream;
    };
  });
  await openScan(page);
  await page.getByRole('link', { name: 'Cerrar' }).click();
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  const states = await page.evaluate(() => (window as unknown as { __tracks: MediaStreamTrack[] }).__tracks.map((t) => t.readyState));
  expect(states.length).toBeGreaterThan(0);
  expect(new Set(states)).toEqual(new Set(['ended']));
});

test('ID mode asks for front, then back, and creates an id-card document with 2 pages', async ({ page }) => {
  await openScan(page, '?mode=id');
  await expect(page.getByText('Cara frontal')).toBeVisible();
  await capture(page);
  await expect(page.getByText('Reverso')).toBeVisible();
  await page.getByRole('button', { name: 'Capturar' }).click();
  await expect(page.getByTestId('page-tile')).toHaveCount(2);
  await expect(page.getByText('dos caras a tamaño real')).toBeVisible();
});

test('exporting an id-card document yields a one-page A4 PDF', async ({ page }) => {
  await openScan(page, '?mode=id');
  await capture(page);
  await page.getByRole('button', { name: 'Capturar' }).click();
  await expect(page.getByTestId('page-tile')).toHaveCount(2);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Compartir PDF' }).click(),
  ]);
  const pdf = await PDFDocument.load(readFileSync(await download.path()));
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
});
