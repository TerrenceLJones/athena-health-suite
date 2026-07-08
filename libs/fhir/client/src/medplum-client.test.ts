import { describe, expect, it } from 'vitest';
import { medplum } from './index';

describe('medplum FHIR client', () => {
  it('points at the Medplum sandbox FHIR R4 endpoint by default', () => {
    // Proves baseUrl + fhirUrlPath compose to the real sandbox FHIR base without
    // a doubled `/fhir/R4/fhir/R4/` prefix.
    expect(medplum.fhirUrl('Observation').toString()).toBe(
      'https://api.medplum.com/fhir/R4/Observation',
    );
  });

  it('starts with no access token — nothing restored from disk-backed storage', () => {
    // With ClientStorage(MemoryStorage) there is no persisted login to rehydrate,
    // so the access token is absent until an explicit in-memory login occurs.
    expect(medplum.getAccessToken()).toBeUndefined();
  });
});
