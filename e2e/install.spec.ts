import { expect, test, type Browser } from '@playwright/test';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';

/** First visit: no stored state, as a person opening the link for the first time. */
async function freshPage(browser: Browser, userAgent?: string) {
  const context = await browser.newContext({
    baseURL: 'http://localhost:5173/appscan/',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    storageState: { cookies: [], origins: [] },
    userAgent,
  });
  return context.newPage();
}

/** Chrome decides when to fire this, so tests fire their own with a fake prompt. */
const firePrompt = (outcome: 'accepted' | 'dismissed') => (page: import('@playwright/test').Page) => page.evaluate((result) => {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  const w = window as unknown as { __prompted: number };
  w.__prompted = 0;
  event.prompt = async () => { w.__prompted++; };
  event.userChoice = Promise.resolve({ outcome: result });
  window.dispatchEvent(event);
}, outcome);

test('first visit on iPhone explains how to install, and the offer stays away once dismissed', async ({ browser }) => {
  const page = await freshPage(browser, IPHONE);
  await page.goto('./');
  const sheet = page.getByRole('dialog', { name: 'Descarga AppScan en tu celular' });
  await expect(sheet).toContainText('Compartir');
  await expect(sheet).toContainText('Agregar a inicio');
  await sheet.getByRole('button', { name: 'Ahora no' }).click();
  await expect(sheet).toHaveCount(0);
  await page.reload();
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await expect(sheet).toHaveCount(0);
});

test('after dismissing, the library still offers a way to install', async ({ browser }) => {
  const page = await freshPage(browser, IPHONE);
  await page.goto('./');
  await page.getByRole('button', { name: 'Ahora no' }).click();
  await page.getByRole('button', { name: 'Instalar AppScan en este celular' }).click();
  await expect(page.getByRole('dialog', { name: 'Descarga AppScan en tu celular' })).toBeVisible();
});

test('first visit in a browser that can install shows the button, which opens its prompt', async ({ browser }) => {
  const page = await freshPage(browser);
  await page.goto('./');
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await firePrompt('accepted')(page);
  const sheet = page.getByRole('dialog', { name: 'Descarga AppScan en tu celular' });
  await sheet.getByRole('button', { name: 'Instalar app' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);
  await expect(sheet).toHaveCount(0);
});

test('Android without a browser prompt falls back to the menu steps', async ({ browser }) => {
  const page = await freshPage(browser, ANDROID);
  await page.goto('./');
  await expect(page.getByRole('dialog', { name: 'Descarga AppScan en tu celular' })).toContainText('Agregar a la pantalla principal', { timeout: 8000 });
});

test('the installed app never offers to install', async ({ browser }) => {
  const page = await freshPage(browser, IPHONE);
  await page.addInitScript(() => {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => (q.includes('standalone')
      ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList
      : real(q));
  });
  await page.goto('./');
  await page.getByRole('heading', { name: 'AppScan' }).waitFor();
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Instalar AppScan en este celular' })).toHaveCount(0);
});

test('the offer does not cover the main action', async ({ browser }) => {
  const page = await freshPage(browser, IPHONE);
  await page.goto('./');
  await page.getByRole('dialog').waitFor();
  await page.getByRole('link', { name: 'Escanear', exact: true }).click({ trial: true, timeout: 3000 });
});
