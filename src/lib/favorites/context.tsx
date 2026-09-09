import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/auth/context";
import { mergeFavorites } from "@/lib/sync/merge";
import {
  fetchFavorites,
  pushFavorite,
  removeFavorite,
} from "@/lib/sync/remote";
import type { Soul } from "@/lib/wikidata";

import { LocalFavoritesRepository } from "./local-repository";
import {
  toFavorite,
  visitStampOf,
  type FavoriteSoul,
  type FavoritesRepository,
} from "./types";

// AsyncStorage is the source of truth and the only read path. Supabase is a
// best-effort mirror wired up below (reconcile on sign-in + fire-and-forget
// push on change). The repository itself stays network-free.
const repository: FavoritesRepository = new LocalFavoritesRepository();

// Two systems over one record: saving is a bookmark you can make from
// anywhere, visiting is proximity-verified at the grave (the person page gates
// it on device location) and is what earns rank credit. Visiting implies
// saving; unsaving forfeits the visit stamp with the rest of the record.
type FavoritesContextValue = {
  favorites: FavoriteSoul[];
  isFavorite: (qid: string) => boolean;
  isVisited: (qid: string) => boolean;
  toggle: (soul: Soul) => void;
  markVisited: (soul: Soul) => void;
  remove: (qid: string) => void;
  visitedCount: number;
  isReady: boolean; // false until the first load from storage completes
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  // In-memory mirror of the persisted list so hearts re-render reactively.
  // Mutations update memory optimistically and write through to the repo.
  const [favorites, setFavorites] = useState<FavoriteSoul[]>([]);
  const [isReady, setIsReady] = useState(false);

  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Latest signed-in user id, read inside the mutation callbacks without
  // re-creating them on every auth change.
  const userIdRef = useRef<string | null>(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  // Guards the reconcile pass: holds the user id currently being (or already)
  // reconciled so a re-render or auth event can't run it twice concurrently.
  const reconciledForRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    repository.list().then((list) => {
      if (!active) return;
      setFavorites(list);
      setIsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Reconcile pass — runs once per signed-in user (on the sign-in transition
  // and on mount when already signed in). Additive only: it inserts remote-only
  // rows locally and pushes local-only rows up, but never removes anything, so
  // local data can't be lost. All Supabase errors are swallowed.
  useEffect(() => {
    if (!userId) {
      // Signed out: keep everything, stop syncing, allow a future sign-in to
      // reconcile again.
      reconciledForRef.current = null;
      return;
    }
    if (reconciledForRef.current === userId) return;
    reconciledForRef.current = userId; // claim before awaiting → no re-entry

    let active = true;
    (async () => {
      try {
        const local = await repository.list();
        const remote = await fetchFavorites(userId);
        const { toInsertLocally, toUpdateLocally, toPushRemotely } =
          mergeFavorites(local, remote);

        for (const fav of toInsertLocally) {
          await repository.add(fav);
        }
        // Rows this device already has, but where the account carried a visit
        // stamp it lacked. `add` upserts by qid, so this rewrites in place.
        for (const fav of toUpdateLocally) {
          await repository.add(fav);
        }
        if (
          active &&
          (toInsertLocally.length > 0 || toUpdateLocally.length > 0)
        ) {
          // Merge into memory additively — never drop a row the user may have
          // toggled during the await gap.
          setFavorites((current) => {
            const have = new Set(current.map((f) => f.qid));
            const added = toInsertLocally.filter((f) => !have.has(f.qid));
            const stamps = new Map(
              toUpdateLocally.map((f) => [f.qid, f.visitedAt]),
            );
            // Patch only the visit stamp onto whatever is in memory now: the
            // user may have re-saved during the await, and their payload is
            // fresher than the snapshot this reconcile started from.
            const patched =
              stamps.size === 0
                ? current
                : current.map((f) =>
                    stamps.has(f.qid)
                      ? { ...f, visitedAt: stamps.get(f.qid) }
                      : f,
                  );
            return added.length > 0 ? [...added, ...patched] : patched;
          });
        }
        for (const fav of toPushRemotely) {
          pushFavorite(userId, fav).catch(() => {});
        }
      } catch (err) {
        // Remote tables missing / network down / any Supabase error: behave
        // exactly like signed out. Local already works.
        if (__DEV__) console.warn("[favorites sync] reconcile failed", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const isFavorite = useCallback(
    (qid: string) => favorites.some((f) => f.qid === qid),
    [favorites],
  );

  const isVisited = useCallback(
    (qid: string) =>
      favorites.some(
        (f) => f.qid === qid && visitStampOf(f) !== undefined,
      ),
    [favorites],
  );

  const visitedCount = useMemo(
    () => favorites.filter((f) => visitStampOf(f) !== undefined).length,
    [favorites],
  );

  const toggle = useCallback((soul: Soul) => {
    setFavorites((current) => {
      const uid = userIdRef.current;
      if (current.some((f) => f.qid === soul.qid)) {
        void repository.remove(soul.qid);
        if (uid) removeFavorite(uid, soul.qid).catch(() => {});
        return current.filter((f) => f.qid !== soul.qid);
      }
      const fav = toFavorite(soul, Date.now());
      void repository.add(fav);
      if (uid) pushFavorite(uid, fav).catch(() => {});
      return [fav, ...current];
    });
  }, []);

  // Proximity-verified visit. Saves first if needed, then stamps — the stamp
  // is only ever written once, because a re-visit isn't a new fact.
  const markVisited = useCallback((soul: Soul) => {
    setFavorites((current) => {
      const uid = userIdRef.current;
      const existing = current.find((f) => f.qid === soul.qid);
      if (existing && visitStampOf(existing) !== undefined) return current;

      const now = Date.now();
      const fav: FavoriteSoul = existing
        ? { ...existing, visitedAt: now }
        : { ...toFavorite(soul, now), visitedAt: now };
      // `add` upserts by qid, so the save path and the stamp path are one call.
      void repository.add(fav);
      if (uid) pushFavorite(uid, fav).catch(() => {});
      return existing
        ? current.map((f) => (f.qid === soul.qid ? fav : f))
        : [fav, ...current];
    });
  }, []);

  const remove = useCallback((qid: string) => {
    setFavorites((current) => {
      const uid = userIdRef.current;
      void repository.remove(qid);
      if (uid) removeFavorite(uid, qid).catch(() => {});
      return current.filter((f) => f.qid !== qid);
    });
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      isVisited,
      toggle,
      markVisited,
      remove,
      visitedCount,
      isReady,
    }),
    [
      favorites,
      isFavorite,
      isVisited,
      toggle,
      markVisited,
      remove,
      visitedCount,
      isReady,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return ctx;
}
