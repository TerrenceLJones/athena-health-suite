import './theme.css';
import './applied-theme.css';

export {
  primitive,
  severity,
  dataStatus,
  theme,
  typography,
  spacing,
  radius,
  type Severity,
  type DataStatus,
} from './tokens';

// Applied theme layer (mockup-named light/dark CSS vars) — components author
// against these bare var(--bg)/var(--text-1) names; toggle via [data-theme].
export { themeColors, themeVars, cssVar, type ThemeName, type ThemeVar } from './theme';
