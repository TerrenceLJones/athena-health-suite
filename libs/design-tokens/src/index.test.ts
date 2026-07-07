import { describe, expect, it } from 'vitest';

describe('public API (src/index.ts)', () => {
  it('imports without throwing and exposes every token export', async () => {
    const mod = await import('./index');

    expect(mod.primitive.neutral).toBeDefined();
    expect(mod.severity.critical).toBeDefined();
    expect(mod.dataStatus.live).toBeDefined();
    expect(mod.theme.light).toBeDefined();
    expect(mod.typography.scale).toBeDefined();
    expect(mod.spacing.base).toBeDefined();
    expect(mod.radius.md).toBeDefined();
  });

  it('exposes the applied theme surface', async () => {
    const mod = await import('./index');

    expect(mod.themeColors.light['text-1']).toBe('#1a1f26');
    expect(mod.themeColors.dark.bg).toBe('#0d1116');
    expect(mod.themeVars).toContain('crit');
    expect(mod.cssVar('accent')).toBe('var(--accent)');
  });
});
