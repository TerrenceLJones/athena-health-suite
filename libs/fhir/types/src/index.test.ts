import { describe, expectTypeOf, it } from 'vitest';
import type { Bundle, Observation, Patient } from './index';

// Type-only assertions: the re-export surfaces real FHIR R4 resource types with
// discriminant `resourceType` literals and precise status unions — no `any`.
describe('@athena/fhir-types', () => {
  it('re-exports FHIR R4 resources with literal resourceType discriminants', () => {
    expectTypeOf<Observation['resourceType']>().toEqualTypeOf<'Observation'>();
    expectTypeOf<Patient['resourceType']>().toEqualTypeOf<'Patient'>();
    expectTypeOf<Bundle['resourceType']>().toEqualTypeOf<'Bundle'>();
  });

  it('models the Observation status lifecycle as a precise string union', () => {
    // These assignments compile only if the union includes each literal — the
    // never-show invariant depends on discriminating entered-in-error at compile
    // time.
    const finalStatus: Observation['status'] = 'final';
    const erroredStatus: Observation['status'] = 'entered-in-error';
    expectTypeOf(finalStatus).not.toBeAny();
    expectTypeOf(erroredStatus).not.toBeAny();
  });
});
