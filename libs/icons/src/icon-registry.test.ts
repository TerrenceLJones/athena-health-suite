import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { describe, expect, it } from 'vitest';
import { loadAthenaIconsApi, buildIconRegistryModule } from '../scripts/generate-icons.mjs';
import { iconRegistry, iconAliases } from './icon-registry.js';

// Under vitest's happy-dom environment, import.meta.url is rewritten
// relative to a fake http://localhost/@fs/<real-path> origin instead of a
// real file:// URL — the real absolute path survives after the "@fs" marker.
function resolveTestAsset(relativePath: string): string {
  const resolved = new URL(relativePath, import.meta.url);
  if (resolved.protocol === 'file:') {
    return fileURLToPath(resolved);
  }
  return decodeURIComponent(resolved.pathname.replace(/^\/@fs/, ''));
}

const canonicalScriptPath = resolveTestAsset('../../../specs/designs/athena-icons.js');
const generatedPath = resolveTestAsset('./icon-registry.ts');

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
