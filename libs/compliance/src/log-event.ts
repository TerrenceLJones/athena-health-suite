import type { NonPHI } from '@athena/fhir-types';

// PHI-safe telemetry (plan §11 "PHI-safe telemetry pattern", US-SH-001 AC-3).
// Standard analytics tools have no BAA, so PHI must never reach an event
// payload. That invariant is enforced at the *type level*: logEvent accepts
// only non-PHI strings, so a value produced by markPHI() is a compile error —
// see log-event.type-test.ts. The guarantee is compile-time, not runtime: there
// is no scrubbing here, because a PHI value can never get this far.

/** A PHI-safe analytics event: an event name plus a bag of non-PHI strings. */
export interface AnalyticsEvent {
  readonly event: string;
  readonly properties: Record<string, string>;
}

/** Where PHI-safe events are delivered (a real backend, a test spy, or nothing). */
export type AnalyticsSink = (event: AnalyticsEvent) => void;

// No BAA-covered analytics backend is wired yet, so the default sink is a no-op:
// telemetry is always safe to call. App bootstrap (or a test) swaps it in.
let sink: AnalyticsSink = () => {};

/** Install the analytics sink that subsequent {@link logEvent} calls deliver to. */
export function configureAnalytics(next: AnalyticsSink): void {
  sink = next;
}

/**
 * Record a PHI-safe analytics event.
 *
 * `properties` is typed `Record<string, NonPHI<string>>`, NOT
 * `Record<string, string>`: a plain string satisfies `NonPHI<string>`, but a
 * `PHI<string>` from markPHI() does not, so accidental PHI logging fails to
 * compile. (A bare `Record<string, string>` would NOT catch it — a `PHI<string>`
 * is a subtype of `string` and would slip through. See @athena/fhir-types.)
 *
 * Telemetry is best-effort: a throwing sink is swallowed so a failing analytics
 * transport can never crash the clinical code path that emitted the event.
 */
export function logEvent(event: string, properties: Record<string, NonPHI<string>>): void {
  try {
    sink({ event, properties });
  } catch {
    // Intentionally ignored — telemetry must never take down its caller.
  }
}
