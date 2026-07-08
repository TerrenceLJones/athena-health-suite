// @athena/ui public entry. Importing the package injects the shared theme
// (see styles.css → @athena/design-tokens) plus the Tailwind utility layer the
// atoms are styled with. The theme lives in @athena/design-tokens and the icon
// registry data in @athena/icons; ui owns the React components that render them.
import './styles.css';

export { Icon, type IconProps } from './foundations/Icon';

// Atoms — the 11 Clearline-sourced UI primitives, ported wholesale and re-themed
// to Athena's own tokens/icons (EPIC-AP-000 / US-AP-012).
export { Text } from './atoms/Text';
export type { TextProps, TextSize, TextWeight, TextTone, TextElement } from './atoms/Text';
export { Button } from './atoms/Button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonTone } from './atoms/Button';
export { TextField } from './atoms/TextField';
export type { TextFieldProps, FieldState } from './atoms/TextField';
export { PasswordField } from './atoms/PasswordField';
export type { PasswordFieldProps } from './atoms/PasswordField';
export { Alert } from './atoms/Alert';
export type { AlertProps, AlertTone } from './atoms/Alert';
export { SegmentedControl } from './atoms/SegmentedControl';
export type { SegmentedControlProps } from './atoms/SegmentedControl';
export { Avatar } from './atoms/Avatar';
export type { AvatarProps, AvatarTone } from './atoms/Avatar';
export { Chip } from './atoms/Chip';
export type { ChipProps } from './atoms/Chip';
export { ProgressBar } from './atoms/ProgressBar';
export type { ProgressBarProps, ProgressTone } from './atoms/ProgressBar';
export { Checkbox } from './atoms/Checkbox';
export type { CheckboxProps } from './atoms/Checkbox';
export { Container } from './atoms/Container';
export type { ContainerProps, ContainerWidth } from './atoms/Container';
