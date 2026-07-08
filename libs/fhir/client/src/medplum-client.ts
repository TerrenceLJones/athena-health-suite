import { ClientStorage, MedplumClient, MemoryStorage } from '@medplum/core';

// Layer 1 — real infrastructure. The Medplum hosted sandbox is a production-grade
// FHIR R4 server; there is no mock behind this client. See
// docs/reference/athena-mock-backend-architecture.md (Layer 1).

// The sandbox FHIR R4 endpoint is the safe default so the client works out of the
// box in dev/test; production overrides both values via Vite env.
const DEFAULT_FHIR_BASE_URL = 'https://api.medplum.com/fhir/R4';

const fhirBaseUrl = import.meta.env.VITE_FHIR_BASE_URL ?? DEFAULT_FHIR_BASE_URL;
const clientId = import.meta.env.VITE_MEDPLUM_CLIENT_ID;

// MedplumClient composes its FHIR endpoint as `baseUrl + fhirUrlPath` (default
// path `fhir/R4/`). VITE_FHIR_BASE_URL is the *full* FHIR base, so split it into
// its server origin and R4 path — otherwise the two would concatenate into a
// doubled `/fhir/R4/fhir/R4/` prefix on every request.
const { origin, pathname } = new URL(fhirBaseUrl);
const baseUrl = `${origin}/`;
const fhirUrlPath = `${pathname.replace(/^\/+|\/+$/g, '')}/`;

/**
 * The shared MedplumClient for the Athena Health Suite.
 *
 * Token handling: `ClientStorage` backed by `MemoryStorage` keeps the access
 * token in memory only — it is never written to localStorage, so PHI-bearing
 * tokens do not survive a reload or leak into disk-backed storage. This is
 * forced explicitly rather than relying on the browser default (which is
 * localStorage-backed). The refresh token is expected to live in an httpOnly
 * cookie set by the server proxy, out of reach of JS entirely.
 */
export const medplum = new MedplumClient({
  baseUrl,
  fhirUrlPath,
  clientId,
  storage: new ClientStorage(new MemoryStorage()),
});
