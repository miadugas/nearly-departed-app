// Live Wikidata SPARQL layer — notable people buried near a point.
// Ported from the HTML POC. Public endpoint, no key.

import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { WIKIMEDIA_HEADERS } from "@/lib/wikimedia";

export type SoulMode = "buried" | "died";
export type PlaceKind = "burial" | "death";

// The one place mode maps to its resulting place-kind label.
export function placeKindOf(mode: SoulMode): PlaceKind {
  return mode === "died" ? "death" : "burial";
}

export type Soul = {
  qid: string;
  label: string;
  desc: string;
  place: string;
  placeKind: PlaceKind;
  otherPlace: string | null;
  coord: [number, number] | null; // [lat, lon]
  dist: number; // km
  article: string | null;
  image: string | null;
  dob: string;
  dod: string;
  occs: string[];
};

export type CemeterySection = {
  title: string;
  dist: number;
  coord: [number, number] | null;
  data: Soul[];
};

const ENDPOINT = "https://query.wikidata.org/sparql";

// How many burials the nearest-first pass takes. Exported because
// fetchNearbySouls reads distinct QIDs off it to flag a dense area (see
// `capped` below) — the UI no longer uses it to frame the map.
export const NEARBY_LIMIT = 150;

// How many burials the outer-ring pass takes, and where that ring starts (as
// a fraction of the radius). See the rationale comment above buildQuery's
// inner subquery for why a second pass exists at all.
export const OUTER_RING_LIMIT = 90;
export const OUTER_RING_START = 0.25;

// Device language (e.g. "fr" from "fr-CA"), falling back to English. Used so
// names/places/occupations come back localized worldwide, then English.
function deviceLang(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
}

export function buildQuery(
  lat: number,
  lon: number,
  radiusKm: number,
  mode: SoulMode = "buried",
) {
  const lang = deviceLang();
  const labelLang = lang === "en" ? "en" : `${lang},en`;
  // P119 = place of burial, P20 = place of death. The complementary OPTIONAL
  // below fetches whichever one this query ISN'T searching by, so the person
  // page can state both facts when Wikidata has both.
  const placePredicate = mode === "died" ? "P20" : "P119";
  const otherPredicate = mode === "died" ? "P119" : "P20";
  // Died-mode "legit place" filter: Wikidata records most deaths at city
  // precision, and the city item has one coordinate — Denver/25 km returned
  // 148/150 rows on the centroid. Excluding places that carry a population
  // (P1082: cities, counties, CDPs) leaves venues — hospitals, homes, hotels.
  // The "correct" P31/P279* admin-entity path was tried and took 20-38s —
  // don't "fix" this by switching to that.
  const legitPlaceFilter =
    mode === "died" ? "FILTER NOT EXISTS { ?p wdt:P1082 [] }\n      " : "";

  // One pass shape shared by both halves of the UNION below, so the
  // predicate/died-mode filter text can't drift between them.
  const aroundPass = (extraFilter: string, orderBy: string, limit: number) => `{
    SELECT ?person (SAMPLE(?p) AS ?place) (SAMPLE(?c) AS ?coord) (MIN(?d) AS ?dist) WHERE {
      ?person wdt:${placePredicate} ?p.
      ${legitPlaceFilter}SERVICE wikibase:around {
        ?p wdt:P625 ?c.
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral.
        bd:serviceParam wikibase:radius "${radiusKm}".
        bd:serviceParam wikibase:distance ?d.
      }
      ${extraFilter}
    }
    GROUP BY ?person
    ORDER BY ${orderBy}
    LIMIT ${limit}
  }`;

  const outerRingStart = (radiusKm * OUTER_RING_START).toFixed(3);
  const nearestPass = aroundPass("", "?dist", NEARBY_LIMIT);
  const outerPass = aroundPass(
    `FILTER(?d > ${outerRingStart} && ?d <= ${radiusKm})`,
    "MD5(STR(?person))",
    OUTER_RING_LIMIT,
  );

  return `
SELECT ?person ?personLabel ?personDescription ?placeLabel ?otherLabel ?coord ?dist ?article ?image ?dob ?dod
       (GROUP_CONCAT(DISTINCT ?occLabel; separator=", ") AS ?occs) WHERE {
  # Two passes, UNIONed, THEN enrich — so the OPTIONAL joins only touch the
  # combined rows, not every burial in radius. A nearest-first pass alone
  # makes a dense city return the same ${NEARBY_LIMIT} people at every radius: Denver at
  # 5/15/30/90 mi all showed the same downtown cluster and the header lied
  # about "within 90 mi". The outer-ring pass guarantees the far 75% of the
  # radius is represented — it's ordered by MD5(STR(?person)), a deterministic
  # pseudo-random order, so it samples across the whole ring instead of
  # filling from its inner edge (nearest-first there reached only 63 km of a
  # 145 km radius). Each wikibase:around pass scans every burial in the
  # radius, so passes are the cost: Paris at 145 km measured 22s with four
  # passes, 7s with two; Denver 1.7s; Denver 5 mi 0.5s.
  # Grouped by person so each pass's row count IS the distinct-person count: a burial
  # place with two P625 coordinate claims (or a person with two burial places) used to yield
  # the same person twice inside the LIMIT, which fetchNearbySouls' capped check relies on.
  {
    ${nearestPass}
    UNION
    ${outerPass}
  }
  OPTIONAL { ?person wdt:P18 ?image. }
  OPTIONAL { ?article schema:about ?person ; schema:isPartOf <https://en.wikipedia.org/> . }
  OPTIONAL { ?person wdt:P569 ?dob. }
  OPTIONAL { ?person wdt:P570 ?dod. }
  OPTIONAL { ?person wdt:P106 ?occ. }
  OPTIONAL { ?person wdt:${otherPredicate} ?other. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "${labelLang}". }
}
GROUP BY ?person ?personLabel ?personDescription ?placeLabel ?otherLabel ?coord ?dist ?article ?image ?dob ?dod
ORDER BY ?dist`;
}

type Binding = Record<string, { value: string } | undefined>;

export type NearbyResult = { souls: Soul[]; capped: boolean };

function parsePoint(wkt: string): [number, number] | null {
  const m = wkt.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
  return m ? [parseFloat(m[2]), parseFloat(m[1])] : null;
}

export async function fetchNearbySouls(
  lat: number,
  lon: number,
  radiusKm: number,
  mode: SoulMode = "buried",
): Promise<NearbyResult> {
  const url =
    `${ENDPOINT}?format=json&query=` +
    encodeURIComponent(buildQuery(lat, lon, radiusKm, mode));
  const res = await fetchWithTimeout(
    url,
    {
      headers: {
        ...WIKIMEDIA_HEADERS,
        Accept: "application/sparql-results+json",
      },
    },
    20_000,
  );
  if (!res.ok) throw new Error(`Wikidata request failed (${res.status})`);

  const rows: Binding[] = (await res.json()).results.bindings;
  const seen = new Set<string>();
  const souls: Soul[] = [];

  for (const r of rows) {
    const qid = r.person?.value.split("/").pop() ?? "";
    if (!qid || seen.has(qid)) continue;
    seen.add(qid);
    const label = r.personLabel?.value ?? qid;
    if (label === qid) continue; // skip unlabeled junk items

    souls.push({
      qid,
      label,
      desc: r.personDescription?.value ?? "",
      place:
        r.placeLabel?.value ??
        (mode === "died" ? "Unknown place of death" : "Unknown resting place"),
      placeKind: placeKindOf(mode),
      otherPlace: r.otherLabel?.value ?? null,
      coord: r.coord ? parsePoint(r.coord.value) : null,
      dist: parseFloat(r.dist?.value ?? "0"),
      article: r.article?.value ?? null,
      image: r.image?.value ?? null,
      dob: r.dob?.value ?? "",
      dod: r.dod?.value ?? "",
      occs: r.occs?.value ? r.occs.value.split(", ").filter(Boolean) : [],
    });
  }
  // The cap has to be read off distinct QIDs, not raw row count: the nearest-
  // first pass caps at NEARBY_LIMIT rows of (person, place, coord, dist), but
  // OPTIONAL joins on P18/P569/etc multiply rows per extra image or date claim
  // — so raw rows over-count. The final soul count under-counts too, since
  // unlabeled junk gets dropped after this loop. Distinct QIDs seen (before
  // that junk filter) is the one number that matches that pass's row cap
  // exactly, since the pass groups by person. The UI no longer frames the map
  // on this — it just means "dense area", not "results ran short of the radius".
  const capped = seen.size >= NEARBY_LIMIT;
  return { souls, capped };
}

export function groupByCemetery(souls: Soul[]): CemeterySection[] {
  const groups: Record<string, CemeterySection> = {};
  for (const s of souls) {
    if (!groups[s.place]) {
      groups[s.place] = {
        title: s.place,
        dist: s.dist,
        coord: s.coord,
        data: [],
      };
    }
    groups[s.place].data.push(s);
  }
  return Object.values(groups).sort((a, b) => a.dist - b.dist);
}

export function year(s: string) {
  if (!s) return "";
  const neg = s.startsWith("-");
  const y = s.replace("-", "").slice(0, 4);
  return neg ? `${y} BC` : y;
}

// Wikidata items can carry several normal-rank birth/death claims with no
// preferred rank chosen (e.g. Frances Drake: 1908 and 1912); the truthy query
// then yields an arbitrary one per row and first-row-wins picks blind. The
// human-curated description usually ends in "(1912–2000)" — the community's
// accepted dates — so when that parses, it outranks the raw claim.
const DESC_YEARS = /\((\d{3,4})\s*[–—-]\s*(\d{3,4})\)/;

export function lifeYears(s: Pick<Soul, "desc" | "dob" | "dod">) {
  const m = s.desc?.match(DESC_YEARS);
  return {
    born: m?.[1] ?? year(s.dob),
    died: m?.[2] ?? year(s.dod),
  };
}

export function lifespan(s: Soul) {
  const { born, died } = lifeYears(s);
  if (!born && !died) return "";
  return `${born || "?"}–${died || "?"}`;
}

export function thumbUrl(image: string) {
  const file = image.replace("http://", "https://");
  return `${file}${file.includes("?") ? "&" : "?"}width=110`;
}

export function heroUrl(image: string) {
  const file = image.replace("http://", "https://");
  return `${file}${file.includes("?") ? "&" : "?"}width=800`;
}
