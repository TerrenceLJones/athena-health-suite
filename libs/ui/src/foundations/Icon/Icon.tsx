import type { CSSProperties } from 'react';
import { iconRegistry, resolveIconName, type AnyIconName } from '@athena/icons';

export interface IconProps {
  name: AnyIconName;
  /** Pixel size for both width and height. @default 16 */
  size?: number;
  /** Overrides the icon definition's canonical stroke-width (1.6). */
  stroke?: number;
  /** CSS color; defaults to `currentColor` via inherited text color. */
  color?: string;
  className?: string;
}

/**
 * Web renderer for the framework-agnostic @athena/icons registry. Accepts both
 * canonical names and ALIAS table entries (e.g. `"warning"` resolves to
 * `"triangle-filled"`) so it stays interchangeable with the `<ath-icon>` web
 * component, which resolves names the same way. Renders DOM `<svg>`; native
 * (React Native) surfaces consume the same registry through their own renderer.
 */
export function Icon({ name, size = 16, stroke, color, className }: IconProps) {
  const def = iconRegistry[resolveIconName(name)];
  const style: CSSProperties = { display: 'block', flexShrink: 0, color };

  if (!def) {
    if (import.meta.env.DEV) {
      console.error(`Icon: no definition found for name "${name}"`);
    }
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={def.viewBox}
      fill={def.filled ? 'currentColor' : 'none'}
      stroke={def.filled ? 'none' : 'currentColor'}
      strokeWidth={stroke ?? def.sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      role="img"
      aria-hidden="true"
      // glyph bodies come from the generated icon registry, never user input
      dangerouslySetInnerHTML={{ __html: def.body }}
    />
  );
}
