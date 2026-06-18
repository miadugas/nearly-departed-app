// In-app copies of the legal docs. Keep in sync with /legal/*.md (the hosted
// versions used for the App Store Privacy Policy URL). Fill the [placeholders].

export const PRIVACY_POLICY = `# Privacy Policy

**Effective date:** June 18, 2026

This Privacy Policy explains how **Nearly Departed** ("the App," "we," "us") handles information when you use it. The App is operated by **[Your name / legal entity]**, based in **[Denver, Colorado, USA]**. Contact: **[your-contact-email]**.

## The short version

- We do not require an account to use the App.
- We do not run analytics or advertising SDKs, and we do not sell your data.
- We do not operate servers that store your personal data. The App talks directly to public third-party services to fetch maps and burial records.
- Your location is used to find notable burials near you, and the coordinates are sent to those services as part of a query to retrieve results.
- Your saved favorites are stored only on your device.

## Location data

If you tap "Use my location," the App requests permission to access your device's location while you are using the App. Your approximate coordinates center the map and query public databases for notable people buried near that point. To do that, your coordinates are sent to the third-party services listed below as part of the request. We do not store your location. You can revoke location access anytime in Settings; the App still works if you search for a place manually.

## Place searches

When you use "search anywhere," the text you type is sent to our geocoding provider (Komoot/Photon) to convert it into coordinates. We do not store these searches.

## Technical information

When the App contacts a third-party service, that service automatically receives standard network information such as your IP address, governed by that service's own privacy policy. We do not receive or retain this.

## Favorites and on-device data

Graves you save are stored locally on your device and are not transmitted to us. They are removed if you delete the App.

## Accounts

The App does not currently offer accounts, so no account data is collected. If sign-in (Apple, Google, or email) is added later, we will update this policy to describe what is collected.

## What we do not do

- No third-party analytics or tracking SDKs.
- No advertising or advertising identifiers.
- No sale or sharing of personal information.
- No access to contacts, photos, microphone, or background location.

## Third-party services

The App sends requests directly to these services. Each has its own privacy policy:

- **Wikimedia Foundation** — burial records, biographies, images. [Privacy policy](https://foundation.wikimedia.org/wiki/Policy:Privacy_policy)
- **Komoot (Photon)** — place-name geocoding. [Privacy policy](https://www.komoot.com/privacy)
- **CARTO** — map tiles. [Privacy policy](https://carto.com/privacy/)
- **Apple** — location services and (if enabled later) Sign in with Apple. [Privacy policy](https://www.apple.com/legal/privacy/)

These services may process data outside your country.

## Your rights

Depending on where you live, you may have rights to access, correct, or delete personal data (e.g. under GDPR or CCPA/CPRA). Because we do not store personal data, most requests are satisfied by controlling your device permissions and deleting local data. For data held by the services above, contact them directly. You may also reach us at **[your-contact-email]**.

## Children's privacy

The App is not directed to children under 13, and we do not knowingly collect their information.

## Changes

We may update this policy as the App evolves. Material changes will be noted in the App.

## Contact

Contact **[Your name / legal entity]** at **[your-contact-email]**.
`;

export const TERMS_OF_SERVICE = `# Terms of Service

**Effective date:** June 18, 2026

These Terms govern your use of the **Nearly Departed** app ("the App"), operated by **[Your name / legal entity]**, based in **[Denver, Colorado, USA]**. By using the App, you agree to these Terms. If you do not agree, do not use the App.

## What the App is

Nearly Departed helps you discover notable people buried near you or near a place you search. Records, biographies, images, and map data come from public sources including **Wikidata, Wikipedia, and OpenStreetMap**. The App is for informational and educational purposes only.

## Eligibility

You must be at least 13 (or the minimum age of digital consent in your jurisdiction) to use the App.

## Accuracy of information

Burial records and locations come from community-maintained third-party databases and may be incomplete, outdated, or inaccurate. Map markers are cemetery-level and approximate — they do not indicate an exact plot. Always verify independently before relying on this information or traveling to a location. We make no guarantee of accuracy, completeness, or availability.

## Respectful and lawful use

Cemeteries are places of remembrance and are often private property with their own rules. You agree that:

- The App does not grant you any right of access to any property, grave, or site.
- You will obey all cemetery rules, posted hours, signage, and applicable laws.
- You will treat burial sites, the deceased, and their families with respect.
- You will not use the App to harass, stalk, or disturb anyone, or for any unlawful purpose.

## Acceptable use

You agree not to scrape or systematically extract data except as permitted by the underlying data licenses; reverse engineer the App except as allowed by law; overload the services the App relies on; or use the App unlawfully.

## Your content

Items you save (favorites) are stored on your device. You are responsible for your own use of saved information.

## Intellectual property and open data

The App's design, code, and branding are owned by **[Your name / legal entity]**. The underlying data and map content are owned by their sources and provided under open licenses you must respect:

- **Wikidata** — CC0 (public domain).
- **Wikipedia** content — CC BY-SA.
- **OpenStreetMap** data — ODbL; © OpenStreetMap contributors.
- Map styling via **CARTO**.

Attribution is provided within the App. Your reuse of underlying data is governed by those licenses.

## Disclaimers

THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING ACCURACY, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR ANY LOSS ARISING FROM YOUR USE OF THE APP OR RELIANCE ON ANY INFORMATION IN IT, INCLUDING ANYTHING RELATED TO VISITING A LOCATION.

## Changes and termination

We may update these Terms or modify, suspend, or discontinue the App at any time. Continued use after changes means you accept them.

## Governing law

These Terms are governed by the laws of the **State of Colorado, USA**, except where your local consumer-protection law requires otherwise.

## Apple App Store

If you obtained the App via the Apple App Store, these Terms are between you and **[Your name / legal entity]**, not Apple. Apple is not responsible for the App and is a third-party beneficiary of these Terms.

## Contact

Contact **[Your name / legal entity]** at **[your-contact-email]**.
`;
