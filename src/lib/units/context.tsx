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
import { getLocales } from "expo-localization";

import { isDistanceUnit, type DistanceUnit } from "./format";

const KEY = "nd:distance-unit";

// Device-level preference, like the OS's own region setting — deliberately not
// synced to the account, since it follows the phone rather than the person.
function deviceDefault(): DistanceUnit {
  try {
    const locale = getLocales()[0];
    // measurementSystem is the OS's own answer: "us" | "uk" | "metric".
    // Both us and uk post road distances in miles.
    if (locale?.measurementSystem === "us" || locale?.measurementSystem === "uk") {
      return "mi";
    }
    if (locale?.measurementSystem === "metric") return "km";
    // No measurement system reported — fall back to the region's convention.
    return /^(US|GB|MM|LR)$/i.test(locale?.regionCode ?? "") ? "mi" : "km";
  } catch {
    return "km";
  }
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
