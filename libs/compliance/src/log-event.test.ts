import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureAnalytics, logEvent } from './log-event';

// Proves the *non-PHI path* compiles and runs: a PHI-safe event (event name +
// resource-type/action strings, never a patient identifier) forwards intact to
// the configured sink. The PHI path is proven un-compilable in
// log-event.type-test.ts — the compile-time half of the same guarantee.
describe('logEvent (non-PHI path)', () => {
  afterEach(() => {
    // Reset the module-level sink so tests don't leak into one another.
    configureAnalytics(() => {});
  });

  it('forwards a PHI-safe event to the configured analytics sink', () => {
    const sink = vi.fn();
    configureAnalytics(sink);

    logEvent('chart_viewed', { resourceType: 'Patient' });

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith({
      event: 'chart_viewed',
      properties: { resourceType: 'Patient' },
    });
  });

  it('is a no-op that does not throw when no sink is configured', () => {
    // The default sink is a no-op so telemetry is always safe to call, even
    // before any analytics backend is wired up.
    expect(() => logEvent('app_opened', { area: 'dashboard' })).not.toThrow();
  });

  it('swallows sink failures — best-effort telemetry never crashes its caller', () => {
    // Telemetry is non-essential: a throwing transport must not bubble up into
    // the clinical code path that emitted the event.
    const boom = vi.fn(() => {
      throw new Error('transport down');
    });
    configureAnalytics(boom);

    expect(() => logEvent('chart_viewed', { resourceType: 'Patient' })).not.toThrow();
    expect(boom).toHaveBeenCalledTimes(1);
  });
});
