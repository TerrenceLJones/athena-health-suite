# Athena Severity & Status System

Canonical reference for every clinical severity tier and data-status state in
Athena Health Suite, and the rule every one of them is built to satisfy:
**severity and data status are never conveyed by color alone.** A clinician
scanning a chart in grayscale, on a miscalibrated monitor, or with a color
vision deficiency must be able to tell a critical alert from an advisory one
from shape and text alone.

Source of truth: [`specs/designs/athena-tokens.json`](../../specs/designs/athena-tokens.json)
(`severity` and `dataStatus` sections) and
[`specs/designs/athena-icons.js`](../../specs/designs/athena-icons.js), piped
through [`@athena/design-tokens`](../../libs/design-tokens) and
[`@athena/icons`](../../libs/icons). This doc does not restate values by
hand — it cites them so a future epic or story has one place to point to
instead of re-deriving the combination.

## Severity tiers

| Tier | Token | Color | Icon | Shape | Treatment |
|---|---|---|---|---|---|
| Critical | `color-alert-critical` | `#c22f2f` | `sev-critical` | octagon | solid |
| Advisory | `color-alert-advisory` | `#d98c1a` | `sev-advisory` | triangle | solid |
| Info | `color-alert-info` | `#4a90d9` | `sev-info` | circle (outlined) | outlined |
| Stale | `color-status-stale` | `#d1730c` | `triangle-filled` | square | dashed |

## Data status states

| State | Token | Color | Icon | Label pattern |
|---|---|---|---|---|
| Preliminary | `color-status-preliminary` | `#4a90d9` | `dot` | "Unconfirmed" |
| Final | `color-status-final` | `#1a1f26` | *(none — expected state, no badge)* | — |
| Live | `color-status-live` | `#1f8a54` | `dot-pulse` | "Live" |
| Stale | `color-status-stale` | `#d1730c` | `triangle-filled` | "Last updated {time}" |
| Disconnected | `color-status-disconnected` | `#9aa4b1` | `dot` | "No signal" |
| Error | `color-status-error` | `#b98a86` | `strikethrough` | "Entered in error" |

## The grayscale test (required before shipping any new indicator)

Before a new severity tier or data-status state ships, desaturate the design
(or view it on a grayscale-simulated display) and confirm:

- [ ] It is still visually distinguishable from every other tier/state by
      **shape** alone (e.g. octagon vs. triangle vs. outlined circle vs.
      dashed square) — never by hue.
- [ ] It carries a **text label**, not just an icon, so screen readers and
      colorblind users get the same signal sighted users with full color
      vision get.
- [ ] Its icon + shape + label + color are defined together as one token
      entry (see `@athena/design-tokens`'s `severity`/`dataStatus` exports) —
      never a color applied ad hoc without its paired icon and label.

A new indicator that only passes with color present does not ship.

## Citing this doc

Any future epic or story introducing a new clinical severity tier or data
status state should cite this doc rather than re-deriving the
color+shape+icon+label combination independently. If the new indicator
doesn't fit an existing tier/state above, it belongs in
`specs/designs/athena-tokens.json`'s `severity`/`dataStatus` sections first —
this doc is generated from that manifest's shape, not the other way around.
