import { describe, expect, it } from "vitest";

import {
  RANKS,
  nextRank,
  progressToNext,
  rankFor,
  rankProgress,
} from "./ranks";

describe("rankFor", () => {
  it("starts everyone as a passerby", () => {
    expect(rankFor(0).title).toBe("Passerby");
  });

  it("promotes at each threshold", () => {
    expect(rankFor(1).title).toBe("Curious Visitor");
    expect(rankFor(2).title).toBe("Curious Visitor");
    expect(rankFor(3).title).toBe("Investigator");
    expect(rankFor(5).title).toBe("Occultist");
    expect(rankFor(34).title).toBe("Miskatonic Scholar");
    expect(rankFor(35).title).toBe("Cemetourist");
    expect(rankFor(9999).title).toBe("Immortal Historian");
  });

  it("climbs every rung in order, with no gaps", () => {
    RANKS.forEach((rank, i) => {
      expect(rankFor(rank.at).title).toBe(rank.title);
      if (i > 0) expect(rank.at).toBeGreaterThan(RANKS[i - 1].at);
    });
  });

  it("treats junk input as zero", () => {
    expect(rankFor(-5).title).toBe("Passerby");
    expect(rankFor(Number.NaN).title).toBe("Passerby");
  });

  it("rounds partial counts down", () => {
    expect(rankFor(4.9).title).toBe("Investigator");
    expect(rankFor(2.9).title).toBe("Curious Visitor");
  });
});

describe("nextRank", () => {
  it("points at the next rung", () => {
    expect(nextRank(0)?.title).toBe("Curious Visitor");
    expect(nextRank(5)?.title).toBe("Epitaph Reader");
    expect(nextRank(1)?.title).toBe("Investigator");
  });

  it("offers twenty rungs to climb", () => {
    expect(RANKS).toHaveLength(20);
  });

  it("returns null at the top", () => {
    expect(nextRank(RANKS[RANKS.length - 1].at)).toBeNull();
  });
});

describe("progressToNext", () => {
  it("counts down to the next title", () => {
    expect(progressToNext(0)).toBe("1 more to Curious Visitor");
    expect(progressToNext(3)).toBe("2 more to Occultist");
    expect(progressToNext(35)).toBe("15 more to Arkham Archivist");
  });

  it("goes quiet once the ladder is climbed", () => {
    expect(progressToNext(5000)).toBeNull();
  });
});

describe("rankProgress", () => {
  it("reports how far along the current rung you are", () => {
    expect(rankProgress(0)).toBe(0);
    expect(rankProgress(1)).toBe(0);
    expect(rankProgress(2)).toBeCloseTo(0.5, 5);
    expect(rankProgress(4)).toBeCloseTo(0.5, 5);
    expect(rankProgress(21)).toBeCloseTo(3 / 7, 5);
  });

  it("is full at the top of the ladder", () => {
    expect(rankProgress(800)).toBe(1);
    expect(rankProgress(99999)).toBe(1);
  });
});
