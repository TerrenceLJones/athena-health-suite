import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { describe, expect, it } from 'vitest';
import { buildTokensModule, buildThemeCss } from '../scripts/generate-tokens.mjs';
import { primitive, severity, dataStatus, theme, typography, spacing, radius } from './tokens';

const sourcePath = fileURLToPath(new URL('../tokens.source.json', import.meta.url));
const source = JSON.parse(readFileSync(sourcePath, 'utf-8'));

const generatedTsPath = fileURLToPath(new URL('./tokens.ts', import.meta.url));
const generatedCssPath = fileURLToPath(new URL('./theme.css', import.meta.url));

describe('generated tokens.ts / theme.css are not stale', () => {
  it('src/tokens.ts matches what generate-tokens.mjs would produce from tokens.source.json', async () => {
    const config = (await prettier.resolveConfig(generatedTsPath)) ?? {};
    const expected = await prettier.format(buildTokensModule(source), {
      ...config,
      filepath: generatedTsPath,
    });
    expect(readFileSync(generatedTsPath, 'utf-8')).toBe(expected);
  });

  it('src/theme.css matches what generate-tokens.mjs would produce from tokens.source.json', async () => {
    const config = (await prettier.resolveConfig(generatedCssPath)) ?? {};
    const expected = await prettier.format(buildThemeCss(source), {
      ...config,
      filepath: generatedCssPath,
    });
    expect(readFileSync(generatedCssPath, 'utf-8')).toBe(expected);
  });
});

describe('primitive', () => {
  it('matches tokens.source.json primitive.neutral and primitive.teal exactly (AC-01)', () => {
    expect(primitive.neutral).toEqual(source.primitive.neutral);
    expect(primitive.teal).toEqual(source.primitive.teal);
  });
});

describe('severity', () => {
  it('covers critical, advisory, info, and stale, each carrying color+icon+shape+label as one unit (AC-02)', () => {
    expect(Object.keys(severity).sort()).toEqual(['advisory', 'critical', 'info', 'stale'].sort());
    expect(severity).toEqual(source.severity);
  });
});

describe('dataStatus', () => {
  it('covers all six clinical data states, including label patterns (AC-03)', () => {
    expect(Object.keys(dataStatus).sort()).toEqual(
      ['disconnected', 'error', 'final', 'live', 'preliminary', 'stale'].sort(),
    );
    expect(dataStatus).toEqual(source.dataStatus);
    expect(dataStatus.stale.label).toBe('Last updated {time}');
  });
});

describe('theme', () => {
  it('exposes every light and dark value from tokens.source.json (AC-04)', () => {
    expect(theme.light).toEqual(source.theme.light);
    expect(theme.dark).toEqual(source.theme.dark);
  });
});

describe('typography, spacing, and radius', () => {
  it('match tokens.source.json exactly (AC-05)', () => {
    expect(typography).toEqual(source.typography);
    expect(spacing).toEqual(source.spacing);
    expect(radius).toEqual(source.radius);
  });
});
