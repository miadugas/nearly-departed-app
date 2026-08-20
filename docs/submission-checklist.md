# App Store submission — protocol

App: **Nearly Departed** · ASC ID `6802525537` · bundle `com.miadugas.nearlydeparted`
Seller: **Small Parts Studio, LLC** · Apple Team `CJAFZA5NP9`

## 1. Before you touch App Store Connect

- [ ] Backend awake: Supabase project `lazmmkvavwicxophadmt` not paused. Free tier
      pauses after ~7 idle days — a pause during review = rejection. Either
      commit the keep-alive workflow or upgrade for the review month.
- [ ] Sign-in works on a real device (email code + Sign in with Apple).
- [ ] Account deletion works: Profile → Delete account.

## 2. Version page (App Store tab → 1.0.2)

| Field | Value |
| --- | --- |
| Version | `1.0.2` |
| Build | the latest processed build |
| Copyright | `2026 Small Parts Studio, LLC` |
| Support URL | `https://nearly-departed.miacodes.com/support` |
| Marketing URL | `https://nearly-departed.miacodes.com` |
| Screenshots | `docs/screenshots/appstore/` (6.9", 1320×2868) |

Promo text, description, and keywords: see `docs/store-copy.md`.

## 3. App Information

- Primary category **Travel**, secondary **Reference**
- Content rights: **contains third-party content** + rights confirmed
  (Wikidata CC0, Wikipedia CC BY-SA, OpenStreetMap ODbL — attributed in app)
- Age rating: **None** to every content question; **No** to unrestricted web
  access and to user-generated content → lands at 4+

## 4. App Privacy (must be Published, not just saved)

| Data type | Purpose | Linked to identity | Tracking |
| --- | --- | --- | --- |
| Contact Info → Email Address | App Functionality | Yes | No |
| Contact Info → Name (display name) | App Functionality | Yes | No |
| User Content → Other User Content (favorites, avatar) | App Functionality | Yes | No |
| Location → Precise Location | App Functionality | **No** | No |

Privacy policy URL: `https://nearly-departed.miacodes.com/privacy`

## 5. Pricing and Availability

- Free · availability: all countries

## 6. App Review Information

- **Sign-in required: unchecked** — the app is fully usable as a guest
- Notes:

> Sign-in is optional — every feature works as a guest with no account. An
> account only syncs saved favorites, display name, and avatar across devices.
> To test accounts, Sign in with Apple is available on the sign-in screen.
> In-app account deletion is at Profile → Delete account. Location is used only
> while the app is open, to find notable burials nearby; if location is
> declined, "search anywhere" works instead (try "Hollywood Forever").

- Contact: Mia Dugas · miadugas@outlook.com · phone on file

## 7. Release

- **Manually release this version** (so launch isn't at 3am)
- Then **Add for Review** → **Submit**

## 8. After approval

- Swap the landing page's beta badges for App Store links
- Watch `crash_reports` in Supabase for real-world fatals
