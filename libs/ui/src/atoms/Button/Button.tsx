import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../../foundations/Icon';
import type { IconName } from '@athena/icons';
import { useDisabledGuard } from '../../utils/useDisabledGuard';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';
/** Overrides a `primary`/`secondary` button's color to match a status/alert tone instead of the default accent look. */
export type ButtonTone = 'accent' | 'positive' | 'negative' | 'warning' | 'critical' | 'neutral';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white',
  secondary: 'bg-surface text-text-1 border border-border-strong',
  ghost: 'bg-transparent text-accent-2',
  danger: 'bg-surface text-crit border border-border-strong',
  // No box at all — see the `isLink` branching below, which also skips SIZE_CLASSES' padding and
  // font-semibold/rounded-lg so this renders as plain inline text, not a shrunken box variant.
  link: 'bg-transparent text-accent-2',
};

const SOLID_TONE_CLASSES: Record<ButtonTone, string> = {
  accent: 'bg-accent',
  positive: 'bg-live',
  negative: 'bg-crit',
  warning: 'bg-adv',
  critical: 'bg-crit',
  neutral: 'bg-text-3',
};

const BORDERED_TONE_TEXT_CLASSES: Record<ButtonTone, string> = {
  accent: 'text-accent-2',
  positive: 'text-live',
  negative: 'text-crit',
  warning: 'text-adv',
  critical: 'text-crit',
  neutral: 'text-text-2',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-[13px]',
  lg: 'px-4.5 py-3 text-sm',
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 13, md: 14, lg: 15 };

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  label?: string;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  tone,
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  label,
  children,
  disabled,
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const isDisabled = !!disabled;
  // `link` renders as bare inline text (no padding/border/background) rather than a box, so its
  // disabled/enabled looks skip the box-only classes (background, border) the other variants use.
  const isLink = variant === 'link';
  let look: string;
  if (isDisabled) {
    look = isLink
      ? 'text-text-3 cursor-not-allowed'
      : 'bg-surface-2 text-text-3 cursor-not-allowed';
  } else if (isLink) {
    look = VARIANT_CLASSES.link;
  } else if (tone && variant === 'primary') {
    look = `${SOLID_TONE_CLASSES[tone]} text-white`;
  } else if (tone && variant === 'secondary') {
    look = `bg-surface border border-border-strong ${BORDERED_TONE_TEXT_CLASSES[tone]}`;
  } else {
    look = VARIANT_CLASSES[variant];
  }

  const guard = useDisabledGuard(isDisabled || loading, onClick);

  return (
    <button
      type="button"
      aria-disabled={guard['aria-disabled']}
      aria-busy={loading}
      onClick={guard.onClick}
      className={[
        'font-sans leading-none',
        isLink ? 'font-medium text-[12.5px]' : 'font-semibold rounded-lg',
        fullWidth ? 'flex w-full' : 'inline-flex',
        'items-center justify-center gap-1.5 whitespace-nowrap',
        !isDisabled && !loading && 'cursor-pointer',
        loading && 'cursor-not-allowed opacity-80',
        isLink ? 'p-0 border-none' : SIZE_CLASSES[size],
        look,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Icon name="spinner" size={ICON_SIZE[size]} className="animate-spin" />
      ) : icon ? (
        <Icon name={icon} size={ICON_SIZE[size]} />
      ) : null}
      <span>{children ?? label ?? 'Button'}</span>
    </button>
  );
}
