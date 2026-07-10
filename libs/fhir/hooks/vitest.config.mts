import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// React hooks — tested with RTL's renderHook under happy-dom, with MSW stubbing
// the FHIR server at the fetch boundary.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['../../../vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/index.ts'],
    },
  },
});
