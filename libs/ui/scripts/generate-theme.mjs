#!/usr/bin/env node
// Regenerates src/theme/theme.css and src/theme/theme.ts from the design-token
// manifest at specs/designs/athena-tokens.json — the single source of truth.
//
// design-tokens (@athena/design-tokens) mirrors that same manifest as the raw,
// tier-named token tree (primitive / severity / theme.text-muted / ...). This
// layer is the *applied* theme @athena/ui components author against: it renames
// the manifest's `theme` keys to the mockup's bare CSS variable names
// (--bg / --card / --text-1..3 / --accent / --crit / --adv / --info / --stale /
// --live / --disc / ...) and emits them under [data-theme="light"|"dark"].
//
// Edit the manifest, then re-run: pnpm --filter @athena/ui generate

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import prettier from 'prettier';

// Manifest key -> mockup CSS variable name. Any key not listed passes through
// unchanged (bg, card, surface-2, crit, crit-fg, accent-soft, disc, err, ...).
const RENAME = {
  text: 'text-1',
  'text-muted': 'text-2',
  'text-subtle': 'text-3',
  'accent-strong': 'accent-2',
};

const GENERATED_HEADER_TS = `// GENERATED FILE — do not edit by hand.
// Source: specs/designs/athena-tokens.json (theme tier), renamed to the mockup's
// bare CSS variable names. Regenerate with: pnpm --filter @athena/ui generate
`;

const GENERATED_HEADER_CSS = `/*
 * GENERATED FILE — do not edit by hand.
 * Source: specs/designs/athena-tokens.json (theme tier), renamed to the mockup's
 * bare CSS variable names. Regenerate with: pnpm --filter @athena/ui generate
 */
`;

/** Rename a theme side ({ text, text-muted, ... }) to mockup var names. */
export function toThemeVars(themeSide) {
  const out = {};
  for (const [key, value] of Object.entries(themeSide)) {
    out[RENAME[key] ?? key] = value;
  }
  return out;
}

function cssBlock(selector, values) {
  const declarations = Object.entries(values)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}

export function buildThemeCss(tokens) {
  return `${GENERATED_HEADER_CSS}
${cssBlock(':root[data-theme="light"]', toThemeVars(tokens.theme.light))}

${cssBlock(':root[data-theme="dark"]', toThemeVars(tokens.theme.dark))}
`;
}

export function buildThemeModule(tokens) {
  const light = toThemeVars(tokens.theme.light);
  const dark = toThemeVars(tokens.theme.dark);

  return `${GENERATED_HEADER_TS}
export type ThemeName = 'light' | 'dark';

/**
 * Resolved theme token values keyed by their CSS variable name, for the rare
 * place a component needs a literal value instead of \`var(--name)\`.
 * Prefer {@link cssVar} so the active [data-theme] wins at runtime.
 */
export const themeColors = {
  light: ${JSON.stringify(light)},
  dark: ${JSON.stringify(dark)},
} as const;

/** Every CSS variable name the theme defines (e.g. 'bg' | 'text-1' | 'crit'). */
export type ThemeVar = keyof (typeof themeColors)['light'];

export const themeVars = Object.keys(themeColors.light) as ThemeVar[];

/** Reference a theme token as a CSS custom property: cssVar('text-1') -> 'var(--text-1)'. */
export function cssVar(name: ThemeVar): string {
  return \`var(--\${name})\`;
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
  const manifestPath = path.join(root, '../../specs/designs/athena-tokens.json');
  const tokens = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const themeDir = path.join(root, 'src/theme');
  mkdirSync(themeDir, { recursive: true });

  await writeFormatted(path.join(themeDir, 'theme.ts'), buildThemeModule(tokens));
  await writeFormatted(path.join(themeDir, 'theme.css'), buildThemeCss(tokens));

  // eslint-disable-next-line no-console
  console.log('Generated src/theme/theme.ts and src/theme/theme.css from athena-tokens.json');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
