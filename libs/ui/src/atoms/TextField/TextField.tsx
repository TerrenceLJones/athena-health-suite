import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Text } from '../Text';

export type FieldState = 'default' | 'focus' | 'error' | 'disabled';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  state?: FieldState;
  help?: string;
  error?: string;
  prefix?: string;
  suffix?: ReactNode;
}

export function TextField({
  label,
  state = 'default',
  help,
  error,
  prefix,
  suffix,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = `${inputId}-help`;
  const isError = state === 'error';
  const isDisabled = state === 'disabled' || rest.disabled;

  const boxClasses = [
    'flex items-center gap-1.5 rounded-lg border px-2.75 py-2.25 text-[13px] font-sans',
    isDisabled
      ? 'bg-surface-3 border-border-strong opacity-60'
      : isError
        ? 'bg-surface border-crit'
        : 'bg-surface border-border-strong',
    state === 'focus' && !isError ? 'border-accent ring-3 ring-accent-soft' : '',
    !isDisabled && !isError
      ? 'focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-soft'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      {label ? (
        <Text as="label" size="label" tone="muted" htmlFor={inputId} className="mb-1.5 block">
          {label}
        </Text>
      ) : null}
      <div className={boxClasses}>
        {prefix ? (
          <Text as="span" size="body" tone="faint" className="flex-shrink-0">
            {prefix}
          </Text>
        ) : null}
        <input
          id={inputId}
          disabled={isDisabled}
          aria-invalid={isError}
          aria-describedby={isError && error ? helpId : help ? helpId : undefined}
          className={['text-text-1 w-full flex-1 bg-transparent outline-none', className]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {suffix ? (
          typeof suffix === 'string' ? (
            <Text as="span" size="mono" tone="faint" className="flex-shrink-0">
              {suffix}
            </Text>
          ) : (
            <span className="flex-shrink-0">{suffix}</span>
          )
        ) : null}
      </div>
      {isError && error ? (
        <Text as="div" id={helpId} role="alert" size="label" tone="negative" className="mt-1.5">
          {error}
        </Text>
      ) : help ? (
        <Text as="div" id={helpId} size="label" weight="regular" tone="faint" className="mt-1.5">
          {help}
        </Text>
      ) : null}
    </div>
  );
}
