import { describe, expect, it } from 'vitest';

describe('public API (src/index.ts)', () => {
  // Placeholder smoke test: the ui lib has no exports yet. This keeps the
  // vitest `test` target green (vitest exits non-zero on "no test files")
  // and will assert real exports as components land.
  it('imports without throwing', async () => {
    const mod = await import('./index.js');

    expect(mod).toBeDefined();
  });
});
