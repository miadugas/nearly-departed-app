import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NativeModules, Platform } from "react-native";

import { isDistanceUnit, type DistanceUnit } from "./format";

const KEY = "nd:distance-unit";

// Device-level preference, like the OS's own region setting — deliberately not
// synced to the account, since it follows the phone rather than the person.
function deviceDefault(): DistanceUnit {
  const locale =
    Platform.OS === "ios"
      ? (NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
        "")
      : (NativeModules.I18nManager?.localeIdentifier ?? "");
  // The three holdouts that measure road distance in miles.
  return /[-_](US|GB|MM|LR)\b/i.test(String(locale)) ? "mi" : "km";
}

type UnitsContextValue = {
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
  isReady: boolean;
};

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<DistanceUnit>("km");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        setUnitState(isDistanceUnit(raw) ? raw : deviceDefault());
      })
      .catch(() => {
        if (alive) setUnitState(deviceDefault());
      })
      .finally(() => {
        if (alive) setIsReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const setUnit = useCallback((next: DistanceUnit) => {
    setUnitState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ unit, setUnit, isReady }),
    [unit, setUnit, isReady],
  );

  return (
    <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>
  );
}

export function useUnits(): UnitsContextValue {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within a UnitsProvider");
  return ctx;
}
