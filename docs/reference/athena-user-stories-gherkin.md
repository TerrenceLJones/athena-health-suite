# Athena Health Suite — Complete User Stories & Acceptance Criteria (Gherkin)

*A FHIR-native platform for the clinician who works both at a desk and in the field. Covers Athena Provider (web clinician console) and Athena Field (React Native offline field app). Every story includes happy path, unhappy paths, patient-safety criteria, HIPAA compliance criteria, and accessibility criteria where applicable. Written in Gherkin (Given/When/Then) syntax for direct use as BDD test specifications (Playwright, Maestro, Vitest + RTL).*

---

## Table of Contents

1. [Authentication & Session Management](#1-authentication--session-management)
2. [SMART on FHIR Launch (Athena Provider)](#2-smart-on-fhir-launch-athena-provider)
3. [Role-Based Access Control & Permissions](#3-role-based-access-control--permissions)
4. [Real-Time Vitals Dashboard (Athena Provider)](#4-real-time-vitals-dashboard-athena-provider)
5. [FHIR Patient Chart Rendering (Athena Provider)](#5-fhir-patient-chart-rendering-athena-provider)
6. [CDS Hooks Alert System (Athena Provider)](#6-cds-hooks-alert-system-athena-provider)
7. [AI Documentation Assistant (Athena Provider)](#7-ai-documentation-assistant-athena-provider)
8. [Prior Authorization Tracker (Athena Provider)](#8-prior-authorization-tracker-athena-provider)
9. [Encounter Lifecycle (Athena Provider)](#9-encounter-lifecycle-athena-provider)
10. [Biometric Authentication (Athena Field)](#10-biometric-authentication-athena-field)
11. [Offline Visit Documentation (Athena Field)](#11-offline-visit-documentation-athena-field)
12. [Clinical Conflict Resolution (Athena Field)](#12-clinical-conflict-resolution-athena-field)
13. [QuestionnaireResponse Forms (Athena Field)](#13-questionnaireresponse-forms-athena-field)
14. [Clinical Photo Capture (Athena Field)](#14-clinical-photo-capture-athena-field)
15. [Sync Status & Push Notifications (Athena Field)](#15-sync-status--push-notifications-athena-field)
16. [HIPAA Compliance (Cross-Cutting)](#16-hipaa-compliance-cross-cutting)
17. [Accessibility (Cross-Cutting)](#17-accessibility-cross-cutting)
18. [Audit Logging (Cross-Cutting)](#18-audit-logging-cross-cutting)
19. [Organization & User Provisioning (Athena Provider)](#19-organization--user-provisioning-athena-provider)

---

## 1. Authentication & Session Management

### 1.1 Standard login (Athena Provider)

```gherkin
Feature: Web clinician login

  Scenario: Successful login
    Given I am a registered clinician with a verified account
    And I am on the Athena Provider login page
    When I enter my correct credentials and submit
    Then I am redirected to the patient dashboard
    And my access token is stored in memory only — never in localStorage or a cookie readable by JavaScript
    And a refresh token is stored in an httpOnly, Secure, SameSite=Strict cookie
    And a FHIR AuditEvent is written recording my practitioner ID, timestamp, and IP address

  Scenario: Login with incorrect credentials
    Given I am on the login page
    When I enter incorrect credentials and submit
    Then I see "Incorrect email or password"
    And the password field is cleared
    And no message reveals whether the email is registered

  Scenario: Account locked after repeated failures
    Given I have failed to log in 5 times within 15 minutes
    When I attempt to log in again
    Then I see "Your account is temporarily locked. Contact your administrator to restore access."
    And a support reference ID is shown
    And a FHIR AuditEvent records the lockout

  Scenario: Network failure during login
    Given the authentication service is unreachable
    When I submit valid credentials
    Then I see "Something went wrong. Retrying…"
    And the client retries up to 3 times with exponential backoff
    And after 3 failures I see a manual "Try again" button
```

### 1.2 Auto-logoff after inactivity

```gherkin
Feature: HIPAA-required session auto-logoff

  Scenario: Inactivity warning appears at 14 minutes
    Given I am logged in and the auto-logoff timeout is 15 minutes
    When I have been inactive for 14 minutes
    Then a modal appears: "You'll be signed out in 60 seconds due to inactivity"
    And a visible countdown runs in the modal

  Scenario: Auto-logoff fires at 15 minutes
    Given the inactivity warning modal is showing
    When I take no action within 60 seconds
    Then I am logged out
    And my in-memory access token is cleared
    And any open Subscription WebSocket connections are closed
    And I see "You were signed out due to inactivity. Please sign in again."
    And a FHIR AuditEvent records the session end

  Scenario: Clinician dismisses the inactivity warning
    Given the inactivity warning modal is showing
    When I click "Stay signed in" or interact with the page
    Then the inactivity timer resets to 15 minutes
    And the modal closes
    And my session continues uninterrupted

  Scenario: Auto-logoff fires during an active encounter
    Given I am documenting a patient encounter
    And the auto-logoff timer fires
    When the logoff executes
    Then my in-progress documentation is preserved locally
    And I see "You were signed out due to inactivity. Your work is saved — sign in to continue."
    And after re-authentication I am returned to the same documentation with my draft intact
```

### 1.3 Token refresh and session continuity

```gherkin
Feature: Token refresh and session continuity

  Scenario: Silent access-token refresh during active use
    Given I am actively using Athena Provider
    And my access token has expired
    When I trigger any authenticated FHIR request
    Then the client silently refreshes the token using the refresh token cookie
    And the original FHIR request is queued and replayed after the refresh
    And I see no interruption to my clinical workflow

  Scenario: Refresh token reuse detected (replay attack signal)
    Given my refresh token was already used to mint a new token
    When the same stale refresh token is presented again
    Then the server revokes the entire token family
    And I am logged out immediately
    And I see "For your security, we signed you out. Please sign in again."
    And a FHIR AuditEvent flags this as a potential security incident

  Scenario: Refresh token expired
    Given my refresh token lifetime has elapsed
    When I attempt any authenticated action
    Then I am logged out and redirected to the login page
    And I see "Your session expired. Please sign in again."
    And my prior route is preserved for post-login redirect

  Scenario: Token expires mid-FHIR-write
    Given I am submitting a FHIR resource (e.g., saving a QuestionnaireResponse)
    And my access token expires before the write completes
    When the write request fails with 401
    Then the draft is preserved locally
    And a re-auth modal appears: "Your session needs to refresh. Your work is saved — sign in to continue."
    And after re-authentication the write is retried and completed
```

### 1.4 Password reset

```gherkin
Feature: Password reset

  Scenario: Request a password reset
    Given I am on the "Forgot password" page
    When I enter a registered email address and submit
    Then I see "If that email is registered, we've sent a reset link" regardless of whether it exists

  Scenario: Reset link has expired
    Given I received a reset link more than 1 hour ago
    When I click the link
    Then I see "This link has expired. Request a new one."

  Scenario: Successful password reset
    Given I have a valid, unexpired reset link
    When I set a new password meeting complexity requirements and submit
    Then my password is updated
    And all existing refresh tokens for my account are revoked
    And I am redirected to the login page
    And I receive an email notifying me that my password was changed
```

### 1.5 Concurrent login from a second device

```gherkin
Feature: Silent single-session enforcement

  Scenario: Login from a second device silently terminates the first session
    Given I am logged in and active on Device A
    When I successfully log in with the same credentials on Device B
    Then my session on Device A is immediately terminated — its refresh token is revoked and any open Subscription WebSocket connections on Device A are closed
    And no confirmation prompt or "continue here?" choice is shown on either device — the termination is silent and unconditional
    And a FHIR AuditEvent records the termination, which device initiated the new login, and when

  Scenario: Device A discovers its session was ended by a login elsewhere
    Given my session on Device A was terminated because I logged in on Device B
    When Device A next attempts any authenticated action, or its access token expires
    Then Device A is signed out and I see "You were signed out because your account was signed in elsewhere. Please sign in again."
    And any in-progress documentation on Device A is preserved locally exactly as in the auto-logoff-during-an-active-encounter scenario, and after re-authentication I am returned to it with my draft intact
```

---

## 2. SMART on FHIR Launch (Athena Provider)

### 2.1 EHR launch

```gherkin
Feature: SMART on FHIR EHR launch

  Scenario: Successful EHR launch with patient context
    Given the EHR calls my registered launch URL with valid "iss" and "launch" parameters
    When the launch flow executes
    Then I fetch "{iss}/.well-known/smart-configuration" to discover endpoints
    And I redirect to the authorization_endpoint with PKCE (S256 code_challenge), a state parameter with at least 128 bits of entropy, and the "launch" scope
    And after the clinician authenticates, the authorization server redirects to my redirect_uri with a code and the original state
    And I exchange the code at the token_endpoint using the PKCE code_verifier
    And I receive patient and encounter context in the token response
    And I open the patient chart without prompting for a patient picker
    And a FHIR AuditEvent records the chart access with practitioner ID and patient ID

  Scenario: Standalone launch — clinician picks a patient
    Given the app is launched without EHR context (standalone mode)
    When the authorization flow completes
    Then I am shown a patient search/selection screen
    And after selecting a patient, the chart opens with that patient in context

  Scenario: Launch URL called without "iss" or "launch" parameters
    Given the launch URL is accessed without the required parameters
    When this is detected
    Then I see a clear error: "This app must be launched from your EHR. Please use the EHR's app launcher."
    And no attempt is made to open a chart in an undefined context

  Scenario: State parameter mismatch (CSRF signal)
    Given the authorization server returns a state value
    When the returned state does not match any stored PKCE session
    Then the flow is aborted immediately
    And I see "Sign-in couldn't be verified — please try again."
    And the mismatch is logged as a security event (without the mismatched state value itself, which may be attacker-controlled)
    And the app never proceeds with the mismatched token

  Scenario: Launch with missing patient context
    Given the EHR launch completes
    But the token response contains no patient ID or encounter ID
    When the chart would open
    Then the clinical view is hard-blocked
    And I see "No patient context — relaunch from the EHR."
    And no chart loads, no patient data is fetched, and no guess is made about which patient to show
    And this is treated as a Patient-Safety-Critical error — operating on the wrong patient is a never-event

  Scenario: Insufficient scope for a specific FHIR resource
    Given I authenticated with a scope that does not include MedicationRequest read access
    When the medications panel attempts to load
    Then only the medications panel shows "You don't have access to this information."
    And all other chart panels with appropriate scope continue to render normally
    And the error is scoped to the specific panel — it does not crash the entire chart

  Scenario: SMART discovery endpoint unreachable
    Given the EHR's ".well-known/smart-configuration" endpoint is unreachable
    When the launch flow attempts discovery
    Then I see "We couldn't connect to your EHR. Please try relaunching."
    And no fallback hardcoded endpoint is used — discovery is always live

  Scenario: Authorization code exchange fails
    Given the token_endpoint returns an error on code exchange
    When the exchange fails
    Then I see "Sign-in failed. Please close this window and relaunch from the EHR."
    And no partial token is stored or used
```

---

## 3. Role-Based Access Control & Permissions

```gherkin
Feature: Role-based access control

  Scenario: Physician sees the full chart including the Sign button
    Given I am logged in as a physician
    When I view a patient chart
    Then I see all chart panels: vitals, medications, notes, orders
    And the "Sign note" button is visible and enabled

  Scenario: Nurse sees the chart but cannot sign notes
    Given I am logged in as a nurse
    When I view a patient chart
    Then I see vitals, medications, and notes panels
    And the "Sign note" button is not rendered — it is never shown as disabled, just absent

  Scenario: Care coordinator sees the chart but cannot edit medications
    Given I am logged in as a care coordinator
    When I view a patient chart
    Then I see the chart in read-only mode
    And no medication edit controls are rendered

  Scenario: Admin can access billing but not clinical charts
    Given I am logged in as an admin
    When I navigate to the billing panel
    Then I see billing data
    And when I attempt to navigate to a patient chart directly
    Then I see "You don't have access to this." and am redirected

  Scenario: Direct URL access to an unauthorized resource
    Given I am logged in as a care coordinator
    When I navigate directly to a URL that would render the "Sign note" interface
    Then the server independently rejects the action with 403
    And I see "You don't have access to this information."
    And no clinical action is taken — UI-level gating is never the only enforcement

  Scenario: Role changes mid-session
    Given I am logged in as a nurse
    And an admin revokes my medication-edit permission while I am active
    When I make my next FHIR request
    Then a 403 is returned for the action
    And I see a banner "Your access changed. Some features may no longer be available."
    And the affected panels degrade gracefully — they do not crash the page
```

---

## 4. Real-Time Vitals Dashboard (Athena Provider)

```gherkin
Feature: Real-time vitals monitoring with staleness safety

  Background:
    Given I am a clinician with a SMART session containing patient context
    And I am viewing the real-time vitals dashboard for a patient

  Scenario: New vital-signs Observation arrives with "final" status
    Given the FHIR Subscription WebSocket is connected
    When an Observation arrives with status "final", a LOINC code, a UCUM unit, and a timestamp
    Then the VitalTile updates within approximately 1 second
    And a live pulsing badge is visible
    And the value, unit, LOINC code, and "last updated {time}" timestamp are all shown
    And a FHIR AuditEvent records that the clinician viewed this vital

  Scenario: VitalTile goes stale after 5 seconds without an update
    Given a VitalTile is displaying a live vital
    When 5 seconds pass without a new Subscription event for that vital
    Then the VitalTile transitions to "stale" state
    And the pulsing live badge is replaced with a static grey badge
    And "Last updated {time}" is shown
    And the vital value remains visible but is not implied to be current

  Scenario: Vitals feed degraded after 30 seconds
    Given 30 seconds have passed since the last Subscription event
    When this threshold is crossed
    Then a persistent banner appears: "Vitals feed delayed — reconnecting…"
    And all VitalTile values are visually dimmed with timestamps
    And the client attempts reconnection with exponential backoff

  Scenario: Vitals feed disconnected after 2 minutes
    Given 2 minutes have passed with no Subscription heartbeat
    When this threshold is crossed
    Then all vital values are hidden behind "No current data available"
    And any threshold alert actions that depend on live vitals are disabled
    And I see a "Monitor manually — alert system unavailable" warning
    And this is treated as a Patient-Safety-Critical state — a clinician must never mistake absent data for a normal reading

  Scenario: WebSocket reconnects after disconnection
    Given the vitals feed was disconnected
    When the WebSocket reconnects
    Then a fresh Subscription is established
    And VitalTile values are only restored once fresh data is confirmed
    And the staleness badges clear only after a fresh event is received — not at the moment of reconnect

  Scenario: "entered-in-error" Observation arrives
    Given the Subscription delivers an Observation with status "entered-in-error"
    When this is received
    Then if the value was previously displayed, it is immediately struck-through with the label "Entered in error"
    And it is filtered from all clinical lists and alert pipelines
    And it is never actionable or alertable in any form
    And this is treated as a Patient-Safety-Critical invariant: displaying an entered-in-error value as valid clinical data is a safety event

  Scenario: "preliminary" Observation arrives
    Given the Subscription delivers an Observation with status "preliminary"
    When this is displayed
    Then a blue "Unconfirmed" badge is shown alongside the value
    And the value is never styled or labeled as a final result
    And alert thresholds treat preliminary values with reduced confidence (configurable)

  Scenario: Unknown Observation status received
    Given the Subscription delivers an Observation with a status code the client does not recognize
    When this is displayed
    Then the value shows "Unrecognized status — review in source system"
    And it is treated as preliminary (not final) for all threshold and alert purposes

  Scenario: Sequence gap in Subscription event numbers
    Given the client is tracking SubscriptionStatus event numbers
    When a gap is detected in the sequence
    Then the client re-fetches missed events via the Subscription $events endpoint or re-subscribes
    And during the re-fetch period, affected VitalTiles show "Resyncing…"
    And no stale or speculative values are shown as current during resync

  Scenario: Vital value is absent (not recorded)
    Given a VitalTile is expecting a value that has not been recorded
    When the tile renders
    Then it shows "—" (em dash) — never "0", "normal", or an empty field that implies in-range
    And this is a hard invariant: absent ≠ zero ≠ in-range

  Scenario: VitalTile is accessible
    Given a screen reader user is viewing the vitals dashboard
    When a VitalTile renders
    Then its aria-label is "Systolic BP: 128 mmHg, final, updated 2 minutes ago" (reflecting the actual values)
    And freshness state is conveyed by text and icon, never by color alone
    And the VitalsBoundary error boundary isolates any VitalTile crash from the rest of the chart
```

---

## 5. FHIR Patient Chart Rendering (Athena Provider)

```gherkin
Feature: Patient chart rendering with FHIR resource correctness

  Scenario: Observations display with status-appropriate treatment
    Given a patient chart is loaded with a mix of Observations in various statuses
    When the chart renders
    Then "final", "amended", and "corrected" Observations display normally
    And "preliminary" Observations display with a blue "Unconfirmed" badge
    And "entered-in-error" Observations are filtered by default and only shown struck-through with the label "Entered in error" if explicitly expanded
    And "unknown" and unrecognized statuses display "Unrecognized status — review in source system"

  Scenario: FHIR 404 — resource not found
    Given a chart section requests a FHIR resource
    When the server returns 404
    Then the affected section shows "This record may have been moved or removed."
    And no placeholder or invented data is shown
    And the section's error boundary is scoped so other chart sections continue to render

  Scenario: FHIR 401 — token expired mid-chart
    Given I am viewing a patient chart
    When a FHIR request returns 401
    Then the client silently attempts a token refresh
    And if the refresh succeeds, the request is replayed
    And if the refresh fails, I see "Your session needs to refresh. Your work is saved." with a re-auth modal

  Scenario: FHIR 403 — insufficient scope for a chart section
    Given my SMART scope does not include MedicationRequest read
    When the medications panel loads
    Then only the medications panel shows "You don't have access to this information."
    And other panels with appropriate scope continue loading normally

  Scenario: FHIR 422 — validation failure on save
    Given I attempt to save a clinical resource that fails FHIR R4 validation
    When the server returns 422 with an OperationOutcome
    Then each issue in OperationOutcome.issue[] is parsed and mapped to a specific field
    And the error is shown in plain language at the field level
    And no FHIR technical codes (e.g., "FHIR R4/Observation/valueQuantity must have unit") are shown directly to the clinician

  Scenario: FHIR 429 — rate limited
    Given a burst of FHIR requests triggers rate limiting
    When 429 responses arrive
    Then the client respects the Retry-After header
    And I see "Loading is taking longer than usual." with a spinner
    And retries happen automatically with exponential backoff

  Scenario: FHIR 500 — server error
    Given a FHIR request results in a server error
    When a 500 response arrives
    Then a scoped error boundary contains the failure to the affected section
    And I see "Something went wrong on our end." with a retry option in that section
    And the rest of the chart continues to render
    And the error is logged with scrubbed context (no PHI in the error report)

  Scenario: FHIR network timeout
    Given a FHIR request exceeds the timeout threshold
    When no response has arrived
    Then I see "This is taking longer than usual — retrying." in the affected section
    And any in-progress documentation is preserved locally
    And the client retries with backoff

  Scenario: MedicationRequest displayed with correct FHIR status
    Given a patient has MedicationRequests in various statuses
    When the medications panel renders
    Then active MedicationRequests display without a status qualifier
    And stopped MedicationRequests display "Stopped" with the stop date
    And entered-in-error MedicationRequests are filtered from the active list
    And unknown statuses display "Unrecognized status — review in source system"

  Scenario: Patient name rendered from FHIR HumanName array
    Given a FHIR Patient resource with a name array
    When the patient's name is displayed
    Then it is constructed from HumanName.given and HumanName.family
    And if neither is present, "Unknown" is shown — never a null or undefined crash

  Scenario: Patient chart PHI safety
    Given I navigate between patient charts
    When a chart URL is generated
    Then it contains only the opaque FHIR Patient resource ID
    And it never contains the patient's name, date of birth, MRN, or any other PHI in any URL parameter or path segment
```

---

## 6. CDS Hooks Alert System (Athena Provider)

```gherkin
Feature: CDS Hooks tiered alerts and override tracking

  Scenario: patient-view hook fires on chart open
    Given I open a patient chart
    When the patient-view hook triggers
    Then a CDS service request is sent with the context and any configured prefetch data
    And cards returned by the service are rendered within 500ms
    And clinical workflow is never blocked waiting for the CDS response

  Scenario: Critical card displayed and requires acknowledgment
    Given a CDS service returns a card with indicator "critical"
    When the card is received
    Then a focus-trapped modal opens with the AlertCard showing: icon + "Critical" text + red styling + summary + detail + source attribution
    And the modal cannot be dismissed without clicking "Acknowledge" or "Override with reason"
    And pressing Escape does not dismiss the modal
    And the clinical workflow is paused until the clinician acts

  Scenario: Advisory card displayed as non-blocking inline
    Given a CDS service returns a card with indicator "warning"
    When the card is received
    Then the AlertCard is shown inline in the chart without blocking any interaction
    And it shows: amber icon + "Advisory" text + amber styling + summary + action options
    And the clinician can continue charting without acting on it immediately

  Scenario: Informational card displayed in collapsible panel
    Given a CDS service returns a card with indicator "info"
    When the card is received
    Then the AlertCard appears in a collapsible "Clinical Guidance" panel at the bottom of the chart
    And it is dismissible without any reason required

  Scenario: Clinician overrides a Critical card
    Given a Critical alert modal is open
    When the clinician clicks "Override"
    Then a reason selector is required before the override is accepted
    And "Override with no reason" is never permitted for Critical cards
    And after a reason is selected and confirmed, the modal closes
    And the override reason + clinician ID + alert ID + timestamp are sent to the CDS Hooks feedback endpoint
    And the override is counted against the override rate for this alert type

  Scenario: Clinician accepts a CDS suggestion
    Given a CDS card includes a suggestion (e.g., add a medication order)
    When the clinician clicks "Accept suggestion"
    Then the suggested FHIR action modifies only the EHR scratchpad (draft state)
    And the FHIR server is not written to until the clinician explicitly saves or signs
    And I see a banner: "Suggestion added to chart — not yet saved. Review and save to confirm."

  Scenario: CDS service times out
    Given the configured CDS response deadline is 500ms
    When the CDS service has not responded after 500ms
    Then the clinical workflow continues unblocked
    And a non-blocking "Decision support unavailable" indicator appears in the alert panel
    And any prefetch data that did arrive is shown if available
    And the alert state never shows "no alerts" when the service merely timed out — these are different states

  Scenario: CDS service returns a malformed response
    Given the CDS service returns a response that fails to parse
    When this is detected
    Then the CdsBoundary error boundary contains the failure
    And I see "Decision support unavailable" with a retry option
    And no part of the malformed response is rendered or acted upon

  Scenario: Override rate threshold exceeded for an alert type
    Given the override rate for a specific Critical alert has exceeded the configured threshold (e.g., 80%)
    When an administrator views the alert-fatigue dashboard
    Then a "High override rate" indicator is shown for that alert
    And the rate is calculated from the captured override feedback, not estimated
    And this indicator is meant to prompt a clinical review of whether the alert is appropriate, not to silently suppress it

  Scenario: Alert with no source attribution
    Given a CDS card arrives without a source field
    When it is rendered
    Then the card displays "Source unspecified" rather than blank
    And the card is still rendered — absence of source attribution is not a reason to suppress a clinical alert
```

---

## 7. AI Documentation Assistant (Athena Provider)

```gherkin
Feature: AI-assisted clinical documentation with mandatory human-in-the-loop

  Scenario: Successful ambient note generation and streaming
    Given an encounter recording session has completed
    When the AI documentation pipeline produces a SOAP note draft
    Then tokens stream progressively into the AIDocumentPanel as they arrive
    And each sentence in the draft has a clickable evidence link
    And the note status shows "Draft — not filed"
    And the Anthropic API was called server-side only — the API key never appears in client-side code or network requests visible to the browser
    And no audio or transcript text is sent to any analytics service or logged in any client-side logger

  Scenario: Clinician clicks an evidence link
    Given the AI note is displayed with evidence-linked sentences
    When I click a sentence's evidence link
    Then the corresponding transcript segment is highlighted in the transcript panel
    And the audio player seeks to and plays from that timestamp
    And that sentence is marked as "reviewed"

  Scenario: Sentence with no transcript evidence (confabulation signal)
    Given the AI pipeline produced a sentence with no grounded transcript span
    When this sentence is rendered
    Then it is highlighted in amber with the label "No source found — review carefully"
    And it is not blocked, but it must be explicitly confirmed before signing
    And a confabulation is never silently allowed into a signed note

  Scenario: Sentence with low confidence
    Given the AI pipeline flagged a sentence as low-confidence
    When this sentence is rendered
    Then it is marked with a "Low confidence — please verify" indicator
    And it must be reviewed or explicitly confirmed before signing

  Scenario: Clinician attempts to sign with unreviewed spans
    Given the AI note has 3 sentences that have not been reviewed (evidence link not clicked or confirmed)
    When the clinician clicks "Sign"
    Then signing is hard-blocked
    And a warning dialog lists the unreviewed spans: "You have 3 unreviewed sections. Review them before signing."
    And signing proceeds only after each unreviewed span is either: (a) reviewed by clicking its evidence link, (b) edited, or (c) explicitly confirmed with an acknowledgment
    And this gate is the core patient-safety invariant: no unreviewed AI content may silently enter a signed clinical record

  Scenario: Clinician edits the AI draft
    Given the AI note draft is displayed
    When the clinician edits one or more sentences
    Then the edits are preserved and attributed to the clinician (not to the AI model)
    And edited sentences are visually distinguished from unedited AI output
    And editing a sentence counts as reviewing it for the sign-off gate

  Scenario: Clinician signs the reviewed and edited note
    Given all spans have been reviewed, edited, or confirmed
    When the clinician clicks "Sign" and confirms
    Then the note status transitions from "Draft" to "Final"
    And the note is filed to the FHIR server as a DocumentReference or DiagnosticReport (per the EHR's requirements)
    And a FHIR AuditEvent records: clinician ID + timestamp + confirmation that review was completed + the fact that AI assistance was used
    And the AI model is never listed as a signatory — the clinician is the sole author of record

  Scenario: AI stream is interrupted mid-note
    Given the AI note is streaming
    When the connection drops before the stream completes (no "message_stop" event received)
    Then the partial note is preserved exactly as streamed
    And the note status changes to "Incomplete — do not sign"
    And "Resume" and "Start over" options are offered
    And the incomplete note is never signable in its current state

  Scenario: Clinician cancels the AI stream
    Given the AI note is streaming
    When the clinician clicks "Cancel"
    Then the server-side AbortController fires, terminating the upstream Anthropic API call
    And the partial note is preserved
    And the note is marked "Incomplete — do not sign"
    And no further tokens arrive after the cancellation

  Scenario: AI model is rate limited
    Given the Anthropic API returns a rate-limit error
    When this occurs
    Then I see "Documentation assistant is busy. You can write the note manually while we retry."
    And the manual note editor is immediately available with no loading state or block
    And manual charting is never blocked by an AI service failure

  Scenario: ONC HTI-1 model-facts panel is accessible
    Given the AI documentation panel is open
    When I click "About this AI"
    Then a collapsible panel opens showing: purpose, intended population, training data description, validation methodology and known accuracy figures (cited as self-reported), fairness assessment, known limitations, and last-reviewed date
    And this panel is present whenever the AI documentation feature is used in a certified EHR context
    And none of the content in this panel is marketing — it reflects the actual model's documented properties
```

---

## 8. Prior Authorization Tracker (Athena Provider)

```gherkin
Feature: Prior authorization status tracker

  Scenario: Prior auth submitted and pending
    Given a clinician initiates a prior authorization request
    When the PA is submitted
    Then the XState PA machine transitions to "submitted"
    And the status displays "Pending — awaiting payer decision"
    And the submission timestamp and turnaround deadline are shown
    And the deadline reflects CMS-0057-F requirements: 72 hours for urgent, 7 calendar days for standard

  Scenario: Additional documentation requested by the payer
    Given a PA is pending
    When the payer requests additional documentation
    Then the PA status updates to "Additional documentation needed"
    And a specific list of requested items is shown if available
    And the remaining deadline adjusts appropriately

  Scenario: PA approved
    Given a PA is under review
    When the payer approves it
    Then the status updates to "Approved" with the approval date and authorization number
    And a FHIR Claim or CoverageEligibilityResponse (per the API) records the approval

  Scenario: PA denied with reason
    Given a PA is under review
    When the payer denies it
    Then the status updates to "Denied" with the denial reason visible in plain language
    And an appeal option is surfaced
    And the specific denial reason is shown (required under CMS-0057-F for applicable payers)

  Scenario: PA status unknown — never shown as approved
    Given a PA's current status cannot be confirmed (e.g., the API call failed or returned an unrecognized status)
    When the status is displayed
    Then I see "Status unknown — do not assume approved"
    And no action that requires prior authorization proceeds until the status is confirmed
    And this is a hard invariant: an unverified PA status is never displayed as approved

  Scenario: PA turnaround clock exceeded
    Given a standard PA has been pending for more than 7 calendar days
    When I view the PA tracker
    Then a warning indicates the turnaround deadline has passed
    And I see "Payer response overdue — consider escalating" with a contact path

  Scenario: Urgent PA turnaround clock exceeded
    Given an urgent PA has been pending for more than 72 hours
    When I view the PA tracker
    Then a critical-tier alert appears: "Urgent PA response overdue — patient care may be delayed"
    And this is never a dismissible informational badge — it requires acknowledgment
```

---

## 9. Encounter Lifecycle (Athena Provider)

```gherkin
Feature: Encounter lifecycle state machine

  Scenario: Encounter transitions from planned to arrived
    Given an Encounter resource exists with status "planned"
    When the clinician confirms the patient has arrived
    Then the Encounter status updates to "arrived"
    And the timestamp is recorded
    And downstream panels (vitals, notes, forms) become editable

  Scenario: Encounter transitions to in-progress
    Given an Encounter is in "arrived" status
    When the clinician begins the clinical assessment
    Then the Encounter status updates to "in-progress"
    And the encounter timer starts

  Scenario: Encounter finishes — note signed and encounter closed
    Given an Encounter is in "in-progress" status
    And the clinician has signed the encounter note
    When the clinician closes the encounter
    Then the Encounter status updates to "finished"
    And the encounter is no longer editable without an amendment
    And a FHIR AuditEvent records the closure

  Scenario: Encounter cancelled
    Given an Encounter is "planned" or "arrived"
    When the encounter is cancelled with a reason
    Then the Encounter status updates to "cancelled"
    And any in-progress documentation is preserved as a draft (not discarded)
    And the reason for cancellation is recorded

  Scenario: Attempt to transition to an illegal state
    Given the XState encounter machine is in "finished" state
    When any action attempts to transition back to "in-progress" directly
    Then the transition is rejected by the state machine
    And no illegal state is representable — this is a core benefit of XState over boolean flags
```

---

## 10. Biometric Authentication (Athena Field)

```gherkin
Feature: Biometric authentication — Athena Field

  Scenario: Successful Face ID / Touch ID unlock
    Given I have enrolled biometrics on my device
    And I previously enabled biometric login in Athena Field
    When I open the app
    Then the OS biometric prompt is triggered
    And upon a successful match, the access token is retrieved from the biometric-gated Keychain service (using accessControl: BIOMETRY_CURRENT_SET and accessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY)
    And I am taken to my patient/visit list without re-entering credentials

  Scenario: Biometric match fails — retry available
    Given the biometric prompt is displayed
    When the scan does not match the enrolled biometric
    Then I am given the option to retry
    And after 3 failed attempts, I see "Too many attempts. Use your passcode to continue."
    And the app falls back to password/passcode authentication

  Scenario: Biometric hardware unavailable
    Given my device has no biometric sensor or biometrics are disabled at the OS level
    When I open the app
    Then I see "Biometrics aren't set up on this device. Sign in with your password."
    And I am never blocked from accessing the app via standard login

  Scenario: User cancels the biometric prompt
    Given the biometric prompt is displayed
    When I tap "Cancel" or dismiss the prompt
    Then the app presents the manual sign-in screen
    And no error is shown — this is a neutral user choice

  Scenario: Enrolled biometrics changed since last session (security event)
    Given the device's enrolled biometric set (Face ID or fingerprint roster) has changed since I last logged in
    When I open the app
    Then the previously stored access token and keychain entry are immediately invalidated
    And I see "Your device's biometrics changed. Please sign in again to re-enable Face ID."
    And full re-authentication is required before biometric login can be re-enabled
    And this check is never bypassed — a changed biometric roster is a potential security event

  Scenario: Two-service Keychain architecture is enforced
    Given the app uses two distinct Keychain namespaces
    When the app makes a routine authenticated API call
    Then the access token is read from the "unlocked" Keychain namespace, which does not trigger a biometric prompt
    And the biometric-gated namespace is accessed only during explicit re-authentication actions (app unlock or step-up)
    And tokens are stored with accessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY — they are never accessible when the device is locked

  Scenario: Step-up biometric for a high-sensitivity action
    Given I am documenting a visit and attempt an action requiring step-up (e.g., submitting a controlled-substance-adjacent form)
    When the step-up gate triggers
    Then the biometric prompt is re-triggered even if I unlocked the app moments ago
    And a successful match is required for that specific action
    And a failed match does not lock the entire app — only that action is blocked
```

---

## 11. Offline Visit Documentation (Athena Field)

```gherkin
Feature: Offline-first visit documentation — Athena Field

  Scenario: Documenting a visit with no network connectivity
    Given I have no network connectivity (airplane mode or no signal)
    When I complete visit documentation — vitals entry, QuestionnaireResponse, clinical notes
    Then all data is saved to the local encrypted SQLite database (WatermelonDB + SQLCipher)
    And an outbox entry is created with status "PENDING"
    And I see "Saved on device — syncing when connected."
    And the local database is encrypted with SQLCipher using the device Keystore (Android) or Data Protection class (iOS)

  Scenario: Outbox syncs automatically on reconnection
    Given I have PENDING outbox entries from offline documentation
    When network connectivity is restored (detected via NetInfo)
    Then the sync engine initiates a pull/push cycle
    And each outbox entry transitions: PENDING → IN_FLIGHT → SYNCED (or CONFLICT or FAILED)
    And I see a global sync progress indicator

  Scenario: Sync completes with all records synced
    Given the sync cycle runs and all records sync without conflict
    When the cycle completes
    Then the SyncStatusBar shows "All synced"
    And per-record badges update to show the synced state

  Scenario: Outbox queue is full
    Given I already have the configured maximum number of records pending sync
    When I attempt to create a new documentation record
    Then I see "You have {n} visits waiting to sync. Connect soon to avoid storage issues."
    And large captures (photos) are specifically blocked with guidance to sync first

  Scenario: Return online after extended offline period (> 4 hours)
    Given I was offline for more than 4 hours
    When connectivity is restored
    Then the app shows "Updating your data…" while refreshing cached clinical data
    And any cached clinical values (vitals, meds) older than the safety threshold display a "Verify before relying on" indicator
    And the indicator clears only after a fresh fetch confirms the data is current

  Scenario: Session expires mid-visit while offline
    Given I am documenting a visit offline
    And my session token expires
    When I return online and the sync engine tries to push
    Then the sync preserves all local documentation
    And I see "Session timed out. Your work is saved — sign in to continue."
    And after re-authentication, the sync is retried automatically with the same data intact

  Scenario: Remote-wipe triggered by server flag
    Given the server has set a remote-wipe flag for my device (e.g., device reported lost or stolen)
    When the app makes its next server contact
    Then all locally stored clinical data is wiped from the device
    And all Keychain entries are cleared
    And I am redirected to the login screen
    And a FHIR AuditEvent records the wipe event
```

---

## 12. Clinical Conflict Resolution (Athena Field)

```gherkin
Feature: Clinical conflict resolution — human-mediated, never last-write-wins

  Scenario: Sync conflict detected on a clinical value
    Given I documented a patient's systolic BP as 128 mmHg while offline
    And during my offline period, another clinician recorded the same patient's systolic BP as 145 mmHg from a different device
    When I return online and the sync engine pushes my changes
    Then the server detects the conflict (both values modified since the lastPulledAt baseline)
    And a ConflictResolutionDialog opens showing:
      - My value: "128 mmHg — recorded by [my name], [my timestamp], [my device]"
      - Server value: "145 mmHg — recorded by [other clinician's name], [their timestamp], [their device]"
    And no automatic resolution is applied — a human must choose
    And this is treated as a Patient-Safety-Critical scenario: silent overwrites of clinical values are a patient safety event

  Scenario: Clinician resolves a conflict by choosing one version
    Given the ConflictResolutionDialog is open with two conflicting values
    When I select "Use my value (128 mmHg)" and confirm
    Then my value is written back to WatermelonDB as the resolved value
    And the resolved value is queued for re-sync with the server
    And a FHIR AuditEvent records: which version was chosen, by whom, at what time, and that a conflict existed

  Scenario: Clinician resolves a conflict by editing a new value
    Given the ConflictResolutionDialog is open
    When I select "Enter a different value" and enter 132 mmHg with a note
    Then 132 mmHg is set as the resolved value with the note as a comment
    And this new value is queued for sync
    And the audit event records the manually entered resolution

  Scenario: Multiple conflicts exist after a long offline period
    Given 5 clinical fields have sync conflicts after reconnection
    When the sync engine processes the push
    Then ConflictResolutionDialog is opened sequentially for each conflict
    And I must resolve all 5 before the sync is considered complete
    And no conflicts are silently skipped or auto-resolved

  Scenario: Conflict on a non-clinical metadata field
    Given a conflict exists on a non-clinical metadata field (e.g., note formatting preference)
    When this is detected
    Then field-level merge is applied automatically (last-write-wins is acceptable for non-clinical metadata)
    And no ConflictResolutionDialog is shown for this field
    And the system distinguishes between clinical data (always human-mediated) and metadata (field-level merge permitted)

  Scenario: Conflict resolution dialog dismissed without a choice
    Given the ConflictResolutionDialog is open
    When the clinician tries to dismiss it by pressing the device back button or tapping outside
    Then the dialog remains open
    And I see "This conflict must be resolved before syncing can continue."
    And the conflict is never silently abandoned
```

---

## 13. QuestionnaireResponse Forms (Athena Field)

```gherkin
Feature: FHIR QuestionnaireResponse clinical forms

  Scenario: Form renders from a FHIR Questionnaire resource
    Given a Questionnaire resource has been pushed to the device
    When I open the form
    Then all items render in the order specified by the Questionnaire
    And required fields are marked with a visible required indicator
    And the form is fully usable offline

  Scenario: "enableWhen" conditional logic shows and hides items correctly
    Given a Questionnaire has an item that should only appear when a prior item has a specific value
    When I enter the triggering value in the prior item
    Then the conditional item appears immediately
    And when I clear or change the prior value, the conditional item is hidden
    And the hidden item's value is cleared so it is not included in the QuestionnaireResponse

  Scenario: "enableWhen" conditional logic fails due to a missing reference
    Given a Questionnaire has an enableWhen condition referencing a question ID that does not exist
    When the form renders
    Then the affected item is shown by default (fail-safe — a hidden question due to a logic error is worse than a visible one)
    And the logic error is logged for engineering review without showing a technical error to the clinician

  Scenario: Clinician submits form with a required field empty
    Given I attempt to submit a QuestionnaireResponse with a required field left blank
    When I tap "Submit"
    Then submission is blocked
    And an inline field-level error is shown in plain language: "Please enter the patient's pain level." (not a FHIR error code)
    And focus moves to the first invalid field

  Scenario: Invalid code system value entered
    Given a form item requires a code from a specific ValueSet
    When I enter a code that does not exist in that ValueSet
    Then the field shows "Please select a valid option" with the allowed options listed
    And the invalid code is never saved to the QuestionnaireResponse

  Scenario: Form saved offline and queued for sync
    Given I complete a QuestionnaireResponse while offline
    When I submit the form
    Then the QuestionnaireResponse is saved to the local WatermelonDB with status PENDING
    And I see "Saved — will sync when connected."
    And the QuestionnaireResponse is FHIR R4 valid at the point of local storage (validated client-side)

  Scenario: Sync of QuestionnaireResponse fails on reconnection
    Given a QuestionnaireResponse is in the PENDING outbox
    When the sync push fails (e.g., FHIR validation failure on the server)
    Then the QuestionnaireResponse status updates to FAILED in the outbox
    And I see a per-record error: "Failed to sync — tap to retry."
    And the data is never lost — it remains in the local database

  Scenario: FHIR validation failure on QuestionnaireResponse sync
    Given the server rejects a QuestionnaireResponse with a 422 OperationOutcome
    When this is returned
    Then the specific OperationOutcome.issue[] entries are parsed
    And the clinician sees plain-language guidance on what to fix
    And the QuestionnaireResponse remains in the local database for correction
```

---

## 14. Clinical Photo Capture (Athena Field)

```gherkin
Feature: Clinical photo capture for wound documentation

  Scenario: Successful photo capture while offline
    Given I am documenting a home visit and the camera permission is granted
    When I capture a wound photo
    Then the photo is saved to the local encrypted store
    And all EXIF metadata (GPS coordinates, device serial, timestamp-linked location data) is stripped from the photo before local storage
    And the photo is queued in the outbox with status PENDING

  Scenario: Camera permission denied
    Given the app does not have camera permission
    When I tap "Capture photo"
    Then a dialog appears: "Allow camera access in Settings to capture wound photos."
    And a deep link to the system Settings page is shown
    And the app never crashes or shows a blank screen — it always explains what action is needed

  Scenario: Camera permission denied — Settings deep link
    Given the camera-permission dialog is showing
    When I tap "Open Settings"
    Then the device's Settings app opens to the app's permissions page
    And when I return to Athena Field with camera permission now granted, the capture flow is available immediately

  Scenario: Photo upload fails on sync
    Given one or more photos are in the PENDING outbox
    When the sync push fails for a photo
    Then the photo remains in the local store with status FAILED
    And I see a per-record retry option
    And the photo is never lost from local storage on a sync failure

  Scenario: Attachment too large
    Given I attempt to attach a photo exceeding the maximum file size
    When the file is selected or captured
    Then I see "This file is too large. Max size is [X] MB." before any upload is attempted
    And guidance is offered to retake at lower resolution

  Scenario: GPS stripping verified
    Given a photo is captured with location services active on the device
    When the photo is saved to the local store
    Then no GPS coordinates are present in the stored file's EXIF metadata
    And this is enforced programmatically before save — it never relies on the clinician to disable location in Settings

  Scenario: Photo fails a client-side blur check
    Given I am capturing a wound photo
    And the captured image fails a client-side blur-detection check
    When the capture completes
    Then I see "This photo looks blurry — hold the camera steady and retake" with "Retake" and "Use this photo anyway" actions
    And choosing "Use this photo anyway" queues the original capture to the outbox with a qualityWarning: blurry flag attached, rather than discarding it

  Scenario: Photo fails a client-side glare check
    Given I am capturing a wound photo
    And the captured image fails a client-side glare-detection check (e.g. a reflective light source washing out the wound site)
    When the capture completes
    Then I see "This photo has glare — reposition to avoid reflections and retake" with "Retake" and "Use this photo anyway" actions
    And choosing "Use this photo anyway" queues the original capture to the outbox with a qualityWarning: glare flag attached, rather than discarding it
```

---

## 15. Sync Status & Push Notifications (Athena Field)

```gherkin
Feature: Sync status visibility and push notifications

  Scenario: SyncStatusBar reflects current outbox state
    Given I have completed two visits while offline
    When I view the SyncStatusBar
    Then it shows "2 pending" with a pending-sync icon
    And after sync completes, it shows "All synced" with a checkmark

  Scenario: SyncStatusBar shows conflict state
    Given a sync conflict exists
    When I view the SyncStatusBar
    Then it shows "1 conflict — tap to resolve" with a warning icon
    And tapping it navigates directly to the ConflictResolutionDialog

  Scenario: SyncStatusBar shows failure state
    Given a sync failed for one record
    When I view the SyncStatusBar
    Then it shows "1 failed to sync — tap to retry" with an error icon
    And tapping "retry" re-attempts only the failed record (not the full sync)

  Scenario: Push notification received for a visit update
    Given I receive a push notification referencing a visit assignment
    When I tap the notification
    Then the app re-fetches the current state of the referenced resource from the server before rendering
    And the notification's embedded snapshot data is never rendered as live clinical data
    And if the visit has been cancelled, I see the current cancelled status — not the snapshot from when the notification was sent

  Scenario: Push notification received while the device is offline
    Given my device has no connectivity
    When a push notification arrives (delivered by the OS push service)
    Then upon tapping the notification after connectivity is restored, the app fetches fresh data
    And stale notification payload data is never used as the source of truth for clinical information

  Scenario: Push notification for a reassigned visit
    Given I receive a push notification for a visit that was reassigned to another clinician after the notification was sent
    When I tap the notification
    Then after fetching the current resource, I see "This visit is no longer assigned to you" — not the visit content from the notification
```

---

## 16. HIPAA Compliance (Cross-Cutting)

```gherkin
Feature: HIPAA technical safeguard compliance

  Scenario: PHI is never present in a URL
    Given any navigation within Athena Provider or Athena Field
    When a URL is generated for any route
    Then the URL contains only opaque FHIR resource IDs (e.g., /patient/f47ac10b-58cc-4372-a567-0e02b2c3d479)
    And the URL never contains a patient name, date of birth, MRN, SSN, or any other PHI as a path segment or query parameter
    And this is enforced by the usePhiSafeNavigation wrapper — direct router.push() calls with PHI are a compile error via linting

  Scenario: PHI is never stored in localStorage or sessionStorage
    Given any clinical data is loaded from the FHIR server
    When it is stored client-side (web)
    Then it lives in memory only during the active session
    And no patient name, date of birth, MRN, observation value, or any other PHI is written to localStorage or sessionStorage
    And on session end or page close, in-memory PHI is garbage-collected

  Scenario: PHI is never included in analytics events
    Given any user interaction that occurs in the context of a patient chart
    When an analytics event is emitted
    Then the event payload contains only resource types and event types (e.g., { event: "vitals_viewed", resourceType: "Observation" })
    And the event payload never contains a patient identifier, name, value, or any PHI
    And this is enforced by the PHI<T> branded type — analytics functions accept only non-PHI strings at the type level

  Scenario: PHI is scrubbed from error reports before they leave the device
    Given a JavaScript error occurs in the context of a patient chart
    When the error is reported to the error-tracking service (Sentry)
    Then the beforeSend hook strips all request bodies and scrubs known PHI keys from the event
    And only the error type, stack trace, and scrubbed context are transmitted
    And the patient ID in a URL is replaced with a placeholder (e.g., "[REDACTED_PATIENT_ID]") before transmission

  Scenario: PHI-safe branded type blocks PHI from reaching unsafe sinks
    Given a PHI<string> value (e.g., a patient family name) is marked at the point of receipt from the FHIR server
    When code attempts to pass this value to a function that accepts only non-PHI strings (e.g., logEvent, sendAnalytics)
    Then the TypeScript compiler emits an error
    And the developer must explicitly strip or redact the PHI before the call — accidental PHI logging is a compile-time error, not a runtime one

  Scenario: Auto-logoff enforces HIPAA session timeout
    Given the HIPAA auto-logoff policy is 15 minutes of inactivity
    When this threshold is reached
    Then the session is terminated, in-memory tokens are cleared, and any open Subscription connections are closed
    And the 15-minute timer is reset by any user interaction (mouse, keyboard, touch, scroll)
    And the timer is not configurable below 15 minutes through any user-facing setting

  Scenario: Audit log records every PHI access
    Given a clinician views a patient chart, a vitals panel, or any PHI-containing resource
    When the view event occurs
    Then a FHIR AuditEvent is written containing: practitioner ID, patient ID, resource type, action type, and timestamp
    And the AuditEvent is written to the FHIR server, not to a local-only log
    And the AuditEvent itself contains only the minimum necessary identifiers — it does not duplicate the clinical data it logs access to

  Scenario: PHI handling on Anthropic API calls
    Given the AI documentation feature processes encounter transcript text (which is PHI)
    When the Anthropic API is called
    Then the call is made from a server-side route only — the API key and the PHI payload never appear in any client-side request, browser network tab, or client-side log
    And the server-side proxy is the only component that holds the API key and constructs the prompt
    And this architecture is required by the BAA — PHI must be handled only by BAA-covered components
```

---

## 17. Accessibility (Cross-Cutting)

```gherkin
Feature: WCAG 2.1 AA compliance across Athena Provider and Athena Field

  Scenario: Clinical severity indicators are never color-only
    Given any UI element conveys a clinical severity (critical, advisory, informational, stale, preliminary, entered-in-error)
    When it is rendered
    Then it includes both an icon and a text label in addition to color
    And this applies to: AlertCard severity, VitalTile freshness state, ObservationStatusBadge, SyncStatusBar, BudgetGauge equivalents, and all clinical state badges

  Scenario: Keyboard-only navigation through the Provider chart
    Given I am navigating the Athena Provider chart using only a keyboard
    When I tab through the page
    Then focus moves in a logical document order through all interactive elements
    And each focused element has a visible focus ring of at least 3px
    And all critical actions (sign note, override alert, submit form) are reachable and activatable via keyboard alone

  Scenario: Screen reader announces a VitalTile value correctly
    Given a screen reader user is viewing the vitals dashboard
    When a VitalTile is read
    Then the announcement is "Systolic BP: 128 millimeters of mercury, final, updated 2 minutes ago"
    And freshness state changes are announced via an aria-live region
    And the "stale" or "disconnected" state change is announced as it occurs

  Scenario: Critical alert modal is focus-trapped
    Given a Critical CDS alert modal is open
    When it is displayed
    Then keyboard focus is trapped within the modal
    And pressing Escape does not close or dismiss it (dismissal requires an explicit action)
    And screen readers announce the modal's title and the required action

  Scenario: Form validation errors are announced to screen readers
    Given I submit a QuestionnaireResponse form with a validation error
    When the error appears
    Then it is associated with the erroring field via aria-describedby
    And it is announced via a role="alert" or role="status" live region
    And the error message is in plain language — not a FHIR validation code

  Scenario: Minimum touch target size on Athena Field
    Given I am using Athena Field on a mobile device
    When I view any primary interactive control (buttons, toggles, checkboxes)
    Then each control has a minimum touch target of 44×44px
    And this applies even when controls appear in condensed clinical data tables

  Scenario: "entered-in-error" is conveyed without color alone
    Given an Observation with "entered-in-error" status is shown
    When it is rendered
    Then it shows strikethrough styling plus the explicit text label "Entered in error"
    And a screen reader user hears "Entered in error" when navigating to the value

  Scenario: Accessibility error in CI blocks deployment
    Given the axe-playwright accessibility scan runs on all Athena Provider surfaces
    When any WCAG 2.1 AA violation is detected
    Then the CI build fails and the violation is reported with the specific element and rule
    And no accessibility regression is deployable without explicit acknowledgment and a fix plan
```

---

## 18. Audit Logging (Cross-Cutting)

```gherkin
Feature: FHIR AuditEvent logging for all PHI access and clinical actions

  Scenario: Every chart view generates an AuditEvent
    Given any clinician opens a patient chart in Athena Provider
    When the chart renders
    Then a FHIR AuditEvent is written to the server containing:
      - agent: the clinician's Practitioner resource reference
      - entity: the Patient resource reference
      - type: "read"
      - outcome: "success"
      - recorded: the current timestamp

  Scenario: Every vital-signs view generates an AuditEvent
    Given a clinician views the real-time vitals panel
    When the panel loads
    Then a FHIR AuditEvent is written with the Observation category and patient reference

  Scenario: AI note sign-off generates an AuditEvent
    Given a clinician signs an AI-assisted clinical note
    When signing completes
    Then a FHIR AuditEvent is written recording: clinician ID, patient ID, document ID, timestamp, the fact that AI assistance was used, and confirmation that the clinician completed the required review

  Scenario: CDS alert override generates an AuditEvent
    Given a clinician overrides a Critical CDS alert with a reason
    When the override is confirmed
    Then a FHIR AuditEvent records: clinician ID, alert type, override reason, and timestamp

  Scenario: Clinical conflict resolution generates an AuditEvent
    Given a clinician resolves a sync conflict in Athena Field
    When the resolution is submitted
    Then a FHIR AuditEvent records: which clinician resolved it, which value was chosen, both conflicting values (local and server), and the timestamp

  Scenario: PHI reveal in PHIMaskedField generates an AuditEvent
    Given a PHIMaskedField is displaying a masked PHI value
    When the clinician explicitly reveals the value by tapping/clicking the reveal action
    Then a FHIR AuditEvent records: the clinician, the patient, the field type revealed, and the timestamp

  Scenario: Remote wipe generates an AuditEvent
    Given a remote-wipe flag is processed by Athena Field
    When the wipe executes
    Then a FHIR AuditEvent is written (to the extent the device can reach the server) recording the wipe event, the device identifier, and the timestamp

  Scenario: Audit log is immutable
    Given any FHIR AuditEvent has been written
    When any user (including clinicians or administrators) attempts to modify or delete it
    Then the action is rejected with a 405 Method Not Allowed or 403 Forbidden
    And FHIR AuditEvents may only be created — never updated or deleted

  Scenario: Viewing the audit log is itself logged
    Given an administrator accesses the audit log view
    When they open it
    Then a FHIR AuditEvent records the access to the audit log itself (who, when, what date range was queried)
    And this prevents undetected audit log review from outside the system
```

---

## 19. Organization & User Provisioning (Athena Provider)

### 19.1 Creating Admin and User accounts

```gherkin
Feature: Account creation by an Account Owner or Admin

  Scenario: Account Owner creates a new Admin
    Given I am logged in as an Account Owner
    And I am on the "Manage users" page
    When I enter a first name, last name, work email, select the "Admin" role, and submit
    Then a new Admin account is created, scoped to my organization
    And a modal appears showing a system-generated temporary password
    And a "Copy" button lets me copy the temporary password to the clipboard
    And a FHIR AuditEvent records who created the account, the role assigned, and when

  Scenario: Account Owner or Admin creates a new User
    Given I am logged in as an Account Owner or an Admin
    And I am on the "Manage users" page
    When I enter a first name, last name, work email, select one of the existing clinical roles (Physician, Nurse, Care Coordinator), and submit
    Then a new account with that role is created, scoped to my organization
    And the same copyable temporary-password modal appears as when an Admin is created
    And a FHIR AuditEvent records who created the account, the role assigned, and when
```

### 19.2 Role-creation restrictions

```gherkin
Feature: Role-scoped creation authority

  Scenario: Admin cannot create another Admin or Account Owner
    Given I am logged in as an Admin
    When I open the "Manage users" page's role selector
    Then only Physician, Nurse, and Care Coordinator are offered — "Admin" and "Account Owner" are not present as options, not merely disabled
    And a direct API request from an Admin caller specifying role=admin or role=account_owner is independently rejected server-side with a 403

  Scenario: "Account Owner" is never a selectable role in this flow
    Given I am logged in as an Account Owner or Admin
    When I view the "Manage users" page's role selector
    Then "Account Owner" never appears as an option under any circumstance
    And the only Account Owner account for my organization is the one seeded outside this flow when the organization was first stood up
```

### 19.3 Temporary password lifecycle

```gherkin
Feature: One-time temporary password issuance

  Scenario: Temporary password must be changed on first login
    Given an account was created with a system-generated temporary password
    When that person logs in for the first time using the temporary password
    Then they are required to set a new password meeting complexity requirements before reaching the dashboard
    And the temporary password cannot be used again once the new password is set

  Scenario: Temporary password is not retrievable once the modal is dismissed
    Given the temporary-password modal has been closed
    When the Account Owner or Admin returns to the "Manage users" page
    Then the temporary password is never shown again in plaintext anywhere in the UI
    And "Reissue temporary password" is the only way to recover access if it was never successfully handed off

  Scenario: Reissuing a temporary password
    Given an existing account has never completed its first login
    When an Account Owner or Admin selects "Reissue temporary password" for that account from the "Manage users" list
    Then a new temporary password is generated and shown once in the same copyable modal as account creation
    And the previous temporary password is invalidated, even if it was never used
    And a FHIR AuditEvent records who reissued the credential, for which account, and when
```

### 19.4 Duplicate accounts and organization scoping

```gherkin
Feature: Email uniqueness and organization isolation

  Scenario: Duplicate email is rejected
    Given an account already exists for a given email address
    When an Account Owner or Admin attempts to create another account with that same email
    Then the submission is blocked with "An account with this email already exists."
    And no duplicate account or duplicate temporary password is generated

  Scenario: Accounts are scoped to a single organization
    Given I am logged in as an Account Owner or Admin for Organization A
    When I view the "Manage users" page
    Then I see only the accounts belonging to Organization A
    And attempting to view or modify an account belonging to a different organization (e.g. via direct API/URL manipulation) is independently rejected server-side with a 403
```

---

*End of document. This Gherkin specification covers Athena Provider (web) and Athena Field (React Native) across 19 feature areas and approximately 140 scenarios. It should be treated as a living specification — update it alongside the Athena Health Suite plan and design system documentation as new clinical features are added. Where Athena and the Clearline/Meridian projects share underlying patterns (auth, session management, streaming AI, accessibility), keep phrasing consistent so shared test helpers apply without divergence.*
