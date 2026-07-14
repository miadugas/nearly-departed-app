# Strategy — Next's and Nopes

_2026-07-14. Distilled from the moat discussion: the defensible position is curated
trails + a verified-location layer scoped to notable graves — "the verified, walkable
canon of graves worth visiting" — not a general burial database. Flywheel: trail →
visit → confirmed markers → better trails._

## Next's

1. [ ] **Ship v1.0.** Avatar picker + account sync runtime-verified 2026-07-14; nothing
       strategic happens until it's in the store.
2. [ ] **Hand-build trail #1: Littleton Cemetery.** Packer is the star. 10–15 stops,
       walk order, 2–3 editorial sentences each. Schema: `trails` + ordered stops by qid.
3. [ ] **Walk it once, fix the pins by hand.** That walk is the verified-location layer,
       v0. No UGC system — just correct coordinates for graves on a trail.
4. [ ] **One-tap "right spot?" confirm** on person detail, shown only within ~50m of the
       pin. Cheapest field-data capture; writes to a `location_reports` table.
5. [ ] **Trails #2–3 in Denver** (labor history, women of Colorado). Three trails is the
       minimum to see completion/save/abandon patterns.
6. [ ] **Instrument the funnel** — discover → detail → directions → confirm. An events
       table in Supabase is enough.
7. [ ] **Then pitch one historical society**, with usage numbers and a working trail as
       the demo.

## Nopes

- **No general burial database.** All-graves ambition is Ancestry's turf (Find a Grave:
  ~250M records, 25 years of family-motivated contributors).
- **No UGC contribution system yet.** Tourists browse, family contributes — we have
  tourists. Visit intent comes first (trails); contributions fall out as a byproduct.
- **No recommendation engine yet.** Personalization needs behavior data that won't exist
  for months.
- **No partnerships-first.** Nothing to offer an institution until trails have users.
- **No AI-bio or map-polish sprints as strategy.** Features, not moats — fine to do,
  never the bet.
- **No scraping Find a Grave.** Licensing risk, and it imports their data model — the
  thing this app is inverting.
