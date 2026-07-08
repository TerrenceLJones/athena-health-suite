import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        'radix-ui',
        '@athena/icons',
        '@athena/design-tokens',
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
    cssCodeSplit: false,
  },
  // No vite-plugin-dts here: @athena/ui composes sibling source packages
  // (@athena/icons, @athena/design-tokens), so a self-contained dist .d.ts would
  // need api-extractor. Consumers resolve ui through `main: src/index.ts`
  // (source), so types come straight from source — same as the other libs.
});
