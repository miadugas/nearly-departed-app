import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchNearbySouls, type SoulMode } from "@/lib/wikidata";

// mode defaults to "buried" so callers not yet passing it (explore.tsx, until
// step 2) stay green on typecheck; step 2 passes it explicitly.
export function useNearbySouls(
  lat: number,
  lon: number,
  radiusKm: number,
  mode: SoulMode = "buried",
) {
  return useQuery({
    queryKey: ["nearby-souls", mode, lat, lon, radiusKm],
    queryFn: () => fetchNearbySouls(lat, lon, radiusKm, mode),
    staleTime: 1000 * 60 * 30, // 30 min — the dead don't move
    // Hold the last list while a new radius/place loads: no empty flicker
    // between queries, and `isLoading` then means "nothing has ever loaded".
    placeholderData: keepPreviousData,
  });
}
