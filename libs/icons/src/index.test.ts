import { describe, expect, it } from 'vitest';
import { iconRegistry, iconAliases, resolveIconName } from './index';

describe('public API (src/index.ts)', () => {
  it('exposes the registry, alias table, and resolver as pure data', () => {
    expect(iconRegistry.check).toBeDefined();
    expect(iconAliases.warning).toBe('triangle-filled');
    expect(resolveIconName('warning')).toBe('triangle-filled');
  });
});
