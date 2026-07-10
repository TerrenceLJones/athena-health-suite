/// <reference types="vite/client" />

// Env contract for the FHIR client. Both are optional at the type level so the
// client can fall back to the Medplum sandbox default; a missing client id is a
// runtime auth concern, not a compile-time one.
interface ImportMetaEnv {
  readonly VITE_FHIR_BASE_URL?: string;
  readonly VITE_MEDPLUM_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
