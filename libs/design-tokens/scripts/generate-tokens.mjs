#!/usr/bin/env node
// Regenerates src/tokens.ts and src/theme.css from tokens.source.json.
// tokens.source.json (a copy of specs/designs/athena-tokens.json) is the
// single input — edit it, then re-run
// `pnpm --filter @athena/design-tokens generate`.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import prettier from 'prettier';

const GENERATED_HEADER_TS = `// GENERATED FILE — do not edit by hand.
// Source: tokens.source.json (a copy of specs/designs/athena-tokens.json).
// Regenerate with: pnpm --filter @athena/design-tokens generate
`;

const GENERATED_HEADER_CSS = `/*
 * GENERATED FILE — do not edit by hand.
 * Source: tokens.source.json (a copy of specs/designs/athena-tokens.json).
 * Regenerate with: pnpm --filter @athena/design-tokens generate
 */
`;

export function buildTokensModule(tokens) {
  return `${GENERATED_HEADER_TS}
export const primitive = ${JSON.stringify(tokens.primitive)} as const;

export type Severity = keyof typeof severity;
export const severity = ${JSON.stringify(tokens.severity)} as const;

export type DataStatus = keyof typeof dataStatus;
export const dataStatus = ${JSON.stringify(tokens.dataStatus)} as const;

export const theme = ${JSON.stringify(tokens.theme)} as const;

export const typography = ${JSON.stringify(tokens.typography)} as const;

export const spacing = ${JSON.stringify(tokens.spacing)} as const;

export const radius = ${JSON.stringify(tokens.radius)} as const;
`;
}

function cssBlock(selector, values) {
  const declarations = Object.entries(values)
    .map(([key, value]) => `  --ath-${key}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}

function themeAliasBlock(values) {
  return Object.keys(values)
    .map((key) => `  --color-${key}: var(--ath-${key});`)
    .join('\n');
}

export function buildThemeCss(tokens) {
  const radiusEntries = Object.entries(tokens.radius).map(
    ([name, px]) => `  --radius-ath-${name}: ${px === 999 ? '9999px' : `${px}px`};`,
  );

  return `${GENERATED_HEADER_CSS}
${cssBlock(':root[data-theme="light"]', tokens.theme.light)}

${cssBlock(':root[data-theme="dark"]', tokens.theme.dark)}

@theme inline {
${themeAliasBlock(tokens.theme.light)}
${radiusEntries.join('\n')}
}
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
  const tokens = JSON.parse(readFileSync(path.join(root, 'tokens.source.json'), 'utf8'));

  await writeFormatted(path.join(root, 'src/tokens.ts'), buildTokensModule(tokens));
  await writeFormatted(path.join(root, 'src/theme.css'), buildThemeCss(tokens));

  // eslint-disable-next-line no-console
  console.log('Generated tokens.ts and theme.css from tokens.source.json');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
