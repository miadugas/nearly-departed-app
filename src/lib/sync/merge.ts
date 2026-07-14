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
