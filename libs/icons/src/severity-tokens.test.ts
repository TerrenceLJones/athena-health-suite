import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { iconRegistry } from './icon-registry';
import { resolveIconName, type AnyIconName } from './resolve-icon-name';
import { resolveTestAsset } from './test-support/resolve-test-asset';

// The severity contract is split across two design-source files: athena-tokens.json
// declares each tier's paired color+shape+icon+label; athena-icons.js provides the
// glyphs. This asserts they hang together — every severity icon the manifest names
// is a real registry glyph, and no two tiers share a shape (the never-color-alone
// invariant leans on shape, so a duplicate shape would silently defeat it).
const tokensPath = resolveTestAsset('../../../specs/designs/athena-tokens.json', import.meta.url);
const severity = JSON.parse(readFileSync(tokensPath, 'utf-8')).severity as Record<
  string,
  { icon: string; shape: string }
>;

describe('severity tokens ↔ icon registry (US-SH-006: grayscale test)', () => {
  it('declares exactly the four severity tiers (so the checks below cannot pass vacuously)', () => {
    expect(Object.keys(severity).sort()).toEqual(['advisory', 'critical', 'info', 'stale']);
  });

  it('every severity tier icon resolves to a real registry glyph', () => {
    for (const [tier, def] of Object.entries(severity)) {
      const resolved = resolveIconName(def.icon as AnyIconName);
      expect(
        iconRegistry[resolved],
        `severity.${tier}.icon "${def.icon}" is unknown`,
      ).toBeDefined();
    }
  });

  it('every severity tier has a shape distinct from every other tier', () => {
    const shapes = Object.values(severity).map((def) => def.shape);
    expect(new Set(shapes).size).toBe(shapes.length);
  });
});
