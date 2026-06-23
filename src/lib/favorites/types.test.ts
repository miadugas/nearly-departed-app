import { describe, expect, it } from "vitest";

import { toFavorite } from "@/lib/favorites/types";
import type { Soul } from "@/lib/wikidata";

const soul: Soul = {
  qid: "Q42",
  label: "Ada Lovelace",
  desc: "mathematician",
  place: "Church of St Mary Magdalene",
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
});
