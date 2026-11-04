import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    testTimeout: 60000,
    // Interop copies OpenCV's self-resolving `then` onto the module, which makes importing it hang.
    deps: { interopDefault: false },
  },
});
