import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourceCopyPath = fileURLToPath(new URL('../tokens.source.json', import.meta.url));
const canonicalPath = fileURLToPath(
  new URL('../../../specs/designs/athena-tokens.json', import.meta.url),
);

describe('tokens.source.json', () => {
  it('is byte-for-byte identical to specs/designs/athena-tokens.json (AC-06: single edited source)', () => {
    const copy = readFileSync(sourceCopyPath, 'utf-8');
    const canonical = readFileSync(canonicalPath, 'utf-8');

    expect(copy).toBe(canonical);
  });
});
