import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}', 'src/index.ts'],
    },
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          globals: true,
          environment: 'happy-dom',
          setupFiles: ['../../vitest.setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        plugins: [react(), storybookTest({ configDir: '.storybook' })],
        // radix-ui (Checkbox's backing primitive) is only reachable through story
        // modules, so Vite's scanner misses it and would optimize+reload mid-run,
        // flaking the Checkbox stories. Pre-bundle it so the page never reloads mid-run.
        optimizeDeps: { include: ['radix-ui'] },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
