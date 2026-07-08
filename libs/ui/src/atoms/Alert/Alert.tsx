import type { ReactNode } from 'react';
import { Icon } from '../../foundations/Icon';
import type { IconName } from '@athena/icons';
import { Button, type ButtonTone } from '../Button';
import { Text } from '../Text';

export type AlertTone = 'info' | 'positive' | 'warning' | 'negative' | 'critical' | 'neutral';

interface ToneDef {
  fgClass: string;
  weakBgClass: string;
  buttonTone: ButtonTone;
  icon: IconName;
}

const TONE: Record<AlertTone, ToneDef> = {
  info: {
    fgClass: 'text-accent-2',
    weakBgClass: 'bg-accent-soft',
    buttonTone: 'accent',
    icon: 'info',
  },
  positive: {
    fgClass: 'text-live',
    weakBgClass: 'bg-live-tint',
    buttonTone: 'positive',
    icon: 'check',
  },
  warning: {
    fgClass: 'text-adv',
    weakBgClass: 'bg-adv-tint',
    buttonTone: 'warning',
    icon: 'sev-advisory',
  },
  negative: {
    fgClass: 'text-crit',
    weakBgClass: 'bg-crit-tint',
    buttonTone: 'negative',
    icon: 'x-circle',
  },
  critical: {
    fgClass: 'text-crit',
    weakBgClass: 'bg-crit-tint',
    buttonTone: 'critical',
    icon: 'sev-critical',
  },
  neutral: {
    fgClass: 'text-text-2',
    weakBgClass: 'bg-surface-3',
    buttonTone: 'neutral',
    icon: 'info',
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title: string;
  message?: ReactNode;
  action?: string;
  onAction?: () => void;
  icon?: IconName;
}

export function Alert({ tone = 'info', title, message, action, onAction, icon }: AlertProps) {
  const def = TONE[tone];

  return (
    <div className="border-border flex items-center gap-3 rounded-lg border p-3.5 font-sans">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <span className={`${def.fgClass} mt-0.5 flex-shrink-0`}>
          <Icon name={icon ?? def.icon} size={16} />
        </span>
        <div>
          <Text size="label" weight="semibold" tone="default">
            {title}
          </Text>
          {message ? (
            <Text size="label" weight="regular" tone="muted">
              {message}
            </Text>
          ) : null}
        </div>
      </div>
      {action ? (
        <Button
          variant="primary"
          tone={def.buttonTone}
          size="sm"
          onClick={onAction}
          className="flex-shrink-0"
        >
          {action}
        </Button>
      ) : null}
    </div>
  );
}
