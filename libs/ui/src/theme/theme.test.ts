import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { describe, expect, it } from 'vitest';
import { buildThemeCss, buildThemeModule, toThemeVars } from '../../scripts/generate-theme.mjs';
import { themeColors, themeVars, cssVar } from './theme.js';

const manifestPath = fileURLToPath(
  new URL('../../../../specs/designs/athena-tokens.json', import.meta.url),
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

const tsPath = fileURLToPath(new URL('./theme.ts', import.meta.url));
const cssPath = fileURLToPath(new URL('./theme.css', import.meta.url));
const css = readFileSync(cssPath, 'utf-8');
const normalizedCss = css.replace(/\s+/g, '');

// The headline variable set the applied theme must expose (from the mockup).
const HEADLINE_VARS = [
  'bg',
  'card',
  'text-1',
  'text-2',
  'text-3',
  'accent',
  'crit',
  'adv',
  'info',
  'stale',
  'live',
  'disc',
];

describe('generated theme.css / theme.ts are not stale', () => {
  it('theme.ts matches what generate-theme.mjs would produce from the manifest', async () => {
    const config = (await prettier.resolveConfig(tsPath)) ?? {};
    const expected = await prettier.format(buildThemeModule(manifest), {
      ...config,
      filepath: tsPath,
    });
    expect(readFileSync(tsPath, 'utf-8')).toBe(expected);
  });

  it('theme.css matches what generate-theme.mjs would produce from the manifest', async () => {
    const config = (await prettier.resolveConfig(cssPath)) ?? {};
    const expected = await prettier.format(buildThemeCss(manifest), {
      ...config,
      filepath: cssPath,
    });
    expect(css).toBe(expected);
  });
});

describe('theme.css', () => {
  it('scopes light and dark under their own [data-theme] selectors', () => {
    expect(css).toContain(":root[data-theme='light']");
    expect(css).toContain(":root[data-theme='dark']");
  });

  it('exposes the mockup headline variable set', () => {
    for (const name of HEADLINE_VARS) {
      expect(themeVars).toContain(name);
    }
  });

  it('emits a custom property for every theme var, matching themeColors', () => {
    for (const side of ['light', 'dark'] as const) {
      for (const [name, value] of Object.entries(themeColors[side])) {
        expect(normalizedCss).toContain(`--${name}:${value.replace(/\s+/g, '')};`);
      }
    }
  });

  it('uses the mockup names, not the manifest tier names', () => {
    // Renamed keys: text -> text-1, text-muted -> text-2, text-subtle -> text-3,
    // accent-strong -> accent-2. None of the legacy names should leak through.
    expect(css).not.toMatch(/--text:/);
    expect(css).not.toMatch(/--text-muted:/);
    expect(css).not.toMatch(/--text-subtle:/);
    expect(css).not.toMatch(/--accent-strong:/);
  });
});

describe('themeColors', () => {
  it('renames the four tier keys and otherwise mirrors the manifest theme', () => {
    expect(themeColors.light).toEqual(toThemeVars(manifest.theme.light));
    expect(themeColors.dark).toEqual(toThemeVars(manifest.theme.dark));
    expect(themeColors.light['text-1']).toBe(manifest.theme.light.text);
    expect(themeColors.light['text-2']).toBe(manifest.theme.light['text-muted']);
    expect(themeColors.light['text-3']).toBe(manifest.theme.light['text-subtle']);
    expect(themeColors.dark['accent-2']).toBe(manifest.theme.dark['accent-strong']);
  });

  it('carries per-theme base severity/status colors including dark-only values', () => {
    expect(themeColors.light.crit).toBe('#c22f2f');
    expect(themeColors.dark.crit).toBe('#e05a52');
    expect(themeColors.dark.info).toBe('#5a9fe0');
    expect(themeColors.dark.stale).toBe('#e08a3a');
    expect(themeColors.dark.err).toBe('#8a6d6a');
  });
});

describe('cssVar', () => {
  it('returns the CSS custom property reference for a theme var', () => {
    expect(cssVar('text-1')).toBe('var(--text-1)');
    expect(cssVar('crit')).toBe('var(--crit)');
  });
});
