import { useMedplum } from '@medplum/react-hooks';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Condition, Encounter, MedicationRequest, Patient } from '@athena/fhir-types';
import { bundleResources } from './bundle';

/**
 * The clinical resources that make up a patient chart snapshot. US Core Must
 * Support fields are handled defensively downstream; here every collection is a
 * fully typed FHIR resource array with zero `any`.
 */
export interface PatientChart {
  patient: Patient;
  conditions: Condition[];
  medicationRequests: MedicationRequest[];
  encounters: Encounter[];
}

/**
 * Read a patient's chart — the demographic `Patient` resource plus the core
 * clinical resources (Conditions, MedicationRequests, Encounters). Scaffold for
 * Spike S1; the resource set will grow (DiagnosticReport, etc.) as chart panels
 * are built out.
 *
 * All four reads run concurrently. The Patient read must succeed; the search
 * results are mapped through the same typed `bundleResources` path as vitals.
 *
 * Partial-failure policy (deliberate, deferred): this is currently all-or-nothing
 * — `Promise.all` rejects the whole query if any single search fails. That is
 * acceptable while the chart is a scaffold, but once the chart UI renders
 * independent panels, each panel should tolerate its own sub-resource failure
 * (e.g. `Promise.allSettled` or a query per panel) so one 403 does not blank the
 * entire chart. Tracked as a follow-up.
 */
export function usePatientChart(patientId: string): UseQueryResult<PatientChart> {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['patient-chart', patientId],
    enabled: patientId.length > 0,
    queryFn: async (): Promise<PatientChart> => {
      const [patient, conditions, medicationRequests, encounters] = await Promise.all([
        medplum.readResource('Patient', patientId),
        medplum.search('Condition', {
          patient: patientId,
          _sort: '-recorded-date',
        }),
        medplum.search('MedicationRequest', {
          patient: patientId,
          _sort: '-authoredon',
        }),
        medplum.search('Encounter', {
          patient: patientId,
          _sort: '-date',
        }),
      ]);

      return {
        patient,
        conditions: bundleResources(conditions),
        medicationRequests: bundleResources(medicationRequests),
        encounters: bundleResources(encounters),
      };
    },
  });
}
