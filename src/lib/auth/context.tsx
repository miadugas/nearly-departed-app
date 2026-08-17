import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

import { AUTH_STORAGE_KEY, supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isReady: boolean; // false until the first session check completes
  // Passwordless email: send a 6-digit code, then verify it. No deep links,
  // no redirect web page — the user just types the code from their inbox.
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  // Permanently deletes the account server-side (App Store Guideline 5.1.1(v)
  // requires this to be reachable in-app), then clears the local session.
  deleteAccount: () => Promise<{ appleRevoked: boolean | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Restore any persisted session on launch...
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsReady(true);
    });
    // ...then stay in sync. verifyCode, signOut, and background token refresh
    // all surface here, so no screen ever has to set the session by hand.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isReady,
      sendCode: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
      },
      verifyCode: async (email, code) => {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: "email",
        });
        if (error) throw error;
      },
      signInWithApple: async () => {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!credential.identityToken) {
          throw new Error("Apple didn't return an identity token.");
        }
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      deleteAccount: async () => {
        const hasAppleIdentity =
          session?.user.identities?.some(
            (identity) => identity.provider === "apple",
          ) ?? false;
        let appleAuthorizationCode: string | undefined;

        if (hasAppleIdentity && Platform.OS === "ios") {
          try {
            const credential = await AppleAuthentication.signInAsync();
            appleAuthorizationCode = credential.authorizationCode ?? undefined;
          } catch {
            // Deletion continues if the Apple re-auth sheet is canceled or fails.
          }
        }

        const { data, error } = await supabase.functions.invoke<{
          revoked?: boolean;
        }>("delete-account", {
          method: "POST",
          ...(appleAuthorizationCode
            ? { body: { appleAuthorizationCode } }
            : {}),
        });
        if (error) throw error;
        // The server-side user is gone, so a global sign-out would 4xx —
        // drop the session on this device only. signOut resolves (not rejects)
        // with { error } and keeps the persisted session when its server call
        // fails, so evict storage and state by hand in that case: a deleted
        // account must never resurface as signed-in.
        const { error: signOutError } = await supabase.auth.signOut({
          scope: "local",
        });
        if (signOutError) {
          await AsyncStorage.multiRemove([
            AUTH_STORAGE_KEY,
            `${AUTH_STORAGE_KEY}-code-verifier`,
          ]).catch(() => {});
          setSession(null);
        }

        return {
          appleRevoked: hasAppleIdentity ? data?.revoked === true : null,
        };
      },
    }),
    [session, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
