## Summary

<!-- What does this PR do and why? Give the reviewer context/intent up front — they'll still read the full diff, this just saves them from reverse-engineering the reasoning. -->

## Ticket

<!-- Link the epic/user story, e.g. EPIC-SH-000 or US-SH-001. -->

- Ticket:

## Type of change

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Chore / build / CI
- [ ] Breaking change

## How was this tested?

<!-- Commands run, manual steps taken, edge cases exercised. Link a recording/screenshot for UI changes. -->

- [ ] `pnpm exec nx affected --target=lint`
- [ ] `pnpm exec nx affected --target=type-check`
- [ ] `pnpm exec nx affected --target=test`
- [ ] `pnpm exec nx affected --target=e2e`
- [ ] Manually verified in the browser

## Manual testing steps

<!-- Numbered steps a reviewer can follow to reproduce and verify the change themselves, including the expected result at each step. Cover the golden path plus any edge cases you exercised (e.g. failed login, network retry, lockout). -->

### Prerequisites

<!-- Env vars, seeded/fixture data, feature flags, accounts, or setup steps needed before the steps below will work. -->

-

### Steps

1.
2.
3.

## Screenshots

<!-- Required for UI changes. Before/after if visual behavior changed. -->

## Security & privacy considerations

<!-- Required for anything touching auth, tokens, PHI/PII, or clinical data (FHIR resources, Medplum access). "None" is a valid answer if genuinely not applicable. -->

## Checklist

- [ ] Self-reviewed the diff
- [ ] No secrets, tokens, credentials, or PHI committed
- [ ] Tests added/updated for the behavior change
- [ ] Specs updated if this changes them (`specs/designs`, `specs/epics`, `specs/user-stories`)
- [ ] No unrelated changes bundled in
