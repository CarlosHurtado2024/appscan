import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/appscan/',
  plugins: [react()],
  worker: { format: 'es' },
  optimizeDeps: { include: ['@techstark/opencv-js'] },
  build: { target: 'es2022', chunkSizeWarningLimit: 15000 },
});
