import { defineConfig } from 'vitest/config';

// Pure-data package — tests read the registry/source in Node, no DOM or RTL.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
