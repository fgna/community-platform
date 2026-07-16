import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // Gate on the service files that have dedicated unit tests.
      // Controllers and other services are exercised via E2E / adversarial
      // tests and will be added here as unit tests are written.
      include: [
        'src/auth/auth.service.ts',
        'src/courses/courses.service.ts',
        'src/messages/messages.service.ts',
        'src/posts/posts.service.ts',
      ],
      exclude: ['src/**/*.spec.ts'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 55,
        statements: 50,
        // Auth is the highest-value target in the codebase — hold it to a
        // stricter floor than the general baseline (measured after HAR-001:
        // 89.59% stmts/lines, 90% functions, 74.19% branches — branch % has
        // been observed to dip several points under system load, since
        // auth.service.ts's Date.now()-based token-expiry checks are
        // timing-sensitive). Gate set with real margin below actual, not a
        // token buffer, so normal noise doesn't flake CI.
        'src/auth/**': {
          lines: 85,
          functions: 80,
          branches: 60,
          statements: 85,
        },
      },
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2021',
      },
      module: { type: 'es6' },
    }),
  ],
});
