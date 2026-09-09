import { isAvatarId, type AvatarId } from "@/lib/avatar/ids";
import { visitStampOf, type FavoriteSoul } from "@/lib/favorites/types";

// Pure reconcile decisions. No I/O — these functions take the local and remote
// snapshots and return what the caller should do. The caller (a provider) is
// responsible for the actual AsyncStorage writes and Supabase pushes.

export type MergeFavoritesResult = {
  // Union of both sides by qid, local record winning any payload conflict —
  // except `visitedAt`, which takes the earliest finite value from either side.
  merged: FavoriteSoul[];
  // Rows present remotely but not locally — the caller inserts these locally.
  toInsertLocally: FavoriteSoul[];
  // Rows already local whose merged `visitedAt` differs from the local one
  // (the account knew about a visit this device didn't) — the caller writes
  // these over the local rows.
  toUpdateLocally: FavoriteSoul[];
  // Merged records the remote mirror doesn't have or has wrong: rows missing
  // remotely, plus rows whose merged `visitedAt` differs from the remote one.
  toPushRemotely: FavoriteSoul[];
};

// Union favorites by qid. No tombstones: an offline local removal can be
// resurrected by a remote copy (accepted v1 semantics). Local wins on payload
// conflict so a device's freshest snapshot is never clobbered by a stale mirror.
//
// `visitedAt` is the one field local does NOT win. A visit is a fact that
// happened once, at a real place and time, and it earns rank credit — so it
// survives across devices and the EARLIEST finite stamp wins (a later stamp on
// the other device is a re-visit, not the first one). A missing stamp never
// overwrites a present one in either direction; whichever side is behind ends
// up in `toUpdateLocally` / `toPushRemotely` so both converge on the earliest.
export function mergeFavorites(
  localIn: FavoriteSoul[] | null | undefined,
  remoteIn: FavoriteSoul[] | null | undefined,
): MergeFavoritesResult {
  // Reconcile runs in async microtasks where a throw is a fatal crash in
  // Release — tolerate null-ish snapshots and rows instead of trusting callers.
  const local = (localIn ?? []).filter((f) => !!f && typeof f.qid === "string");
  const remote = (remoteIn ?? []).filter(
    (f) => !!f && typeof f.qid === "string",
  );
  const localByQid = new Map(local.map((f) => [f.qid, f]));
  const remoteByQid = new Map(remote.map((f) => [f.qid, f]));

  const toInsertLocally = remote.filter((f) => !localByQid.has(f.qid));
  const toUpdateLocally: FavoriteSoul[] = [];
  const toPushRemotely: FavoriteSoul[] = [];

  const reconciledLocal = local.map((localFav) => {
    const remoteFav = remoteByQid.get(localFav.qid);
    // Local-only row: nothing to reconcile, the mirror just needs it.
    if (!remoteFav) {
      toPushRemotely.push(localFav);
      return localFav;
    }

    const localAt = visitStampOf(localFav);
    const remoteAt = visitStampOf(remoteFav);
    const mergedAt =
      localAt === undefined
        ? remoteAt
        : remoteAt === undefined
          ? localAt
          : Math.min(localAt, remoteAt);

    // Neither side has ever been visited — identical to the pre-visit
    // behavior: local record kept as-is, nothing to write anywhere.
    if (mergedAt === undefined) return localFav;

    const mergedFav =
      mergedAt === localAt ? localFav : { ...localFav, visitedAt: mergedAt };
    if (mergedAt !== localAt) toUpdateLocally.push(mergedFav);
    if (mergedAt !== remoteAt) toPushRemotely.push(mergedFav);
    return mergedFav;
  });

  // Local first (it wins conflicts), then remote-only rows.
  const merged = [...reconciledLocal, ...toInsertLocally];

  return { merged, toInsertLocally, toUpdateLocally, toPushRemotely };
}

export type MergeDisplayNameResult = {
  // The name that should be in effect locally after reconcile.
  effective: string | null;
  // Whether the caller should push the local value (name or clear) to Supabase.
  pushLocal: boolean;
};

// The one place a display name is normalized — used on the way in (the editor,
// i.e. user intent) and on the way out (remote values, written by some other
// client). Strips control characters, collapses whitespace, caps length by code
// point so accents/emoji can't be cut mid-character, blank counts as no name.
export function sanitizeDisplayName(
  raw: string | null | undefined,
): string | null {
  // Remote values cross a type boundary (Postgres → JSON → here); a non-string
  // must degrade to "no name", never throw in the reconcile microtask.
  if (typeof raw !== "string") return null;

  const sanitized = raw
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  if (!sanitized) return null;
  // Re-trim after the cap: the slice can land just past a space.
  return Array.from(sanitized).slice(0, 40).join("").trim() || null;
}

// Display-name reconcile preserves the distinction between never set
// (undefined) and explicitly cleared (null), so an offline clear cannot be
// resurrected by a later remote read.
export function mergeDisplayName(
  local: string | null | undefined,
  remote: string | null,
): MergeDisplayNameResult {
  if (local !== undefined) {
    return { effective: local, pushLocal: true };
  }

  return { effective: sanitizeDisplayName(remote), pushLocal: false };
}

export type MergeAvatarResult = {
  // The avatar id that should be in effect locally after reconcile.
  effective: AvatarId | null;
  // Whether the caller should push the local avatar id to Supabase.
  pushLocal: boolean;
};

// Avatar reconcile: local wins. If the device has no avatar and the account
// does, adopt the account's (validating it first). If the device has one, keep
// it and push it up. A missing/invalid remote is ignored.
export function mergeAvatar(
  local: AvatarId | null,
  remote: string | null,
): MergeAvatarResult {
  if (local) {
    return { effective: local, pushLocal: true };
  }
  if (isAvatarId(remote)) {
    return { effective: remote, pushLocal: false };
  }
  return { effective: null, pushLocal: false };
}
