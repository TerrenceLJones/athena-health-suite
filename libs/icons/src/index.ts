// Framework-agnostic icon registry — pure data (glyph definitions, alias table,
// name types, resolver). No React/DOM: web renders via @athena/ui's <Icon>,
// native surfaces via their own react-native-svg renderer, both off this data.
export { resolveIconName, type AnyIconName } from './resolve-icon-name';
export {
  iconRegistry,
  iconAliases,
  type IconName,
  type AliasName,
  type IconDefinition,
} from './icon-registry';
