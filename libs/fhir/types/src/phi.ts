// Branded PHI types — compile-time PHI safety (plan §11 HIPAA Compliance
// Patterns, ADR-004). This is the "type wall" that turns "we have a policy
// against logging PHI" into "this cannot compile": a value marked as Protected
// Health Information carries a phantom brand that PHI-refusing sinks (analytics,
// telemetry, error logs) reject at the type level.
//
// The guarantee is compile-time, NOT runtime — see markPHI below and README.md.

// A phantom, un-constructable key. `unique symbol` + `declare` means it exists
// only in the type system: nothing can produce or inspect it at runtime.
declare const __phi: unique symbol;

/**
 * A value marked as Protected Health Information.
 *
 * Structurally still a `T` (so a `PHI<string>` renders and concatenates like any
 * string), but tagged with a phantom brand. Because it is an *intersection*,
 * `PHI<T>` is a *subtype* of `T` — it flows freely into code that legitimately
 * handles PHI. What it must NOT flow into are sinks typed to reject the brand;
 * see {@link NonPHI}.
 */
export type PHI<T> = T & { readonly [__phi]: true };

/**
 * The negative of {@link PHI}: a `T` that is provably not PHI-branded.
 *
 * This is the type PHI-refusing sinks must accept — NOT a bare `T`. A bare `T`
 * parameter would silently accept a `PHI<T>` too, since `PHI<T>` is a subtype of
 * `T`. `NonPHI<T>` closes that gap: a plain `T` satisfies `[__phi]?: never`,
 * but a `PHI<T>` (whose `[__phi]` is `true`) does not — `true` is not assignable
 * to `never`, so the assignment is a compile error.
 */
export type NonPHI<T> = T & { readonly [__phi]?: never };

/**
 * Brand a value as PHI at its point of receipt from the FHIR server.
 *
 * Runtime no-op: this returns `value` untouched — the cast exists purely to
 * inform the type checker. `markPHI(x) === x` always holds. The protection is
 * the branded type it hands back, enforced by the compiler, not by any runtime
 * check.
 */
export function markPHI<T>(value: T): PHI<T> {
  return value as PHI<T>;
}
