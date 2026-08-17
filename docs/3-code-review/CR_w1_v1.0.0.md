# Code Review: App Store Submission Readiness

**Review Date**: 2026-08-16  
**Version**: 1.0.0  
**Files Reviewed**:

- `.gitignore`
- `app.json`
- `assets/images/ios-icon.png`
- `docs/1-plans/F_1.0.0_app-store-submission-readiness.plan.md`
- `docs/4-unit-tests/COVERAGE-DEBT.md`
- `eslint.config.js`
- `legal/privacy-policy.md`
- `legal/terms-of-service.md`
- `src/app/_layout.tsx`
- `src/app/auth.tsx`
- `src/app/profile.tsx`
- `src/content/legal.ts`
- `src/lib/auth/context.tsx`
- `src/lib/supabase.ts`
- `supabase/functions/delete-account/deno.json`
- `supabase/functions/delete-account/index.ts`
- `tsconfig.json`

**Plan**: `docs/1-plans/F_1.0.0_app-store-submission-readiness.plan.md`

---

## Executive Summary

The change prepares Nearly Departed 1.0.0 for App Store submission by hardening iOS configuration, enabling Sign in with Apple, implementing authenticated account deletion with best-effort Apple token revocation, and correcting legal disclosures. Both major findings raised during review were addressed, and no new issues remained after the incremental review.

APPROVED

---

## Changes Overview

The implementation makes `app.json` the CNG source of truth for Apple Sign In, encryption compliance, permission descriptions, splash styling, and the iOS icon. It adds a JWT-scoped Supabase Edge Function for account deletion, client-side Apple reauthentication and session eviction, destructive profile UI, updated privacy and terms content, and an isolated Deno tooling boundary. Edge-function test coverage remains tracked in the coverage-debt ledger.

---

## Findings

### Critical Issues

None.

### Major Issues

- **Unbounded Apple revocation requests** — `supabase/functions/delete-account/index.ts:109`, `supabase/functions/delete-account/index.ts:140`. The initial implementation awaited both Apple endpoints without deadlines, allowing a stalled revocation request to prevent account deletion. **Disposition: addressed** — both requests now use 10-second abort deadlines at `supabase/functions/delete-account/index.ts:118` and `supabase/functions/delete-account/index.ts:149`; timeout failures enter the best-effort catch at `supabase/functions/delete-account/index.ts:156` before deletion proceeds at `supabase/functions/delete-account/index.ts:201`.

- **Stale local session after successful account deletion** — `src/lib/auth/context.tsx:121`. The initial implementation used `.catch()` on `signOut()`, although Supabase returns routine failures through `{ error }`, potentially leaving a deleted account displayed as signed in. **Disposition: addressed** — the result error is inspected at `src/lib/auth/context.tsx:121-124`; failures explicitly remove persisted auth data and reset provider state at `src/lib/auth/context.tsx:125-130`. The public eviction path uses the explicit key declared at `src/lib/supabase.ts:23` and configured at `src/lib/supabase.ts:29`.

### Minor Issues

None.

### Suggestions

None.

---

## Checklist

- [x] 1. Functional Requirements — passed
- [x] 2. Code Quality — passed
- [x] 3. Architectural Compliance — passed against the plan’s architectural context; `docs/ARCHI.md` is intentionally pending TRIP initialization
- [x] 4. Error Handling — passed after both major findings were addressed
- [x] 5. Security — passed
- [x] 6. Performance — passed

---

## Verdict

**APPROVED**

All review findings are addressed. The explicit storage key intentionally invalidates existing pre-release beta sessions once (`src/lib/supabase.ts:23-29`). Deno coverage remains documented at `docs/4-unit-tests/COVERAGE-DEBT.md:5`; Apple credentials, Edge Function deployment, hosted legal updates, integration verification, and EAS/App Store operations remain manual release steps tracked at `docs/1-plans/F_1.0.0_app-store-submission-readiness.plan.md:194-211`, not open code-review findings.

