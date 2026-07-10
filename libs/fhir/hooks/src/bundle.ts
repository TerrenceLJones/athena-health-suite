import type { Bundle, Resource } from '@athena/fhir-types';

/**
 * Extract the resources from a FHIR search `Bundle` as a typed array.
 *
 * This is the mapping path the never-show invariants depend on, so it is kept
 * fully typed end to end — `Bundle<T>` in, `T[]` out, with zero `any`. Bundle
 * entries and their `resource` are both optional in FHIR (a `searchset` can
 * carry `OperationOutcome` entries or `search`-mode-only entries with no
 * resource), so undefined resources are filtered out via a type guard rather
 * than asserted away.
 */
export function bundleResources<T extends Resource>(bundle: Bundle<T>): T[] {
  return (
    bundle.entry
      ?.map((entry) => entry.resource)
      .filter((resource): resource is T => resource !== undefined) ?? []
  );
}
