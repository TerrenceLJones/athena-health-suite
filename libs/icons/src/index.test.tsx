import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Icon, iconRegistry, iconAliases, resolveIconName } from './index.js';

describe('public API (src/index.ts)', () => {
  it('imports without throwing and exposes every export end-to-end', () => {
    expect(iconRegistry.check).toBeDefined();
    expect(iconAliases.warning).toBe('triangle-filled');
    expect(resolveIconName('warning')).toBe('triangle-filled');

    const { container } = render(<Icon name="check" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
