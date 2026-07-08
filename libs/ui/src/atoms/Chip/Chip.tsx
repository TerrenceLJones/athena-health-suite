import { Icon } from '../../foundations/Icon';
import type { IconName } from '@athena/icons';
import { Text } from '../Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  icon?: IconName;
}

export function Chip({ label, selected = false, removable = false, onRemove, icon }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2.75 py-1.5 leading-none whitespace-nowrap',
        selected ? 'bg-accent text-white' : 'bg-surface text-text-2 border-border-strong border',
      ].join(' ')}
    >
      {selected ? <Icon name="check" size={11} /> : icon ? <Icon name={icon} size={11} /> : null}
      <Text as="span" size="label">
        {label}
      </Text>
      {removable ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="ml-0.5 inline-flex cursor-pointer opacity-70"
        >
          <Icon name="x" size={11} />
        </button>
      ) : null}
    </span>
  );
}
