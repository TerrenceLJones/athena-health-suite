import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { iconRegistry } from '@athena/icons';
import { Icon } from './Icon';

// Load the canonical <ath-icon> web component from the design source and read
// off its svg() output, to prove this React <Icon> renders identical markup.
// athena-icons.js touches HTMLElement at load, so evaluate it in a vm sandbox
// with a minimal DOM shim.
function loadAthenaIconsApi() {
  const scriptPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../../../specs/designs/athena-icons.js',
  );
  const source = readFileSync(scriptPath, 'utf-8');
  const sandboxModule = {
    exports: {} as { svg: (name: string, size: number, stroke: number) => string },
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

const api = loadAthenaIconsApi();

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
