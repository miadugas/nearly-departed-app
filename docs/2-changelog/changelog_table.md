# Changelog Table

| Version | Week | Object |
| --- | --- | --- |
| `1.0.1` | 1 | chore: add twice-daily Supabase keep-alive workflow to prevent free-tier auto-pause |
| `1.0.0` | 1 | feat: App Store submission readiness — Apple sign-in, in-app account deletion with token revocation, truthful privacy disclosures |

## Changelog Summary

- **1.0.1 (w1)** — Twice-daily GitHub Actions keep-alive pinging Supabase with two RLS-safe queries so the free-tier project avoids its ~7-day inactivity pause (best-effort; fails loud via GitHub email). App binary untouched — `expo.version` stays 1.0.0 for the first store submission.
- **1.0.0 (w1)** — First release candidate for App Store submission: CNG-complete iOS config (Apple Sign In entitlement, encryption compliance, honest permission strings), Sign in with Apple enabled with the official button, in-app account deletion with best-effort Apple token revocation, hardened session eviction, and privacy/terms corrected to disclose account sync truthfully.
