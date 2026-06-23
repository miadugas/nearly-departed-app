import { describe, expect, it } from "vitest";

import {
  groupByCemetery,
  heroUrl,
  lifespan,
  thumbUrl,
  year,
  type Soul,
} from "@/lib/wikidata";

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
