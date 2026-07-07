// GENERATED FILE — do not edit by hand.
// Source: specs/designs/athena-tokens.json (theme tier), renamed to the mockup's
// bare CSS variable names. Regenerate with: pnpm --filter @athena/design-tokens generate

export type ThemeName = 'light' | 'dark';

/**
 * Resolved theme token values keyed by their CSS variable name, for the rare
 * place a component needs a literal value instead of `var(--name)`.
 * Prefer {@link cssVar} so the active [data-theme] wins at runtime.
 */
export const themeColors = {
  light: {
    bg: '#e7eaee',
    card: '#ffffff',
    surface: '#ffffff',
    'surface-2': '#f6f7f9',
    'surface-3': '#eceff3',
    border: '#d8dde3',
    'border-strong': '#cfd5dd',
    'text-1': '#1a1f26',
    'text-2': '#4d5866',
    'text-3': '#7a8493',
    inverse: '#12161c',
    accent: '#0e7c86',
    'accent-2': '#0a626b',
    'accent-soft': '#e4f2f3',
    crit: '#c22f2f',
    'crit-fg': '#a8261f',
    'crit-tint': '#fbeceb',
    'crit-line': '#f0c9c6',
    adv: '#d98c1a',
    'adv-fg': '#9a6a08',
    'adv-tint': '#fbf3e0',
    'adv-line': '#edd2ab',
    info: '#4a90d9',
    'info-fg': '#2765a8',
    'info-tint': '#e9f1fb',
    'info-line': '#bcd3fb',
    stale: '#d1730c',
    'stale-fg': '#a25a08',
    'stale-tint': '#fbeeda',
    'stale-line': '#edd2ab',
    live: '#1f8a54',
    'live-fg': '#17724a',
    'live-tint': '#e6f4ec',
    'live-line': '#1f8a54',
    disc: '#9aa4b1',
    err: '#b98a86',
    'err-fg': '#a8261f',
    'err-tint': '#fbeceb',
  },
  dark: {
    bg: '#0d1116',
    card: '#161b22',
    surface: '#161b22',
    'surface-2': '#1c232c',
    'surface-3': '#222c31',
    border: '#2a323d',
    'border-strong': '#39434f',
    'text-1': '#e8ecf1',
    'text-2': '#a9b3bf',
    'text-3': '#7b8593',
    inverse: '#0d1116',
    accent: '#35b3bb',
    'accent-2': '#0e7c86',
    'accent-soft': 'rgba(14,124,134,0.18)',
    crit: '#e05a52',
    'crit-fg': '#e88a84',
    'crit-tint': 'rgba(224,90,82,0.15)',
    'crit-line': '#4a2a28',
    adv: '#e0a13a',
    'adv-fg': '#e0a13a',
    'adv-tint': 'rgba(216,140,26,0.15)',
    'adv-line': '#4a3a20',
    info: '#5a9fe0',
    'info-fg': '#7ab3e8',
    'info-tint': 'rgba(90,159,224,0.15)',
    'info-line': '#26406e',
    stale: '#e08a3a',
    'stale-fg': '#e79a4d',
    'stale-tint': 'rgba(224,138,58,0.16)',
    'stale-line': '#4a3a20',
    live: '#35b06f',
    'live-fg': '#4fc487',
    'live-tint': 'rgba(53,176,111,0.15)',
    'live-line': '#35b06f',
    disc: '#6b7684',
    err: '#8a6d6a',
    'err-fg': '#e88a84',
    'err-tint': 'rgba(224,90,82,0.15)',
  },
} as const;

/** Every CSS variable name the theme defines (e.g. 'bg' | 'text-1' | 'crit'). */
export type ThemeVar = keyof (typeof themeColors)['light'];

export const themeVars = Object.keys(themeColors.light) as ThemeVar[];

/** Reference a theme token as a CSS custom property: cssVar('text-1') -> 'var(--text-1)'. */
export function cssVar(name: ThemeVar): string {
  return `var(--${name})`;
}
