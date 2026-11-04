import { expect, test, type Page } from '@playwright/test';
import { backToLibrary, importAndOpen, openLibrary } from './helpers';

async function makeDoc(page: Page, title: string, name: string) {
  await importAndOpen(page, name);
  await page.getByLabel('Título del documento').fill(title);
  await page.getByLabel('Título del documento').blur();
  await expect(page.getByLabel('Título del documento')).toHaveValue(title);
  await page.waitForTimeout(100);
  await backToLibrary(page);
}

test.beforeEach(async ({ page }) => {
  await openLibrary(page);
  await makeDoc(page, 'Primero', 'document.jpg');
  await makeDoc(page, 'Segundo', 'blank.jpg');
  await page.getByRole('link', { name: 'Unir documentos' }).click();
  await page.getByRole('heading', { name: 'Unir documentos' }).waitFor();
});

test('merge needs at least two documents selected', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Unir' });
  await expect(button).toBeDisabled();
  await page.getByLabel('Segundo').click({ force: true });
  await expect(button).toBeDisabled();
  await page.getByLabel('Primero').click({ force: true });
  await expect(button).toBeEnabled();
});

test('merge creates a new document in selection order; sources are unchanged', async ({ page }) => {
  await page.getByLabel('Segundo').click({ force: true });
  await page.getByLabel('Primero').click({ force: true });
  await expect(page.getByText('1.º Segundo')).toBeVisible();
  await page.getByRole('button', { name: 'Unir' }).click();
  await expect(page.getByTestId('page-tile')).toHaveCount(2);
  await expect(page.getByLabel('Título del documento')).toHaveValue('Segundo + Primero');

  const pages = await page.evaluate(async () => {
    const { listDocs, getPages } = await import('/appscan/src/storage/db.ts' as string);
    const docs = await listDocs();
    return Promise.all(docs.map(async (d: { title: string; id: string }) => ({
      title: d.title,
      sizes: (await getPages(d.id)).map((p: { original: Blob }) => p.original.size),
    })));
  });
  const by = (title: string) => pages.find((p: { title: string }) => p.title === title)!;
  expect(by('Primero').sizes).toHaveLength(1);
  expect(by('Segundo').sizes).toHaveLength(1);
  expect(by('Segundo + Primero').sizes).toEqual([...by('Segundo').sizes, ...by('Primero').sizes]);
});

test('with fewer than two documents the screen explains why it cannot merge', async ({ page }) => {
  await page.evaluate(async () => {
    const { listDocs, deleteDoc } = await import('/appscan/src/storage/db.ts' as string);
    const [first] = await listDocs();
    await deleteDoc(first.id);
  });
  await page.reload();
  await expect(page.getByText('Necesitas al menos dos documentos')).toBeVisible();
});
