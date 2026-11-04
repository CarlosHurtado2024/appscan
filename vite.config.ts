import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const THEME = '#23246b';

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
  base: '/appscan/',
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
        start_url: '/appscan/',
        scope: '/appscan/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: THEME,
        background_color: THEME,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app shell installs up front; the heavy engines are cached the first time they load.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        globIgnores: ['**/opencv*', '**/ocr/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /\/assets\/opencv.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'appscan-opencv', cacheableResponse: { statuses: [200] } },
          },
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
