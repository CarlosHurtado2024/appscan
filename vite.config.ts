import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { deployBase } from './src/deployBase';

const THEME = '#23246b';
const BASE = deployBase(process.env);

// Only in production: the dev server relies on inline scripts and websockets for hot reload.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self'",
  "connect-src 'self'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob: mediastream:",
  "style-src 'self' 'unsafe-inline'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const contentSecurityPolicy = (): Plugin => ({
  name: 'appscan-csp',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
});

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    contentSecurityPolicy(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'AppScan',
        short_name: 'AppScan',
        description: 'Escanea documentos con tu celular. Todo se queda en tu dispositivo.',
        lang: 'es',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: THEME,
        background_color: THEME,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // OpenCV installs with the app, so scanning works offline after the first visit, however slow it was.
        // OCR is optional and only cached the first time it is used.
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/ocr/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /\/ocr\//,
            handler: 'CacheFirst',
            options: { cacheName: 'appscan-ocr', cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
    rollupOptions: { output: { entryFileNames: 'assets/[name]-[hash].js', chunkFileNames: 'assets/[name]-[hash].js' } },
  },
  optimizeDeps: { include: ['@techstark/opencv-js'] },
  build: { target: 'es2022', chunkSizeWarningLimit: 15000 },
});
