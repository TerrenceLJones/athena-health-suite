import { describe, expect, it } from 'vitest';

describe('public API (src/index.ts)', () => {
  it('re-exports the applied theme surface', async () => {
    const mod = await import('./index.js');

    expect(mod.themeColors.light['text-1']).toBe('#1a1f26');
    expect(mod.themeColors.dark.bg).toBe('#0d1116');
    expect(mod.themeVars).toContain('crit');
    expect(mod.cssVar('accent')).toBe('var(--accent)');
  });
});
