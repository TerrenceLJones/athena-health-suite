import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientStorage, MedplumClient, MemoryStorage } from '@medplum/core';
import { MedplumProvider } from '@medplum/react-hooks';
import type { Bundle, Observation } from '@athena/fhir-types';
import { useVitalSigns } from './use-vital-signs';

const SERVER_ROOT = 'https://api.medplum.com/';
const FHIR_BASE_URL = 'https://api.medplum.com/fhir/R4';

// One stubbed Medplum search response: two valid vital-signs Observations.
// (The `status:not=entered-in-error` filter is applied by Medplum server-side,
// so a correct stub simply never includes an entered-in-error record.)
const systolic: Observation = {
  resourceType: 'Observation',
  id: 'obs-systolic',
  status: 'final',
  category: [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
        },
      ],
    },
  ],
  code: {
    coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }],
  },
  subject: { reference: 'Patient/patient-123' },
  effectiveDateTime: '2026-07-01T10:05:00Z',
  valueQuantity: { value: 118, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
};

const heartRate: Observation = {
  resourceType: 'Observation',
  id: 'obs-heart-rate',
  status: 'final',
  category: [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
        },
      ],
    },
  ],
  code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
  subject: { reference: 'Patient/patient-123' },
  effectiveDateTime: '2026-07-01T10:04:00Z',
  valueQuantity: { value: 72, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
};

const searchBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: systolic }, { resource: heartRate }],
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// baseUrl is the server root; MedplumClient's default fhirUrlPath (`fhir/R4/`)
// makes searches hit `${FHIR_BASE_URL}/...`. Constructed per-test so it captures
// the MSW-patched fetch. Memory-only storage mirrors the production client.
function makeClient(): MedplumClient {
  return new MedplumClient({
    baseUrl: SERVER_ROOT,
    storage: new ClientStorage(new MemoryStorage()),
  });
}

function createWrapper(medplum: MedplumClient) {
  // retry:false so a stub mismatch fails fast instead of retrying for the timeout.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MedplumProvider medplum={medplum}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MedplumProvider>
    );
  };
}

describe('useVitalSigns', () => {
  it('returns a typed Observation[] from a stubbed Medplum search', async () => {
    server.use(http.get(`${FHIR_BASE_URL}/Observation`, () => HttpResponse.json(searchBundle)));

    const { result } = renderHook(() => useVitalSigns('patient-123'), {
      wrapper: createWrapper(makeClient()),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Compile-time guarantee: the hook's data is exactly Observation[] — no `any`
    // leaks through the mapping path from Bundle<Observation> to the result.
    expectTypeOf(result.current.data).toEqualTypeOf<Observation[] | undefined>();

    const observations: Observation[] = result.current.data ?? [];
    expect(observations).toHaveLength(2);

    // Every element is a fully typed Observation reachable without a cast.
    const [first] = observations;
    expect(first?.resourceType).toBe('Observation');
    const status: Observation['status'] | undefined = first?.status;
    expect(status).toBe('final');
    expect(first?.valueQuantity?.unit).toBe('mmHg');
    expect(observations.map((observation) => observation.id)).toEqual([
      'obs-systolic',
      'obs-heart-rate',
    ]);
  });

  it('filters out an entered-in-error Observation even if the server returns one', async () => {
    // Defense-in-depth: the query asks the server to exclude entered-in-error,
    // but a server that ignores the modifier (or an injected fault) must never
    // leak an invalid clinical value through to the UI.
    const enteredInError: Observation = {
      resourceType: 'Observation',
      id: 'obs-void',
      status: 'entered-in-error',
      subject: { reference: 'Patient/patient-123' },
      code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] },
      valueQuantity: { value: 250, unit: 'mmHg' },
    };
    server.use(
      http.get(`${FHIR_BASE_URL}/Observation`, () =>
        HttpResponse.json<Bundle<Observation>>({
          resourceType: 'Bundle',
          type: 'searchset',
          entry: [{ resource: systolic }, { resource: enteredInError }],
        }),
      ),
    );

    const { result } = renderHook(() => useVitalSigns('patient-123'), {
      wrapper: createWrapper(makeClient()),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const observations = result.current.data ?? [];
    expect(observations.map((observation) => observation.id)).toEqual(['obs-systolic']);
    expect(observations.some((observation) => observation.status === 'entered-in-error')).toBe(
      false,
    );
  });

  it('surfaces a server error as an error state', async () => {
    // Use a 400 (client error) rather than 5xx: MedplumClient auto-retries 5xx
    // with backoff, which would outlast the assertion window. A 400 fails fast.
    server.use(
      http.get(`${FHIR_BASE_URL}/Observation`, () =>
        HttpResponse.json(
          { resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'invalid' }] },
          { status: 400 },
        ),
      ),
    );

    const { result } = renderHook(() => useVitalSigns('patient-123'), {
      wrapper: createWrapper(makeClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch when the patient id is empty (enabled gate)', () => {
    // No handler registered: if the disabled query fired, onUnhandledRequest:'error'
    // would fail the test. The query stays idle instead.
    const { result } = renderHook(() => useVitalSigns(''), {
      wrapper: createWrapper(makeClient()),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
