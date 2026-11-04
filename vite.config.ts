import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const THEME = '#23246b';

export default defineConfig({
  base: '/appscan/',
  plugins: [
    react(),
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
