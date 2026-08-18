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
import {
  mergeAvatar,
  mergeDisplayName,
  sanitizeDisplayName,
} from "@/lib/sync/merge";
import {
  fetchProfile,
  upsertAvatar,
  upsertDisplayName,
} from "@/lib/sync/remote";

import { isAvatarId, type AvatarId } from "./avatars";

const KEY = "nd:avatar";
const GUEST_DISPLAY_NAME_KEY = "nd:display-name:guest";

function displayNameKey(userId: string | null): string {
  return userId ? `nd:display-name:u:${userId}` : GUEST_DISPLAY_NAME_KEY;
}

// Stored null is the tombstone that keeps an offline clear from being
// mistaken for a never-set name during a later reconcile.
async function readStoredName(
  key: string,
): Promise<string | null | undefined> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return undefined;

  try {
    const decoded: unknown = JSON.parse(raw);
    if (decoded === null) return null;
    if (typeof decoded !== "string") return undefined;
    // A stored string that sanitizes away is corruption, not a clear — fall
    // back to never-set so a remote name can still be adopted.
    return sanitizeDisplayName(decoded) ?? undefined;
  } catch {
    return undefined;
  }
}

// Undefined removes only a never-set key; user intent passes null so clears
// always persist as the tombstone rather than becoming an absent key.
async function writeStoredName(
  key: string,
  name: string | null | undefined,
): Promise<void> {
  if (name === undefined) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(name));
}

type AvatarContextValue = {
  avatarId: AvatarId | null;
  setAvatarId: (id: AvatarId | null) => void;
  displayName: string | null;
  setDisplayName: (name: string | null) => void;
  isReady: boolean; // false until the first load from storage completes
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

// Device-local profile selections (avatar + display name) work for guests and
// signed-in users. AsyncStorage is the source of truth; Supabase is a best-effort
// mirror (reconcile on sign-in + fire-and-forget push on change).
export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarId, setAvatarIdState] = useState<AvatarId | null>(null);
  // The name is stored together with the scope that owns it (a user id, or null
  // for the guest scope). Auth state changes render before the effects below can
  // reload storage, so a bare name would flash under the wrong identity — the
  // exposed value is gated on the owner matching the active scope instead.
  const [scopedName, setScopedName] = useState<{
    owner: string | null;
    name: string | null;
  } | null>(null);
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
  // Bumped on every explicit name edit. Reconcile captures it before awaiting
  // the network and drops its (now stale) result if the user typed meanwhile.
  const nameIntentRef = useRef(0);
  // Prevents the sign-out reset from duplicating the initial guest load.
  const previousUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(KEY),
      readStoredName(GUEST_DISPLAY_NAME_KEY),
    ]).then(([avatarRaw, storedName]) => {
      if (!active) return;
      setAvatarIdState(isAvatarId(avatarRaw) ? avatarRaw : null);
      if (userIdRef.current === null) {
        setScopedName({ owner: null, name: storedName ?? null });
      }
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

  // User intent always writes a scoped value, including a tombstone for
  // Clear, so the next remote reconcile cannot resurrect an offline choice.
  const setDisplayName = useCallback((name: string | null) => {
    const sanitized = sanitizeDisplayName(name);
    const uid = userIdRef.current;
    const key = displayNameKey(uid);

    nameIntentRef.current += 1; // any reconcile still in flight is now stale
    setScopedName({ owner: uid, name: sanitized });
    writeStoredName(key, sanitized).catch(() => {});
    if (uid) upsertDisplayName(uid, sanitized).catch(() => {});
  }, []);

  // A signed-out transition restores the guest value before another account
  // can render or push the previous account's name.
  useEffect(() => {
    if (userId) {
      previousUserIdRef.current = userId;
      return;
    }
    if (previousUserIdRef.current === null) return;
    previousUserIdRef.current = null;

    let active = true;
    const intent = nameIntentRef.current;
    readStoredName(GUEST_DISPLAY_NAME_KEY).then((storedName) => {
      if (!active || nameIntentRef.current !== intent) return;
      setScopedName({ owner: null, name: storedName ?? null });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Reconcile once per signed-in user. Avatar keeps its local-first behavior;
  // display name uses scoped three-state storage so offline clears persist.
  // All Supabase errors are swallowed.
  useEffect(() => {
    if (!userId) {
      reconciledForRef.current = null;
      return;
    }
    if (reconciledForRef.current === userId) return;
    reconciledForRef.current = userId; // claim before awaiting → no re-entry
    // Nothing from a previous scope may render against this account's identity.
    setScopedName({ owner: userId, name: null });

    let active = true;
    const nameKey = displayNameKey(userId);
    // Captured before any await: an explicit edit during the round trip bumps
    // the counter, and every branch below then abandons its stale conclusion
    // rather than reverting what the user just typed (locally or remotely).
    const intent = nameIntentRef.current;
    const superseded = () => !active || nameIntentRef.current !== intent;
    // Reconcile may adopt a remote name, but it must never use the user-intent
    // setter or manufacture a clear tombstone when the local key was absent.
    const applyReconciledName = (
      effective: string | null,
      options: { persist: boolean },
    ) => {
      if (superseded()) return;
      setScopedName({ owner: userId, name: effective });
      if (options.persist && effective !== null) {
        writeStoredName(nameKey, effective).catch(() => {});
      }
    };
    // Guarded so a push cannot land after the user changed their mind.
    const pushName = (name: string | null) => {
      if (superseded()) return;
      upsertDisplayName(userId, name).catch(() => {});
    };

    (async () => {
      try {
        const localName = await readStoredName(nameKey);
        if (superseded()) return;
        setScopedName({ owner: userId, name: localName ?? null });

        const rawAvatar = await AsyncStorage.getItem(KEY);
        const profile = await fetchProfile(userId);
        if (!active) return; // avatar reconcile below is independent of name intent

        const localAvatar = isAvatarId(rawAvatar) ? rawAvatar : null;
        const { avatarId: remoteAvatar, displayName: rawRemoteName } = profile;
        const remoteName = sanitizeDisplayName(rawRemoteName);

        // Avatar first, so an early return on the name side can't skip it.
        const { effective: effectiveAvatar, pushLocal: pushLocalAvatar } =
          mergeAvatar(localAvatar, remoteAvatar);
        if (effectiveAvatar !== localAvatar) {
          // Adopt the remote avatar (writes through to AsyncStorage).
          setAvatarId(effectiveAvatar);
        }
        if (pushLocalAvatar && effectiveAvatar) {
          upsertAvatar(userId, effectiveAvatar).catch(() => {});
        }

        // Promote a guest name only when this account has no name of its own —
        // an existing account name always wins (never silently overwritten).
        if (localName === undefined && remoteName === null) {
          const guestName = await readStoredName(GUEST_DISPLAY_NAME_KEY);
          if (superseded()) return;

          if (typeof guestName === "string") {
            applyReconciledName(guestName, { persist: true });
            pushName(guestName);
            return;
          }
        }

        const { effective, pushLocal } = mergeDisplayName(localName, remoteName);
        applyReconciledName(effective, {
          persist: localName === undefined && effective !== null,
        });
        if (pushLocal) pushName(effective);
      } catch (err) {
        // Remote missing / network down / any Supabase error: local still works.
        if (__DEV__) console.warn("[profile sync] reconcile failed", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [setAvatarId, userId]);

  // Only surface a name that belongs to the scope currently signed in. Between
  // an auth change and the effect that reloads storage, the held value belongs
  // to the previous scope — showing it would put one account's name (or a
  // guest's) under another's identity for a frame or two.
  const displayName =
    scopedName && scopedName.owner === userId ? scopedName.name : null;

  const value = useMemo(
    () => ({ avatarId, setAvatarId, displayName, setDisplayName, isReady }),
    [avatarId, setAvatarId, displayName, setDisplayName, isReady],
  );

  return (
    <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
  );
}

// Consumers use one context so avatar and display-name identity cannot drift
// across separate provider lifecycles.
export function useAvatar(): AvatarContextValue {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return ctx;
}
