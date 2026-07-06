import { describe, expect, it } from 'vitest';

describe('public API (src/index.ts)', () => {
  it('imports without throwing and exposes every token export', async () => {
    const mod = await import('./index.js');

    expect(mod.primitive.neutral).toBeDefined();
    expect(mod.severity.critical).toBeDefined();
    expect(mod.dataStatus.live).toBeDefined();
    expect(mod.theme.light).toBeDefined();
    expect(mod.typography.scale).toBeDefined();
    expect(mod.spacing.base).toBeDefined();
    expect(mod.radius.md).toBeDefined();
  });
});
