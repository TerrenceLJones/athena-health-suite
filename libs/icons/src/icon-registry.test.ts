import { readFileSync } from 'node:fs';
import prettier from 'prettier';
import { describe, expect, it } from 'vitest';
import { loadAthenaIconsApi, buildIconRegistryModule } from '../scripts/generate-icons.mjs';
import { iconRegistry, iconAliases } from './icon-registry.js';
import { resolveTestAsset } from './test-support/resolve-test-asset.js';

const canonicalScriptPath = resolveTestAsset(
  '../../../specs/designs/athena-icons.js',
  import.meta.url,
);
const generatedPath = resolveTestAsset('./icon-registry.ts', import.meta.url);

describe('src/icon-registry.ts is not stale', () => {
  it('matches what generate-icons.mjs would produce from specs/designs/athena-icons.js', async () => {
    const api = loadAthenaIconsApi(canonicalScriptPath);
    const config = (await prettier.resolveConfig(generatedPath)) ?? {};
    const expected = await prettier.format(buildIconRegistryModule(api), {
      ...config,
      filepath: generatedPath,
    });

    expect(readFileSync(generatedPath, 'utf-8')).toBe(expected);
  });
});

describe('iconRegistry', () => {
  it('shares one viewBox and stroke-width across every glyph (AC-02)', () => {
    for (const def of Object.values(iconRegistry)) {
      expect(def.viewBox).toBe('0 0 16 16');
      expect(def.sw).toBe(1.6);
    }
  });

  it('marks fill-instead-of-stroke glyphs correctly', () => {
    expect(iconRegistry['circle-filled'].filled).toBe(true);
    expect(iconRegistry['dot'].filled).toBe(true);
    expect(iconRegistry['triangle-filled'].filled).toBe(true);
    expect(iconRegistry['moon'].filled).toBe(true);
    expect(iconRegistry['check'].filled).toBe(false);
  });
});

describe('iconAliases', () => {
  it('resolves every alternate name to a canonical registry entry (AC-04)', () => {
    for (const canonical of Object.values(iconAliases)) {
      expect(iconRegistry[canonical]).toBeDefined();
    }
    expect(iconAliases.warning).toBe('triangle-filled');
    expect(iconAliases.critical).toBe('circle-filled');
  });
});
