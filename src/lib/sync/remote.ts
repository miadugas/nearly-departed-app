import { supabase } from "@/lib/supabase";
import type { FavoriteSoul } from "@/lib/favorites/types";

// Thin Supabase I/O for the account mirror. Every function takes the user id and
// throws on error — callers (the providers) swallow those so a sync failure
// never reaches the UI. This is the ONLY place favorites/avatar touch Supabase;
// the local repository stays network-free.

type FavoriteRow = { soul: FavoriteSoul };
type ProfileRow = { avatar_id: string | null };

export async function fetchFavorites(userId: string): Promise<FavoriteSoul[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("soul")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as FavoriteRow[]).map((row) => row.soul);
}

export async function pushFavorite(
  userId: string,
  fav: FavoriteSoul,
): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .upsert(
      { user_id: userId, qid: fav.qid, soul: fav },
      { onConflict: "user_id,qid" },
    );
  if (error) throw error;
}

export async function removeFavorite(
  userId: string,
  qid: string,
): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("qid", qid);
  if (error) throw error;
}

export async function fetchAvatar(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null)?.avatar_id ?? null;
}

export async function upsertAvatar(
  userId: string,
  avatarId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, avatar_id: avatarId, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  if (error) throw error;
}
