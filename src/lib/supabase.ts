import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";

// URL + anon (publishable) key live in app.json → expo.extra so they ride with
// the build instead of a gitignored .env that EAS can't see. The anon key is
// safe to ship — Row Level Security guards the data, not key secrecy.
const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = extra.supabaseUrl as string | undefined;
const supabaseAnonKey = extra.supabaseAnonKey as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase config — set expo.extra.supabaseUrl and expo.extra.supabaseAnonKey in app.json.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session in AsyncStorage so a magic-link login survives restarts.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // RN has no URL bar — we hand the magic-link code to Supabase ourselves
    // (Step 2), so don't try to parse a session out of window.location.
    detectSessionInUrl: false,
  },
});

// Supabase only refreshes tokens while the app is foregrounded. Without this the
// access token can expire in the background and the next request 401s.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
