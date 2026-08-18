# Changelog Table

| Version | Week | Object |
| --- | --- | --- |
| `1.0.2` | 1 | fix: editable display name with account sync + friendly auth error copy (TestFlight build 4 batch) |
| `1.0.1` | 1 | chore: add twice-daily Supabase keep-alive workflow to prevent free-tier auto-pause |
| `1.0.0` | 1 | feat: App Store submission readiness — Apple sign-in, in-app account deletion with token revocation, truthful privacy disclosures |

## Changelog Summary

- **1.0.2 (w1)** — TestFlight build-4 batch: editable display name (account-synced with scoped keys, clear-tombstones, and race guards so names never leak across accounts or get resurrected/clobbered) replacing the private-relay email as profile identity, plus policy-based friendly auth error copy so raw server JSON can never render. Privacy policy discloses the synced name; migration 0003 adds `profiles.display_name`.
- **1.0.1 (w1)** — Twice-daily GitHub Actions keep-alive pinging Supabase with two RLS-safe queries so the free-tier project avoids its ~7-day inactivity pause (best-effort; fails loud via GitHub email). App binary untouched — `expo.version` stays 1.0.0 for the first store submission.
- **1.0.0 (w1)** — First release candidate for App Store submission: CNG-complete iOS config (Apple Sign In entitlement, encryption compliance, honest permission strings), Sign in with Apple enabled with the official button, in-app account deletion with best-effort Apple token revocation, hardened session eviction, and privacy/terms corrected to disclose account sync truthfully.
