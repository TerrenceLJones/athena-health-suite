import { iconAliases, type IconName, type AliasName } from './icon-registry';

export type AnyIconName = IconName | AliasName;

export function resolveIconName(name: AnyIconName): IconName {
  return (iconAliases as Record<string, IconName>)[name] ?? (name as IconName);
}
