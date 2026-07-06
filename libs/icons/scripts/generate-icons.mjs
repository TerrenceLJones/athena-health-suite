#!/usr/bin/env node
// Regenerates src/icon-registry.ts from specs/designs/athena-icons.js.
// Unlike design-tokens (which has a plain JSON design source to copy),
// athena-icons.js is the only source — it's a UMD module that defines a
// <ath-icon> custom element and unconditionally touches HTMLElement at
// load time, so it can only be evaluated with a DOM present. This script
// evaluates it once, inside a minimal vm sandbox, purely to read off its
// ICONS/ALIAS tables and generate a plain, dependency-free TS module —
// the shipped library never runs vm or needs a DOM to read icon data.
//
// Regenerate with: pnpm --filter @athena/icons generate

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import prettier from 'prettier';

const GENERATED_HEADER = `// GENERATED FILE — do not edit by hand.
// Source: specs/designs/athena-icons.js.
// Regenerate with: pnpm --filter @athena/icons generate
`;

class ShimHTMLElement {}

/**
 * @typedef {object} AthenaIconsApi
 * @property {Record<string, string>} ICONS
 * @property {string[]} names
 * @property {Record<string, string>} aliases
 * @property {(name?: string | null, size?: string | number | null, stroke?: string | number | null) => string} svg
 * @property {(name: string) => string} resolve
 */

/** @returns {AthenaIconsApi} */
export function loadAthenaIconsApi(scriptPath) {
  const source = readFileSync(scriptPath, 'utf-8');
  /** @type {{ exports: Partial<AthenaIconsApi> }} */
  const sandboxModule = { exports: {} };
  const sandbox = {
    module: sandboxModule,
    exports: sandboxModule.exports,
    HTMLElement: ShimHTMLElement,
    customElements: { get: () => undefined, define: () => undefined },
    window: undefined,
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: scriptPath });

  return sandboxModule.exports;
}

export function buildIconRegistryModule(api) {
  const names = api.names;
  const nameUnion = names.map((name) => `  | '${name}'`).join('\n');
  const aliasNames = Object.keys(api.aliases);
  const aliasUnion = aliasNames.length
    ? aliasNames.map((name) => `  | '${name}'`).join('\n')
    : '  | never';

  const entries = names
    .map((name) => {
      // FILLED isn't in athena-icons.js's public `api` export (only ICONS,
      // names, aliases, svg, resolve are) — derive it from svg()'s own
      // output instead of re-typing a second fill/stroke list by hand.
      const filled = api.svg(name).includes('fill="currentColor"');
      return `  '${name}': { viewBox: '0 0 16 16', sw: 1.6, filled: ${filled}, body: ${JSON.stringify(api.ICONS[name])} },`;
    })
    .join('\n');

  const aliasEntries = aliasNames.map((name) => `  '${name}': '${api.aliases[name]}',`).join('\n');

  return `${GENERATED_HEADER}
export interface IconDefinition {
  viewBox: string;
  sw: number;
  filled: boolean;
  body: string;
}

export type IconName =
${nameUnion};

export type AliasName =
${aliasUnion};

export const iconRegistry: Record<IconName, IconDefinition> = {
${entries}
};

export const iconAliases: Record<AliasName, IconName> = {
${aliasEntries}
};
`;
}

async function writeFormatted(filePath, contents) {
  const config = (await prettier.resolveConfig(filePath)) ?? {};
  const formatted = await prettier.format(contents, { ...config, filepath: filePath });
  writeFileSync(filePath, formatted);
}

async function main() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.join(dir, '..');
  const scriptPath = path.join(root, '../../specs/designs/athena-icons.js');

  const api = loadAthenaIconsApi(scriptPath);
  await writeFormatted(path.join(root, 'src/icon-registry.ts'), buildIconRegistryModule(api));

  // eslint-disable-next-line no-console
  console.log(`Generated icon-registry.ts with ${api.names.length} icons from athena-icons.js`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
