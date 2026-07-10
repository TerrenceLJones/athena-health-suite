// FHIR R4 types for the Athena Health Suite — the single source of truth for
// clinical resource shapes (ADR-001). A type-only re-export of @medplum/fhirtypes
// with zero `any` introduced on our side. Consumers import FHIR resource types
// from here (e.g. `Observation`, `Patient`, `Bundle`) rather than reaching into
// @medplum/fhirtypes directly, so the dependency stays swappable and centrally
// governed.
export type * from '@medplum/fhirtypes';

// Branded PHI safety (plan §11, ADR-004): the `PHI<T>` / `NonPHI<T>` types and
// the `markPHI` helper. The only runtime code in this otherwise type-only
// package is markPHI, a zero-cost identity cast — see phi.ts and README.md.
export * from './phi';
