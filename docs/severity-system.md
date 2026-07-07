# Severity System

The four clinical **severity tiers** and how to render one correctly. Every tier is a
bundle of four things that always ship together — a color, a shape, an icon, and a text
label — so that **severity is never conveyed by hue alone**. A clinician scanning in
grayscale, on a miscalibrated monitor, or with a color-vision deficiency must be able to
tell one tier from another by shape and text, with color removed entirely (the
_grayscale test_, called out in the "Athena UI Foundation" mockup).

Colors come from the [`@athena/design-tokens`](../libs/design-tokens) pipeline as CSS
custom properties (they re-theme automatically for light/dark via `[data-theme]`); icons
come from the [`@athena/icons`](../libs/icons) registry, rendered on web by
[`@athena/ui`](../libs/ui)'s `<Icon>` component. The source of truth for the pairing is
`specs/designs/athena-tokens.json`'s `severity` section — this doc cites it rather than
restating it.

## The four tiers

| Tier     | Color (CSS var) | Shape             | Icon                              | Label      |
| -------- | --------------- | ----------------- | --------------------------------- | ---------- |
| Critical | `--crit`        | octagon           | `<Icon name="sev-critical" />`    | `Critical` |
| Advisory | `--adv`         | triangle          | `<Icon name="sev-advisory" />`    | `Advisory` |
| Info     | `--info`        | circle (outlined) | `<Icon name="sev-info" />`        | `Info`     |
| Stale    | `--stale`       | square (dashed)   | `<Icon name="triangle-filled" />` | `Stale`    |

The shapes are deliberately distinct — octagon vs. triangle vs. outlined circle vs. dashed
square — so the tier survives the grayscale test. Critical and Advisory are `solid`, Info is
`outlined`, and Stale is `dashed`; each tier also exposes companion `-fg`, `-tint`, and
`-line` color variables (e.g. `--crit-fg`, `--crit-tint`, `--crit-line`) for foreground
text, fills, and borders.

## Rendering a tier

`<Icon>` inherits `currentColor`, so drive its color from the tier's CSS variable and
always keep the text label alongside it — the icon is never the only signal:

```tsx
import { Icon } from '@athena/ui';

<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--crit)' }}>
  <Icon name="sev-critical" />
  <span>Critical</span>
</span>;
```

## The grayscale test (before shipping any new indicator)

Desaturate the design (or view it on a grayscale-simulated display) and confirm the new
tier is still:

- [ ] distinguishable from every other tier by **shape** alone — never by hue;
- [ ] accompanied by a **text label**, not just an icon, so screen-reader and colorblind
      users get the same signal;
- [ ] defined as one token entry — color **and** shape **and** icon **and** label
      together in `athena-tokens.json`'s `severity` section — never a color applied ad hoc
      without its paired icon and label.

An indicator that only reads with color present does not ship. This pairing is enforced in
CI by [`libs/icons/src/severity-tokens.test.ts`](../libs/icons/src/severity-tokens.test.ts),
which asserts that every severity tier in `athena-tokens.json` resolves to a real `<Icon>`
name and carries a shape distinct from every other tier.

## See also

- [`docs/reference/athena-severity-status-system.md`](reference/athena-severity-status-system.md)
  — the canonical reference covering both severity **and** the six clinical `dataStatus`
  states, citing the design-source token names (`color-alert-critical`, …). This doc is the
  developer-facing quick reference for the severity tiers specifically, keyed on the runtime
  API (CSS variables and the `<Icon>` component); that one is the broader spec keyed on the
  token manifest's own names. Both are generated from the same `athena-tokens.json`
  `severity` section, so they cannot drift.
