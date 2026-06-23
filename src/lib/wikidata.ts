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

// Device language (e.g. "fr" from "fr-CA"), falling back to English. Used so
// names/places/occupations come back localized worldwide, then English.
function deviceLang(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
}

function buildQuery(lat: number, lon: number, radiusKm: number) {
  const lang = deviceLang();
  const labelLang = lang === "en" ? "en" : `${lang},en`;
  return `
SELECT ?person ?personLabel ?personDescription ?placeLabel ?coord ?dist ?article ?image ?dob ?dod
       (GROUP_CONCAT(DISTINCT ?occLabel; separator=", ") AS ?occs) WHERE {
  # Nearest 150 first (subquery), THEN enrich — so the OPTIONAL joins only touch
  # 150 rows, not every burial in radius. Keeps dense-city queries ~3s, not 30s+.
  {
    SELECT ?person ?place ?coord ?dist WHERE {
      ?person wdt:P119 ?place.
      SERVICE wikibase:around {
        ?place wdt:P625 ?coord.
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral.
        bd:serviceParam wikibase:radius "${radiusKm}".
        bd:serviceParam wikibase:distance ?dist.
      }
    }
    ORDER BY ?dist
    LIMIT 150
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

function parsePoint(wkt: string): [number, number] | null {
  const m = wkt.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
  return m ? [parseFloat(m[2]), parseFloat(m[1])] : null;
}

export async function fetchNearbySouls(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<Soul[]> {
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
  return souls;
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

export function lifespan(s: Soul) {
  const a = year(s.dob);
  const b = year(s.dod);
  if (!a && !b) return "";
  return `${a || "?"}–${b || "?"}`;
}

export function thumbUrl(image: string) {
  const file = image.replace("http://", "https://");
  return `${file}${file.includes("?") ? "&" : "?"}width=110`;
}

export function heroUrl(image: string) {
  const file = image.replace("http://", "https://");
  return `${file}${file.includes("?") ? "&" : "?"}width=800`;
}
