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
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // Baseline floor — raise after measuring with: pnpm test:coverage
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 45,
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
