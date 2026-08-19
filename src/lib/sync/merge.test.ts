import { describe, expect, it } from "vitest";

import type { AvatarId } from "@/lib/avatar/ids";
import type { FavoriteSoul } from "@/lib/favorites/types";
import {
  mergeAvatar,
  mergeDisplayName,
  mergeFavorites,
  sanitizeDisplayName,
} from "@/lib/sync/merge";

function fav(qid: string, overrides: Partial<FavoriteSoul> = {}): FavoriteSoul {
  return {
    qid,
    label: qid,
    desc: "",
    place: "",
    coord: null,
    image: null,
    dob: "",
    dod: "",
    occs: [],
    savedAt: 0,
    ...overrides,
  };
}

describe("mergeFavorites", () => {
  it("unions disjoint local and remote sets", () => {
    const local = [fav("Q1")];
    const remote = [fav("Q2")];

    const { merged, toInsertLocally, toPushRemotely } = mergeFavorites(
      local,
      remote,
    );

    expect(merged.map((f) => f.qid).sort()).toEqual(["Q1", "Q2"]);
    expect(toInsertLocally.map((f) => f.qid)).toEqual(["Q2"]);
    expect(toPushRemotely.map((f) => f.qid)).toEqual(["Q1"]);
  });

  it("does not duplicate qids present on both sides", () => {
    const local = [fav("Q1"), fav("Q2")];
    const remote = [fav("Q2"), fav("Q3")];

    const { merged, toInsertLocally, toPushRemotely } = mergeFavorites(
      local,
      remote,
    );

    expect(merged.map((f) => f.qid).sort()).toEqual(["Q1", "Q2", "Q3"]);
    expect(toInsertLocally.map((f) => f.qid)).toEqual(["Q3"]);
    expect(toPushRemotely.map((f) => f.qid)).toEqual(["Q1"]);
  });

  it("keeps the local record when a qid conflicts on payload", () => {
    const local = [fav("Q1", { label: "Local Ada", savedAt: 100 })];
    const remote = [fav("Q1", { label: "Remote Ada", savedAt: 200 })];

    const { merged, toInsertLocally, toPushRemotely } = mergeFavorites(
      local,
      remote,
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].label).toBe("Local Ada");
    expect(merged[0].savedAt).toBe(100);
    expect(toInsertLocally).toEqual([]);
    expect(toPushRemotely).toEqual([]);
  });

  it("handles an empty remote (push everything local)", () => {
    const local = [fav("Q1"), fav("Q2")];

    const { merged, toInsertLocally, toPushRemotely } = mergeFavorites(
      local,
      [],
    );

    expect(merged.map((f) => f.qid)).toEqual(["Q1", "Q2"]);
    expect(toInsertLocally).toEqual([]);
    expect(toPushRemotely.map((f) => f.qid)).toEqual(["Q1", "Q2"]);
  });

  it("handles an empty local (insert everything remote)", () => {
    const remote = [fav("Q1"), fav("Q2")];

    const { merged, toInsertLocally, toPushRemotely } = mergeFavorites(
      [],
      remote,
    );

    expect(merged.map((f) => f.qid)).toEqual(["Q1", "Q2"]);
    expect(toInsertLocally.map((f) => f.qid)).toEqual(["Q1", "Q2"]);
    expect(toPushRemotely).toEqual([]);
  });

  it("returns empty results for two empty sides", () => {
    expect(mergeFavorites([], [])).toEqual({
      merged: [],
      toInsertLocally: [],
      toPushRemotely: [],
    });
  });
});

describe("mergeAvatar", () => {
  const localAvatar: AvatarId = "goth-girl";
  const remoteAvatar: AvatarId = "the-count";

  it("keeps and pushes the local avatar when one is set (local wins)", () => {
    expect(mergeAvatar(localAvatar, remoteAvatar)).toEqual({
      effective: localAvatar,
      pushLocal: true,
    });
  });

  it("still pushes the local avatar when remote is empty", () => {
    expect(mergeAvatar(localAvatar, null)).toEqual({
      effective: localAvatar,
      pushLocal: true,
    });
  });

  it("adopts the remote avatar when local is null", () => {
    expect(mergeAvatar(null, remoteAvatar)).toEqual({
      effective: remoteAvatar,
      pushLocal: false,
    });
  });

  it("stays null when both sides are empty", () => {
    expect(mergeAvatar(null, null)).toEqual({
      effective: null,
      pushLocal: false,
    });
  });

  it("ignores an invalid remote avatar id", () => {
    expect(mergeAvatar(null, "not-a-real-avatar")).toEqual({
      effective: null,
      pushLocal: false,
    });
  });
});

describe("sanitizeDisplayName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(sanitizeDisplayName("  Mia   E   Dugas  ")).toBe("Mia E Dugas");
  });

  it("strips control characters", () => {
    expect(sanitizeDisplayName("Mi\u0007a\u0000")).toBe("Mia");
  });

  it("treats blank input as no name", () => {
    expect(sanitizeDisplayName("   ")).toBeNull();
    expect(sanitizeDisplayName("\u0007")).toBeNull();
    expect(sanitizeDisplayName(null)).toBeNull();
    expect(sanitizeDisplayName(undefined)).toBeNull();
  });

  it("caps length at 40 without leaving a trailing space", () => {
    const sanitized = sanitizeDisplayName(`${"a".repeat(39)} tail`);

    expect(sanitized).toBe("a".repeat(39));
  });

  it("counts by code point so multi-byte characters are not split", () => {
    const sanitized = sanitizeDisplayName("💀".repeat(50));

    expect(Array.from(sanitized ?? "")).toHaveLength(40);
  });
});

describe("mergeDisplayName", () => {
  it("keeps and pushes a local name over a remote one", () => {
    expect(mergeDisplayName("Mia", "Stale")).toEqual({
      effective: "Mia",
      pushLocal: true,
    });
  });

  // Offline-clear regression: a tombstone must not be resurrected by the remote
  // copy, and the clear has to be pushed on the next reconcile.
  it("keeps an explicit clear and pushes it instead of adopting remote", () => {
    expect(mergeDisplayName(null, "Ghost")).toEqual({
      effective: null,
      pushLocal: true,
    });
  });

  it("adopts a remote name when this device never set one, without pushing", () => {
    expect(mergeDisplayName(undefined, "Mia")).toEqual({
      effective: "Mia",
      pushLocal: false,
    });
  });

  it("sanitizes an adopted remote name", () => {
    expect(mergeDisplayName(undefined, "  Mia   Dugas ")).toEqual({
      effective: "Mia Dugas",
      pushLocal: false,
    });
  });

  it("stays never-set when neither side has a name", () => {
    expect(mergeDisplayName(undefined, null)).toEqual({
      effective: null,
      pushLocal: false,
    });
  });
});

// Fatal-crash hardening (2026-08-18 TestFlight SIGABRT): reconcile runs in
// async microtasks where any throw kills the app in Release. These lock in
// the "degrade, never throw" contract for malformed inputs.
describe("merge hardening", () => {
  it("mergeFavorites tolerates null/undefined snapshots", () => {
    expect(() => mergeFavorites(null as never, undefined as never)).not.toThrow();
    const r = mergeFavorites(null as never, undefined as never);
    expect(r.merged).toEqual([]);
  });

  it("mergeFavorites drops rows without a qid instead of throwing", () => {
    const good = fav("Q1");
    const r = mergeFavorites(
      [good],
      [null, {}, fav("Q2")] as never,
    );
    expect(r.merged.map((f) => f.qid)).toEqual(["Q1", "Q2"]);
    expect(r.toInsertLocally.map((f) => f.qid)).toEqual(["Q2"]);
  });

  it("sanitizeDisplayName returns null for non-string runtime values", () => {
    expect(sanitizeDisplayName(42 as never)).toBeNull();
    expect(sanitizeDisplayName({} as never)).toBeNull();
    expect(sanitizeDisplayName([] as never)).toBeNull();
  });
});
