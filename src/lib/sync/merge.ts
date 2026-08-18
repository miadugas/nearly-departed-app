import { isAvatarId, type AvatarId } from "@/lib/avatar/ids";
import type { FavoriteSoul } from "@/lib/favorites/types";

// Pure reconcile decisions. No I/O — these functions take the local and remote
// snapshots and return what the caller should do. The caller (a provider) is
// responsible for the actual AsyncStorage writes and Supabase pushes.

export type MergeFavoritesResult = {
  // Union of both sides by qid, local record winning any payload conflict.
  merged: FavoriteSoul[];
  // Rows present remotely but not locally — the caller inserts these locally.
  toInsertLocally: FavoriteSoul[];
  // Rows present locally but not remotely — the caller pushes these to Supabase.
  toPushRemotely: FavoriteSoul[];
};

// Union favorites by qid. No tombstones: an offline local removal can be
// resurrected by a remote copy (accepted v1 semantics). Local wins on payload
// conflict so a device's freshest snapshot is never clobbered by a stale mirror.
export function mergeFavorites(
  local: FavoriteSoul[],
  remote: FavoriteSoul[],
): MergeFavoritesResult {
  const localByQid = new Map(local.map((f) => [f.qid, f]));
  const remoteByQid = new Map(remote.map((f) => [f.qid, f]));

  const toInsertLocally = remote.filter((f) => !localByQid.has(f.qid));
  const toPushRemotely = local.filter((f) => !remoteByQid.has(f.qid));

  // Local first (it wins conflicts), then remote-only rows.
  const merged = [...local, ...toInsertLocally];

  return { merged, toInsertLocally, toPushRemotely };
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
  if (raw == null) return null;

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
