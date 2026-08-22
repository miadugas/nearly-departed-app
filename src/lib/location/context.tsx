import { createContext, useContext, type ReactNode } from "react";

import {
  useDeviceLocation,
  type DeviceLocation,
} from "@/hooks/use-device-location";

// The tab bar renders on every screen and now owns the "use my location"
// affordance, so the device location can't live inside Discover any more.
const LocationContext = createContext<DeviceLocation | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  // Never auto-request at the app level: entry points decide. Discover asks on
  // mount when it was reached from "Use my location"; everywhere else the user
  // asks explicitly through the Location tab.
  const value = useDeviceLocation(false);
  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): DeviceLocation {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
