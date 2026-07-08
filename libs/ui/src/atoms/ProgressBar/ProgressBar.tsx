export type ProgressTone = 'accent' | 'positive' | 'warning' | 'negative' | 'critical';

const TONE_CLASSES: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  positive: 'bg-live',
  warning: 'bg-adv',
  negative: 'bg-crit',
  critical: 'bg-crit',
};

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  height?: number;
  label: string;
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'accent',
  height = 9,
  label,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="bg-surface-2 w-full overflow-hidden rounded-full"
      style={{ height }}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${TONE_CLASSES[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
