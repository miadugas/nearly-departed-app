# Changelog Table

| Version | Week | Object |
| --- | --- | --- |
| `1.0.6` | 5 | feat: "Died here" discovery mode (Wikidata P20) + radius honored via two-pass ring query |
| `1.0.2` | 1 | fix: editable display name with account sync + friendly auth error copy (TestFlight build 4 batch) |
| `1.0.1` | 1 | chore: add twice-daily Supabase keep-alive workflow to prevent free-tier auto-pause |
| `1.0.0` | 1 | feat: App Store submission readiness — Apple sign-in, in-app account deletion with token revocation, truthful privacy disclosures |

## Changelog Summary

- **1.0.6 (w5)** — Explore gains a Buried here / Died here toggle. Died-mode queries Wikidata place of death (P20) through the same nearest-first pipeline, excluding places that carry a population (P1082) so "died in Denver" city-centroid rows drop and hospitals, hotels, airports and battlefields remain; an explainer under the toggle says so and links to Wikidata. Souls carry `placeKind`/`otherPlace` (optional on favorites, defaulted at read — no migration); person page reads "Died at X / Buried at Y", hides the visit control for death places (visits stay grave-only), and every person page gets an "Improve this record on Wikidata" link. Saved rows prefix death places with "died ·". The nearest-first query is now two passes (nearest 150 + hash-sampled outer ring of 90) so the chosen radius is honored in dense cities; header and map always describe the radius. Ships as build 30.
- **1.0.2 (w1)** — TestFlight build-4 batch: editable display name (account-synced with scoped keys, clear-tombstones, and race guards so names never leak across accounts or get resurrected/clobbered) replacing the private-relay email as profile identity, plus policy-based friendly auth error copy so raw server JSON can never render. Privacy policy discloses the synced name; migration 0003 adds `profiles.display_name`.
- **1.0.1 (w1)** — Twice-daily GitHub Actions keep-alive pinging Supabase with two RLS-safe queries so the free-tier project avoids its ~7-day inactivity pause (best-effort; fails loud via GitHub email). App binary untouched — `expo.version` stays 1.0.0 for the first store submission.
- **1.0.0 (w1)** — First release candidate for App Store submission: CNG-complete iOS config (Apple Sign In entitlement, encryption compliance, honest permission strings), Sign in with Apple enabled with the official button, in-app account deletion with best-effort Apple token revocation, hardened session eviction, and privacy/terms corrected to disclose account sync truthfully.
