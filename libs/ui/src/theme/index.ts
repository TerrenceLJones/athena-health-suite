// Applied theme layer for @athena/ui.
//
// Importing this module (transitively, via the package root) injects the
// light/dark CSS custom properties so components can author against bare
// var(--bg) / var(--text-1) / var(--crit) etc. Toggle themes by setting
// data-theme="light" | "dark" on a root element (e.g. <html>).
import './theme.css';

export { themeColors, themeVars, cssVar, type ThemeName, type ThemeVar } from './theme.js';
