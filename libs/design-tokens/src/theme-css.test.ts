import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { theme } from './tokens.js';

const cssPath = fileURLToPath(new URL('./theme.css', import.meta.url));
const css = readFileSync(cssPath, 'utf-8');

const normalizedCss = css.replace(/\s+/g, '');

describe('theme.css', () => {
  it('scopes light and dark under their own [data-theme] selectors', () => {
    expect(css).toContain(":root[data-theme='light']");
    expect(css).toContain(":root[data-theme='dark']");
  });

  it('emits a custom property for every light and dark theme key', () => {
    for (const [key, value] of Object.entries(theme.light)) {
      expect(normalizedCss).toContain(`--ath-${key}:${value.replace(/\s+/g, '')};`);
    }
    for (const [key, value] of Object.entries(theme.dark)) {
      expect(normalizedCss).toContain(`--ath-${key}:${value.replace(/\s+/g, '')};`);
    }
  });

  it('exposes a Tailwind v4 @theme inline block aliasing the light custom properties', () => {
    expect(css).toContain('@theme inline');
    for (const key of Object.keys(theme.light)) {
      expect(css).toContain(`--color-${key}: var(--ath-${key});`);
    }
  });
});
