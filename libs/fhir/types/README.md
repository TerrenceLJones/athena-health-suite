# @athena/fhir-types

FHIR R4 TypeScript types for the Athena Health Suite — a zero-`any` re-export of
[`@medplum/fhirtypes`](https://www.medplum.com/docs/sdk/core.resourcetype) (the
single source of truth for clinical resource shapes, ADR-001) — plus the branded
**PHI safety** types that make accidental PHI leakage a compile error.

## Branded PHI types — compile-time, not runtime

HIPAA breach reporting turns on whether PHI was _actually_ exposed, not on
whether a developer _meant_ to expose it (US-SH-001). A policy ("don't log
patient names") is enforced by review and hope. A **branded type** is enforced by
the compiler: passing PHI to an analytics or logging sink simply **does not
compile**.

The guarantee is **compile-time, not runtime**. `markPHI` adds no wrapper, no
flag, and no check — at runtime `markPHI(x) === x`. All of the safety lives in
the type system and evaporates when the code is compiled to JavaScript. There is
nothing to strip, nothing to scrub, and zero runtime cost. PHI is blocked
_before the program ever runs_, at the moment you try to build it.

```ts
import { markPHI } from '@athena/fhir-types';
import { logEvent } from '@athena/compliance';

// Mark a value as PHI at its point of receipt from the FHIR server.
const familyName = markPHI(patient.name?.[0]?.family ?? '');

logEvent('chart_viewed', { name: familyName }); // ✗ compile error ✅
logEvent('chart_viewed', { resourceType: 'Patient' }); // ✓ compiles & runs ✅
```

### The three pieces

| Export       | Purpose                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `PHI<T>`     | A `T` tagged as Protected Health Information (`markPHI` mints it).      |
| `NonPHI<T>`  | A `T` proven _not_ to be PHI — the type PHI-refusing sinks must accept. |
| `markPHI(v)` | Brands a value `PHI<T>` at its point of receipt. Runtime identity.      |

```ts
declare const __phi: unique symbol; // phantom key — exists only in the type system
export type PHI<T> = T & { readonly [__phi]: true };
export type NonPHI<T> = T & { readonly [__phi]?: never };
export function markPHI<T>(value: T): PHI<T> {
  return value as PHI<T>; // no-op at runtime; the cast is purely for the compiler
}
```

### Why the sink accepts `NonPHI<string>`, not `string`

This is the subtle part, and getting it wrong makes the whole wall silently
useless. `PHI<T>` is an **intersection** (`T & { …brand }`), which makes it a
**subtype** of `T`. So a `PHI<string>` _is_ assignable to a plain `string`
parameter — a naive sink signature does **not** reject it:

```ts
// ✗ Looks safe. Is not. A PHI<string> is a string, so this compiles:
function logEvent(event: string, properties: Record<string, string>): void {}
logEvent('x', { name: markPHI(patientName) }); // compiles — PHI leaks through
```

The fix is the **negative brand** `NonPHI<T> = T & { readonly [__phi]?: never }`.
A plain string satisfies it (the property is optional and absent), but a
`PHI<string>` — whose `[__phi]` is `true` — does not, because `true` is not
assignable to `never`:

```ts
// ✓ Rejects PHI, accepts plain strings:
function logEvent(event: string, properties: Record<string, NonPHI<string>>): void {}
logEvent('x', { name: markPHI(patientName) }); // ✗ compile error
logEvent('x', { resourceType: 'Patient' }); // ✓ ok
```

`@athena/compliance`'s `logEvent` uses exactly this signature.

### How it's tested

Because the guarantee is compile-time, its test is a **compile**, not a runtime
assertion:

- [`libs/compliance/src/log-event.type-test.ts`](../../compliance/src/log-event.type-test.ts)
  — a `@ts-expect-error` over the PHI call, enforced by `tsc --noEmit`. If the
  wall ever regresses, the directive finds nothing to suppress and the
  type-check fails (`TS2578: Unused '@ts-expect-error' directive`). The
  `.type-test.ts` suffix keeps it out of the Vitest runtime include.
- [`libs/compliance/src/log-event.test.ts`](../../compliance/src/log-event.test.ts)
  — a Vitest test proving the non-PHI path compiles and _runs_ (the safe event
  reaches the analytics sink intact).
- [`src/phi.test.ts`](src/phi.test.ts) — pins `markPHI`'s runtime identity and
  the type-level brand.

### Scope and limits

- The brand is advisory at the boundary: `markPHI` trusts the caller to mark PHI
  at the point of receipt. It guards the **sinks**, not the source — it cannot
  know a value is PHI until you say so.
- Compile-time only. It stops PHI from being _written_ into a non-PHI sink in
  our code; it is one layer of the defense-in-depth in US-SH-001 (alongside
  PHI-safe navigation, no-localStorage, and Sentry `beforeSend` scrubbing), not
  the whole of it.
