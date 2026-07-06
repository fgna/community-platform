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
      // Gate on store + the specific lib files that have unit tests.
      // Other lib files (markdown, oauth, query-client, render-post-content,
      // theme-provider) are exercised via E2E and will be added here as
      // unit tests are written.
      include: ['src/store/**', 'src/lib/api-client.ts', 'src/lib/utils.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
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
