import { describe, expect, expectTypeOf, it } from 'vitest';
import { markPHI, type NonPHI, type PHI } from './phi';

// The branded-PHI wall is a *compile-time* construct: `markPHI` adds a phantom
// tag the type system reads, but erases to nothing at runtime. These tests pin
// both halves of that contract — the runtime identity and the type-level brand.
describe('markPHI (compile-time brand, runtime identity)', () => {
  it('returns the value unchanged at runtime — the brand carries no runtime cost', () => {
    const raw = 'Doe';
    // No wrapping, no copy: markPHI(x) IS x. Safety lives in the type, not here.
    expect(markPHI(raw)).toBe(raw);
    expect(markPHI(42)).toBe(42);
  });

  it('brands the value type so PHI<string> is distinct from a bare string', () => {
    // A PHI<string> still IS-A string, so it renders/concatenates normally…
    expectTypeOf(markPHI('Doe')).toMatchTypeOf<string>();
    // …but the brand is a real added requirement: a plain string is NOT a
    // PHI<string>, so nothing becomes PHI by accident — only markPHI mints it.
    expectTypeOf<string>().not.toMatchTypeOf<PHI<string>>();
  });

  it('models NonPHI as the negative brand a plain string satisfies', () => {
    // A plain string is assignable to NonPHI<string> (the sink type)…
    const plain: NonPHI<string> = 'Patient';
    expectTypeOf(plain).toMatchTypeOf<string>();
    // …while a PHI<string> is NOT — that gap is what blocks PHI at the sink.
    expectTypeOf<PHI<string>>().not.toMatchTypeOf<NonPHI<string>>();
  });
});
