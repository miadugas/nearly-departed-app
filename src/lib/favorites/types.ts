import type { Soul } from "@/lib/wikidata";

// A saved soul. Denormalized snapshot of the display fields so the favorites
// list renders instantly/offline without re-querying Wikidata. This shape maps
// 1:1 to a future DB row.
//
// NOTE: `dist` (distance-from-you) is intentionally NOT stored — it's
// location-dependent and goes stale the moment you move. Keep `coord` and
// recompute distance at render time.
export type FavoriteSoul = {
  qid: string;
  label: string;
  desc: string;
  place: string;
  coord: [number, number] | null;
  image: string | null;
  dob: string;
  dod: string;
  occs: string[];
  savedAt: number; // epoch ms — used to order by recency
};

// The storage contract. Today: LocalFavoritesRepository (AsyncStorage).
// Later: SupabaseFavoritesRepository (same interface, scoped to auth.uid()).
// Swapping implementations is the entire local→DB migration.
export interface FavoritesRepository {
  list(): Promise<FavoriteSoul[]>;
  add(fav: FavoriteSoul): Promise<void>;
  remove(qid: string): Promise<void>;
  clear(): Promise<void>;
}

export function toFavorite(soul: Soul, savedAt: number): FavoriteSoul {
  return {
    qid: soul.qid,
    label: soul.label,
    desc: soul.desc,
    place: soul.place,
    coord: soul.coord,
    image: soul.image,
    dob: soul.dob,
    dod: soul.dod,
    occs: soul.occs,
    savedAt,
  };
}
