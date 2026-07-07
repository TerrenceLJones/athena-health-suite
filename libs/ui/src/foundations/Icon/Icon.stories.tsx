import type { Meta, StoryObj } from '@storybook/react-vite';
import { iconRegistry, iconAliases, type AnyIconName, type IconName } from '@athena/icons';
import { themeColors, type ThemeName } from '@athena/design-tokens';
import { Icon } from './Icon';

// Every canonical glyph, straight from the generated registry — the gallery
// can never drift from athena-icons.js because it iterates the source of truth.
const ICON_NAMES = Object.keys(iconRegistry) as IconName[];
const ALIAS_NAMES = Object.keys(iconAliases) as AnyIconName[];

// The three demo sizes: registry default (16), and two common up-scales.
const SIZES = [16, 24, 32] as const;

const meta = {
  title: 'Foundations/Icon',
  component: Icon,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Named glyphs from `@athena/icons`, rendered on a 16×16 viewBox with a ' +
          'shared 1.6 stroke-width and `currentColor` so they inherit their ' +
          "context's text color in either theme. Accepts canonical names and " +
          'ALIAS-table entries (e.g. `warning` → `triangle-filled`).',
      },
    },
  },
  argTypes: {
    name: {
      control: 'select',
      options: [...ICON_NAMES, ...ALIAS_NAMES],
      description: 'Canonical icon name or a registered alias.',
    },
    size: { control: { type: 'number', min: 8, max: 96, step: 1 } },
    stroke: { control: { type: 'number', min: 0.5, max: 4, step: 0.1 } },
    color: { control: 'color' },
  },
  args: { name: 'check', size: 32 },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Single icon with live controls for name / size / stroke / color. */
export const Playground: Story = {};

// ---- gallery building blocks ------------------------------------------------

function IconCell({ name }: { name: IconName }) {
  return (
    <figure
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        margin: 0,
        padding: '16px 8px',
        borderRadius: 10,
        border: '1px solid var(--border, #d8dde3)',
        background: 'var(--surface, transparent)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, minHeight: 32 }}>
        {SIZES.map((size) => (
          <Icon key={size} name={name} size={size} />
        ))}
      </div>
      <figcaption
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 11,
          opacity: 0.72,
          textAlign: 'center',
        }}
      >
        {name}
      </figcaption>
    </figure>
  );
}

function Grid({ names }: { names: IconName[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
        gap: 12,
      }}
    >
      {names.map((name) => (
        <IconCell key={name} name={name} />
      ))}
    </div>
  );
}

/**
 * Every icon in the registry, each shown at all three sizes (16 / 24 / 32).
 * Flip the toolbar theme to see the whole set react in light vs. dark — icons
 * inherit `currentColor`, so no per-icon theme wiring is needed.
 */
export const Gallery: Story = {
  render: () => <Grid names={ICON_NAMES} />,
};

// Render the full gallery on a hard-coded theme surface, using the theme's own
// resolved tokens, so both themes can sit side by side regardless of the
// [data-theme] toolbar selection.
function ThemePanel({ theme }: { theme: ThemeName }) {
  const c = themeColors[theme];
  return (
    <section
      data-theme={theme}
      style={{
        flex: 1,
        minWidth: 0,
        background: c.bg,
        color: c['text-1'],
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3
        style={{ margin: '0 0 16px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 }}
      >
        {theme}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 12,
        }}
      >
        {ICON_NAMES.map((name) => (
          <figure
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              margin: 0,
              padding: '14px 8px',
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              background: c.surface,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minHeight: 32 }}>
              {SIZES.map((size) => (
                <Icon key={size} name={name} size={size} />
              ))}
            </div>
            <figcaption
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: c['text-2'] }}
            >
              {name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Every icon at all three sizes, in light and dark simultaneously. */
export const BothThemes: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start' }}>
      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </div>
  ),
};

/**
 * The ALIAS table rendered next to what it resolves to — proof that alternate
 * names (`warning`, `patients`, `settings`, …) draw the same glyph as their
 * canonical key.
 */
export const Aliases: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
      }}
    >
      {ALIAS_NAMES.map((alias) => (
        <div
          key={alias}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid var(--border, #d8dde3)',
          }}
        >
          <Icon name={alias} size={24} />
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.5 }}>
            <div>{alias}</div>
            <div style={{ opacity: 0.6 }}>→ {iconAliases[alias as keyof typeof iconAliases]}</div>
          </div>
        </div>
      ))}
    </div>
  ),
};
