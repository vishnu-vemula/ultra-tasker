import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup-env.ts'],
    include: ['src/**/*.spec.ts'],
    testTimeout: 30_000
  }
});
