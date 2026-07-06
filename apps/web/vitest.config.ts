import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // Only gate on store + lib — components need E2E, not unit tests
      include: ['src/store/**', 'src/lib/**'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 40,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@community/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@community/themes': resolve(__dirname, '../../packages/themes/src/index.ts'),
    },
  },
});
