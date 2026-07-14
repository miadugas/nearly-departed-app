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
  type FavoriteSoul,
  type FavoritesRepository,
} from "./types";

// AsyncStorage is the source of truth and the only read path. Supabase is a
// best-effort mirror wired up below (reconcile on sign-in + fire-and-forget
// push on change). The repository itself stays network-free.
const repository: FavoritesRepository = new LocalFavoritesRepository();

type FavoritesContextValue = {
  favorites: FavoriteSoul[];
  isFavorite: (qid: string) => boolean;
  toggle: (soul: Soul) => void;
  remove: (qid: string) => void;
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
        const { toInsertLocally, toPushRemotely } = mergeFavorites(
          local,
          remote,
        );

        for (const fav of toInsertLocally) {
          await repository.add(fav);
        }
        if (active && toInsertLocally.length > 0) {
          // Merge into memory additively — never drop a row the user may have
          // toggled during the await gap.
          setFavorites((current) => {
            const have = new Set(current.map((f) => f.qid));
            const added = toInsertLocally.filter((f) => !have.has(f.qid));
            return added.length > 0 ? [...added, ...current] : current;
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

  const remove = useCallback((qid: string) => {
    setFavorites((current) => {
      const uid = userIdRef.current;
      void repository.remove(qid);
      if (uid) removeFavorite(uid, qid).catch(() => {});
      return current.filter((f) => f.qid !== qid);
    });
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggle, remove, isReady }),
    [favorites, isFavorite, toggle, remove, isReady],
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
