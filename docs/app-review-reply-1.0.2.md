# App Review reply — 1.0.2 (22), Guideline 2.1 Information Needed

Rejected 2026-08-20. Submission ID `5e5b7e04-e2be-42be-42c5-b389-63062c702e58`.

Apple's rejection is an information request, not a bug report. Separately, a real
defect surfaced while preparing the recording: entering through "Sign in or create
account" never requested location, and nothing in Discover could ask for it
afterwards, so that path was stuck on the Denver sample. Fixed — see the
"Location fix" section — which means this reply ships against a **new build**,
1.0.2 (22), not the rejected 1.0.2 (17).

Reply in App Store Connect with the text below, attach the recording, then
Resubmit to App Review.

Before replying, fill the two `[FILL]` markers and confirm the two blockers:

- [ ] Supabase project `lazmmkvavwicxophadmt` is **not paused** (free tier pauses
      after ~7 idle days; a pause mid-review reads as a broken sign-in)
- [ ] Email OTP still sends from `signin@smallpartsstudio.com` (curl the
      `/auth/v1/otp` endpoint once)
- [ ] `[FILL: device model]` and `[FILL: iOS version]` in item 2
- [ ] Build 22 uploaded and selected on the existing 1.0.2 version page
- [ ] New build uploaded and attached to the version before resubmitting
- [ ] Screen recording captured on a physical device (shot list at the bottom)

---

## Reply text (paste into "Reply to App Review")

Hello,

Thank you for the review. Everything requested is below, and a screen recording
captured on a physical iPhone is attached.

**1. Screen recording**

Attached. It starts from launch on a physical device and walks the typical user
flow: onboarding, granting location, the discovery map and results list, opening
a person's detail screen, saving a favorite, "search anywhere" for a place other
than the current location, optional sign-in via Sign in with Apple, and in-app
account deletion.

The app has no paid content, no subscriptions, and no in-app purchases. It has
no user-generated content that is shared between users, so there is no reporting
or blocking mechanism — the only user-entered data is a private display name and
a chosen avatar, visible only to that user. The one sensitive-data prompt is
location (When In Use), and the recording shows that prompt in context.

**2. Devices and operating systems tested**

Tested on a physical [FILL: device model, e.g. iPhone 15 Pro] running iOS
[FILL: e.g. 26.0], distributed through TestFlight, plus the iOS Simulator for
iPhone 17 Pro. The build under review is 1.0.2 (22).

**3. What the app does, and who it is for**

Nearly Departed is a discovery app for notable burials. It shows the graves of
historically notable people — writers, musicians, inventors, outlaws — near the
user's current location or near any place they search, plotted on a map and
grouped by cemetery. Tapping a person opens a detail screen with their dates,
occupations, and a short biography drawn from Wikipedia.

The problem it solves: existing gravesite apps are search-first — they assume
you already know whose grave you want. Nearly Departed is discovery-first: it
answers "who is buried near me, and why did they matter?" for people who did not
have a name in mind.

Target audience: travelers and day-trippers, local-history enthusiasts,
cemetery visitors ("cemetourists"), and genealogy hobbyists. Age rating 4+; the
content is biographical and historical, with no graphic material.

**4. Setup and access instructions**

No setup, no login, and no demo account are required. Every feature works as a
guest, which is why "Sign-in required" is unchecked in App Review Information.

To exercise the app end to end:

- Launch the app and tap "Use my location", then allow location When In Use.
- If you enter through "Sign in or create account" instead, the app does not
  interrupt sign-in with a location prompt. Tap "Use my location" under the
  search field on the Discover screen whenever you want it; until then, results
  are shown for a labelled sample city.
- If location is declined or unavailable, tap the search field and enter a place
  — "Hollywood Forever" or "Paris, France" both return dense results.
- Adjust the radius control (10 / 25 / 50 / 150 km, or 5 / 15 / 30 / 90 mi when
  the device locale uses miles) to widen or narrow results.
- Tap any cemetery pin on the map, or any row in the results list, to open a
  person's detail screen.
- Tap the heart on a person to save them; saved people appear under Saved.
- Profile lets you set a display name and pick an avatar. Both work as a guest,
  stored on device.
- To test the optional account: Profile → Sign in. Sign in with Apple works with
  the reviewer's own Apple ID and requires no credentials from us. Passwordless
  email codes are also supported; codes are sent from
  `Nearly Departed <signin@smallpartsstudio.com>`.
- To test account deletion: Profile → Delete account. It deletes the synced
  account record and revokes the Sign in with Apple token.

**5. External services used**

All are public, unauthenticated endpoints except Supabase; none require an API
key from the user.

- **Wikidata SPARQL** (`query.wikidata.org`) — the burial records themselves:
  people with a burial place and coordinates, queried by geographic radius.
- **Wikipedia REST summary API** (`en.wikipedia.org/api/rest_v1`) — the
  biography text on the person detail screen.
- **Photon** by komoot, built on OpenStreetMap (`photon.komoot.io`) —
  place-name geocoding for "search anywhere".
- **CARTO basemap tiles** (`basemaps.cartocdn.com`) — the dark map style,
  rendered by MapLibre.
- **Supabase** (`lazmmkvavwicxophadmt.supabase.co`) — optional account only:
  passwordless email codes, Sign in with Apple, and syncing the user's saved
  favorites, display name, and avatar. Transactional sign-in email is delivered
  by Resend.
- **Apple Maps** — opened via a link for directions to a cemetery.

There are no analytics SDKs, no advertising SDKs, and no tracking. The app does
not collect data for tracking purposes as defined in ATT, so it does not present
an App Tracking Transparency prompt.

**6. Regional differences**

None in features or content. The app is available in all territories and behaves
identically everywhere. Two things follow the device's own settings: result
labels are requested in the device language and fall back to English, and
distances display in kilometers or miles based on the device locale (overridable
in Settings). The underlying burial data is worldwide, so result density varies
by location rather than by region-locked functionality.

**7. Regulated industry and third-party material**

The app does not operate in a regulated industry. It is not a genealogy records
service, sells nothing, and stores no health, financial, or government-ID data.

All burial and biographical content comes from openly licensed community
databases, used within their licenses and attributed in the app under
Profile → Terms of Service ("Sources and licenses"):

- Wikidata — CC0 1.0 (public domain dedication)
- Wikipedia article summaries — CC BY-SA 4.0, attributed with a link to the
  source article on each person's detail screen
- OpenStreetMap via Photon — ODbL, attributed
- CARTO basemap — attributed on the map per CARTO's terms

Map pins mark cemeteries, not exact plots, and the app says so; it does not
publish grave-plot locations or photographs of private individuals.

Thank you — happy to provide anything further.

Mia Dugas
Small Parts Studio, LLC

---

## Screen recording — shot list

One take, physical device, ~2–3 minutes, no cuts. Delete and reinstall first so
the permission prompt and onboarding both appear.

1. Home screen → tap the app icon. Show the launch and onboarding screen.
2. Tap "Use my location" → the iOS location prompt appears → Allow While Using.
3. The discovery map fills with cemetery pins; drag the results sheet up and
   down once so both the map and the full list are visible.
4. Change the radius (10 → 50 km) and let results reload.
5. Tap a cemetery pin, then tap a person → person detail screen. Scroll through
   the biography. Tap the heart to save.
6. Back → search field → type a distant place ("Hollywood Forever") → tap a
   result → show that the map moved and results reloaded.
7. Saved tab → the saved person is there.
8. Profile → set a display name → pick an avatar.
9. Profile → Sign in → Sign in with Apple → complete → return to Profile showing
   the signed-in state.
10. Profile → Delete account → confirm → back to guest state.
11. Profile → Terms of Service → scroll to "Sources and licenses", so the
    attributions are on camera.

Trim nothing from the start: Apple asks the recording to begin with launching
the app.

## Also paste into App Review Information → Notes

Keep this for every future submission — items 2–7 in short form prevent the same
rejection:

> Nearly Departed maps notable historical burials near the user or near any
> place they search, with a short biography per person. Discovery-first, for
> travelers, local-history enthusiasts, and cemetery visitors. Age 4+.
>
> No account, login, or demo credentials required — every feature works as a
> guest. Optional sign-in (Sign in with Apple, or passwordless email code from
> signin@smallpartsstudio.com) only syncs saved favorites, display name, and
> avatar. In-app account deletion: Profile → Delete account.
>
> Location is used only while the app is open, to find burials nearby. If
> location is declined, use the search field ("Hollywood Forever").
>
> No IAP, no subscriptions, no ads, no analytics, no tracking, no
> user-generated content shared between users.
>
> External services: Wikidata SPARQL (burial records, CC0), Wikipedia REST
> summary API (biographies, CC BY-SA), Photon/OpenStreetMap (geocoding, ODbL),
> CARTO basemap tiles, Supabase (optional account sync + auth), Apple Maps
> (directions). All attributed in-app under Profile → Terms of Service.
>
> No regional differences: same features in all territories; labels follow
> device language, distance units follow device locale.
>
> Tested on physical iPhone via TestFlight + iOS Simulator.

---

## Location fix (shipped in build 22)

**Symptom.** "Use my location" on the onboarding screen prompted correctly, but
signing in with Apple never prompted, and the map silently sat on the Denver
sample for the rest of the session.

**Cause.** The permission request was gated on a route param.
`src/app/index.tsx` sent `/explore?locate=1`; `src/app/auth.tsx` sent
`/explore?locate=0` after both Apple sign-in and email-code verify, and
`src/app/explore.tsx` passed `locate !== "0"` into `useDeviceLocation`. So the
sign-in path *disabled* the hook rather than deferring it, landing on the seed
coordinates with `status: "fallback"`. Nothing in Discover could re-request:
"Back to my location" only appeared when a searched place was set and only
cleared that place, which in this state meant going back to Denver. The same
dead end trapped anyone who declined the first prompt.

**Fix.** `useDeviceLocation` now returns a `request()` alongside the state, and
distinguishes `denied` (iOS will ask again) from `blocked` (`canAskAgain` is
false — only Settings can restore it). Discover shows one context-dependent
control under the search field:

| State | Control |
| --- | --- |
| granted, place searched | "Back to my location" — clears the place |
| granted, no place | none |
| loading | "Finding you…", disabled |
| denied / fallback | "Use my location" — clears any place, re-requests |
| blocked | "Enable location in Settings" — opens Settings |

Sign-in still does not auto-prompt, so the location alert never stacks on the
dismissing Apple sheet — but the way back is now always on screen.

The control also carries a 44pt minimum height and hitSlop. That is not
cosmetic: at the original text-height size the row rendered but was effectively
unhittable in testing, so the first version of this fix looked correct on screen
and did nothing when tapped.

**Verified on the iPhone 17 simulator, fresh install, location permission reset:**
`explore?locate=0` (the post-sign-in state) shows "Use my location" over the
"Denver (sample)" label → tapping it flips the label to "Finding you…" and
raises the iOS prompt with the correct purpose string → Allow While Using App
moves the map to the simulated location and the header to "near you", and the
control correctly disappears.

Touched: `src/hooks/use-device-location.ts`, `src/app/explore.tsx`.
`src/app/auth.tsx` is unchanged. Typecheck, lint, and the 81-test suite pass.
