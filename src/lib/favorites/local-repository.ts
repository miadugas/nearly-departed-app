import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FavoriteSoul, FavoritesRepository } from "./types";

const KEY = "nd.favorites.v1";

// Local, on-device favorites. The whole list lives under one key as JSON —
// favorites are small and read/written rarely, so this is plenty.
export class LocalFavoritesRepository implements FavoritesRepository {
  async list(): Promise<FavoriteSoul[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FavoriteSoul[]) : [];
    } catch {
      return [];
    }
  }

  async add(fav: FavoriteSoul): Promise<void> {
    const all = await this.list();
    const next = [fav, ...all.filter((f) => f.qid !== fav.qid)];
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  async remove(qid: string): Promise<void> {
    const all = await this.list();
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify(all.filter((f) => f.qid !== qid)),
    );
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
