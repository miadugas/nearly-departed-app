// Static registry of the 16 pickable avatar stickers. Metro requires string
// literals at build time, so each require() call has to be written out by
// hand — no loop, no template string. Slugs and labels are pinned by design;
// don't reorder without checking the picker grid still reads sensibly.
//
// The AvatarId union + isAvatarId guard live in ./ids (no PNG requires) so pure
// logic and tests can validate ids without dragging Metro assets into Node.
import { isAvatarId, type AvatarId } from "./ids";

export { isAvatarId, type AvatarId };

export type Avatar = {
  id: AvatarId;
  label: string;
  source: number;
};

export const AVATARS: Avatar[] = [
  {
    id: "dapper-gent",
    label: "Dapper Gent",
    source: require("@/assets/images/avatars/dapper-gent.png"),
  },
  {
    id: "raven-matriarch",
    label: "Raven Matriarch",
    source: require("@/assets/images/avatars/raven-matriarch.png"),
  },
  {
    id: "braided-girl",
    label: "Braided Girl",
    source: require("@/assets/images/avatars/braided-girl.png"),
  },
  {
    id: "zombie-boy",
    label: "Zombie Boy",
    source: require("@/assets/images/avatars/zombie-boy.png"),
  },
  {
    id: "bald-uncle",
    label: "Bald Uncle",
    source: require("@/assets/images/avatars/bald-uncle.png"),
  },
  {
    id: "tall-butler",
    label: "Tall Butler",
    source: require("@/assets/images/avatars/tall-butler.png"),
  },
  {
    id: "stitched-monster",
    label: "Stitched Monster",
    source: require("@/assets/images/avatars/stitched-monster.png"),
  },
  {
    id: "monster-bride",
    label: "Monster Bride",
    source: require("@/assets/images/avatars/monster-bride.png"),
  },
  {
    id: "the-count",
    label: "The Count",
    source: require("@/assets/images/avatars/the-count.png"),
  },
  {
    id: "little-vamp",
    label: "Little Vamp",
    source: require("@/assets/images/avatars/little-vamp.png"),
  },
  {
    id: "ghoul-glam",
    label: "Ghoul Glam",
    source: require("@/assets/images/avatars/ghoul-glam.png"),
  },
  {
    id: "hairy-cousin",
    label: "Hairy Cousin",
    source: require("@/assets/images/avatars/hairy-cousin.png"),
  },
  {
    id: "granny-ghoul",
    label: "Granny Ghoul",
    source: require("@/assets/images/avatars/granny-ghoul.png"),
  },
  {
    id: "deep-one",
    label: "Deep One",
    source: require("@/assets/images/avatars/deep-one.png"),
  },
  {
    id: "goth-girl",
    label: "Goth Girl",
    source: require("@/assets/images/avatars/goth-girl.png"),
  },
  {
    id: "crimson-queen",
    label: "Crimson Queen",
    source: require("@/assets/images/avatars/crimson-queen.png"),
  },
];

const BY_ID: Record<AvatarId, Avatar> = AVATARS.reduce(
  (acc, avatar) => {
    acc[avatar.id] = avatar;
    return acc;
  },
  {} as Record<AvatarId, Avatar>,
);

export function avatarSource(id: AvatarId): number {
  return BY_ID[id].source;
}
