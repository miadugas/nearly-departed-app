// The avatar id union + its runtime validator, kept free of any image
// require() so pure/logic code (and the vitest node runner) can import the
// guard without pulling Metro's PNG assets into a plain-Node context.
// `avatars.ts` re-exports these alongside the asset registry.
export type AvatarId =
  | "dapper-gent"
  | "raven-matriarch"
  | "braided-girl"
  | "zombie-boy"
  | "bald-uncle"
  | "tall-butler"
  | "stitched-monster"
  | "monster-bride"
  | "the-count"
  | "little-vamp"
  | "ghoul-glam"
  | "hairy-cousin"
  | "granny-ghoul"
  | "deep-one"
  | "goth-girl"
  | "crimson-queen";

// Source of truth for which ids are valid. Order here is not load-bearing —
// the picker grid order lives in avatars.ts.
export const AVATAR_IDS: readonly AvatarId[] = [
  "dapper-gent",
  "raven-matriarch",
  "braided-girl",
  "zombie-boy",
  "bald-uncle",
  "tall-butler",
  "stitched-monster",
  "monster-bride",
  "the-count",
  "little-vamp",
  "ghoul-glam",
  "hairy-cousin",
  "granny-ghoul",
  "deep-one",
  "goth-girl",
  "crimson-queen",
];

const ID_SET = new Set<string>(AVATAR_IDS);

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && ID_SET.has(value);
}
