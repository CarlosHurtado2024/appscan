import { expect, test, type Page } from '@playwright/test';
import { importAndOpen, openLibrary } from './helpers';

async function openAnnotate(page: Page) {
  await importAndOpen(page, 'blank.jpg');
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  await page.getByRole('link', { name: 'Anotar' }).click();
  await page.getByTestId('annotate-stage').waitFor();
  await page.getByAltText('Página para anotar').waitFor();
}

async function drawLine(page: Page, testId: string, y: number) {
  const box = (await page.getByTestId(testId).boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * y, { steps: 6 });
  await page.mouse.up();
}

async function saveAnnotations(page: Page) {
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
}

/** Reads the saved page from the database: the number of annotations and a sample of the output. */
const stored = (page: Page, sample?: [number, number]) => page.evaluate(async ([id, at]) => {
  const { getPage } = await import('/appscan/src/storage/db.ts' as string);
  const { blobToRaster } = await import('/appscan/src/core/image.ts' as string);
  const p = await getPage(id);
  const img = await blobToRaster(p.rendered);
  const i = at ? (Math.floor(img.height * at[1]) * img.width + Math.floor(img.width * at[0])) * 4 : 0;
  return { annotations: p.annotations, width: img.width, height: img.height, pixel: [img.data[i], img.data[i + 1], img.data[i + 2]] };
}, [page.url().split('/page/')[1], sample ?? null] as const);

const isDark = ([r, g, b]: number[]) => r + g + b < 300;

test.beforeEach(async ({ page }) => {
  await openLibrary(page);
  await openAnnotate(page);
});

test('freehand marks appear in the rendered page', async ({ page }) => {
  await page.getByRole('button', { name: 'Dibujar' }).click();
  await drawLine(page, 'annotate-stage', 0.5);
  await saveAnnotations(page);
  const s = await stored(page, [0.5, 0.5]);
  expect(s.annotations).toHaveLength(1);
  expect(isDark(s.pixel)).toBe(true);
});

test('text appears in the rendered page', async ({ page }) => {
  await page.getByRole('button', { name: 'Texto' }).click();
  await page.getByLabel('Texto a añadir').fill('Pagado');
  await page.getByRole('button', { name: 'Añadir texto' }).click();
  await expect(page.getByTestId('annotation-item')).toContainText('Pagado');
  await saveAnnotations(page);
  const s = await stored(page);
  expect(s.annotations[0]).toMatchObject({ type: 'text', text: 'Pagado' });
});

test('an empty signature cannot be saved', async ({ page }) => {
  await page.getByRole('button', { name: 'Firma', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva firma' }).click();
  await expect(page.getByRole('button', { name: 'Guardar firma' })).toBeDisabled();
});

async function createSignature(page: Page) {
  await page.getByRole('button', { name: 'Firma', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva firma' }).click();
  await drawLine(page, 'signature-pad', 0.5);
  await page.getByRole('button', { name: 'Guardar firma' }).click();
  await page.getByRole('button', { name: 'Colocar firma 1' }).waitFor();
}

test('a drawn signature is saved and listed for reuse', async ({ page }) => {
  await createSignature(page);
  await page.reload();
  await page.getByAltText('Página para anotar').waitFor();
  await page.getByRole('button', { name: 'Firma', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Colocar firma 1' })).toBeVisible();
});

test('a saved signature can be placed, moved and resized on a page', async ({ page }) => {
  await createSignature(page);
  await page.getByRole('button', { name: 'Colocar firma 1' }).click();
  const item = page.getByTestId('annotation-item');
  await expect(item).toBeVisible();
  const before = (await item.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 - 30, before.y + before.height / 2 + 40, { steps: 4 });
  await page.mouse.up();
  const moved = (await item.boundingBox())!;
  expect(moved.y).toBeGreaterThan(before.y + 20);
  const handle = (await page.getByTestId('resize-handle').boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 30, handle.y + 30, { steps: 4 });
  await page.mouse.up();
  expect((await item.boundingBox())!.width).toBeGreaterThan(moved.width);
  await saveAnnotations(page);
  expect((await stored(page)).annotations[0].type).toBe('signature');
});

test('annotations survive reload and can be undone', async ({ page }) => {
  await page.getByRole('button', { name: 'Dibujar' }).click();
  await drawLine(page, 'annotate-stage', 0.3);
  await drawLine(page, 'annotate-stage', 0.6);
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await saveAnnotations(page);
  await page.reload();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  const s = await stored(page);
  expect(s.annotations).toHaveLength(1);
});

test('annotations stay on the same content after rotating the page', async ({ page }) => {
  await page.getByRole('button', { name: 'Dibujar' }).click();
  await drawLine(page, 'annotate-stage', 0.25);
  await saveAnnotations(page);
  await page.getByRole('button', { name: 'Girar' }).click();
  // A line at the upper quarter ends up on the right quarter after a clockwise turn.
  await expect.poll(async () => isDark((await stored(page, [0.75, 0.5])).pixel)).toBe(true);
  expect(isDark((await stored(page, [0.25, 0.5])).pixel)).toBe(false);
});

test('deleting a signature in use is refused with the page count', async ({ page }) => {
  await createSignature(page);
  await page.getByRole('button', { name: 'Colocar firma 1' }).click();
  await saveAnnotations(page);
  await page.getByRole('link', { name: 'Anotar' }).click();
  await page.getByAltText('Página para anotar').waitFor();
  await page.getByRole('button', { name: 'Firma', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar firma 1' }).click();
  await expect(page.getByRole('status')).toContainText('en uso en 1 página');
  await expect(page.getByRole('button', { name: 'Colocar firma 1' })).toBeVisible();
});

test('an unused signature can be deleted', async ({ page }) => {
  await createSignature(page);
  await page.getByRole('button', { name: 'Eliminar firma 1' }).click();
  await expect(page.getByRole('button', { name: 'Colocar firma 1' })).toHaveCount(0);
});
