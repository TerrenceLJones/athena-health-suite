import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { iconRegistry, iconAliases, resolveIconName, type IconName } from './index';

// Read the ALIAS table straight from the design source rather than trusting the
// generated copy — this test proves the *source of truth* resolves cleanly, so
// a new alias pointing at a typo'd/removed glyph fails here immediately.
// athena-icons.js is a UMD module that touches HTMLElement at load, so it can
// only be evaluated with a minimal DOM shim inside a vm sandbox.
function loadAthenaIconsSource() {
  const scriptPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../specs/designs/athena-icons.js',
  );
  const source = readFileSync(scriptPath, 'utf-8');
  const sandboxModule = {
    exports: {} as { ICONS: Record<string, string>; aliases: Record<string, string> },
  };
  const sandbox = {
    module: sandboxModule,
    exports: sandboxModule.exports,
    HTMLElement: class {},
    customElements: { get: () => undefined, define: () => undefined },
    window: undefined,
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: scriptPath });
  return sandboxModule.exports;
}

const source = loadAthenaIconsSource();
const sourceAliasNames = Object.keys(source.aliases);

describe('athena-icons.js ALIAS table', () => {
  it('has aliases to test (guards against an empty/failed source load)', () => {
    expect(sourceAliasNames.length).toBeGreaterThan(0);
  });

  it('exposes exactly the source ALIAS entries through @athena/icons (no drift)', () => {
    expect(new Set(Object.keys(iconAliases))).toEqual(new Set(sourceAliasNames));
    for (const alias of sourceAliasNames) {
      expect(iconAliases[alias as keyof typeof iconAliases]).toBe(source.aliases[alias]);
    }
  });

  it.each(sourceAliasNames)('resolves alias "%s" to a real icon key', (alias) => {
    const canonical = resolveIconName(alias as IconName);
    // The alias must point at a canonical glyph that actually exists in the
    // registry — the same shape the source's own ICONS table draws.
    expect(source.ICONS).toHaveProperty(canonical);
    expect(iconRegistry).toHaveProperty(canonical);
    expect(iconRegistry[canonical as IconName].body.length).toBeGreaterThan(0);
  });
});
