import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/services/**/*.ts', 'src/routes/**/*.ts'],
      exclude: ['src/__tests__/**'],
    },
  },
});
