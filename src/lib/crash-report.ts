import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import { supabase } from "@/lib/supabase";

// Dependency-free crash breadcrumbs. A fatal JS error in Release kills the app
// via RCTFatal with no trace we can read (TestFlight crash logs carry only the
// native abort, not the JS message/stack — learned the hard way from the
// 2026-08-18 "scrolling" crash). So: persist the error at death, upload it on
// the next launch. Best-effort at every step — the crash handler itself must
// never throw, and the AsyncStorage write races process death (it usually
// wins; when it doesn't we've lost nothing we ever had).

const KEY = "nd:last-fatal";

type Crumb = {
  message: string;
  stack: string;
  isFatal: boolean;
  at: string; // ISO — stamped at crash time on the device
  appVersion: string;
};

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = {
  getGlobalHandler?: () => GlobalHandler;
  setGlobalHandler?: (fn: GlobalHandler) => void;
};

export function installCrashBreadcrumb() {
  const utils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (!utils?.setGlobalHandler) return; // web / unexpected host: nothing to hook

  const previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    try {
      const e = error as { message?: unknown; stack?: unknown } | null;
      const crumb: Crumb = {
        message: String(e?.message ?? error),
        stack: String(e?.stack ?? "").slice(0, 8000),
        isFatal: !!isFatal,
        at: new Date().toISOString(),
        appVersion: Constants.expoConfig?.version ?? "unknown",
      };
      // Fire-and-forget: the abort follows on the previous handler's heels.
      AsyncStorage.setItem(KEY, JSON.stringify(crumb)).catch(() => {});
    } catch {
      // never let the crash reporter be the crash
    }
    previous?.(error, isFatal);
  });
}

export async function reportPendingCrash() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const crumb = JSON.parse(raw) as Crumb;
    const { error } = await supabase.from("crash_reports").insert({
      message: crumb.message,
      stack: crumb.stack,
      is_fatal: crumb.isFatal,
      crashed_at: crumb.at,
      app_version: crumb.appVersion,
    });
    // Keep the crumb until it lands somewhere — offline launch retries next time.
    if (!error) await AsyncStorage.removeItem(KEY);
  } catch {
    // reporting is best-effort; never disturb launch
  }
}
