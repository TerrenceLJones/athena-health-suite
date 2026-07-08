// FHIR R4 types for the Athena Health Suite — the single source of truth for
// clinical resource shapes (ADR-001). This is a pure type-only re-export of
// @medplum/fhirtypes: no runtime code, and zero `any` introduced on our side.
// Consumers import FHIR resource types from here (e.g. `Observation`, `Patient`,
// `Bundle`) rather than reaching into @medplum/fhirtypes directly, so the
// dependency stays swappable and centrally governed.
export type * from '@medplum/fhirtypes';
