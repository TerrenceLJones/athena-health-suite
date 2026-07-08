import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientStorage, MedplumClient, MemoryStorage } from '@medplum/core';
import { MedplumProvider } from '@medplum/react-hooks';
import type { Bundle, Condition, Encounter, MedicationRequest, Patient } from '@athena/fhir-types';
import { usePatientChart, type PatientChart } from './use-patient-chart';

const SERVER_ROOT = 'https://api.medplum.com/';
const FHIR_BASE_URL = 'https://api.medplum.com/fhir/R4';
const PATIENT_ID = 'patient-123';

const patient: Patient = {
  resourceType: 'Patient',
  id: PATIENT_ID,
  name: [{ family: 'Synthea', given: ['Ada'] }],
};

const conditionBundle: Bundle<Condition> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Condition',
        id: 'cond-1',
        subject: { reference: `Patient/${PATIENT_ID}` },
      },
    },
  ],
};

const medicationBundle: Bundle<MedicationRequest> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        intent: 'order',
        subject: { reference: `Patient/${PATIENT_ID}` },
      },
    },
  ],
};

const encounterBundle: Bundle<Encounter> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Encounter',
        id: 'enc-1',
        status: 'finished',
        class: { code: 'AMB' },
        subject: { reference: `Patient/${PATIENT_ID}` },
      },
    },
  ],
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient(): MedplumClient {
  return new MedplumClient({
    baseUrl: SERVER_ROOT,
    storage: new ClientStorage(new MemoryStorage()),
  });
}

function createWrapper(medplum: MedplumClient) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MedplumProvider medplum={medplum}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MedplumProvider>
    );
  };
}

describe('usePatientChart', () => {
  it('assembles a typed PatientChart from the Patient read and clinical searches', async () => {
    server.use(
      http.get(`${FHIR_BASE_URL}/Patient/${PATIENT_ID}`, () => HttpResponse.json(patient)),
      http.get(`${FHIR_BASE_URL}/Condition`, () => HttpResponse.json(conditionBundle)),
      http.get(`${FHIR_BASE_URL}/MedicationRequest`, () => HttpResponse.json(medicationBundle)),
      http.get(`${FHIR_BASE_URL}/Encounter`, () => HttpResponse.json(encounterBundle)),
    );

    const { result } = renderHook(() => usePatientChart(PATIENT_ID), {
      wrapper: createWrapper(makeClient()),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expectTypeOf(result.current.data).toEqualTypeOf<PatientChart | undefined>();

    const chart = result.current.data;
    expect(chart?.patient.id).toBe(PATIENT_ID);
    expect(chart?.conditions.map((condition) => condition.id)).toEqual(['cond-1']);
    expect(chart?.medicationRequests.map((request) => request.id)).toEqual(['med-1']);
    expect(chart?.encounters.map((encounter) => encounter.id)).toEqual(['enc-1']);
  });

  it('fails the whole chart if a sub-resource search fails (all-or-nothing policy)', async () => {
    server.use(
      http.get(`${FHIR_BASE_URL}/Patient/${PATIENT_ID}`, () => HttpResponse.json(patient)),
      http.get(`${FHIR_BASE_URL}/Condition`, () => HttpResponse.json(conditionBundle)),
      http.get(`${FHIR_BASE_URL}/MedicationRequest`, () => HttpResponse.json(medicationBundle)),
      http.get(`${FHIR_BASE_URL}/Encounter`, () =>
        HttpResponse.json(
          { resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'forbidden' }] },
          { status: 403 },
        ),
      ),
    );

    const { result } = renderHook(() => usePatientChart(PATIENT_ID), {
      wrapper: createWrapper(makeClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch when the patient id is empty (enabled gate)', () => {
    const { result } = renderHook(() => usePatientChart(''), {
      wrapper: createWrapper(makeClient()),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
