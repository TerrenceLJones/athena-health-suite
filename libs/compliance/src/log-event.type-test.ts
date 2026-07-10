// Compile-time test — NOT a Vitest runner (the `.type-test.ts` suffix keeps it
// out of the vitest include). It is enforced by `tsc --noEmit`: if the branded-
// PHI wall ever regresses, `@ts-expect-error` finds nothing to suppress and the
// type-check fails. That is the whole point — the guarantee is compile-time,
// not runtime, so its test is a compile, not an assertion.
import { markPHI, type Patient } from '@athena/fhir-types';
import { logEvent } from './log-event';

declare const patient: Patient;

// A patient's family name, marked PHI at its point of receipt from the FHIR
// server. Passing it to logEvent MUST NOT compile — @ts-expect-error asserts the
// error exists. If markPHI-branded PHI ever became assignable to the sink, this
// line would compile, @ts-expect-error would be unused, and tsc would fail.
// @ts-expect-error — PHI<string> is not assignable to a non-PHI analytics sink
logEvent('chart_viewed', { name: markPHI(patient.name?.[0]?.family ?? '') });

// The non-PHI path type-checks with no suppression: a resource type is not PHI.
logEvent('chart_viewed', { resourceType: 'Patient' });
