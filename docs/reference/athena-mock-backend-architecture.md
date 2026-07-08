# Clinical Mock Backend Architecture — Athena Health Suite

*This addendum documents the backend strategy for the Athena Health Suite (Athena Provider + Athena Field). It is a companion to the main plan and should be read alongside it. The strategy differs meaningfully from the fintech projects (Clearline and Meridian), and the difference is itself a portfolio signal worth understanding.*

---

## How this differs from the fintech projects

In Clearline and Meridian, there is no hosted backend at all. Every API call, every payment state, and every order is intercepted and answered by MSW handlers backed by in-memory service classes. The entire server is synthesized.

Athena does something more sophisticated — and, for a health tech portfolio, more credible.

**Athena uses a real FHIR server.** The Medplum hosted sandbox (`https://api.medplum.com/fhir/R4`) is a production-grade, HIPAA-eligible FHIR R4 server with real SMART on FHIR OAuth, real FHIR Subscriptions over WebSocket, real AuditEvent writing, and real FHIR validation on every resource write. `launch.smarthealthit.org` provides a simulated EHR that runs a real SMART on FHIR EHR launch flow with PKCE against Synthea patients. None of this is mocked.

The mock layer for Athena is **additive and surgical** — it exists to cover three things the real Medplum server cannot produce reliably on demand:

1. **FHIR error states** — a 404, 422 with a specific `OperationOutcome`, a 403 for a specific scope, or a network timeout cannot be triggered deterministically in Medplum's sandbox. MSW injects these on demand for the Gherkin scenarios that require them.
2. **FHIR Subscription faults** — vitals staleness thresholds (5s / 30s / 2min), sequence gaps, and controlled disconnects cannot be scheduled. MSW intercepts the WebSocket and produces these on command, making the staleness-threshold demo a button press rather than a timing gamble.
3. **CDS Hooks service** — Medplum does not ship a CDS Hooks server by default. The CDS alert system in Athena Provider requires a simulated CDS service that returns tiered cards (Critical / Advisory / Informational), times out deterministically, and records override feedback for rate tracking.

A fourth mock concern exists for Athena Field specifically:

4. **WatermelonDB sync conflicts** — a real server-side conflict (two clinicians editing the same vital offline) cannot be created on demand against the Medplum sandbox. An injected conflict service creates the exact server-response shape WatermelonDB's sync engine expects, so `ConflictResolutionDialog` can be exercised in tests and Loom recordings without coordinating two real devices.

The result is a three-layer architecture that escalates in fidelity, where the first layer is genuinely real infrastructure:

| Layer | What it is | What it handles |
|---|---|---|
| **Layer 1 — Medplum + Synthea** | Real FHIR R4 server + realistic synthetic patients | Core FHIR reads/writes, SMART OAuth, Subscriptions, AuditEvents, FHIR validation |
| **Layer 2 — MSW fault injection** | MSW HTTP + WebSocket handlers, activated on demand | FHIR error states, Subscription faults, CDS Hooks simulation |
| **Layer 3 — Clinical service classes** | Stateful TypeScript services | FHIR fault mode state, vitals feed simulation, CDS card generation, sync conflict injection |

---

## Layer 1 — Real infrastructure: Medplum sandbox + Synthea

### Medplum hosted sandbox

The Medplum hosted sandbox is the primary FHIR backend for both Athena Provider and Athena Field during development and demo. It is a real server with real behavior.

```bash
# .env.local
VITE_FHIR_BASE_URL=https://api.medplum.com/fhir/R4
VITE_MEDPLUM_CLIENT_ID=your-client-id        # never expose a secret here
VITE_SMART_ISSUER=https://launch.smarthealthit.org/v/r4/fhir
```

The Medplum client is initialized once in `libs/fhir/client/medplum-client.ts`:

```ts
import { MedplumClient } from '@medplum/core'

export const medplum = new MedplumClient({
  baseUrl: import.meta.env.VITE_FHIR_BASE_URL,
  clientId: import.meta.env.VITE_MEDPLUM_CLIENT_ID,
  // Token storage: access token in memory (MedplumClient default);
  // refresh token in httpOnly cookie set by the server proxy.
  // PHI never touches localStorage.
})
```

> **Implementation note — `baseUrl` vs `fhirUrlPath`.** `VITE_FHIR_BASE_URL` is the
> *full* FHIR R4 endpoint (`https://api.medplum.com/fhir/R4`), but `MedplumClient`
> composes its request URL as `baseUrl + fhirUrlPath` where `fhirUrlPath` defaults
> to `fhir/R4/`. Passing the full endpoint as `baseUrl` verbatim (as the snippet
> above does) doubles the prefix to `/fhir/R4/fhir/R4/`. The real client in
> `libs/fhir/client` splits the env value into its origin (`baseUrl`) and path
> (`fhirUrlPath`) so requests resolve correctly. For access-token-in-memory-only,
> it also passes `storage: new ClientStorage(new MemoryStorage())` explicitly —
> the browser default is localStorage-backed, not in-memory.

What the real Medplum server provides without any mocking:
- FHIR R4 CRUD for Patient, Observation, Encounter, MedicationRequest, Condition, DocumentReference, AuditEvent, Questionnaire, QuestionnaireResponse, Subscription
- SMART on FHIR EHR launch and standalone launch (via `launch.smarthealthit.org`)
- PKCE flow, token introspection, token refresh
- FHIR Subscriptions via WebSocket channel (R4B backport)
- `AuditEvent` persistence on every write
- `OperationOutcome` responses on real validation failures
- US Core profile validation (via HAPI FHIR validator in CI)

### Synthea synthetic patient pipeline

Synthea generates realistic FHIR R4 patient populations with complete clinical histories — never real PHI:

```bash
# Spike S7 output: load 100 synthetic patients into Medplum sandbox
npx synthea-run -p 100 --exporter.fhir.export=true --exporter.fhir.version=R4

# Load into Medplum using the CLI
npx medplum bulk-import ./output/fhir/
```

The seed script (`libs/clinical-mock/fixtures/synthea-seed.ts`) loads a deterministic subset of these patients and documents which patient IDs to use in each demo flow, so demos are reproducible across restarts:

```ts
// libs/clinical-mock/fixtures/synthea-seed.ts
export const DEMO_PATIENTS = {
  // Use these patient IDs in all dev/demo/test flows
  vitalsMonitoring: 'Patient/synthea-123abc',  // has vital-signs Observations + active Subscriptions
  conflictResolution: 'Patient/synthea-456def', // used in Athena Field sync conflict demo
  cdsAlert: 'Patient/synthea-789ghi',           // has a drug interaction that triggers CDS advisory
  aiDocumentation: 'Patient/synthea-012jkl',    // has a recent Encounter to document against
} as const
```

### SMART on FHIR EHR launch environment

```
launch.smarthealthit.org — no registration required; simulated EHR + Synthea patients
Register Athena Provider as a SMART app:
  launch_url:   http://localhost:5173/launch
  redirect_uri: http://localhost:5173/auth/callback
  scope:        launch patient/Observation.rs patient/MedicationRequest.rs patient/Condition.rs openid fhirUser
```

This gives a real SMART on FHIR EHR launch flow, a real PKCE exchange, real scope enforcement, and a real `patient` context in the token response — all without standing up an EHR. The missing-patient-context hard-stop scenario (Gherkin §2) can be triggered by using a `scope` that omits `launch/patient` in standalone mode.

---

## Layer 2 — MSW fault injection

MSW's role in Athena is narrower and more targeted than in Clearline/Meridian. It activates conditionally: the default in `development` mode is to let all FHIR requests pass through to Medplum. MSW handlers intercept specific routes only when a fault mode is active or when the endpoint doesn't exist in Medplum (CDS Hooks).

### File structure

```
libs/
  clinical-mock/                      # type:data-access  scope:shared
    services/
      fhir-fault.service.ts           # controls FHIR error injection modes
      observation-feed.service.ts     # FHIR Subscription vitals sim + fault injection
      cds-hooks.service.ts            # simulated CDS Hooks service with tiered cards
      sync-conflict.service.ts        # injects WatermelonDB push conflicts (Athena Field)
      audit-verifier.service.ts       # verifies expected AuditEvents were written to Medplum
    handlers/
      fhir-overrides.handlers.ts      # FHIR error state handlers (401, 403, 404, 422, 429, 500)
      cds-hooks.handlers.ts           # CDS Hooks endpoint simulation
      subscription.handlers.ts        # FHIR Subscription WebSocket simulation
    fixtures/
      synthea-seed.ts                 # seed script + DEMO_PATIENTS registry
      questionnaires.ts               # sample Questionnaire resources for Athena Field
      cds-cards.ts                    # CDS Hooks card fixtures (Critical / Advisory / Info)
    browser.ts                        # setupWorker — dev + Storybook
    server.ts                         # setupServer — Vitest + Playwright
```

### MSW pass-through by default

The critical design principle: MSW defaults to pass-through. Real Medplum calls succeed normally. Only activated fault modes are intercepted.

```ts
// libs/clinical-mock/browser.ts
import { setupWorker } from 'msw/browser'
import { fhirOverrideHandlers } from './handlers/fhir-overrides.handlers'
import { cdsHooksHandlers } from './handlers/cds-hooks.handlers'
import { subscriptionHandlers } from './handlers/subscription.handlers'

export const worker = setupWorker(
  ...fhirOverrideHandlers,   // pass-through when no fault is active
  ...cdsHooksHandlers,        // always active — no real CDS server exists
  ...subscriptionHandlers,    // always active — augments real Medplum Subscriptions
)
```

### FHIR error injection handlers

```ts
// libs/clinical-mock/handlers/fhir-overrides.handlers.ts
import { http, HttpResponse, passthrough } from 'msw'
import { fhirFaultService } from '../services/fhir-fault.service'

const FHIR_BASE = import.meta.env.VITE_FHIR_BASE_URL

export const fhirOverrideHandlers = [

  // Observation reads — inject staleness/error modes for vitals testing
  http.get(`${FHIR_BASE}/Observation/:id`, ({ params }) => {
    const mode = fhirFaultService.getModeForResource('Observation', params.id as string)
    if (!mode) return passthrough()  // let the real Medplum call through

    switch (mode) {
      case '401':
        return HttpResponse.json(operationOutcome('security', 'Session expired'), { status: 401 })
      case '403':
        return HttpResponse.json(operationOutcome('forbidden', 'Insufficient scope for Observation'), { status: 403 })
      case '404':
        return HttpResponse.json(operationOutcome('not-found', 'Resource not found'), { status: 404 })
      case '429':
        return new HttpResponse(null, { status: 429, headers: { 'Retry-After': '5' } })
      case '500':
        return HttpResponse.json(operationOutcome('exception', 'Internal server error'), { status: 500 })
      case 'timeout':
        return new Promise(() => {}) // never resolves — triggers the client's timeout logic
    }
  }),

  // QuestionnaireResponse writes — inject FHIR validation failures
  http.post(`${FHIR_BASE}/QuestionnaireResponse`, async ({ request }) => {
    const mode = fhirFaultService.getGlobalMode()
    if (mode !== '422') return passthrough()

    // Return a realistic OperationOutcome with per-field issues
    return HttpResponse.json({
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'required',
          details: { text: 'Item "pain-level" is required' },
          location: ['QuestionnaireResponse.item[2]'],
        }
      ]
    }, { status: 422 })
  }),
]

// Utility: build a minimal OperationOutcome for error responses
function operationOutcome(code: string, text: string) {
  return {
    resourceType: 'OperationOutcome',
    issue: [{ severity: 'error', code, details: { text } }]
  }
}
```

### FHIR fault service (controls injection modes)

```ts
// libs/clinical-mock/services/fhir-fault.service.ts
// Activated from the Demo Controls panel or from Playwright tests.
// All other code uses the real Medplum server by default.

type FaultMode = '401' | '403' | '404' | '422' | '429' | '500' | 'timeout' | null

export class FhirFaultService {
  private globalMode: FaultMode = null
  private resourceModes = new Map<string, FaultMode>()  // keyed by "ResourceType/id"

  setGlobalMode(mode: FaultMode) { this.globalMode = mode }
  getGlobalMode(): FaultMode { return this.globalMode }

  setModeForResource(resourceType: string, id: string, mode: FaultMode) {
    this.resourceModes.set(`${resourceType}/${id}`, mode)
  }
  getModeForResource(resourceType: string, id: string): FaultMode {
    return this.resourceModes.get(`${resourceType}/${id}`) ?? this.globalMode
  }

  reset() {
    this.globalMode = null
    this.resourceModes.clear()
  }
}

export const fhirFaultService = new FhirFaultService()
```

---

## Layer 3 — Clinical service classes

These are the stateful TypeScript services that hold real clinical invariants. MSW handlers don't return static fixtures — they call into these services. The services are also importable directly by Vitest unit tests, independent of MSW.

### ObservationFeedService — vitals subscription simulation

This is the health tech equivalent of the fintech order-book service. It controls the FHIR Subscription vitals feed and provides the fault injection hooks that make staleness-threshold demos deterministic.

```ts
// libs/clinical-mock/services/observation-feed.service.ts
import type { Observation } from '@medplum/fhirtypes'

interface FeedState {
  mode: 'live' | 'stale' | 'disconnected'
  lastEventMs: number
  sequenceCounter: bigint
  paused: boolean
  gapPending: boolean
}

export class ObservationFeedService {
  private state: FeedState = {
    mode: 'live',
    lastEventMs: Date.now(),
    sequenceCounter: 1n,
    paused: false,
    gapPending: false,
  }

  // Returns the next synthetic Observation event for the WebSocket handler
  nextVitalEvent(patientId: string): SubscriptionEvent {
    const seqNum = this.state.gapPending
      ? this.state.sequenceCounter + 2n  // deliberately skip a sequence number
      : this.state.sequenceCounter

    this.state.sequenceCounter = seqNum + 1n
    this.state.gapPending = false
    this.state.lastEventMs = Date.now()

    const observation: Observation = {
      resourceType: 'Observation',
      id: `obs-${Date.now()}`,
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: '55284-4', display: 'Blood pressure systolic and diastolic' }] },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: new Date().toISOString(),
      component: [
        { code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
          valueQuantity: { value: 115 + Math.floor(Math.random() * 20), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
        { code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
          valueQuantity: { value: 70 + Math.floor(Math.random() * 15), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } }
      ]
    }

    return { type: 'event-notification', eventNumber: seqNum, resource: observation }
  }

  // Fault injection — called from Demo Controls panel or Playwright tests

  injectSequenceGap() {
    // The NEXT event will skip a sequence number, triggering the client's re-sync logic
    this.state.gapPending = true
  }

  injectDisconnect() {
    // Causes the WebSocket handler to close the connection
    this.state.mode = 'disconnected'
  }

  injectStaleFeed(durationMs: number) {
    // Pauses event emission for durationMs — crosses the 5s/30s/2min thresholds
    this.state.paused = true
    setTimeout(() => { this.state.paused = false; this.state.mode = 'live' }, durationMs)
  }

  injectEnteredInError(patientId: string): SubscriptionEvent {
    // Returns an Observation with entered-in-error status — triggers the never-show invariant
    return {
      type: 'event-notification',
      eventNumber: this.state.sequenceCounter++,
      resource: {
        resourceType: 'Observation',
        id: `obs-error-${Date.now()}`,
        status: 'entered-in-error',
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: new Date().toISOString(),
        code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] },
        valueQuantity: { value: 250, unit: 'mmHg' }, // implausibly high — should be suppressed
      }
    }
  }

  isPaused() { return this.state.paused }
  getMode() { return this.state.mode }
}

export const observationFeedService = new ObservationFeedService()

interface SubscriptionEvent {
  type: 'event-notification'
  eventNumber: bigint
  resource: Observation
}
```

### FHIR Subscription WebSocket handler

```ts
// libs/clinical-mock/handlers/subscription.handlers.ts
import { ws } from 'msw'
import { observationFeedService } from '../services/observation-feed.service'

// Intercepts the Medplum WebSocket Subscription channel.
// In production this is the real Medplum wss:// URL.
// In dev/test, MSW intercepts it so we can inject faults deterministically.
const subscriptionLink = ws.link(
  import.meta.env.VITE_FHIR_BASE_URL.replace('https://', 'wss://') + '/ws/subscriptions-r4'
)

export const subscriptionHandlers = [
  subscriptionLink.addEventListener('connection', ({ client }) => {

    // Send a handshake event per the FHIR Subscription WebSocket spec
    client.send(JSON.stringify({ type: 'ping', subscriptionTopic: 'vital-signs' }))

    // Stream synthetic vitals events every 2 seconds while connected and live
    const interval = setInterval(() => {
      if (observationFeedService.isPaused()) return          // staleness injection
      if (observationFeedService.getMode() === 'disconnected') {
        client.close()
        clearInterval(interval)
        return
      }
      const patientId = 'synthea-123abc'  // resolved from context in a real implementation
      client.send(JSON.stringify(observationFeedService.nextVitalEvent(patientId)))
    }, 2000)

    client.addEventListener('close', () => clearInterval(interval))
  }),
]
```

### CdsHooksService — simulated CDS Hooks server

```ts
// libs/clinical-mock/services/cds-hooks.service.ts
// Medplum doesn't ship a CDS Hooks server by default.
// This service implements the full CDS Hooks specification response shape
// and is the only way to deterministically test all three alert severity tiers.

import type { Card } from '../types/cds-hooks'

interface CdsServiceConfig {
  responseDelayMs: number   // set to > 500 to test the timeout degradation scenario
  forceTimeout: boolean
  cards: Card[]
}

const DEFAULT_CARDS: Card[] = [
  {
    summary: 'Potential drug-drug interaction: Warfarin + Aspirin',
    indicator: 'critical',
    detail: 'Co-administration of Warfarin and Aspirin significantly increases bleeding risk. Review current anticoagulation therapy.',
    source: { label: 'Clinical Pharmacology DB', url: 'https://example-cds.org/interactions/warfarin-aspirin' },
    suggestions: [],
    overrideReasons: [
      { code: 'patient-tolerates', display: 'Patient has tolerated this combination previously' },
      { code: 'benefit-outweighs-risk', display: 'Clinical benefit outweighs bleeding risk in this patient' },
      { code: 'other', display: 'Other — specify in note' },
    ],
  },
  {
    summary: 'Blood pressure above goal — consider medication adjustment',
    indicator: 'warning',
    detail: 'Patient\'s last 3 BP readings average 148/92 mmHg, above the 130/80 mmHg target for patients with Type 2 diabetes.',
    source: { label: 'ACC/AHA BP Guidelines 2024', url: 'https://example-cds.org/bp-guidelines' },
    suggestions: [
      { label: 'Add thiazide diuretic', uuid: 'sug-001', actions: [{ type: 'create', description: 'Order HCTZ 25mg daily' }] }
    ],
  },
  {
    summary: 'Patient due for annual wellness visit',
    indicator: 'info',
    detail: 'No wellness visit on record in the past 12 months. Patient is eligible for G0439 annual wellness visit.',
    source: { label: 'Preventive Care Guidelines' },
    suggestions: [],
  },
]

export class CdsHooksService {
  private config: CdsServiceConfig = {
    responseDelayMs: 200,
    forceTimeout: false,
    cards: DEFAULT_CARDS,
  }

  async getCards(hook: string, _context: unknown): Promise<{ cards: Card[] }> {
    if (this.config.forceTimeout) {
      // Never resolves — triggers the 500ms CDS timeout scenario in the Gherkin spec
      return new Promise(() => {})
    }
    await delay(this.config.responseDelayMs)
    return { cards: this.config.cards }
  }

  // Fault injection — called from Demo Controls or Playwright

  setCriticalOnly() {
    this.config.cards = [DEFAULT_CARDS[0]]  // only the drug-drug interaction
  }

  forceTimeout() { this.config.forceTimeout = true }
  clearTimeout() { this.config.forceTimeout = false; this.config.responseDelayMs = 200 }
  setResponseDelay(ms: number) { this.config.responseDelayMs = ms }
  setCards(cards: Card[]) { this.config.cards = cards }
  reset() { this.config = { responseDelayMs: 200, forceTimeout: false, cards: DEFAULT_CARDS } }
}

export const cdsHooksService = new CdsHooksService()

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
```

```ts
// libs/clinical-mock/handlers/cds-hooks.handlers.ts
import { http, HttpResponse } from 'msw'
import { cdsHooksService } from '../services/cds-hooks.service'

const CDS_BASE = import.meta.env.VITE_CDS_HOOKS_BASE_URL ?? 'http://localhost:3001/cds-services'

export const cdsHooksHandlers = [
  // CDS Hooks discovery endpoint
  http.get(`${CDS_BASE}/`, () =>
    HttpResponse.json({
      services: [
        { hook: 'patient-view', id: 'athena-patient-view', title: 'Athena Clinical Decision Support', prefetch: { patient: 'Patient/{{context.patientId}}' } },
        { hook: 'order-sign', id: 'athena-order-sign', title: 'Athena Order Checks' },
      ]
    })
  ),

  // patient-view hook
  http.post(`${CDS_BASE}/athena-patient-view`, async ({ request }) => {
    const context = await request.json()
    const result = await cdsHooksService.getCards('patient-view', context)
    return HttpResponse.json(result)
  }),

  // order-sign hook
  http.post(`${CDS_BASE}/athena-order-sign`, async ({ request }) => {
    const context = await request.json()
    const result = await cdsHooksService.getCards('order-sign', context)
    return HttpResponse.json(result)
  }),

  // Override feedback endpoint — records the clinician's override reason for rate tracking
  http.post(`${CDS_BASE}/:serviceId/feedback`, async ({ request }) => {
    const feedback = await request.json()
    // In dev, log the override to the console; in test, the audit-verifier checks it
    console.debug('[CDS Feedback]', feedback)
    return new HttpResponse(null, { status: 204 })
  }),
]
```

### SyncConflictService — WatermelonDB conflict injection

This service is unique to Athena Field. WatermelonDB's push protocol aborts if a server record was modified since the client's `lastPulledAt`. This service simulates exactly that server response, so `ConflictResolutionDialog` can be exercised without coordinating two real offline devices.

```ts
// libs/clinical-mock/services/sync-conflict.service.ts
// Produces the conflict response shape that WatermelonDB's synchronize() expects.
// A clinical conflict is never auto-resolved — this service produces the payload
// that routes to ConflictResolutionDialog, the human-mediated resolution UI.

interface ConflictRecord {
  id: string
  table: string                  // WatermelonDB table name (e.g., 'visit_observations')
  field: string                  // the conflicting clinical field (e.g., 'systolicBP')
  localValue: unknown            // what the field-clinician recorded offline
  localUpdatedBy: string
  localUpdatedAt: string
  serverValue: unknown           // what another clinician updated on the server
  serverUpdatedBy: string
  serverUpdatedAt: string
}

export class SyncConflictService {
  private pendingConflicts: ConflictRecord[] = []

  injectBloodPressureConflict(patientId: string) {
    this.pendingConflicts.push({
      id: `obs-bp-${patientId}`,
      table: 'visit_observations',
      field: 'systolicBP',
      localValue: 128,
      localUpdatedBy: 'Dr. J. Martinez (field device)',
      localUpdatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
      serverValue: 145,
      serverUpdatedBy: 'Dr. P. Thompson (supervisor console)',
      serverUpdatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
    })
  }

  // Returns the conflicts payload as part of the sync push response
  getPushResponse(): { conflicts: ConflictRecord[] } {
    const conflicts = [...this.pendingConflicts]
    this.pendingConflicts = []
    return { conflicts }
  }

  hasPendingConflicts() { return this.pendingConflicts.length > 0 }
  reset() { this.pendingConflicts = [] }
}

export const syncConflictService = new SyncConflictService()
```

The MSW handler intercepts the sync push and returns the injected conflict:

```ts
// In fhir-overrides.handlers.ts — add the sync endpoint alongside FHIR overrides
http.post('/sync/push', async () => {
  if (syncConflictService.hasPendingConflicts()) {
    const response = syncConflictService.getPushResponse()
    return HttpResponse.json(response, { status: 409 })
  }
  return passthrough()
})
```

### AuditEventVerifier — verify PHI access is being logged

Unlike the fintech projects, Athena writes real FHIR `AuditEvent` resources to the Medplum sandbox. The `AuditEventVerifier` service queries Medplum after each test flow to confirm the expected events were written — proving the logging is real, not simulated.

```ts
// libs/clinical-mock/services/audit-verifier.service.ts
import { medplum } from '@libs/fhir/client/medplum-client'
import type { AuditEvent, Bundle } from '@medplum/fhirtypes'

export class AuditEventVerifier {
  // After a clinical action, verify the expected AuditEvent was written to Medplum
  async verifyChartAccess(practitionerId: string, patientId: string): Promise<boolean> {
    const bundle = await medplum.search('AuditEvent', {
      agent: `Practitioner/${practitionerId}`,
      'entity-what': `Patient/${patientId}`,
      type: 'read',
      _sort: '-date',
      _count: '1',
    }) as Bundle<AuditEvent>

    const events = bundle.entry?.map(e => e.resource) ?? []
    const recent = events[0]
    if (!recent) return false

    const eventAge = Date.now() - new Date(recent.recorded!).getTime()
    return eventAge < 10_000  // event written within the last 10 seconds
  }

  async verifyNoteSignOff(practitionerId: string, documentId: string): Promise<boolean> {
    const bundle = await medplum.search('AuditEvent', {
      agent: `Practitioner/${practitionerId}`,
      'entity-what': `DocumentReference/${documentId}`,
      type: 'update',  // signing transitions the document to final status
      _sort: '-date',
      _count: '1',
    }) as Bundle<AuditEvent>

    return (bundle.entry?.length ?? 0) > 0
  }
}

export const auditEventVerifier = new AuditEventVerifier()
```

---

## Demo Controls panel

A small in-app panel (visible only in `NODE_ENV === 'development'` builds, stripped in production) wires buttons to the service fault-injection methods. This makes every Gherkin scenario demoed in the Loom recording a button press rather than a timing gamble.

```tsx
// apps/athena-provider/src/components/DemoControls.tsx
// Only rendered in development builds — never ships to Vercel
if (import.meta.env.PROD) return null

const controls = [
  { label: 'Inject: vitals stale 5s',    action: () => observationFeedService.injectStaleFeed(6_000) },
  { label: 'Inject: vitals degraded 30s', action: () => observationFeedService.injectStaleFeed(31_000) },
  { label: 'Inject: vitals disconnected', action: () => observationFeedService.injectDisconnect() },
  { label: 'Inject: sequence gap',        action: () => observationFeedService.injectSequenceGap() },
  { label: 'Inject: entered-in-error vital', action: () =>
    observationFeedService.injectEnteredInError(DEMO_PATIENTS.vitalsMonitoring) },
  { label: 'Inject: CDS timeout',         action: () => cdsHooksService.forceTimeout() },
  { label: 'Inject: CDS critical only',   action: () => cdsHooksService.setCriticalOnly() },
  { label: 'Inject: FHIR 401',            action: () => fhirFaultService.setGlobalMode('401') },
  { label: 'Inject: FHIR 403',            action: () => fhirFaultService.setGlobalMode('403') },
  { label: 'Inject: FHIR 404',            action: () => fhirFaultService.setGlobalMode('404') },
  { label: 'Inject: FHIR 422',            action: () => fhirFaultService.setGlobalMode('422') },
  { label: 'Inject: sync conflict (BP)',  action: () =>
    syncConflictService.injectBloodPressureConflict(DEMO_PATIENTS.conflictResolution) },
  { label: 'Reset all faults',             action: () => {
    observationFeedService.injectStaleFeed(0)
    cdsHooksService.reset()
    fhirFaultService.reset()
    syncConflictService.reset()
  }},
]
```

---

## Applying the clinical never-show invariants as tests

The Gherkin spec defines seven "never-show" invariants (the clinical equivalent of "never show $0.00 while loading" from the fintech projects). The clinical mock layer makes each one testable as a Vitest unit test or Playwright E2E:

```ts
// VitalTile — entered-in-error is always filtered
test('entered-in-error Observation is never rendered as a valid clinical value', () => {
  const obs = observationFeedService.injectEnteredInError('patient-123').resource
  render(<VitalTile observation={obs} />)
  expect(screen.queryByText('250')).not.toBeInTheDocument()  // the implausible value is hidden
  expect(screen.getByText(/entered in error/i)).toBeInTheDocument()
})

// VitalTile — stale degrades at the 5-second threshold
test('VitalTile shows stale state after 5 seconds without an update', async () => {
  vi.useFakeTimers()
  render(<VitalTile lastUpdatedMs={Date.now()} />)
  expect(screen.getByTestId('freshness-state')).toHaveAttribute('data-state', 'live')
  act(() => vi.advanceTimersByTime(6_000))
  expect(screen.getByTestId('freshness-state')).toHaveAttribute('data-state', 'stale')
})

// AI documentation — unreviewed spans block signing
test('Sign is blocked when one or more spans have not been reviewed', async () => {
  render(<AIDocumentPanel note={NOTE_WITH_3_UNREVIEWED_SPANS} />)
  await userEvent.click(screen.getByRole('button', { name: /sign/i }))
  expect(screen.getByText(/3 unreviewed sections/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /sign/i })).toBeDisabled()
})

// CDS conflict — override requires a reason, feedback is sent
test('Critical CDS override requires a reason and sends feedback', async () => {
  server.use(...cdsHooksHandlers)
  cdsHooksService.setCriticalOnly()
  // ... render the alert, assert feedback endpoint was called with a reason
})

// Sync conflict — never auto-resolves, always routes to ConflictResolutionDialog
test('Sync conflict routes to resolution dialog — no auto-merge button exists', async () => {
  syncConflictService.injectBloodPressureConflict('patient-123')
  render(<ConflictResolutionDialog conflict={BLOOD_PRESSURE_CONFLICT} />)
  expect(screen.getByText('128')).toBeInTheDocument()   // local value
  expect(screen.getByText('145')).toBeInTheDocument()   // server value
  expect(screen.queryByRole('button', { name: /auto/i })).not.toBeInTheDocument()
})
```

---

## What this earns you

**Real FHIR infrastructure is the baseline, not a constraint to work around.** Clearline and Meridian demonstrate that you can design a correct system without building a backend. Athena demonstrates that you can integrate with a real, specification-compliant FHIR server, exercise SMART on FHIR OAuth against a real EHR simulator, and write real AuditEvents — and then layer deterministic fault injection on top for the clinical scenarios that a live server cannot reproduce on demand. That combination is a stronger statement than either approach alone.

**Fault injection surfaces the never-show invariants.** The staleness thresholds, the entered-in-error filter, the unreviewed-span sign-off gate — these are the invariants health tech hiring managers look for first. Because every fault is a button press in the Demo Controls panel, the Loom recording can demonstrate each one reliably rather than requiring a lucky timing window.

**The CDS Hooks service layer proves system-level understanding.** Knowing that a CDS Hooks service must respond within 500ms, that clinical workflow must never be blocked on a slow CDS response, that override reasons must be captured and sent to the feedback endpoint, and that override rates are a product metric — these are things you can assert in a live demo because `cdsHooksService.forceTimeout()` is a single method call.

**Sync conflict injection proves the clinical conflict-resolution story without two devices.** The `ConflictResolutionDialog` is the most distinctive piece of the Athena Field app — it is the engineering artifact that shows why last-write-wins is malpractice for clinical data. `syncConflictService.injectBloodPressureConflict()` makes this demonstrable in any test or recording without coordinating two physical devices going offline at the same time.

**AuditEvent verification closes the loop on HIPAA.** Saying "AuditEvents are written for every PHI access" in a README is a claim. The `AuditEventVerifier` service turns it into a verifiable test result: after viewing a chart, query Medplum and confirm the AuditEvent was written within the last 10 seconds. That's a different class of evidence.

---

## What this is *not*

The clinical mock layer is not a substitute for production HIPAA compliance, ONC certification, a real BAA with Anthropic/Medplum/Daily.co, or clinical safety validation. It is also not a substitute for a second, independently-deployed FHIR server that could participate in Pact-style contract verification — the Medplum sandbox IS the server, so the Pact argument from the fintech projects applies here in a different form: you already have a real server to test against, and consumer-contract tests against that same server would add no verification value beyond what Vitest integration tests already provide.

The boundary is clearly stated in the README: this is a portfolio project demonstrating that you understand the clinical frontend's responsibilities within a HIPAA-compliant, FHIR-native system. The fault injection layer makes the riskiest Gherkin scenarios exercisable in a controlled environment. It does not make the app production-ready for real patients.

---

## ADR-007: Clinical backend strategy — real Medplum FHIR server + surgical MSW fault injection

**Decision:** Athena Health Suite uses a real Medplum hosted FHIR R4 sandbox as its primary backend, populated with Synthea synthetic patients. MSW is used selectively to inject FHIR error states, FHIR Subscription faults, simulated CDS Hooks service responses, and WatermelonDB sync conflicts — scenarios the real Medplum server cannot produce reliably on demand. Consumer-driven contract testing (Pact) is not used.

**Rationale for using a real FHIR server:** A mock-only FHIR backend would miss the primary portfolio signal for health tech roles — the ability to integrate with a specification-compliant FHIR R4 server, exercise real SMART on FHIR OAuth, write real AuditEvents, and handle real FHIR `OperationOutcome` validation errors. Medplum's free hosted sandbox provides all of this at zero cost and is the correct choice.

**Rationale for MSW fault injection on top:** Four Gherkin scenario categories cannot be reliably exercised against the real Medplum server: FHIR error states (401/403/404/422/429/500), Subscription staleness thresholds (waiting 5 real minutes is impractical in tests), CDS Hooks responses (no CDS server in Medplum by default), and WatermelonDB push conflicts (requiring two offline devices simultaneously). MSW fills exactly these gaps without replacing the real server for anything it handles well.

**Rationale for excluding Pact:** Medplum is the independently-deployed provider. Pact's value is verifying that a consumer's expectations are met by a provider that verifies them independently — but the Medplum sandbox already does this implicitly for every real API call. Adding Pact would create a second test layer that tests the mock handler against itself rather than the real server. The integration test suite (Vitest against real Medplum + MSW fault injection) provides stronger coverage than Pact would in this context.

**Consequences:** Application code runs identically in local dev, Storybook, Vitest, and Playwright — the fault injection services and MSW handlers are the only test-environment-specific code. Never-show invariants are provable in unit tests. Every clinical scenario in the Gherkin spec is exercisable deterministically. The real Medplum server validates the happy-path FHIR interactions; the MSW layer validates every failure mode.

**Alternatives considered:**
- *Mock-only FHIR server (no real Medplum)* — rejected; loses SMART OAuth, real FHIR validation, and AuditEvent persistence, which are the primary health tech portfolio signals.
- *Full Medplum server with no MSW* — rejected; makes staleness-threshold testing impractical (5-minute real wait), makes CDS Hooks impossible (no built-in server), and makes sync conflict testing require two physical devices.
- *HAPI FHIR (Docker) instead of Medplum* — viable alternative for local dev; retained as the CI FHIR validator for US Core conformance checking, but Medplum is preferred for the hosted sandbox because it requires no local Docker dependency for demos and is HIPAA-eligible.
- *Pact consumer contract testing* — rejected for the reasons above; integration tests against real Medplum provide stronger verification than consumer-contract mocks in this architecture.
