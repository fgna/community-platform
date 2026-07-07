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
