import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Bundle, Observation } from '@athena/fhir-types';
import { bundleResources } from './bundle';

describe('bundleResources', () => {
  it('extracts resources as a typed array', () => {
    const bundle: Bundle<Observation> = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        { resource: { resourceType: 'Observation', id: 'a', status: 'final', code: {} } },
        { resource: { resourceType: 'Observation', id: 'b', status: 'final', code: {} } },
      ],
    };

    const resources = bundleResources(bundle);

    expectTypeOf(resources).toEqualTypeOf<Observation[]>();
    expect(resources.map((resource) => resource.id)).toEqual(['a', 'b']);
  });

  it('drops entries with no resource (e.g. search-mode-only or OperationOutcome entries)', () => {
    const bundle: Bundle<Observation> = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        { resource: { resourceType: 'Observation', id: 'a', status: 'final', code: {} } },
        { search: { mode: 'outcome' } },
      ],
    };

    expect(bundleResources(bundle)).toHaveLength(1);
  });

  it('returns an empty array when the bundle has no entries', () => {
    expect(bundleResources({ resourceType: 'Bundle', type: 'searchset' })).toEqual([]);
  });
});
