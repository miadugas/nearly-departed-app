// Live Wikidata SPARQL layer — notable people buried near a point.
// Ported from the HTML POC. Public endpoint, no key.

import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { WIKIMEDIA_HEADERS } from "@/lib/wikimedia";

export type Soul = {
  qid: string;
  label: string;
  desc: string;
  place: string;
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

// How many burials the nearest-first subquery takes. Exported because the UI
// has to know when a result set is capped: in a dense city every one of these
// rows can sit inside the city centre, so "within 90 mi" would be a lie and a
// radius-sized map box would stack every pin under the user dot.
export const NEARBY_LIMIT = 150;

// Device language (e.g. "fr" from "fr-CA"), falling back to English. Used so
// names/places/occupations come back localized worldwide, then English.
function deviceLang(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
}

export function buildQuery(lat: number, lon: number, radiusKm: number) {
  const lang = deviceLang();
  const labelLang = lang === "en" ? "en" : `${lang},en`;
  return `
SELECT ?person ?personLabel ?personDescription ?placeLabel ?coord ?dist ?article ?image ?dob ?dod
       (GROUP_CONCAT(DISTINCT ?occLabel; separator=", ") AS ?occs) WHERE {
  # Nearest ${NEARBY_LIMIT} first (subquery), THEN enrich — so the OPTIONAL joins only touch
  # ${NEARBY_LIMIT} rows, not every burial in radius. Keeps dense-city queries ~3s, not 30s+.
  # Grouped by person so this subquery's row count IS the distinct-person count: a burial
  # place with two P625 coordinate claims (or a person with two burial places) used to yield
  # the same person twice inside the LIMIT, which fetchNearbySouls' capped check relies on.
  {
    SELECT ?person (SAMPLE(?p) AS ?place) (SAMPLE(?c) AS ?coord) (MIN(?d) AS ?dist) WHERE {
      ?person wdt:P119 ?p.
      SERVICE wikibase:around {
        ?p wdt:P625 ?c.
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral.
        bd:serviceParam wikibase:radius "${radiusKm}".
        bd:serviceParam wikibase:distance ?d.
      }
    }
    GROUP BY ?person
    ORDER BY ?dist
    LIMIT ${NEARBY_LIMIT}
  }
  OPTIONAL { ?person wdt:P18 ?image. }
  OPTIONAL { ?article schema:about ?person ; schema:isPartOf <https://en.wikipedia.org/> . }
  OPTIONAL { ?person wdt:P569 ?dob. }
  OPTIONAL { ?person wdt:P570 ?dod. }
  OPTIONAL { ?person wdt:P106 ?occ. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "${labelLang}". }
}
GROUP BY ?person ?personLabel ?personDescription ?placeLabel ?coord ?dist ?article ?image ?dob ?dod
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
): Promise<NearbyResult> {
  const url =
    `${ENDPOINT}?format=json&query=` +
    encodeURIComponent(buildQuery(lat, lon, radiusKm));
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
      place: r.placeLabel?.value ?? "Unknown resting place",
      coord: r.coord ? parsePoint(r.coord.value) : null,
      dist: parseFloat(r.dist?.value ?? "0"),
      article: r.article?.value ?? null,
      image: r.image?.value ?? null,
      dob: r.dob?.value ?? "",
      dod: r.dod?.value ?? "",
      occs: r.occs?.value ? r.occs.value.split(", ").filter(Boolean) : [],
    });
  }
  // The cap has to be read off distinct QIDs, not raw row count: the inner
  // subquery caps at NEARBY_LIMIT rows of (person, place, coord, dist), but
  // OPTIONAL joins on P18/P569/etc multiply rows per extra image or date claim
  // — so raw rows over-count. The final soul count under-counts too, since
  // unlabeled junk gets dropped after this loop. Distinct QIDs seen (before
  // that junk filter) is the one number that matches the subquery's row cap
  // exactly, since the subquery now groups by person.
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
