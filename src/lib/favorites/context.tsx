import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Soul } from "@/lib/wikidata";

import { LocalFavoritesRepository } from "./local-repository";
import {
  toFavorite,
  type FavoriteSoul,
  type FavoritesRepository,
} from "./types";

// ── The one line that changes when accounts land ────────────────────────────
// Replace with `new SupabaseFavoritesRepository()` (same interface). The hook,
// the provider, and every component stay exactly as they are.
const repository: FavoritesRepository = new LocalFavoritesRepository();
// ────────────────────────────────────────────────────────────────────────────

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

  const isFavorite = useCallback(
    (qid: string) => favorites.some((f) => f.qid === qid),
    [favorites],
  );

  const toggle = useCallback((soul: Soul) => {
    setFavorites((current) => {
      if (current.some((f) => f.qid === soul.qid)) {
        void repository.remove(soul.qid);
        return current.filter((f) => f.qid !== soul.qid);
      }
      const fav = toFavorite(soul, Date.now());
      void repository.add(fav);
      return [fav, ...current];
    });
  }, []);

  const remove = useCallback((qid: string) => {
    setFavorites((current) => {
      void repository.remove(qid);
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
