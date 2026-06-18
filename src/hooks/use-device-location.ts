import * as Location from "expo-location";
import { useEffect, useState } from "react";

// Fallback when location is denied/unavailable (matches the POC seed city).
const DENVER = { lat: 39.7392, lon: -104.9903 };

export type LocationStatus = "loading" | "granted" | "denied" | "fallback";

export type DeviceLocation = {
  lat: number;
  lon: number;
  status: LocationStatus;
};

export function useDeviceLocation(enabled = true): DeviceLocation {
  const [state, setState] = useState<DeviceLocation>({
    ...DENVER,
    status: enabled ? "loading" : "fallback",
  });

  useEffect(() => {
    if (!enabled) {
      setState({ ...DENVER, status: "fallback" });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) setState({ ...DENVER, status: "denied" });
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
        if (!cancelled) {
          setState({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            status: "granted",
          });
        }
      } catch {
        if (!cancelled) setState({ ...DENVER, status: "fallback" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
