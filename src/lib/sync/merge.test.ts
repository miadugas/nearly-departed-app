import { describe, expect, it } from "vitest";

import type { AvatarId } from "@/lib/avatar/ids";
import type { FavoriteSoul } from "@/lib/favorites/types";
import { mergeAvatar, mergeFavorites } from "@/lib/sync/merge";

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
