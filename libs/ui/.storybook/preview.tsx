import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

// Inject the applied theme layer (from @athena/design-tokens, pulled in via
// ui's styles.css) so every story authors against the same light/dark CSS
// custom properties (var(--bg), var(--text-1), …). Themes toggle via
// [data-theme] on <html>, which is what withThemeByDataAttribute drives from
// the toolbar. The theme vars are scoped to `:root[data-theme]`, so the
// attribute must sit on <html> — hence no `parentSelector` override here.
import '../src/styles.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    controls: { expanded: true },
    a11y: { test: 'error' },
    // The theme decorator paints the canvas from --bg, so disable Storybook's
    // own backgrounds addon to avoid it fighting the active theme.
    backgrounds: { disable: true },
  },
  decorators: [
    // Paint the canvas with the active theme's own tokens so contrast is
    // representative and currentColor-based icons inherit the right ink.
    (Story) => (
      <div
        style={{ background: 'var(--bg)', color: 'var(--text-1)', padding: 24, minHeight: '100vh' }}
      >
        <Story />
      </div>
    ),
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
