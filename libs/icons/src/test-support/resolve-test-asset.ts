import { fileURLToPath } from 'node:url';

// Under vitest's happy-dom environment, import.meta.url is rewritten
// relative to a fake http://localhost/@fs/<real-path> origin instead of a
// real file:// URL — the real absolute path survives after the "@fs" marker.
export function resolveTestAsset(relativePath: string, moduleUrl: string): string {
  const resolved = new URL(relativePath, moduleUrl);
  if (resolved.protocol === 'file:') {
    return fileURLToPath(resolved);
  }
  return decodeURIComponent(resolved.pathname.replace(/^\/@fs/, ''));
}
