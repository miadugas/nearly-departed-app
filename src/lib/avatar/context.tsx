import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { mergeAvatar } from "@/lib/sync/merge";
import { fetchAvatar, upsertAvatar } from "@/lib/sync/remote";

import { isAvatarId, type AvatarId } from "./avatars";

const KEY = "nd:avatar";

type AvatarContextValue = {
  avatarId: AvatarId | null;
  setAvatarId: (id: AvatarId | null) => void;
  isReady: boolean; // false until the first load from storage completes
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

// Device-local avatar selection — works identically for guests and
// signed-in users, no account required. AsyncStorage is the source of truth;
// Supabase is a best-effort mirror (reconcile on sign-in + fire-and-forget
// push on change) wired up below. Mirrors the favorites provider's shape
// (in-memory mirror + write-through) but for a single value instead of a list.
export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarId, setAvatarIdState] = useState<AvatarId | null>(null);
  const [isReady, setIsReady] = useState(false);

  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Latest signed-in user id, read inside setAvatarId without re-creating it.
  const userIdRef = useRef<string | null>(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  // Guards the reconcile pass against concurrent/duplicate runs.
  const reconciledForRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!active) return;
      setAvatarIdState(isAvatarId(raw) ? raw : null);
      setIsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const setAvatarId = useCallback((id: AvatarId | null) => {
    setAvatarIdState(id);
    if (id) {
      void AsyncStorage.setItem(KEY, id);
    } else {
      void AsyncStorage.removeItem(KEY);
    }
    const uid = userIdRef.current;
    if (uid) upsertAvatar(uid, id).catch(() => {});
  }, []);

  // Reconcile pass — runs once per signed-in user. Local wins: if the device
  // has an avatar it's pushed up; if it doesn't and the account has one, it's
  // adopted. Never clears anything. All Supabase errors are swallowed.
  useEffect(() => {
    if (!userId) {
      reconciledForRef.current = null;
      return;
    }
    if (reconciledForRef.current === userId) return;
    reconciledForRef.current = userId; // claim before awaiting → no re-entry

    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const local = isAvatarId(raw) ? raw : null;
        const remote = await fetchAvatar(userId);
        const { effective, pushLocal } = mergeAvatar(local, remote);

        if (active && effective !== local) {
          // Adopt the remote avatar (writes through to AsyncStorage).
          setAvatarId(effective);
        }
        if (pushLocal && effective) {
          upsertAvatar(userId, effective).catch(() => {});
        }
      } catch (err) {
        // Remote missing / network down / any Supabase error: local still works.
        if (__DEV__) console.warn("[avatar sync] reconcile failed", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, setAvatarId]);

  const value = useMemo(
    () => ({ avatarId, setAvatarId, isReady }),
    [avatarId, setAvatarId, isReady],
  );

  return (
    <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
  );
}

export function useAvatar(): AvatarContextValue {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return ctx;
}
