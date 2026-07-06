import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { loadAthenaIconsApi } from '../scripts/generate-icons.mjs';
import { Icon } from './Icon.js';
import { iconRegistry } from './icon-registry.js';
import { resolveTestAsset } from './test-support/resolve-test-asset.js';

const canonicalScriptPath = resolveTestAsset(
  '../../../specs/designs/athena-icons.js',
  import.meta.url,
);
const api = loadAthenaIconsApi(canonicalScriptPath);

describe('Icon vs <ath-icon> parity (AC-01)', () => {
  it.each(Object.keys(iconRegistry))(
    'renders markup equivalent to the web component svg() for "%s"',
    (name) => {
      const rawMarkup = api.svg(name, 16, 1.6);
      const openingSvgTag = rawMarkup.match(/^<svg[^>]*>/)?.[0] ?? '';
      const rawAttrs = [...openingSvgTag.matchAll(/(\w[\w-]*)="([^"]*)"/g)].reduce<
        Record<string, string>
      >((attrs, [, key, value]) => ({ ...attrs, [key as string]: value as string }), {});

      const { container } = render(<Icon name={name as never} />);
      const svg = container.querySelector('svg')!;

      expect(svg.getAttribute('width')).toBe(rawAttrs['width']);
      expect(svg.getAttribute('height')).toBe(rawAttrs['height']);
      expect(svg.getAttribute('viewBox')).toBe(rawAttrs['viewBox']);
      expect(svg.getAttribute('fill')).toBe(rawAttrs['fill']);
      expect(svg.getAttribute('stroke')).toBe(rawAttrs['stroke']);
      expect(svg.getAttribute('stroke-width')).toBe(rawAttrs['stroke-width']);

      // Compare inner markup via DOM serialization on both sides (not raw
      // string equality) so attribute-order/quoting differences between the
      // hand-written source and React's renderer don't produce a false failure.
      const rawContainer = document.createElement('div');
      rawContainer.innerHTML = rawMarkup;
      expect(svg.innerHTML).toBe(rawContainer.querySelector('svg')!.innerHTML);
    },
  );
});
