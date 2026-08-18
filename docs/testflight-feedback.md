# TestFlight feedback — fixes for next build (v1.0.0 build 4+)

## Next batch (post-build-4)

| # | Issue | Source | Status |
| --- | --- | --- | --- |
| 4 | Discovery bottom sheet: results list is now collapsible — tap or fling the handle pill; header (search/radius/status) stays, map takes the freed space via one LayoutAnimation transition. Tapping a cemetery pin auto-expands. Simulator-verified both directions. | Mia, TF on device (build 4) 2026-08-18 | fixed (in working tree) |

## Shipped in build 4 (v1.0.2)

Collected during the pre-submission TestFlight pass. Each item gets fixed,
batched into the next build, and re-uploaded before App Store submission.

| # | Issue | Source | Status |
| --- | --- | --- | --- |
| 1 | Display name: profile header shows the Apple private-relay email (`78pw929rcr@privaterelay...`) as identity when Hide My Email is used. Add an editable display name (tap-to-edit on profile, local-first like avatar; optional `display_name` column on `profiles` for sync). | Mia, TF screenshot feedback 2026-08-18 00:14 | open |
| 2 | Email OTP send fails: `POST /auth/v1/otp` returns 500 "Error sending confirmation email" (reproduced via curl 2026-08-18). ROOT CAUSE (two layers): Supabase SMTP held an API key from an old, separate Resend account stuck in sandbox (`onboarding@resend.dev` sender → delivers only to that account's owner). FIXED 2026-08-18: verified smallpartsstudio.com in the correct Resend workspace (Cloudflare auto-config DNS), created the API key in that same workspace, sender → signin@smallpartsstudio.com, port 587. Verified: curl probe returns HTTP 200. Backend config only — no app code change. | Melanie Cadd, TF feedback 2026-08-18 00:14 | **fixed** |
| 3 | Auth screen renders the raw error JSON (`{"status":500,...}`) in the UI when send-code fails. Replace with a friendly message ("Couldn't send the code — try again in a minute or use Sign in with Apple") and keep the raw error in logs only. `src/app/auth.tsx`. | Melanie Cadd, same screenshot | open |
