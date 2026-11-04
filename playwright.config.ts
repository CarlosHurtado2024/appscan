import { defineConfig } from '@playwright/test';

const mobile = {
  channel: 'chrome' as const,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  locale: 'es-ES',
  acceptDownloads: true,
};

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: 'line',
  projects: [
    {
      name: 'app',
      testIgnore: /pwa\.spec/,
      use: {
        ...mobile,
        baseURL: 'http://localhost:5173/appscan/',
        launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
      },
    },
    {
      name: 'pwa',
      testMatch: /pwa\.spec/,
      use: { ...mobile, baseURL: 'http://localhost:4173/appscan/' },
    },
  ],
  webServer: [
    { command: 'npx vite --port 5173 --strictPort', url: 'http://localhost:5173/appscan/', reuseExistingServer: true, timeout: 60_000 },
    { command: 'npm run build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/appscan/', reuseExistingServer: true, timeout: 180_000 },
  ],
});
