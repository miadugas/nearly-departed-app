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
  // Set only when the save was proximity-verified at the grave. Absent/null =
  // saved but never visited, which is every record written before visits
  // existed. Two systems: saving is a bookmark, visiting is the fact that
  // earns rank credit — so this field, not `savedAt`, is what ranks count.
  visitedAt?: number | null;
};

// The one place a visit stamp is validated. It only counts as a visit if it is
// a finite number: the field is optional, nullable, and crosses a jsonb/JSON
// boundary written by whatever client version synced it, so anything else
// (missing, null, a string, NaN) means "not visited".
export function visitStampOf(
  fav: Pick<FavoriteSoul, "visitedAt"> | null | undefined,
): number | undefined {
  const at = fav?.visitedAt;
  return typeof at === "number" && Number.isFinite(at) ? at : undefined;
}

// The storage contract. Today: LocalFavoritesRepository (AsyncStorage).
// Later: SupabaseFavoritesRepository (same interface, scoped to auth.uid()).
// Swapping implementations is the entire local→DB migration.
export interface FavoritesRepository {
  list(): Promise<FavoriteSoul[]>;
  // Upsert by qid — callers rely on this to update a record in place (e.g.
  // stamping `visitedAt` on an already-saved soul) without a remove+add.
  add(fav: FavoriteSoul): Promise<void>;
  remove(qid: string): Promise<void>;
  clear(): Promise<void>;
}

// Produces an unvisited record — saving never implies a visit. The visit path
// stamps `visitedAt` on top of this.
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
