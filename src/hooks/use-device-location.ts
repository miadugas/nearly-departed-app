import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

// Fallback when location is denied/unavailable (matches the POC seed city).
const DENVER = { lat: 39.7392, lon: -104.9903 };

export type LocationStatus =
  | "loading"
  | "granted"
  | "denied"
  | "blocked"
  | "fallback";

export type DeviceLocation = {
  lat: number;
  lon: number;
  status: LocationStatus;
  // Ask again on demand. Entry points that don't auto-request (sign-in) and
  // users who declined the first prompt both need a way back to their location.
  request: () => void;
};

export function useDeviceLocation(enabled = true): DeviceLocation {
  const [state, setState] = useState<Omit<DeviceLocation, "request">>({
    ...DENVER,
    status: enabled ? "loading" : "fallback",
  });

  // Each run claims a generation; a superseded run (unmount, or a newer
  // request) can never write its result over a fresher one.
  const generation = useRef(0);

  const runLocate = useCallback(async () => {
    const gen = ++generation.current;
    const commit = (next: Omit<DeviceLocation, "request">) => {
      if (generation.current === gen) setState(next);
    };

    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // canAskAgain === false means iOS will no longer show the prompt —
        // the only way back is Settings, and the UI has to say so.
        commit({ ...DENVER, status: canAskAgain ? "denied" : "blocked" });
        return;
      }
      // Race against a timeout — a simulator with no location set can hang.
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("location-timeout")), 6000),
        ),
      ]);
      commit({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        status: "granted",
      });
    } catch {
      commit({ ...DENVER, status: "fallback" });
    }
  }, []);

  const request = useCallback(() => {
    // Keep the previous coordinates while re-asking, so the map doesn't flash
    // back to the seed city between the tap and the answer.
    setState((prev) =>
      prev.status === "loading" ? prev : { ...prev, status: "loading" },
    );
    runLocate();
  }, [runLocate]);

  // Only the auto-request lives here; a disabled hook keeps its initial
  // "fallback" state, and the caller re-enters through request().
  useEffect(() => {
    if (!enabled) return;
    runLocate();
  }, [enabled, runLocate]);

  return { ...state, request };
}
