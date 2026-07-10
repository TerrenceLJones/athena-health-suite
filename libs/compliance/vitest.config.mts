import { defineConfig } from 'vitest/config';

// `*.type-test.ts` files are deliberately excluded from the runtime include:
// they are compile-time assertions (enforced by `tsc --noEmit`), not runners.
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
