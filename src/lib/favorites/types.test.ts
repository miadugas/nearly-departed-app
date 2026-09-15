import { describe, expect, it } from "vitest";

import { placeKindOfFav, toFavorite } from "@/lib/favorites/types";
import type { Soul } from "@/lib/wikidata";

const soul: Soul = {
  qid: "Q42",
  label: "Ada Lovelace",
  desc: "mathematician",
  place: "Church of St Mary Magdalene",
  placeKind: "burial",
  otherPlace: null,
  coord: [52.0, -1.3],
  dist: 3.2,
  article: "https://en.wikipedia.org/wiki/Ada_Lovelace",
  image: "http://img/ada.jpg",
  dob: "1815-12-10",
  dod: "1852-11-27",
  occs: ["mathematician", "writer"],
};

describe("toFavorite", () => {
  it("snapshots the display fields and stamps savedAt", () => {
    expect(toFavorite(soul, 1000)).toEqual({
      qid: "Q42",
      label: "Ada Lovelace",
      desc: "mathematician",
      place: "Church of St Mary Magdalene",
      placeKind: "burial",
      otherPlace: null,
      coord: [52.0, -1.3],
      image: "http://img/ada.jpg",
      dob: "1815-12-10",
      dod: "1852-11-27",
      occs: ["mathematician", "writer"],
      savedAt: 1000,
    });
  });

  it("intentionally drops dist (it's location-dependent and goes stale)", () => {
    expect("dist" in toFavorite(soul, 1000)).toBe(false);
  });

  // Save and visit are two systems: saving from anywhere must never produce a
  // visit stamp, because only visits earn rank credit.
  it("produces an unvisited record", () => {
    const fav = toFavorite(soul, 1000);

    expect(fav.visitedAt ?? undefined).toBeUndefined();
  });

  it("carries placeKind and otherPlace from a died-mode soul", () => {
    const died: Soul = {
      ...soul,
      placeKind: "death",
      otherPlace: "Highgate Cemetery",
    };
    const fav = toFavorite(died, 1000);

    expect(fav.placeKind).toBe("death");
    expect(fav.otherPlace).toBe("Highgate Cemetery");
  });
});

describe("placeKindOfFav", () => {
  it("defaults to burial when the field is undefined", () => {
    expect(placeKindOfFav(undefined)).toBe("burial");
  });

  it("defaults to burial when fav itself is null", () => {
    expect(placeKindOfFav(null)).toBe("burial");
  });

  it("defaults to burial when placeKind is missing from the record", () => {
    expect(placeKindOfFav({})).toBe("burial");
  });

  it("defaults to burial for a garbage string value", () => {
    // @ts-expect-error - simulating a corrupted/legacy value crossing the jsonb boundary
    expect(placeKindOfFav({ placeKind: "grave" })).toBe("burial");
  });

  it("returns death only for the exact string 'death'", () => {
    expect(placeKindOfFav({ placeKind: "death" })).toBe("death");
  });
});
