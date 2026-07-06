import { describe, expect, it } from 'vitest';
import { iconRegistry } from './icon-registry.js';

function outlineCommandCount(body: string): number {
  const d = body.match(/<path d="([^"]*)"/)?.[1] ?? '';
  return (d.match(/[MLHVZ]/g) ?? []).length;
}

describe('severity icon shapes (AC-03: grayscale test, automatable slice)', () => {
  it('sev-critical, sev-advisory, and sev-info are structurally distinct with hue removed', () => {
    const critical = iconRegistry['sev-critical'].body;
    const advisory = iconRegistry['sev-advisory'].body;
    const info = iconRegistry['sev-info'].body;

    // octagon (8 sides) vs. triangle (3 sides): more path commands in the outline
    expect(critical).toMatch(/^<path d="M[^"]*Z"\/>/);
    expect(advisory).toMatch(/^<path d="M[^"]*Z"\/>/);
    expect(outlineCommandCount(critical)).toBeGreaterThan(outlineCommandCount(advisory));

    // outlined circle: a <circle> element, not a <path>
    expect(info).toContain('<circle');

    // pairwise distinct markup — the never-color-alone invariant depends on shape, not color
    expect(new Set([critical, advisory, info]).size).toBe(3);
  });
});
