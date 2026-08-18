# Code Review: Build 4 TestFlight Fixes

**Review Date**: 2026-08-18  
**Version**: 1.0.2  
**Files Reviewed**:

- `docs/1-plans/F_1.0.2_build4-testflight-fixes.plan.md`
- `docs/testflight-feedback.md`
- `legal/privacy-policy.md`
- `src/app/auth.tsx`
- `src/app/profile.tsx`
- `src/content/legal.ts`
- `src/lib/auth/messages.test.ts`
- `src/lib/auth/messages.ts`
- `src/lib/avatar/context.tsx`
- `src/lib/sync/merge.test.ts`
- `src/lib/sync/merge.ts`
- `src/lib/sync/remote.ts`
- `supabase/migrations/0003_display_name.sql`

**Plan**: `docs/1-plans/F_1.0.2_build4-testflight-fixes.plan.md`

---

## Executive Summary

The change adds account-synced display names with user-scoped local persistence and replaces raw authentication errors with safe, actionable copy. Both Major issues found during the initial review were corrected, with no open or overridden findings.

APPROVED

---

## Changes Overview

The profile provider now reconciles avatar and display-name data through one profile request while preserving guest, per-account, and explicit-clear states. The profile screen adds display-name editing, and authentication failures use operation-specific fixed or allowlisted messages. The database migration, privacy disclosures, generated legal content, and pure-function tests accompany the implementation.

---

## Findings

### Critical Issues

None.

### Major Issues

#### Stale reconcile could overwrite a newly saved name

**Location**: `src/lib/avatar/context.tsx:101`, `src/lib/avatar/context.tsx:138`, `src/lib/avatar/context.tsx:185`, `src/lib/avatar/context.tsx:192`, `src/lib/avatar/context.tsx:203`

The original implementation could apply or push a stale reconcile result after the user saved a newer name during the network request. The final implementation increments `nameIntentRef` for explicit edits, captures the revision before reconciliation begins, and checks `superseded()` before every name application and push.

**Disposition**: Addressed.

#### Previous account name could render under another scope

**Location**: `src/lib/avatar/context.tsx:82`, `src/lib/avatar/context.tsx:149`, `src/lib/avatar/context.tsx:159`, `src/lib/avatar/context.tsx:262`

The original state stored a bare name, allowing account A’s name to appear briefly after sign-out or while account B loaded. The final implementation stores the name with its owning scope, guards asynchronous guest restoration against newer intent, and exposes the name only when its owner matches the active user ID.

**Disposition**: Addressed.

### Minor Issues

None.

### Suggestions

None.

---

## Checklist

- [x] 1. Functional Requirements — passed
- [x] 2. Code Quality — passed
- [x] 3. Architectural Compliance — passed against the implementation plan and established provider patterns; `ARCHI.md` is intentionally absent
- [x] 4. Error Handling — passed
- [x] 5. Security — passed
- [x] 6. Performance — passed

---

## Verdict

**APPROVED**

No findings were overridden or remain open. The supplied gate was clean: lint passed, type-check passed, and 43 tests passed, including 16 new tests. Migration application, hosted privacy-policy deployment, App Store privacy-label updates, simulator verification, and TestFlight submission remain intentionally deferred to the plan’s operations phase.

