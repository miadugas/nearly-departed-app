# Code Review: Who Died Here

**Review Date**: 2026-09-14
**Version**: 1.0.6
**Files Reviewed**:

- `docs/1-plans/F_1.0.6_who-died-here.plan.md`
- `src/app/died-here.tsx`
- `src/app/explore.tsx`
- `src/app/person/[qid].tsx`
- `src/components/discovery-controls.native.tsx`
- `src/components/discovery-controls.tsx`
- `src/components/favorite-row.tsx`
- `src/components/souls-map.tsx`
- `src/hooks/use-nearby-souls.ts`
- `src/lib/favorites/types.test.ts`
- `src/lib/favorites/types.ts`
- `src/lib/wikidata.test.ts`
- `src/lib/wikidata.ts`

**Plan**: `docs/1-plans/F_1.0.6_who-died-here.plan.md`

---

## Executive Summary

Adds a "Died here" discovery mode backed by Wikidata place of death (P20), filtered to places without a population so city-centroid rows drop, plus mode-aware copy on Explore, the person page and saved rows, and a Wikidata contribute link. During Mia's test pass the search radius was found not to be honored in Denver (same 150 downtown people at every radius); fixed in the same release with a two-pass ring query (nearest 150 + hash-sampled outer ring of 90) and by removing the cap-aware framing from Explore. Codex review was skipped by user decision (fast-track); the Opus final release review found no Critical or Major issues and four Minor a11y/format findings, all addressed before release.

APPROVED with observations

---

## Changes Overview

One discriminator flows through the stack: `SoulMode` at query time becomes `Soul.placeKind` on results and an optional field on `FavoriteSoul`, defaulted at read by `placeKindOfFav`. The SPARQL subquery swaps P119/P20 and, in died-mode, excludes places carrying P1082; the outer query fetches the complementary place as `otherPlace`. Explore gains the toggle and explainer; the person page branches labels, hides the visit control for death places, and links to the item's Wikidata page.

---

## Findings

### Critical Issues

None.

### Major Issues

None.

### Minor Issues

- **Toggle accessible name mismatch** — `src/app/explore.tsx`: `accessibilityLabel` overrode the visible "Buried here"/"Died here" (Voice Control "tap Died here" would not match). Addressed: override removed, visible label is the accessible name.
- **Inline link unreachable to VoiceOver** — `src/app/explore.tsx`: nested `<Text onPress>` is not a separate accessibility element on iOS. Addressed: explainer is one `Pressable` with `accessibilityRole="link"` and the full sentence as its label.
- **Sub-44pt target** — `src/app/person/[qid].tsx`: "Improve this record on Wikidata" was ~33pt. Addressed: `minHeight: 44`.
- **Prettier drift** on three files. Addressed: formatted; `prettier --check` on all touched files passes.

### Suggestions

- Native wheel pickers replaced the chip rows after the Opus gate (Mia's design call); verified in the simulator (both wheels drive the query). The explainer then moved to its own page (`died-here.tsx`) with a link row under the wheels; sim-verified. Not re-run through Opus. Accepted.
- Radius fix reviewed by Fable against live timings (Paris/145 km 7.2 s, Denver 1.7 s) and sim (Denver 90 mi → 214 souls across the Front Range); not re-run through the Opus gate. Accepted.

- Buried-mode query shape also changed (new `OPTIONAL P20` + `?otherLabel` in GROUP BY). Measured Paris/90 mi cold: 3.3–4.3 s new vs 4.1 s old — no regression.
- `?otherLabel` in the outer GROUP BY can split a person with two burial/death places into multiple rows; first-row-wins dedup keeps one, so occupations may truncate for those rare people. Same behavior as the existing multi-image case. Accepted.
- Forward-compat: a died-mode favorite synced to a 1.0.5 device renders as "Resting at" with a visit control. Unavoidable without a server-side shape; accepted.

---

## Checklist

- [x] 1. Functional Requirements — passed (every plan item present in the diff; verified in simulator)
- [x] 2. Code Quality — passed
- [x] 3. Error Handling & Back-compat — passed (all new persisted fields optional, defaulted at read; parse guards on route params)
- [x] 4. Tests — passed (114 green, +7 for this change)
- [x] 5. Accessibility — passed with caveats (three findings above, all addressed)
- [x] 6. Performance — passed (live timings recorded in the changelog)
- [x] 7. Documentation — passed (plan, changelog, store copy)
