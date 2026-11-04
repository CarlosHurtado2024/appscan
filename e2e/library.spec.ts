import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { backToLibrary, importAndOpen, importFiles, openLibrary } from './helpers';

test.beforeEach(async ({ page }) => {
  await openLibrary(page);
});

test('empty library explains how to start and offers Escanear and Importar', async ({ page }) => {
  await expect(page.getByText('Aún no tienes documentos')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Escanear', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importar' })).toBeVisible();
});

test('Escanear opens the camera after its printed sweep', async ({ page }) => {
  await page.getByRole('link', { name: 'Escanear', exact: true }).click();
  await expect(page.locator('.guilloche--active')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Capturar' })).toBeVisible();
});

test('Unir is offered only with two or more documents', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Unir documentos' })).toHaveCount(0);
  await importAndOpen(page);
  await backToLibrary(page);
  await expect(page.getByRole('link', { name: 'Unir documentos' })).toHaveCount(0);
  await importAndOpen(page);
  await backToLibrary(page);
  await expect(page.getByRole('link', { name: 'Unir documentos' })).toBeVisible();
});

test('the library keeps saying where documents live after the notice is dismissed', async ({ page }) => {
  await importAndOpen(page);
  await backToLibrary(page);
  await page.getByRole('button', { name: 'Entendido' }).click();
  await expect(page.getByText('Tus documentos se quedan en este celular')).toBeVisible();
});

test('importing an image creates a document with a thumbnail', async ({ page }) => {
  await importAndOpen(page);
  await backToLibrary(page);
  const stub = page.getByTestId('doc-stub');
  await expect(stub).toHaveCount(1);
  await expect(stub.getByRole('img')).toBeVisible();
  await expect(stub).toContainText('1 página');
});

test('documents persist after a page reload', async ({ page }) => {
  await importAndOpen(page);
  await backToLibrary(page);
  await page.reload();
  await expect(page.getByTestId('doc-stub')).toHaveCount(1);
});

test('search filters documents by title', async ({ page }) => {
  await importAndOpen(page);
  await page.getByLabel('Título del documento').fill('Factura de luz');
  await page.getByLabel('Título del documento').blur();
  await backToLibrary(page);
  await importAndOpen(page);
  await backToLibrary(page);
  await expect(page.getByTestId('doc-stub')).toHaveCount(2);
  await page.getByRole('searchbox').fill('factura');
  await expect(page.getByTestId('doc-stub')).toHaveCount(1);
  await page.getByRole('searchbox').fill('zzz');
  await expect(page.getByText('Ningún documento coincide')).toBeVisible();
});

test('importing a corrupt file plus a valid one reports the bad file and keeps the good one', async ({ page }) => {
  await importFiles(page, 'corrupt.jpg', 'document.jpg');
  await page.getByTestId('page-tile').first().waitFor();
  await expect(page.getByTestId('page-tile')).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('corrupt.jpg');
});

test('importing only a corrupt file stays on the library with a clear message', async ({ page }) => {
  await importFiles(page, 'corrupt.jpg');
  await expect(page.getByRole('status')).toContainText('corrupt.jpg');
  await expect(page.getByTestId('doc-stub')).toHaveCount(0);
});

test('pages can be moved earlier and later, and order survives reload', async ({ page }) => {
  await importFiles(page, 'document.jpg', 'blank.jpg');
  await expect(page.getByTestId('page-tile')).toHaveCount(2);
  const ids = () => page.getByTestId('page-tile').evaluateAll((els) => els.map((e) => e.getAttribute('data-page-id')));
  const before = await ids();
  await page.getByRole('button', { name: 'Mover página 2 antes' }).click();
  await expect.poll(ids).toEqual([before[1], before[0]]);
  await page.reload();
  await expect.poll(ids).toEqual([before[1], before[0]]);
  await page.getByRole('button', { name: 'Mover página 1 después' }).click();
  await expect.poll(ids).toEqual(before);
  await expect(page.getByRole('button', { name: 'Mover página 1 antes' })).toBeDisabled();
});

test('deleting the last page asks for confirmation, then removes the document', async ({ page }) => {
  await importAndOpen(page);
  await page.getByRole('button', { name: 'Eliminar página 1' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('También se eliminará el documento');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByTestId('page-tile')).toHaveCount(1);
  await page.getByRole('button', { name: 'Eliminar página 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByText('Aún no tienes documentos')).toBeVisible();
});

test('export produces a PDF download named after the document', async ({ page }) => {
  await importAndOpen(page);
  await page.getByLabel('Título del documento').fill('Contrato: alquiler');
  await page.getByLabel('Título del documento').blur();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Compartir PDF' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Contrato alquiler.pdf');
  const bytes = readFileSync(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
});

test('the no-backup notice can be dismissed and stays dismissed', async ({ page }) => {
  await importAndOpen(page);
  await backToLibrary(page);
  const notice = page.getByText('Sin copia de seguridad');
  await expect(notice).toBeVisible();
  await page.getByRole('button', { name: 'Entendido' }).click();
  await expect(notice).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('doc-stub')).toHaveCount(1);
  await expect(notice).toHaveCount(0);
});
