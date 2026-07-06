import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon.js';
import { resolveIconName, type AnyIconName } from './resolve-icon-name.js';
import { iconRegistry } from './icon-registry.js';

describe('Icon', () => {
  it('renders the named icon with its registry viewBox and default stroke-width', () => {
    const { container } = render(<Icon name="check" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', iconRegistry.check.viewBox);
    expect(svg).toHaveAttribute('stroke-width', String(iconRegistry.check.sw));
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('renders a filled icon with fill=currentColor and stroke=none', () => {
    const { container } = render(<Icon name="circle-filled" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveAttribute('stroke', 'none');
  });

  it('applies a custom size, stroke, and color', () => {
    const { container } = render(<Icon name="clock" size={24} stroke={2.4} color="red" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('stroke-width', '2.4');
    expect(svg).toHaveStyle({ color: 'red' });
  });

  it('applies a className to the rendered svg', () => {
    const { container } = render(<Icon name="check" className="my-icon" />);
    expect(container.querySelector('svg')).toHaveClass('my-icon');
  });

  it('resolves alias names to their canonical icon (AC-04)', () => {
    expect(resolveIconName('warning')).toBe('triangle-filled');
    expect(resolveIconName('check')).toBe('check');

    const { container: aliasContainer } = render(<Icon name="warning" />);
    const { container: canonicalContainer } = render(<Icon name="triangle-filled" />);

    expect(aliasContainer.querySelector('svg')?.innerHTML).toBe(
      canonicalContainer.querySelector('svg')?.innerHTML,
    );
  });

  it('is hidden from the accessibility tree (decorative by default)', () => {
    const { container } = render(<Icon name="lock" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders nothing and logs an error for an unknown icon name', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<Icon name={'not-a-real-icon' as AnyIconName} />);

    expect(container.querySelector('svg')).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('not-a-real-icon'));

    consoleError.mockRestore();
  });
});
