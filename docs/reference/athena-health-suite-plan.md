# Athena Health Suite — A FHIR-Native Portfolio Project Plan for Health Tech Roles

*A React / TypeScript / React Native / Nx monorepo demonstrating clinician-facing and field-clinician engineering for home health, care coordination, and provider tool roles. Targets Axle Health, DispatchHealth, Cityblock Health, Hinge Health, Commure, Cedar, Medplum, Canvas Medical, Abridge, Spring Health, and Headway. Current to mid-2026.*

---

## Table of Contents

1. [TL;DR & Positioning](#tldr)
2. [The XOi Transfer Story](#xoi-transfer)
3. [Project Architecture](#architecture)
4. [Technology Choices](#technology)
5. [Shared Design System (@athena/ui)](#design-system)
6. [App 1 — Athena Provider (Web Clinician Console)](#athena-provider)
7. [App 2 — Athena Field (React Native Offline Field App)](#athena-field)
8. [User Stories & Acceptance Criteria](#user-stories)
9. [Error States, Unhappy Paths & Clinical Error Architecture](#error-states)
10. [Core Technical Patterns](#technical-patterns)
11. [HIPAA Compliance Patterns](#hipaa)
12. [AI Trust UX](#ai-trust)
13. [Testing Strategy](#testing)
14. [AI Usage Positioning](#ai-positioning)
15. [Spike Tasks](#spikes)
16. [Architecture Decision Records](#adrs)
17. [Data Sources & Infrastructure](#data-sources)
18. [Implementation Timeline (8 Weeks)](#timeline)
19. [Portfolio Presentation & README](#portfolio)
20. [Caveats](#caveats)

---

## 1. TL;DR & Positioning {#tldr}

**The single thesis: a FHIR-native platform for the clinician who works both at a desk and in the field.**

Two apps. One mission. Athena Provider is the web console where a supervising clinician reviews patient charts, monitors real-time vitals, handles CDS alerts, and reviews AI-drafted notes. Athena Field is the React Native app that field clinicians carry into homes, rural clinics, and facility basements — documenting visits offline, syncing back when connectivity returns, resolving clinical conflicts with provenance rather than silent overwrites.

These two surfaces are the exact workflow that Axle Health, Cityblock, DispatchHealth, and Hinge Health operate every day. The engineering signals health tech interviewers probe for — FHIR TypeScript types, SMART on FHIR OAuth, offline-first with clinical conflict resolution, AI trust UX with evidence linking, HIPAA-safe PHI handling — are all demonstrated across these two apps.

### What makes this portfolio land interviews

| Signal | Where it appears |
|---|---|
| `@medplum/fhirtypes` — zero `any` for FHIR | Every lib that touches a clinical resource |
| SMART on FHIR OAuth2 with PKCE | Athena Provider launch from smarthealthit.org |
| Offline-first with clinical conflict resolution | Athena Field — WatermelonDB sync |
| AI trust UX — evidence linking + HITL sign-off | AI documentation feature in Provider |
| HIPAA PHI architecture — no PHI in URLs/logs | Branded PHI types, scrubbing middleware |
| Alert fatigue design — tiered severity + override rates | CDS Hooks card rendering in Provider |
| Staleness indicators — never show stale vitals as current | Real-time vitals dashboard |
| ONC HTI-1 source attributes | AI model-facts panel |

### Target company tiers

| Tier | Company | Primary signal |
|---|---|---|
| **1** | Axle Health, DispatchHealth | Field app: offline + dispatch — direct XOi parallel |
| **1** | Cityblock Health | Field + home-based care coordination |
| **1** | Hinge Health | React Native, field clinicians, offline |
| **2** | Commure (FDE) | FHIR + SMART + HL7, forward-deployed engineering |
| **2** | Medplum | Open-source contribution + FHIR platform expertise |
| **2** | Canvas Medical | FHIR API + developer-platform awareness |
| **2** | Abridge, Spring Health, Headway | AI trust UX + clinician-facing FHIR |

---

## 2. The XOi Transfer Story {#xoi-transfer}

This is the framing that makes the portfolio immediately legible to health tech hiring managers.

| XOi field-service concept | Athena health tech analog |
|---|---|
| Dispatch a technician to a job site | Dispatch a clinician to a home visit |
| Work order lifecycle (assigned → en route → on-site → complete) | Encounter lifecycle (planned → arrived → in-progress → finished) |
| Offline mobile data capture in field (no connectivity in basements, rural areas) | Offline visit documentation — same connectivity failure modes |
| Complex configurable workflow forms | FHIR QuestionnaireResponse with SDC `enableWhen` conditional logic |
| Workflow automations and conditional logic | CDS Hooks decision support and clinical state machines |
| Audit / change logs | FHIR AuditEvent — immutable who/what/when for PHI access |
| Third-party integrations (Explo, Neighborly) | SMART on FHIR EHR integrations (Epic, Oracle Health) |
| Multi-role platform (dispatcher, technician, manager) | Multi-role clinical platform (physician, nurse, coordinator) |

The field app is not a stretch for this background — it is a near-exact technical analog. Lead with this in every interview.

---

## 3. Project Architecture {#architecture}

### Monorepo structure

```
athena-health-suite/
├── apps/
│   ├── athena-provider/            # React + Vite — web clinician console
│   ├── athena-field/               # Expo / React Native — offline field app
│   ├── storybook-host/             # Storybook for @athena/ui
│   ├── athena-provider-e2e/        # Playwright (web)
│   └── athena-field-e2e/           # Maestro (mobile)
└── libs/
    ├── ui/                         # @athena/ui — shared design system
    ├── fhir/
    │   ├── types/                  # re-exports @medplum/fhirtypes + branded PHI types
    │   ├── client/                 # MedplumClient wiring, search helpers
    │   ├── hooks/                  # wraps @medplum/react-hooks
    │   └── mappers/                # FHIR ↔ view-model transforms
    ├── clinical/
    │   ├── state-machines/         # XState: encounter, med order, prior-auth lifecycles
    │   ├── safety/                 # staleness guards, never-show invariants, error taxonomy
    │   └── cds/                    # CDS Hooks card rendering logic
    ├── ai/                         # Anthropic streaming, evidence linking, HITL
    ├── offline/                    # WatermelonDB schema, sync engine, outbox, conflict resolution
    ├── auth/                       # SMART on FHIR launch, biometric auth, auto-logoff
    ├── compliance/                 # Audit logging, PHI scrubbing, RBAC, BAA allowlist
    └── util/                       # Config, feature flags, telemetry (PHI-safe)
```

### Module boundaries (enforced via `@nx/enforce-module-boundaries`)

**One-way dependency direction:**
```
feature → ui, data-access, fhir/hooks, clinical, ai, offline, compliance, util
ui → ui, util
fhir/hooks → fhir/client, fhir/types, util
fhir/client → fhir/types, util
clinical → fhir/types, util
ai → fhir/types, util
offline → fhir/types, clinical, util
compliance → fhir/types, util
```

**Tags per library:**
- `scope:provider`, `scope:field`, `scope:shared`
- `type:feature`, `type:ui`, `type:data`, `type:domain`, `type:util`

`fhir/types` is a leaf — everything may import it, it imports nothing. `compliance` is imported by data/feature libs but never the reverse — PHI-handling logic is never downstream of feature code.

### Scaffolding

```bash
npx create-nx-workspace@latest athena-health-suite --preset=ts
npx nx add @nx/react && npx nx add @nx/expo
npx nx g @nx/react:app athena-provider --bundler=vite
npx nx g @nx/expo:app athena-field
npx nx g @nx/js:lib ui --directory=libs/ui        # @athena/ui
npx nx g @nx/js:lib fhir-types --directory=libs/fhir/types
# Tag each lib in project.json: scope + type
```

Run `nx graph` and include a screenshot in the README — a clean dependency graph is the first thing a platform engineer checks.

---

## 4. Technology Choices {#technology}

| Concern | Choice | Why |
|---|---|---|
| FHIR types | **`@medplum/fhirtypes`** | Complete R4 TS definitions; zero `any` for clinical data; actively maintained; no Mantine peer dep so it composes with a custom design system |
| FHIR client/hooks | **`@medplum/core` + `@medplum/react-hooks`** | `useResource`, `useSearch`, `useSubscription` (shared WebSocket); `MedplumClient` is the FHIR-request engine |
| Web build | **Vite + React** | Fast, standard, matches Cedar/Headway/Spring Health shops |
| Mobile | **Expo + React Native** | `@nx/expo` integration; EAS Build/Update; matches Hinge Health and Axle Health stacks directly |
| Offline DB | **WatermelonDB** | Reactive, SQLite-backed, lazy-loading; documented pull/push sync protocol; best-in-class for complex offline-first RN |
| Local encryption | **SQLCipher** (via WatermelonDB config) | HIPAA PHI at rest encrypted with device keystore |
| Clinical state machines | **XState v5** | Encounter, medication order, prior-auth lifecycles are finite-state problems; statechart diagrams are self-documenting |
| AI features | **`@anthropic-ai/sdk` (server-proxied)** | `.stream()`, `MessageStream`, `stream.abort()`, partial-content handling; BAA-eligible first-party API |
| Forms | **FHIR Questionnaire + SDC `enableWhen`** | Standards-based conditional logic; renders from a schema |
| Biometrics | **`react-native-keychain`** | Two-service pattern: unlocked namespace + biometric-gated namespace |
| Design system docs | **Storybook** | Clinical-domain stories per component state; mirrors Medplum's own Storybook |
| Synthetic data | **Synthea** | Realistic FHIR R4 patients; never real PHI in dev/test |
| Video (telehealth) | **Daily.co or AWS Chime SDK** | Both offer BAAs; document which in the BAA allowlist |

---

## 5. Shared Design System (`@athena/ui`) {#design-system}

### Token architecture (three tiers)

```
Primitives:   gray-900, red-600, amber-500, blue-600
      ↓
Semantic:     color-text-primary → gray-900
              color-alert-critical → red-600
              color-alert-advisory → amber-500
              color-status-stale → orange-500
              color-status-preliminary → blue-400
              color-status-final → gray-900
              color-status-entered-in-error → red-300 (with strikethrough)
      ↓
Component:    alert-critical-bg → color-alert-critical (with opacity)
```

Style Dictionary transforms JSON tokens into CSS variables (web) and JS objects (React Native) from a single source of truth.

### Clinical severity system (never color-alone)

Every severity level carries icon + text + color to satisfy WCAG 1.4.1:

| Level | Clinical meaning | Visual treatment |
|---|---|---|
| `critical` | Requires immediate action | 🔴 icon + "Critical" text + red background; focus-trapped modal |
| `advisory` | Should be reviewed | 🟡 icon + "Advisory" text + amber; non-blocking inline |
| `informational` | Awareness only | 🔵 icon + "Info" text + blue; dismissible |
| `stale` | Data freshness warning | ⚠ icon + "Last updated {time}" + orange |
| `preliminary` | Unconfirmed observation | 🔵 "Unconfirmed" badge + blue tint |
| `entered-in-error` | Invalid — never treat as clinical data | ~~strikethrough~~ + "Entered in error" label; filtered by default |

### Clinical components

- **`VitalTile`** — live value + LOINC code + UCUM unit + freshness state (`live` / `stale` / `disconnected`) + last-updated timestamp. Never shows a stale value with `live` styling.
- **`ObservationStatusBadge`** — one badge per FHIR `Observation.status` value with icon + text.
- **`AlertCard`** — CDS Hooks card with `indicator` severity, summary, detail, source attribution, and accept/override actions. Override requires a reason.
- **`AIDocumentPanel`** — editable AI-drafted note with per-sentence evidence links, confidence indicators, and a sign-off button that warns on unreviewed spans.
- **`SyncStatusBar`** — global sync state (all synced / N pending / conflict / error) + per-record badges.
- **`ConflictResolutionDialog`** — shows both versions of a conflicted clinical value with provenance (who, when, device) and requires an explicit choice.
- **`QuestionnaireRenderer`** — dynamic form from a FHIR `Questionnaire` resource with `enableWhen` conditional logic, SDC validation, and `QuestionnaireResponse` output.
- **`PHIMaskedField`** — auto-masks PHI in display; reveals on explicit interaction; logs the reveal as an audit event.

### WCAG 2.1 AA built in

- Text contrast ≥ 4.5:1; large text ≥ 3:1; non-text UI ≥ 3:1 (SC 1.4.11)
- No color-only alerts (SC 1.4.1) — always icon + text + color
- 44×44px minimum touch targets (mobile)
- Full keyboard navigation; visible 3px focus ring
- Screen-reader announcements via `role="alert"` for critical alerts and `AccessibilityInfo.announceForAccessibility` on mobile
- Storybook a11y addon on every story; failures block CI

---

## 6. App 1 — Athena Provider (Web Clinician Console) {#athena-provider}

**Target users:** physicians, nurses, supervising clinicians reviewing field visits.
**Target employers:** Abridge (AI documentation), Commure (forward-deployed EHR tooling), Canvas Medical (FHIR-native EHR), Spring Health, Headway.

### Core features

1. **Patient chart** — FHIR R4 resources: Patient, Condition, MedicationRequest, Encounter, DiagnosticReport. US Core Must Support fields handled defensively. `entered-in-error` observations filtered by default.
2. **Real-time vitals dashboard** — FHIR Subscriptions (R4B backport) via `useSubscription`; staleness indicators at 5s / 30s / 2min; Critical alert interruption; never shows stale vitals as current.
3. **CDS Hooks alert rendering** — tiered severity (Critical/Advisory/Informational), accept/override with required-reason capture, override-rate tracking via CDS Hooks feedback endpoint.
4. **AI documentation assistant** — ambient note review: streaming transcript → LLM → SOAP note draft; evidence-linked sentences; mandatory HITL sign-off; ONC HTI-1 model-facts panel.
5. **Prior authorization tracker** — multi-step async workflow (draft → submitted → pending → approved/denied); CMS-0057-F 72-hour urgent / 7-day standard thresholds.

### Key architectural decisions

- SMART on FHIR EHR launch with PKCE against `launch.smarthealthit.org` (no-registration sandbox)
- CDS Hooks cards rendered client-side; suggestions act on EHR scratchpad, not the FHIR server directly
- AI note is always in `draft` state until clinician signs; signing is a logged, deliberate action
- FHIR search uses `_include` to co-fetch related resources in one round-trip; `_elements` to slim payloads
- Scoped error boundaries: vitals boundary, AI documentation boundary, chart-section boundary, CDS boundary — a crash in the AI panel never takes down the medication list

---

## 7. App 2 — Athena Field (React Native Offline Field App) {#athena-field}

**Target users:** home-health nurses, field clinicians, paramedics, care coordinators on the road.
**Target employers:** Axle Health (TypeScript/RN/GraphQL, serves Cityblock), DispatchHealth, Cityblock Health, Hinge Health.

### Core features

1. **Offline-first visit documentation** — WatermelonDB + SQLCipher; local DB is source of truth; sync when connectivity returns; clinical conflict resolution (NOT last-write-wins).
2. **FHIR QuestionnaireResponse forms** — SDC `enableWhen` conditional logic; rendered from server-pushed `Questionnaire` schemas; offline-capable.
3. **Biometric auth** — `react-native-keychain` two-service pattern; biometric-enrollment-change detection forces re-auth.
4. **Clinical photo capture** — `react-native-vision-camera`; EXIF/GPS stripped before storage (PHI); offline queue.
5. **Real-time visit dispatch** — visit queue with assigned/en-route/on-site/complete states (the XOi parallel); push notifications for new assignments.
6. **Sync status UI** — explicit per-record badges (synced/pending/conflict/failed) + global indicator; clinician always knows whether documentation has reached the server.

### Key architectural decisions

- WatermelonDB pull/push sync: pull server changes since `lastPulledAt`; push local creates/updates/deletes; if a pushed record changed server-side since `lastPulledAt`, the server rejects and the client re-pulls
- **Clinical conflict resolution is human-mediated** — `ConflictResolutionDialog` shows both versions with provenance; never auto-overwrites a clinical value. Field-level merge for non-clinical fields (e.g., visit timestamps); human resolution for clinical data (vitals, assessments, medications).
- Offline outbox: append-only queue with per-entry state (PENDING / IN_FLIGHT / SYNCED / CONFLICT / FAILED); replayed on reconnect
- PHI at rest encrypted via SQLCipher + iOS Data Protection / Android Keystore; remote-wipe capability (server flag → app clears DB + Keychain on next contact)
- Biometric unlock gates token retrieval from the Keychain service, not a separate API call — `accessControl: BIOMETRY_CURRENT_SET`, `accessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`

---

## 8. User Stories & Acceptance Criteria {#user-stories}

*Each story covers: happy path, unhappy paths (technical + clinical), patient safety criteria, HIPAA criteria, and accessibility criteria.*

---

### Story 1 — Real-time vitals review (Athena Provider)

**As a supervising clinician, I want to monitor a field patient's real-time vitals, so that I can intervene if their condition deteriorates.**

**Happy path:**
- Given a connected Subscription feed, When a new vital-signs Observation arrives with status `final`, Then it renders within ~1s in the VitalTile with a `live` pulsing badge, LOINC code, UCUM unit, and timestamp.

**Unhappy — feed disconnects:**
- Given the WebSocket drops, When 5s pass without a heartbeat, Then VitalTile flips to `stale` (grey + "last updated {time}"); live animation stops; prices never continue pulsing as if live.
- When 30s pass, Then a persistent banner: "Vitals feed delayed — reconnecting…" Auto-reconnect with exponential backoff.
- When 2+ minutes pass, Then vitals are hidden behind "No current data" warning. **Critical alerts are disabled until feed recovers.**
- **Patient safety:** A clinician must never read a stale vital as a current one. Stale values must be visually unambiguous at every threshold.

**Unhappy — `entered-in-error` Observation arrives:**
- Then the value is filtered from all clinical lists; if already displayed, it is immediately struck-through and labeled "Entered in error." It is never actionable or alertable.
- **Patient safety:** Displaying an `entered-in-error` value as valid clinical data is a safety event.

**Unhappy — `preliminary` Observation:**
- Then it renders with a blue "Unconfirmed" badge. Never styled as a `final` result.

**Unhappy — sequence gap in Subscription notifications:**
- Given a `SubscriptionStatus` event number is missing, Then the client re-fetches via `$events` or re-subscribes; interim values are marked "uncertain" rather than hidden or silently stale.

**HIPAA:** Viewing vitals emits a FHIR `AuditEvent` (practitioner ID, patient ID, resource, timestamp). Auto-logoff fires after 15 minutes of inactivity.

**Accessibility:** Each VitalTile is labeled with `aria-label="Systolic BP: 128 mmHg, final, updated 2 minutes ago"`. Freshness state is conveyed by text + icon, never color alone.

---

### Story 2 — CDS Hooks alert handling (Athena Provider)

**As a clinician, I want CDS alerts tiered by severity so that I don't ignore every alert due to fatigue.**

**Happy path:**
- Given a `patient-view` hook fires, When the CDS service returns cards, Then Critical cards open a focus-trapped modal requiring acknowledgment; Advisory cards surface inline non-blocking; Informational cards appear in a collapsible panel.

**Unhappy — CDS service timeout (> 500ms):**
- Then the EHR does not block on the slow service; prefetch data is shown if available; a "Decision support unavailable" indicator appears. Clinical workflow is never blocked waiting for a CDS response.

**Unhappy — clinician overrides a Critical alert:**
- Then a reason selector is required before override is accepted. The override reason + timestamp + clinician ID are sent to the CDS feedback endpoint. Override rate is tracked per alert type.

**Unhappy — suggestion accepted:**
- Then the suggestion's FHIR actions modify the EHR **scratchpad** (draft state), not the FHIR server directly. The clinician still has to explicitly save/sign the chart update.

**Patient safety:** Override rates above a configurable threshold surface a "High override rate" dashboard indicator — alert fatigue is measured, not assumed.

---

### Story 3 — AI documentation sign-off (Athena Provider)

**As a clinician, I want to review, edit, and sign an AI-drafted note so that the final record is accurate and I am accountable for it.**

**Happy path:**
- Given an ambient recording completes, When the AI pipeline produces a SOAP note draft, Then each sentence displays an evidence link (click → transcript segment + timestamp); the note is fully editable; status is "Draft — not filed."
- When I review, edit, and click Sign, Then the note transitions to `final`; a `AuditEvent` records clinician ID + timestamp + review confirmation; the note is filed to the FHIR server.

**Unhappy — signing with unreviewed AI spans:**
- Given one or more note sentences have not been clicked (evidence link not reviewed), When I click Sign, Then a hard warning lists the unreviewed spans: "You have {n} unreviewed sections. Review them before signing." Sign is blocked until each is either reviewed, edited, or explicitly confirmed.
- **Patient safety:** No unreviewed AI content may silently enter the signed clinical record.

**Unhappy — streaming interrupted mid-note:**
- Then partial note is preserved; marked "Incomplete — do not sign"; a "Resume" or "Start over" option is offered.

**Unhappy — confabulation detected (span with no grounded transcript evidence):**
- Then the span is highlighted in amber with a "No source found — review carefully" label. It is not blocked, but it is visually distinct and must be explicitly confirmed before signing.

**Unhappy — model rate limited:**
- Then: "Documentation assistant is busy. You can write manually while we retry." Manual charting is never blocked.

**HIPAA:** Transcript audio and AI-processed text are PHI; the Anthropic API is called server-side with a signed BAA; PHI never touches client-side logging or analytics.

---

### Story 4 — Offline visit documentation (Athena Field)

**As a field clinician, I want to document a home visit with no signal so that connectivity never interrupts patient care.**

**Happy path:**
- Given no network connectivity, When I complete visit documentation (vitals entry, QuestionnaireResponse, clinical notes, photos), Then all data is saved to the local encrypted SQLite DB; outbox entry created with status `PENDING`; I see "Saved on device — syncing when connected."

**Unhappy — sync conflict (another clinician updated the same field):**
- Given I return online and push, When the server rejects because the field was updated remotely during my offline period, Then `ConflictResolutionDialog` opens showing: (a) my version with my name + timestamp, (b) the server version with the other clinician's name + timestamp; I must explicitly choose or merge. **No auto-merge of clinical data.**
- **Patient safety:** Silent overwrites of clinical values are never acceptable. If blood pressure was recorded twice with different values, a human must resolve it.

**Unhappy — offline queue full:**
- Then: "You have {n} visits waiting to sync. Connect soon to avoid storage issues." Block new photo captures with guidance to sync first.

**Unhappy — camera permission denied:**
- Then: dialog "Allow camera access in Settings to capture wound photos." Deep-link to Settings. Never silently fail.

**Unhappy — biometric enrollment changed (security event):**
- Given Face ID was re-enrolled since last session, When I open the app, Then the stored token is invalidated; "Your device's biometrics changed — please sign in again to re-enable Face ID." Never bypass this check.

**Unhappy — return online after extended offline (> 4 hours):**
- Then: cached data older than the safety threshold is flagged as potentially stale; app shows "Updating your data…" with progress; clinician sees a "Verify before relying on" indicator on cached clinical values until refresh completes.

**Unhappy — push notification for a stale context:**
- Given a push notification references a visit, When I tap it after a delay, Then the app re-fetches the current resource before rendering. Never renders the notification's embedded snapshot as live data.

**HIPAA:** Local SQLite encrypted with SQLCipher + device Keystore (Android) / Data Protection (iOS). Token stored in `react-native-keychain` with `accessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Remote-wipe triggered by server flag on next contact.

**Accessibility:** 44×44px touch targets on all primary actions; plain-language error messages; critical errors announced via `AccessibilityInfo.announceForAccessibility`.

---

### Story 5 — SMART on FHIR EHR launch (Athena Provider)

**As a clinician, I want to launch Athena Provider from within the EHR so that patient context is passed automatically.**

**Happy path:**
- Given the EHR calls my registered launch URL with `iss` and `launch`, Then I fetch `{iss}/.well-known/smart-configuration`, redirect to `authorization_endpoint` with PKCE (S256) + `state` (≥128 bits entropy) + `launch` scope, exchange the code at `token_endpoint`, and receive patient/encounter context in the token response. No patient picker needed — context arrives automatically.

**Unhappy — launch context missing patient:**
- Then: block the clinical view; show "No patient context — relaunch from the EHR." Never attempt to show a generic chart without knowing which patient.
- **Patient safety:** Operating on the wrong patient is a never-event. Missing context must hard-stop.

**Unhappy — state parameter mismatch (CSRF signal):**
- Then: abort the flow immediately; show "Sign-in couldn't be verified — please try again." Log the event. Never proceed.

**Unhappy — insufficient scope for requested resource:**
- Then: degrade the specific panel ("Medications unavailable — insufficient scope") without crashing the rest of the chart.

**Unhappy — token expired during an active encounter:**
- Then: silent refresh using the refresh token; queue in-flight FHIR calls; replay after refresh. If refresh fails, preserve the current draft documentation locally and show a re-auth modal: "Your session needs to refresh. Your work is saved."

---

### Story 6 — QuestionnaireResponse form (Athena Field)

**As a field clinician, I want to complete an intake form on my phone so that structured clinical data is captured consistently.**

**Happy path:**
- Given a `Questionnaire` is pushed to the device, When I open the form, Then items render in order; `enableWhen` conditions hide/show items dynamically as I enter values; required fields are marked; the completed `QuestionnaireResponse` is saved locally (offline) and queued for sync.

**Unhappy — `enableWhen` conditional failure:**
- Given a conditional logic error (e.g., the referenced item ID doesn't exist), Then the item is shown (fail safe — never hide a question due to a logic error). The error is logged.

**Unhappy — required FHIR element missing on submit:**
- Then: inline field-level error in plain language: "Please enter the patient's pain level." Never technical FHIR error codes to the clinician.

**Unhappy — invalid code system value:**
- Then: reject with allowed options shown. Never store an unbound code that would fail FHIR validation on the server.

**Unhappy — sync fails on re-connect:**
- Then: keep the `QuestionnaireResponse` in the outbox as `FAILED`; show per-record "Failed to sync — tap to retry." Never lose the data.

---

## 9. Error States, Unhappy Paths & Clinical Error Architecture {#error-states}

### Clinical error taxonomy

| Tier | Definition | UI surface | Clinical safety implication |
|---|---|---|---|
| **Patient-Safety-Critical** | Could lead to a wrong clinical decision | Block/hide + force-stop | Highest. Never show stale-as-current, `entered-in-error`-as-valid, AI-as-signed-before-review |
| **Clinical-Recoverable** | Operation failed; data integrity intact | Preserve input; offer retry/resolution | Moderate. No data loss; clinician can re-attempt |
| **Degraded** | Reduced capability; safe to continue | Persistent non-blocking banner | Low. Chart is available; one feature is down |
| **Validation** | User-correctable input error | Inline field, plain language | Informational. Clinician fixes and retries |
| **Informational** | Awareness; no action needed | Dismissible helper text | None |

### The never-show list (health tech's "$0.00 while loading")

These invariants must be encoded in code and enforced by tests:

- ❌ **Never show stale vitals as current** — after threshold, degrade VitalTile to `stale`/`disconnected`
- ❌ **Never show `entered-in-error` Observations as valid** — filter by default; only show struck-through with label
- ❌ **Never show `preliminary` results as `final`** — always badge them as "Unconfirmed"
- ❌ **Never show AI output as signed/final before clinician review and sign-off**
- ❌ **Never show absent data as `0` or as "normal"** — absent ≠ zero ≠ in-range. Show "—" or "Not recorded"
- ❌ **Never show an unknown FHIR status as normal** — map unknown codes to "Unrecognized status — review in source system"
- ❌ **Never show unverified prior-auth as approved** — show "Status unknown — do not assume approved"

### FHIR API error states

| Scenario | UX response | Copy | Safety |
|---|---|---|---|
| 401 token expired | Silent refresh; if fail → re-auth modal | "Your session needs to refresh. Your work is saved." | No silent data loss |
| 403 scope insufficient | Degrade the specific panel | "You don't have access to this information." | Minimum-necessary access enforced |
| 404 resource not found | Explain; don't fabricate | "This record may have been moved or removed." | Never invent a placeholder resource |
| 422 FHIR validation failure | Parse `OperationOutcome.issue[]`, map to fields | Plain-language per-field | Invalid clinical data never persisted |
| 429 rate limited | Exponential backoff; respect `Retry-After` | "Loading is taking longer than usual." | — |
| 500 server error | Scoped error boundary; retry; report (scrubbed) | "Something went wrong on our end." | Never crash the whole chart |
| Network timeout | Distinguish from offline; retry with backoff | "This is taking longer than usual — retrying." | Preserve in-progress documentation locally |

### Real-time vitals / WebSocket errors

| Scenario | UX | Copy | Safety |
|---|---|---|---|
| Disconnect | Auto-reconnect with backoff; stale badges | "Vitals feed delayed. Reconnecting…" | Stale ≠ current — visually unambiguous |
| Sequence gap in Subscription | Re-sync; mark uncertain | "Resyncing…" (brief, inline) | No wrong data displayed |
| Device data quality (motion artifact) | Show `dataAbsentReason` / quality flag | "Signal quality low" | Suppress implausible values |
| Threshold alert pipeline unavailable | Show "alerts unavailable" | "Monitor manually — alert system unavailable" | Clinician never assumes silence = safe |

### Auth and session errors

| Scenario | Response | Copy |
|---|---|---|
| Token expired (web) | Silent refresh → replay | Transparent |
| Token expired (mobile — mid-visit) | Preserve local work; prompt re-auth | "Session timed out. Your work is saved — sign in to continue." |
| Biometric lockout (too many attempts) | Fallback to passcode | "Too many attempts. Use your passcode." |
| Biometric enrollment changed | Force re-auth + clear stored tokens | "Your device's biometrics changed. Sign in again to re-enable Face ID." |
| SMART state mismatch | Hard abort | "Sign-in couldn't be verified. Please try again." |
| SMART launch — no patient context | Hard block | "No patient context — relaunch from the EHR." |

### Offline and sync errors

| Scenario | UX | Copy |
|---|---|---|
| Fully offline | Allow all documentation; queue in outbox | "You're offline. Work is saved on device and will sync automatically." |
| Sync conflict | Human-mediated resolution dialog | Show both versions + provenance; require explicit choice |
| Outbox full | Warn; block heavy captures | "Connect soon to sync {n} pending visits." |
| Sync failure on reconnect | Per-record retry | "Failed to sync — tap to retry." |
| Long offline (> 4 hours) | Flag stale cache | "Verify before relying on older cached data." |

### AI documentation errors

| Scenario | UX | Copy | Safety |
|---|---|---|---|
| Stream interrupted | Keep partial; mark incomplete | "Incomplete — do not sign." | Clinician never signs a truncated note unknowingly |
| Confabulation detected | Highlight + flag; require confirmation | "No source found — review carefully." | Errors surfaced for human review |
| Confidence below threshold | Flag span; require confirmation | "Low confidence — please verify." | — |
| Model rate limited | Degrade gracefully | "Assistant is busy. You can write manually." | Never blocks charting |
| Sign with unreviewed spans | Hard warning; block until confirmed | "Review {n} sections before signing." | Core patient-safety gate |

### React error boundary scoping

One boundary per clinical concern — a crash in one section never blanks another:

- `VitalsBoundary` — real-time data
- `AIDocumentBoundary` — ambient scribing
- `MedicationsBoundary` — medication list
- `ChartSectionBoundary` — per chart tab
- `CdsBoundary` — alert rendering
- `PriorAuthBoundary` — PA workflow

React's docs note boundaries **do not catch** event-handler or async errors — bridge these by catching in handlers and calling `showBoundary` or setting local error state.

---

## 10. Core Technical Patterns {#technical-patterns}

### FHIR types with `@medplum/fhirtypes` — zero `any`

```tsx
import type { Patient, Observation, HumanName } from '@medplum/fhirtypes'

// ✅ Correct — Patient.name is HumanName[], not string
function displayName(patient: Patient): string {
  const name: HumanName | undefined = patient.name?.[0]
  if (!name) return 'Unknown'
  const given = name.given?.join(' ') ?? ''
  const family = name.family ?? ''
  return `${given} ${family}`.trim()
}

// ✅ Correct — Observation.valueQuantity is typed; unit and system are required
function formatVital(obs: Observation): string {
  const vq = obs.valueQuantity
  if (!vq) return '—'   // absent ≠ zero — show dash
  return `${vq.value} ${vq.unit}`
}
```

### Branded PHI type — compile-time safety

```ts
// libs/fhir/types/phi.ts
declare const __phi: unique symbol
type PHI<T> = T & { readonly [__phi]: true }

// Mark a value as PHI at the point of receipt
function markPHI<T>(value: T): PHI<T> {
  return value as PHI<T>
}

// Logging/analytics functions accept only non-PHI strings
function logEvent(event: string, properties: Record<string, string>): void {
  // `string` — NOT `PHI<string>` — required here
  // TypeScript will error if you try to pass a PHI<string> directly
}

// Usage
const patientName = markPHI(patient.name?.[0]?.family ?? '')
// logEvent('chart_viewed', { name: patientName }) // ← compile error ✅
logEvent('chart_viewed', { resourceType: 'Patient' })  // ✅ safe
```

### FHIR search patterns

```ts
import { useMedplum } from '@medplum/react-hooks'
import type { Bundle, Observation } from '@medplum/fhirtypes'

function useVitalSigns(patientId: string) {
  const medplum = useMedplum()
  return useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () =>
      medplum.search('Observation', {
        patient: patientId,
        category: 'vital-signs',
        _sort: '-date',
        _count: '20',
        // Filter out entered-in-error at the query level
        'status:not': 'entered-in-error',
      }) as Promise<Bundle<Observation>>,
  })
}
```

### Observation status lifecycle in the UI

```ts
type ObsStatus = Observation['status'] // 'registered'|'preliminary'|'final'|'amended'|'corrected'|'cancelled'|'entered-in-error'|'unknown'

function statusDisplay(status: ObsStatus | undefined): {
  label: string; variant: 'final' | 'preliminary' | 'error' | 'unknown'
} {
  switch (status) {
    case 'final':
    case 'amended':
    case 'corrected':     return { label: 'Final', variant: 'final' }
    case 'preliminary':   return { label: 'Unconfirmed', variant: 'preliminary' }
    case 'entered-in-error': return { label: 'Entered in error', variant: 'error' }
    default:              return { label: 'Unrecognized status', variant: 'unknown' }
  }
}
// Never render 'entered-in-error' as a valid clinical value.
// Unknown status → 'Unrecognized status — review in source system.'
```

### SMART on FHIR launch (EHR launch with PKCE)

```ts
// libs/auth/smart-launch.ts
async function launchFromEHR(launchUrl: URL) {
  const iss = launchUrl.searchParams.get('iss')!
  const launch = launchUrl.searchParams.get('launch')!

  // Discover endpoints
  const config = await fetch(`${iss}/.well-known/smart-configuration`).then(r => r.json())

  // PKCE
  const codeVerifier = generateCodeVerifier()           // 43–128 random chars
  const codeChallenge = await sha256base64url(codeVerifier)

  // CSRF state — ≥128 bits entropy
  const state = crypto.randomUUID()
  sessionStorage.setItem(`smart_state_${state}`, codeVerifier)  // verifier stored; state is the key

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SMART_CLIENT_ID,
    redirect_uri: SMART_REDIRECT_URI,
    scope: 'launch patient/Observation.rs patient/MedicationRequest.rs openid fhirUser',
    state,
    launch,
    aud: iss,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${config.authorization_endpoint}?${params}`
}

async function handleCallback(callbackUrl: URL) {
  const state = callbackUrl.searchParams.get('state')!
  const code = callbackUrl.searchParams.get('code')!

  // CSRF check — abort on mismatch
  const codeVerifier = sessionStorage.getItem(`smart_state_${state}`)
  if (!codeVerifier) throw new Error('State mismatch — possible CSRF')
  sessionStorage.removeItem(`smart_state_${state}`)

  // Exchange code
  const tokens = await fetch(config.token_endpoint, { method: 'POST', body: new URLSearchParams({
    grant_type: 'authorization_code', code, redirect_uri: SMART_REDIRECT_URI,
    client_id: SMART_CLIENT_ID, code_verifier: codeVerifier,
  })}).then(r => r.json())

  return tokens  // { access_token, patient, encounter, ... }
}
```

### WatermelonDB offline sync with clinical conflict resolution

```ts
// libs/offline/sync.ts
import { synchronize } from '@nozbe/watermelondb/sync'

async function syncVisitData(database: Database) {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await api.get('/sync/pull', { params: { lastPulledAt } })
      return response.data  // { changes, timestamp }
    },
    pushChanges: async ({ changes }) => {
      const result = await api.post('/sync/push', changes)
      // If server returns conflict records, route them to resolution UI
      if (result.conflicts?.length) {
        conflictStore.set(result.conflicts)
      }
    },
  })
}

// Conflict resolution: human-mediated, never auto-merge clinical values
interface ClinicalConflict {
  recordId: string
  field: string
  localValue: unknown;  localUpdatedBy: string;  localUpdatedAt: string
  serverValue: unknown; serverUpdatedBy: string; serverUpdatedAt: string
}

// ConflictResolutionDialog presents both versions with provenance
// and writes the chosen value back to WatermelonDB + queues for re-sync
```

### Anthropic streaming for clinical insights (server-proxied)

```ts
// server/routes/ai-insights.ts  (Next.js API route or Express)
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()  // reads ANTHROPIC_API_KEY from env — never client-side

export async function POST(req: Request) {
  const { patientContext } = await req.json()  // de-identified or under BAA

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: buildClinicalPrompt(patientContext) }],
  })

  // SSE to client — client renders tokens progressively
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      stream.on('text', (text) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      })
      await stream.finalMessage()
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } })
}
```

Client-side abort: `AbortController` → `fetch` abort → server stream abandons on disconnect.

---

## 11. HIPAA Compliance Patterns {#hipaa}

### The rules baked into architecture

- **No PHI in URLs** — route on opaque FHIR resource IDs only; names/DOB never in query strings (they appear in server logs, browser history, referrer headers)
- **No PHI in localStorage** — use in-memory state + session-storage for non-PHI only
- **No PHI in analytics** — standard analytics tools have no BAA; use a PHI-safe event schema (resource type + action, never patient identifiers)
- **No PHI in error logs** — `beforeSend` in Sentry strips all request bodies and scrubs known PHI keys; only error type + stack + scrubbed context leaves the device
- **PHI-safe telemetry pattern:** log `{ event: 'vitals_viewed', resourceType: 'Observation' }` — never `{ event: 'vitals_viewed', patientName: 'Jane Doe' }`

### Session auto-logoff (`useAutoLogoff`)

```tsx
// libs/auth/use-auto-logoff.ts
export function useAutoLogoff(timeoutMs = 15 * 60 * 1000) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        clearTokens()          // clear in-memory access token
        clearKeychain()        // clear RN keychain (mobile)
        router.replace('/login?reason=timeout')
      }, timeoutMs)
    }
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)) }
  }, [timeoutMs])
}
```

### RBAC at the UI layer

```tsx
// libs/compliance/rbac.tsx
type Role = 'physician' | 'nurse' | 'coordinator' | 'admin'
type Permission = 'sign:note' | 'view:chart' | 'edit:medication' | 'view:billing'

const rolePermissions: Record<Role, Permission[]> = {
  physician:   ['sign:note', 'view:chart', 'edit:medication'],
  nurse:       ['view:chart', 'edit:medication'],
  coordinator: ['view:chart'],
  admin:       ['view:billing'],
}

function useCan(permission: Permission): boolean {
  const { role } = useCurrentUser()
  return rolePermissions[role]?.includes(permission) ?? false
}

function RoleGate({ allow, children }: { allow: Permission; children: ReactNode }) {
  const can = useCan(allow)
  return can ? <>{children}</> : null  // never render; never just disable
}

// Usage: <RoleGate allow="sign:note"><SignButton /></RoleGate>
```

### BAA allowlist (document in README)

Services confirmed BAA-eligible (verify before each integration — terms change):
- ✅ Anthropic first-party API (HIPAA-ready Enterprise / BAA-eligible; consumer Free/Pro/Max/Team plans are NOT)
- ✅ AWS (Bedrock, Chime SDK — account-level BAA via AWS Artifact)
- ✅ Daily.co (BAA-eligible video with Healthcare add-on)
- ✅ Sentry (BAA available — still scrub PHI in `beforeSend`)
- ✅ Medplum hosted sandbox (HIPAA-eligible)
- ❌ Standard Google Analytics (no BAA — do not send PHI)
- ❌ Standard Firebase (no BAA — do not send PHI)
- ❌ Consumer ChatGPT / Claude.ai (no BAA — never send real PHI)

---

## 12. AI Trust UX {#ai-trust}

### The evidence-linking pattern (Abridge-style)

Every AI-generated sentence links to its source transcript span. Clicking the sentence highlights the transcript excerpt and seeks to the audio timestamp. This is the primary mechanism for catching confabulations — a hallucinated medication has no evidence link, so it is immediately visible.

**Implementation:** The LLM is prompted to produce structured output: `[{ text, start_ms, end_ms, confidence }]` per sentence, alongside the prose note. The frontend renders the note with each sentence wrapped in a `<EvidenceLink>` component. Sentences with no associated span are rendered with an amber `⚠ No source found` indicator.

### ONC HTI-1 model-facts panel

For any AI feature in a certified EHR context, surface the HTI-1 source attributes in a collapsible "About this AI" panel:

```
Purpose: Clinical documentation assistance — drafts SOAP notes from recorded encounters
Intended population: Adult outpatient and home-health encounters (English)
Training data: De-identified clinical encounter transcripts
Validation: Internal benchmark of 10,000+ encounters; 97% confabulation detection rate (Abridge Aug 2025 whitepaper — self-reported)
Fairness assessment: Evaluated for performance variance by specialty and patient age
Known limitations: May miss context from non-verbal cues; accuracy varies by specialty; requires clinician review
Last reviewed: [date]
```

This panel is not marketing — it is a regulatory compliance surface under HTI-1 (31 source attributes for Predictive DSIs effective January 1, 2025) and demonstrates you know what HTI-1 requires.

### The three HITL gates (hard requirements)

1. **Review gate** — clinician must open and read the note (evidence-link interactions tracked)
2. **Edit gate** — clinician may edit any character; edits are preserved and attributed
3. **Sign gate** — signing is an explicit action with a dialog warning on unreviewed spans; the signed note records the clinician's identity + timestamp; the AI is not a signatory

---

## 13. Testing Strategy {#testing}

| Layer | Tool | What it proves |
|---|---|---|
| Property-based | **fast-check** | FHIR resource parsing edge cases (missing Must Support elements, unknown status codes); staleness threshold logic; conflict-resolution invariants |
| Unit | **Vitest** | Domain logic: observation status routing, never-show guards, clinical state machine transitions, PHI scrubbing |
| Component | **React Testing Library** | VitalTile states (live/stale/disconnected), AlertCard severity rendering (icon+text+color), `entered-in-error` filter, `preliminary` badge |
| Contract | **Pact** | Frontend FHIR client vs Medplum backend; ensures search params and resource shapes stay aligned |
| E2E | **Playwright** (web), **Maestro** (mobile) | SMART on FHIR launch, vitals staleness threshold, AI note sign-off with unreviewed span warning, offline visit + conflict resolution |
| Accessibility | **axe-playwright** | WCAG 2.1 AA on every clinical UI surface; no color-only alerts; blocks CI on violations |
| FHIR conformance | **HAPI FHIR Validator** (Docker) | Emitted `QuestionnaireResponse` and `Observation` resources pass US Core profile validation |

### Domain-specific test cases

```ts
// Never-show invariant: entered-in-error is always filtered
test('entered-in-error Observation is not rendered', () => {
  const obs = buildObs({ status: 'entered-in-error', value: 180 })
  render(<VitalTile observation={obs} />)
  expect(screen.queryByText('180')).not.toBeInTheDocument()
  expect(screen.getByText(/entered in error/i)).toBeInTheDocument()
})

// Never-show invariant: stale vitals degrade at threshold
test('VitalTile shows stale after 5 seconds without update', async () => {
  vi.useFakeTimers()
  const { rerender } = render(<VitalTile lastUpdated={Date.now()} />)
  expect(screen.getByTestId('freshness')).toHaveAttribute('data-state', 'live')
  act(() => vi.advanceTimersByTime(6000))
  expect(screen.getByTestId('freshness')).toHaveAttribute('data-state', 'stale')
})

// Clinical conflict resolution: never auto-merges
test('sync conflict routes to resolution dialog, not silent overwrite', async () => {
  const conflict = buildConflict({ localValue: 128, serverValue: 145, field: 'systolicBP' })
  render(<ConflictResolutionDialog conflict={conflict} />)
  // Both values visible with provenance
  expect(screen.getByText('128')).toBeInTheDocument()
  expect(screen.getByText('145')).toBeInTheDocument()
  // No auto-resolve button
  expect(screen.queryByRole('button', { name: /auto/i })).not.toBeInTheDocument()
})
```

**Synthetic data:** Synthea generates realistic FHIR R4 patient populations (`run_synthea -p 100 --exporter.fhir.export true`); load into local HAPI FHIR (Docker) and Medplum cloud sandbox. Never use real PHI in dev or test.

**MSW for FHIR fault injection:** 401 (token expired), 403 (scope), 404 (not found), 422 (validation failure), 429 (rate limited), 500, network timeout, malformed Bundle responses, `OperationOutcome` with multiple issues.

---

## 14. AI Usage Positioning {#ai-positioning}

### The core narrative

**"AI generates the clinical boilerplate. I own the PHI safety and patient-safety decisions."**

This is the health tech parallel to the fintech "AI generates candidates; I own the money correctness." In fintech, an AI-generated float for a money amount is a correctness bug. In health tech, an AI-generated medication name that doesn't link to transcript evidence is a patient-safety event. Domain expertise is what makes AI usable in both domains.

### Where AI was genuinely valuable

- **FHIR resource boilerplate and view-model mappers** — `Observation` → `VitalReading` transforms scaffolded by AI, reviewed against `@medplum/fhirtypes`
- **QuestionnaireResponse renderer** — SDC `enableWhen` conditional logic skeleton generated by AI, refined for edge cases
- **Storybook stories** — all component states scaffolded; domain-specific states (entered-in-error, preliminary, stale) authored manually
- **Test scaffolding** — Vitest/RTL test cases and `fast-check` arbitraries scaffolded; clinical invariants authored manually
- **ADR and README first drafts** — generated from the reasoning; domain-specific content provided by the engineer

### Where AI was deliberately NOT trusted

| Decision | Why it's human-owned |
|---|---|
| PHI handling patterns and the branded-type wall | Compliance decision — one mistake is a reportable breach |
| Clinical safety decisions and the never-show invariants | Patient safety — wrong displays can cause harm |
| HIPAA technical-safeguard logic (auto-logoff, audit, RBAC) | Regulatory — must be exactly right |
| Offline conflict-resolution logic for clinical data | Clinical correctness — auto-merge of a blood pressure reading is malpractice |
| The clinical error taxonomy | Classification of what's Patient-Safety-Critical requires senior judgment |
| ONC HTI-1 source-attribute content | Regulatory accuracy — must reflect the actual model's properties |

### AI as product feature (real Anthropic SDK usage)

The ambient documentation feature uses the Anthropic TypeScript SDK with `client.messages.stream()`. This is not "I used AI to build this" — it is "the product I built includes an AI feature that I designed the trust UX for, including evidence linking, confabulation detection, and mandatory HITL sign-off." That distinction matters enormously to Abridge, Commure, and Canvas Medical interviewers.

### Interview talking points

**"How do you use AI in your workflow?"**

> "I treat it as a fast collaborator — I define the clinical invariants and safety decisions, and AI handles the scaffolding. On Athena I used Claude Code to generate test scaffolding and FHIR mapper boilerplate, but I personally authored every PHI-handling pattern, every never-show invariant, and every conflict-resolution decision. Those aren't places where I could accept AI output without deep review — a wrong assumption about when to show a stale vital is a patient safety event, not a UI bug."

**For Commure's forward-deployed model specifically:**

> "The FDE role is about sitting with clinicians, translating workflow friction into shipped software, and knowing when the clinical stakes change the engineering constraints. The Athena Field app's conflict-resolution UI — showing both vitals readings with provenance and requiring a human choice — came from understanding why last-write-wins is malpractice for clinical data. That judgment doesn't come from a framework; it comes from domain understanding. And that's exactly the XOi parallel: in field-service, you don't silently overwrite a technician's on-site diagnosis with a remote update either."

**Company-specific calibration:**

| Company | Focus | How to adapt |
|---|---|---|
| **Axle Health / DispatchHealth** | Offline + dispatch | Lead with the field app; emphasize the WatermelonDB sync and conflict-resolution UI; use the XOi parallel |
| **Abridge** | AI documentation trust UX | Lead with evidence linking, confabulation detection, HITL sign-off; cite the Abridge whitepaper knowingly |
| **Commure (FDE)** | FHIR + SMART + HL7 + clinical workflow | Lead with SMART on FHIR launch, CDS Hooks, PHI architecture, and "embed + translate + ship" story |
| **Medplum** | Open-source FHIR platform contribution | Lead with the `@medplum/fhirtypes` usage + Medplum hooks + any merged PR |
| **Spring Health / Headway** | Clinician-facing React/TS | Lead with the Provider web app; mention alert fatigue design and ONC HTI-1 |

### README "Built with AI assistance" section

```markdown
## Built with AI assistance

AI accelerated this project; it did not author it.
I directed the tools, reviewed all output, and own every safety-critical decision.

**AI-accelerated** (specified by me, generated by AI, reviewed by me):
- FHIR resource → view-model mapper scaffolding
- Storybook story boilerplate for standard component states
- `fast-check` property-test generators
- SDC `enableWhen` conditional logic skeleton
- ADR and README first drafts

**Human-owned** (designed, written, and tested by me):
- PHI handling patterns and branded PHI type enforcement
- Clinical safety decisions and the never-show invariants
- HIPAA technical safeguards (auto-logoff, audit logging, RBAC)
- Offline conflict-resolution logic for clinical data
- ONC HTI-1 source attribute content
- The clinical error taxonomy (Patient-Safety-Critical classification)

**How I verified the boundary:**
Never-show invariants are proven by targeted Vitest tests.
PHI-type enforcement is proven at compile time.
Clinical conflict resolution is integration-tested with deliberate conflict injection.

**AI as a product feature:**
The ambient documentation panel streams from the Anthropic Messages API
with evidence-linked sentences, confabulation surfacing, and mandatory
clinician sign-off — designed to the ONC HTI-1 trust requirements.
```

---

## 15. Spike Tasks {#spikes}

| Spike | Goal | Output |
|---|---|---|
| **S1 — FHIR R4 search against Medplum** | Prove search grammar, paging, `_include`, `_revinclude`, resource modeling with `@medplum/fhirtypes` | Working `useVitalSigns` and `usePatientChart` hooks |
| **S2 — SMART on FHIR EHR launch** | EHR launch + standalone, PKCE, state, against `launch.smarthealthit.org` | Working auth flow with missing-context hard-stop |
| **S3 — WatermelonDB clinical conflict resolution** | Implement field-level merge + human-mediated escalation for clinical values against a mock backend | Working `ConflictResolutionDialog` + test |
| **S4 — Real-time vitals via FHIR Subscriptions** | `useSubscription` from `@medplum/react-hooks`; heartbeat watchdog; staleness thresholds; reconnect/backoff | VitalTile with all 3 staleness states |
| **S5 — Anthropic streaming in clinical context** | Evidence-linked notes; `MessageStream`; abort; partial handling; server proxy | Working AI documentation panel |
| **S6 — `@medplum/fhirtypes` branded PHI enforcement** | Prove branded PHI types block PHI from analytics/logging sinks at compile time | `libs/fhir/types/phi.ts` with compile-time test |
| **S7 — Synthea + Medplum data pipeline** | `run_synthea -p 100`; load into local HAPI FHIR (Docker) and Medplum cloud sandbox | Seed script; never real PHI |
| **S8 — `react-native-keychain` two-service biometric** | `BIOMETRY_CURRENT_SET`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, biometric-change detection — on a **real device** (Simulator doesn't reproduce cancel/lockout error shapes) | Working biometric auth; lockout + enrollment-change tested |

---

## 16. Architecture Decision Records {#adrs}

Each ADR uses the template: **Title / Status / Context / Decision / Consequences / Alternatives Considered.**

### ADR-001: FHIR TypeScript tooling — `@medplum/fhirtypes`

**Decision:** Use `@medplum/fhirtypes` for all FHIR R4 TypeScript types. Zero `any` for clinical resources.

**Context:** FHIR resources have dozens of optional fields; untyped handling leads to runtime errors and silent data loss (e.g., treating `Patient.name` as a string when it is `HumanName[]`).

**Consequences:** Compile-time safety on resource shapes. Pairs naturally with `@medplum/react-hooks`. No Mantine peer dependency — compatible with a custom design system. Type generation is maintained by the Medplum team, reducing maintenance burden.

**Alternatives considered:** `fhir.js` (less complete, less actively maintained); custom Zod schemas (build overhead; would drift from spec); raw fetch with `any` (rejected immediately — this is the anti-pattern that distinguishes health tech engineers from generalists).

---

### ADR-002: Offline sync engine — WatermelonDB

**Decision:** WatermelonDB with SQLCipher for offline-first field-clinician visit documentation.

**Context:** Field clinicians lose connectivity in rural areas, home basements, and hospital dead zones. Documentation must never be blocked by connectivity.

**Consequences:** Reactive observables; lazy loading; documented pull/push sync protocol with `lastPulledAt`; works with `@nx/expo`. PHI at rest encrypted via SQLCipher + device keystore.

**Alternatives considered:** `expo-sqlite` (lower-level — no built-in sync protocol; more custom code); MMKV (key-value only — not suitable for relational clinical data); `realm` (Mongo acquisition introduced uncertainty; licensing concerns).

---

### ADR-003: Clinical conflict resolution — human-mediated, never last-write-wins

**Decision:** Conflicts in clinical data are always escalated to a human resolution dialog with full provenance (who, when, device, value). Field-level merge for non-clinical metadata. No automatic overwrite of clinical values.

**Context:** WatermelonDB's default push behavior aborts if a record changed server-side since `lastPulledAt`. The naive fix (last-write-wins) is unsafe for clinical data — if a blood pressure reading was recorded twice with different values, a clinician must choose, not an algorithm.

**Consequences:** `ConflictResolutionDialog` is a required UI component. Sync can surface conflicts to the user. Conflict resolution events are audit-logged.

**Alternatives considered:** CRDT (additive clinical data like annotation appends — acceptable and noted; conflicting vital signs — rejected); last-write-wins (rejected — potential patient safety event); first-write-wins (rejected — same safety concern in reverse).

---

### ADR-004: PHI storage — encrypted at rest, never in URLs/localStorage

**Decision:** PHI lives in encrypted SQLite (mobile) or server-fetched memory (web). Never in URLs, localStorage, analytics payloads, or error logs. Enforced by branded `PHI<T>` types at compile time.

**Context:** PHI in a URL appears in server logs, browser history, and referrer headers. PHI in localStorage is readable by any injected script. Either is a reportable breach.

**Consequences:** Routes use opaque FHIR resource IDs only. `usePhiSafeNavigation` wrapper. `beforeSend` Sentry hook scrubs PHI keys. Analytics schema uses resource types and event types, never patient identifiers.

**Alternatives considered:** Encryption-at-rest only (rejected — doesn't prevent PHI in URLs); localStorage with encryption (rejected — key management complexity, still risks PHI in URLs/analytics).

---

### ADR-005: Alert fatigue mitigation — tiered severity + override-rate measurement

**Decision:** CDS alerts are tiered: Critical (focus-trapped modal, required acknowledgment), Advisory (inline non-blocking), Informational (collapsible). Override reasons are captured and sent to the CDS Hooks feedback endpoint. Override rates are tracked per alert type as a product metric.

**Context:** The clinical literature documents override rates of 49–96% across CDS implementations. High override rates make even important alerts invisible. More alerts is not safer — it is less safe.

**Consequences:** Three distinct alert component variants. Override reason required for Critical dismissal. Override-rate dashboard for clinical administrators. Alert volume is a product KPI, not just a feature.

**Alternatives considered:** All alerts as toasts (rejected — no override-rate tracking; no mechanism for interrupting on critical); modal for all alerts (rejected — would create the fatigue problem the design is trying to solve).

---

## 17. Data Sources & Infrastructure {#data-sources}

| Source | What it provides | Notes |
|---|---|---|
| **Medplum hosted sandbox** | Free FHIR R4 server (`https://api.medplum.com/fhir/R4`), SMART App Launch, Subscriptions, AuditEvent logging | Best starting point; HIPAA-eligible |
| **Synthea** | Realistic synthetic FHIR R4 patient populations | `run_synthea -p 100 --exporter.fhir.export true`; never real PHI |
| **HAPI FHIR (Docker)** | Local FHIR server for offline dev + conformance validation | `docker run -p 8080:8080 hapiproject/hapi:latest` |
| **`launch.smarthealthit.org`** | No-registration SMART on FHIR sandbox — simulated EHR + Synthea patients | Best for SMART launch testing; R4 server |
| **Medplum SMART demo** | Reference SMART on FHIR implementation | `github.com/medplum/medplum-smart-on-fhir-demo` |
| **Anthropic API** | Ambient documentation streaming | Server-proxied only; BAA-eligible first-party API |
| **Daily.co** | BAA-eligible video for telehealth (stretch feature) | Healthcare add-on required for BAA |

**Key infrastructure note:** The HAPI FHIR validator can be run as a Docker container or CLI to validate emitted `Observation`, `QuestionnaireResponse`, and `AuditEvent` resources against US Core profiles in CI. Include this validation step in the GitHub Actions workflow and call it out in the README — it is a concrete, verifiable FHIR-correctness claim.

---

## 18. Implementation Timeline (8 Weeks) {#timeline}

### Phase 1 — Foundation (Weeks 1–2)

**Week 1: Workspace, design system, FHIR types**
- Nx workspace with tags and boundary rules enforced
- `@athena/ui` tokens (Style Dictionary), `VitalTile` all 4 states, `ObservationStatusBadge`, `AlertCard`, `SyncStatusBar`, Storybook
- `libs/fhir/types` — `@medplum/fhirtypes` re-exports + branded `PHI<T>` type
- Medplum client wiring + `useVitalSigns` / `usePatientChart` hooks
- Synthea seed → Medplum sandbox load
- CI: affected builds, axe a11y checks, boundary lint, HAPI validator gate

**Week 2: SMART on FHIR + auth + HIPAA patterns**
- EHR launch + standalone SMART with PKCE against `launch.smarthealthit.org`
- Auto-logoff hook, RBAC `useCan` + `RoleGate`, session-refresh interceptor
- PHI scrubbing Sentry `beforeSend`; PHI-safe analytics schema
- FHIR AuditEvent write on chart open

*Demo by end of Week 2:* SMART launch from smarthealthit.org → chart opens with Synthea patient data → missing-patient-context hard-stop demonstrated.

---

### Phase 2 — Provider Core (Weeks 3–4)

**Week 3: Real-time vitals + staleness**
- FHIR Subscriptions via `useSubscription`; heartbeat watchdog; staleness state machine (live / stale 5s / degraded 30s / disconnected 2min)
- `VitalTile` staleness thresholds; persistent banner on 30s; feed disabled on 2min
- Scoped `VitalsBoundary` error boundary
- `entered-in-error` filter and display treatment
- Vitest: never-show invariants (entered-in-error, stale-as-live, preliminary-as-final)

*Demo by end of Week 3:* Kill the Subscription connection → VitalTile degrades through all three thresholds without ever showing stale data as live.

**Week 4: CDS Hooks + alert fatigue design**
- CDS Hooks card rendering (Critical/Advisory/Informational tiers)
- Override reason capture + feedback endpoint
- Override-rate tracking store
- CDS scratchpad vs FHIR server distinction enforced
- XState encounter lifecycle machine

*Demo by end of Week 4:* CDS alert fires → Critical interrupts → override with required reason → feedback sent.

---

### Phase 3 — AI Documentation + Field App Core (Weeks 5–6)

**Week 5: AI documentation assistant**
- Anthropic streaming server proxy (SSE to client)
- Evidence-linked note editor (`EvidenceLink` per sentence)
- Confabulation surface (ungrounded spans highlighted amber)
- Confidence indicators per span
- HITL sign-off with unreviewed-span warning
- ONC HTI-1 model-facts panel
- `AIDocumentBoundary` + streaming abort

*Demo by end of Week 5:* Stream an AI note → click sentence to reveal transcript link → attempt to sign with unreviewed spans → hard warning → sign after review → AuditEvent written.

**Week 6: Athena Field — offline core**
- WatermelonDB + SQLCipher setup in Expo
- Sync engine (pull/push) + outbox (PENDING/IN_FLIGHT/SYNCED/CONFLICT/FAILED)
- `ConflictResolutionDialog` with provenance
- `react-native-keychain` two-service biometric auth (test on real device)
- NetInfo connectivity detection + sync trigger

*Demo by end of Week 6:* Go offline on device → complete visit documentation → return online → force a sync conflict → resolve it with provenance in the dialog.

---

### Phase 4 — Field App Advanced + Polish (Weeks 7–8)

**Week 7: QuestionnaireResponse forms + photo capture + prior auth**
- FHIR `Questionnaire` renderer with SDC `enableWhen`
- `react-native-vision-camera` clinical photo capture; EXIF/GPS strip; offline queue
- Prior authorization tracker (XState PA machine; CMS thresholds displayed)
- Sync status UI (per-record badges + global indicator)

**Week 8: Testing, README, Loom, deploy**
- Playwright E2E for Provider flows; Maestro for Field flows
- axe-playwright on all Provider surfaces (WCAG 2.1 AA gate)
- HAPI FHIR validator in CI
- Pact contract tests (FHIR client vs Medplum)
- README: architecture diagram, `nx graph` screenshot, 5 ADRs, never-show list, "built with AI" section
- 90-second Loom recorded
- Deploy Provider to Vercel; EAS preview build for Field
- "Coming soon" documented clearly

---

### "Coming soon" (documented, not built)

- Bulk FHIR `$export` population-health pipeline
- Full DEA controlled-substance identity verification flow for telehealth prescribing
- Multi-language clinical glossary (beyond 2 languages)
- Medplum Bot serverless FHIR event handlers
- Full telehealth recording pipeline (Daily.co)

Documenting these is a feature, not a failure — scope discipline is a senior signal.

---

## 19. Portfolio Presentation & README {#portfolio}

### README must contain

1. **Opening thesis:** "A FHIR-native platform for the clinician who works both at a desk and in the field — Provider is the desk; Field is the field. Built to the engineering standards that Axle Health, Commure, and Abridge actually operate."

2. **The never-show invariants list** — this is the fastest way to show a health tech interviewer that you think in clinical safety terms, not just UI terms.

3. **Architecture diagram + `nx graph` screenshot**

4. **Clinical state machine diagrams** (Stately export for encounter lifecycle)

5. **GIFs:**
   - VitalTile degrading through all 3 staleness thresholds
   - Conflict resolution dialog with both provenance versions
   - AI note sign-off warning on unreviewed spans
   - Offline → sync → conflict → resolve sequence

6. **"Built with AI assistance" section** (from §14)

7. **"Coming soon" list** — scoped and honest

8. **Link to live demo** (Vercel for Provider) + **EAS preview link** for Field + 90-second Loom

### The 90-second Loom script

- **(0–15s)** "Athena Provider monitors a home-health patient's vitals in real time. Watch what happens when the feed goes down." [Kill the connection] "VitalTile immediately shows 'last updated 4m ago' — it never keeps pulsing as if live. That's a patient-safety decision, not a UX preference."
- **(15–40s)** "Now to the field app. I'm going offline." [Airplane mode] "Complete a home visit — vitals, form, photo." [Show sync queue] "Come back online." [Force a conflict] "Another clinician updated the same systolic BP while I was offline. The app shows both values with provenance and requires me to choose. No auto-merge."
- **(40–65s)** "Back to Provider — the AI drafts a SOAP note from the transcript. Each sentence links to the audio." [Click a sentence] "And if I try to sign before reviewing all sections…" [Click Sign] "A hard warning lists the unreviewed spans. The AI never signs the chart."
- **(65–90s)** "This is the XOi parallel: offline mobile workflow, conflict resolution, multi-role platform — same engineering patterns, different domain. The FHIR types, SMART OAuth, and PHI architecture are the health tech layer on top."

### LinkedIn post angles

1. **"Why last-write-wins is malpractice for clinical data"** — the conflict-resolution story, connecting offline-first engineering to clinical safety
2. **"The staleness problem: how real-time vitals dashboards can cause harm"** — the stale-as-current never-show invariant and how to implement the staleness state machine
3. **"Evidence linking: the trust UX pattern for clinical AI that Abridge cracked"** — what it is, why it works, and how to build a version of it

---

## 20. Caveats {#caveats}

- **FHIR Subscriptions maturity.** R4B `SubscriptionTopic` / `SubscriptionStatus` were at Maturity Level 0 at R4B publication. Not every server implements topic-based push identically. Design the vitals feed to degrade to polling if Subscriptions aren't supported, and treat heartbeat loss as the staleness signal regardless.
- **Medplum API stability.** Medplum releases frequently; pin `@medplum/fhirtypes` and `@medplum/react-hooks` to a specific version and re-verify behavior after upgrades. The hosted sandbox is best-effort for free accounts.
- **Anthropic BAA scope changes.** Anthropic's HIPAA BAA eligibility applies to the first-party API and HIPAA-ready Enterprise plan as of mid-2026. Consumer plans (Free/Pro/Max/Team) are explicitly excluded. Verify current terms before building any feature that sends real PHI.
- **`react-native-keychain` biometric error classes on Simulator.** The iOS Simulator's "Match Touch ID" and "Match Face ID" only cover happy-path flows. Lockout, enrollment-change, and hardware-unavailable error classes require a real device. Budget time for this in Spike S8.
- **ONC HTI-1 figures.** The rule published January 9, 2024 specifies 31 source attributes for Predictive DSIs. Compliance was required starting January 1, 2025. Verify the current ONC FAQ for any enforcement-discretion guidance issued after publication.
- **Abridge confabulation detection figure.** The 97% figure is from Abridge's August 2025 whitepaper and is self-reported on an internal benchmark of 10,000+ encounters. Cite it as Abridge's claim, not an independently audited fact.
- **This is a portfolio project, not a production clinical system.** Real HIPAA compliance, ONC certification, BAA execution, and clinical safety validation are far beyond scope. The value is demonstrating that you understand the frontend's responsibilities within that system — and can have an informed conversation about the constraints with a health tech engineering team on day one.
