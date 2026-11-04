import { expect, test, type Page } from '@playwright/test';
import { importAndOpen, openLibrary } from './helpers';

const EXPECTED = [[0.18, 0.12], [0.84, 0.17], [0.9, 0.86], [0.11, 0.9]];

async function openPage(page: Page, name = 'document.jpg') {
  await importAndOpen(page, name);
  await page.getByRole('link', { name: 'Editar página 1' }).click();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
}

async function openCrop(page: Page, name = 'document.jpg') {
  await openPage(page, name);
  await page.getByRole('link', { name: 'Recortar' }).click();
  await page.getByTestId('handle-0').waitFor();
}

const handles = (page: Page) => page.locator('[data-testid^=handle-]').evaluateAll((els) =>
  els.map((e) => [Number(e.getAttribute('data-x')), Number(e.getAttribute('data-y'))]));

async function dragHandle(page: Page, index: number, toX: number, toY: number) {
  const stage = (await page.getByTestId('crop-stage').boundingBox())!;
  const h = (await page.getByTestId(`handle-${index}`).boundingBox())!;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * toX, stage.y + stage.height * toY, { steps: 5 });
  await page.mouse.up();
}

const naturalSize = (page: Page) => page.getByTestId('page-preview').evaluate((img: HTMLImageElement) =>
  new Promise<[number, number]>((resolve) => {
    const done = () => resolve([img.naturalWidth, img.naturalHeight]);
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener('load', done, { once: true });
  }));

test.beforeEach(async ({ page }) => {
  await openLibrary(page);
});

test('crop opens with detected corners on a document photo', async ({ page }) => {
  await openCrop(page);
  const found = await handles(page);
  found.forEach(([x, y], i) => {
    expect(Math.abs(x - EXPECTED[i][0])).toBeLessThan(0.03);
    expect(Math.abs(y - EXPECTED[i][1])).toBeLessThan(0.03);
  });
});

test('a photo with no document proposes the full image and still allows Aplicar', async ({ page }) => {
  await openCrop(page, 'blank.jpg');
  expect(await handles(page)).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]]);
  await expect(page.getByRole('button', { name: 'Aplicar' })).toBeEnabled();
});

test('dragging a corner across the opposite edge disables Aplicar and explains why', async ({ page }) => {
  await openCrop(page);
  await dragHandle(page, 0, 0.95, 0.95);
  await expect(page.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  await expect(page.getByText('Las esquinas se cruzan')).toBeVisible();
});

test('a touch-sized drag moves the corner and Aplicar saves it', async ({ page }) => {
  await openCrop(page);
  await dragHandle(page, 0, 0.25, 0.2);
  const [x, y] = (await handles(page))[0];
  expect(x).toBeCloseTo(0.25, 1);
  expect(y).toBeCloseTo(0.2, 1);
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  await page.getByRole('link', { name: 'Recortar' }).click();
  await page.getByTestId('handle-0').waitFor();
  expect((await handles(page))[0][0]).toBeCloseTo(0.25, 1);
});

test('Volver a detectar restores detected corners', async ({ page }) => {
  await openCrop(page);
  const detected = await handles(page);
  await dragHandle(page, 0, 0.4, 0.4);
  await page.getByRole('button', { name: 'Volver a detectar' }).click();
  await expect.poll(() => handles(page)).toEqual(detected);
});

test('changing the filter updates the page and survives reload', async ({ page }) => {
  await openPage(page);
  const src = await page.getByTestId('page-preview').getAttribute('src');
  await page.getByLabel('Blanco y negro').check({ force: true });
  await expect(page.getByTestId('page-preview')).not.toHaveAttribute('src', src!);
  await page.reload();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  await expect(page.getByLabel('Blanco y negro')).toBeChecked();
});

test('editing the crop keeps the original photo intact', async ({ page }) => {
  await openCrop(page);
  const id = page.url().split('/crop/')[1];
  const sizeOf = () => page.evaluate(async (pageId) => {
    const { getPage } = await import('/appscan/src/storage/db.ts' as string);
    return (await getPage(pageId)).original.size;
  }, id);
  const before = await sizeOf();
  await dragHandle(page, 1, 0.8, 0.2);
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  expect(await sizeOf()).toBe(before);
});

test('rotation changes page dimensions', async ({ page }) => {
  await openPage(page);
  const [w, h] = await naturalSize(page);
  const src = await page.getByTestId('page-preview').getAttribute('src');
  await page.getByRole('button', { name: 'Girar' }).click();
  await expect(page.getByTestId('page-preview')).not.toHaveAttribute('src', src!);
  expect(await naturalSize(page)).toEqual([h, w]);
});

test('without OpenCV, cropping stays available and says automatic detection is off', async ({ page }) => {
  await page.route(/opencv/, (route) => route.abort());
  await page.reload();
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await openCrop(page);
  await expect(page.getByText('detección automática no está disponible')).toBeVisible();
  await dragHandle(page, 0, 0.2, 0.2);
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await page.getByRole('heading', { name: 'Página 1' }).waitFor();
  const [w] = await naturalSize(page);
  expect(w).toBeLessThan(900);
});
