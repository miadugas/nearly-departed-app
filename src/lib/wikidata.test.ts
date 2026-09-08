import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWithTimeout } from "@/lib/fetch-timeout";
import {
  NEARBY_LIMIT,
  buildQuery,
  fetchNearbySouls,
  groupByCemetery,
  heroUrl,
  lifespan,
  lifeYears,
  thumbUrl,
  year,
  type Soul,
} from "@/lib/wikidata";

// vitest hoists vi.mock above the imports at transform time, so fetchWithTimeout
// is already the mock by the time the module under test loads.
vi.mock("@/lib/fetch-timeout", () => ({ fetchWithTimeout: vi.fn() }));

const mockResponse = (bindings: Record<string, { value: string }>[]) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ results: { bindings } }),
  }) as Response;

// Shape of one SPARQL result row for a labeled person, distinct by qid.
const binding = (qid: string) => ({
  person: { value: `http://www.wikidata.org/entity/${qid}` },
  personLabel: { value: `Person ${qid}` },
});

function soul(partial: Partial<Soul>): Soul {
  return {
    qid: "Q1",
    label: "Test",
    desc: "",
    place: "Unknown resting place",
    coord: null,
    dist: 0,
    article: null,
    image: null,
    dob: "",
    dod: "",
    occs: [],
    ...partial,
  };
}

describe("year", () => {
  it("extracts a 4-digit year from an ISO date", () => {
    expect(year("1971-10-09T00:00:00Z")).toBe("1971");
  });

  it("marks negative (BC) years", () => {
    expect(year("-0044-03-15T00:00:00Z")).toBe("0044 BC");
  });

  it("returns empty string for empty input", () => {
    expect(year("")).toBe("");
  });
});

describe("lifespan", () => {
  it("formats born–died", () => {
    expect(lifespan(soul({ dob: "1860-05-01", dod: "1937-08-13" }))).toBe(
      "1860–1937",
    );
  });

  it("uses ? for a missing endpoint", () => {
    expect(lifespan(soul({ dob: "1860-05-01", dod: "" }))).toBe("1860–?");
  });

  it("returns empty when both dates are missing", () => {
    expect(lifespan(soul({ dob: "", dod: "" }))).toBe("");
  });
});

describe("thumbUrl / heroUrl", () => {
  it("upgrades http to https and appends a width", () => {
    expect(thumbUrl("http://ex.org/a.jpg")).toBe(
      "https://ex.org/a.jpg?width=110",
    );
    expect(heroUrl("http://ex.org/a.jpg")).toBe(
      "https://ex.org/a.jpg?width=800",
    );
  });

  it("uses & when the url already has a query string", () => {
    expect(thumbUrl("https://ex.org/a.jpg?v=2")).toBe(
      "https://ex.org/a.jpg?v=2&width=110",
    );
  });
});

describe("groupByCemetery", () => {
  it("groups souls by place and sorts groups by nearest distance", () => {
    const souls = [
      soul({ qid: "Q1", place: "Highgate", dist: 5 }),
      soul({ qid: "Q2", place: "Père Lachaise", dist: 2 }),
      soul({ qid: "Q3", place: "Highgate", dist: 5 }),
    ];
    const groups = groupByCemetery(souls);
    expect(groups.map((g) => g.title)).toEqual(["Père Lachaise", "Highgate"]);
    expect(groups[1].data).toHaveLength(2);
    expect(groups[0].dist).toBe(2);
  });

  it("returns an empty array for no souls", () => {
    expect(groupByCemetery([])).toEqual([]);
  });
});

describe("lifeYears", () => {
  it("prefers years from the curated description over conflicting claims", () => {
    // e.g. Frances Drake: two normal-rank P569 claims (1908, 1912); the
    // description carries the community-accepted dates.
    const s = soul({ desc: "American actress (1912–2000)", dob: "1908-01-01", dod: "2000-01-17" });
    expect(lifeYears(s)).toEqual({ born: "1912", died: "2000" });
  });

  it("falls back to claim years when the description has none", () => {
    const s = soul({ desc: "American actress", dob: "1908-01-01", dod: "2000-01-17" });
    expect(lifeYears(s)).toEqual({ born: "1908", died: "2000" });
  });

  it("handles hyphen and em-dash separators", () => {
    const s = soul({ desc: "Poet (1809-1849)", dob: "", dod: "" });
    expect(lifeYears(s)).toEqual({ born: "1809", died: "1849" });
  });

  it("ignores non-year parentheticals", () => {
    const s = soul({ desc: "Singer (of the band Heart)", dob: "1950-06-19", dod: "" });
    expect(lifeYears(s)).toEqual({ born: "1950", died: "" });
  });
});

describe("fetchNearbySouls", () => {
  beforeEach(() => vi.mocked(fetchWithTimeout).mockReset());

  it("reports capped: false for a short result set", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      mockResponse([binding("Q1"), binding("Q2")]),
    );

    const { souls, capped } = await fetchNearbySouls(0, 0, 10);
    expect(souls).toHaveLength(2);
    expect(capped).toBe(false);
  });

  it("reports capped: false when raw rows over-count distinct people (multi-image OPTIONAL join)", async () => {
    // 100 distinct QIDs, each appearing twice — e.g. two P18 images per person
    // via the OPTIONAL join. 200 raw rows but only 100 people: not capped.
    const rows = Array.from({ length: 100 }, (_, i) => binding(`Q${i}`)).flatMap(
      (b) => [b, b],
    );
    vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse(rows));

    const { souls, capped } = await fetchNearbySouls(0, 0, 10);
    expect(rows).toHaveLength(200);
    expect(souls).toHaveLength(100);
    expect(capped).toBe(false);
  });

  it("reports capped: true off distinct QIDs even when dedup/junk-filter shrinks the soul count", async () => {
    // NEARBY_LIMIT distinct QIDs, one of them unlabeled junk (personLabel ===
    // qid) and dropped after the loop — the cap must still read true because
    // seen.size (counted before the junk filter) hits NEARBY_LIMIT.
    const rows = Array.from({ length: NEARBY_LIMIT }, (_, i) => binding(`Q${i}`));
    rows[0] = { ...rows[0], personLabel: { value: "Q0" } };

    vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse(rows));

    const { souls, capped } = await fetchNearbySouls(0, 0, 10);
    expect(souls).toHaveLength(NEARBY_LIMIT - 1);
    expect(capped).toBe(true);
  });
});

describe("NEARBY_LIMIT", () => {
  it("is 150", () => {
    expect(NEARBY_LIMIT).toBe(150);
  });

  it("is the LIMIT the nearest-first subquery actually uses", () => {
    expect(buildQuery(48.8566, 2.3522, 145)).toContain("LIMIT 150");
  });

  it("groups the nearest-first subquery by person so the LIMIT counts distinct people", () => {
    const query = buildQuery(48.8566, 2.3522, 145);
    expect(query).toContain("GROUP BY ?person");
    expect(query).toContain("(MIN(?d) AS ?dist)");
  });
});
