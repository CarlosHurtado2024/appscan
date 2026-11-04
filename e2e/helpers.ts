import type { Page } from '@playwright/test';

export const fixture = (name: string) => `e2e/fixtures/${name}`;

/** Sharing would open a system dialog on desktop Chrome, so tests take the download path. */
export async function disableSystemShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
  });
}

export async function openLibrary(page: Page) {
  await disableSystemShare(page);
  await page.goto('./');
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
}

export async function importFiles(page: Page, ...names: string[]) {
  await page.getByTestId('import-input').setInputFiles(names.map(fixture));
}

/** Imports one image and waits until its document opens. */
export async function importAndOpen(page: Page, name = 'document.jpg') {
  await importFiles(page, name);
  await page.getByTestId('page-tile').first().waitFor();
}

/** Waits for the library to render so a following import cannot land on the screen being left. */
export async function backToLibrary(page: Page) {
  await page.getByRole('link', { name: 'Volver' }).click();
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
}
