import { useMedplum } from '@medplum/react-hooks';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Bundle, Observation } from '@athena/fhir-types';
import { bundleResources } from './bundle';

/**
 * Read a patient's vital-signs Observations from the FHIR server.
 *
 * Follows the plan's FHIR search pattern (Spike S1):
 *  - `category=vital-signs` restricts to the vitals panel
 *  - `status:not=entered-in-error` filters invalid records at the query level so
 *    an `entered-in-error` value can never reach the UI as valid clinical data
 *    (a patient-safety never-show invariant)
 *  - `_sort=-date` returns newest first
 *
 * Returns a typed `Observation[]` — the mapping path (see `bundleResources`)
 * carries no `any`.
 */
export function useVitalSigns(patientId: string): UseQueryResult<Observation[]> {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['vital-signs', patientId],
    enabled: patientId.length > 0,
    queryFn: async (): Promise<Observation[]> => {
      const bundle: Bundle<Observation> = await medplum.search('Observation', {
        patient: patientId,
        category: 'vital-signs',
        'status:not': 'entered-in-error',
        _sort: '-date',
        _count: '20',
      });
      // Defense-in-depth for a patient-safety never-show invariant. The query
      // already asks the server to exclude entered-in-error, but we never trust a
      // single layer to keep an invalid clinical value out of the UI — a server
      // that ignores the modifier, or an injected fault, must not leak one through.
      return bundleResources(bundle).filter(
        (observation) => observation.status !== 'entered-in-error',
      );
    },
  });
}
