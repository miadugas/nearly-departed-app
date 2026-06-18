import { useQuery } from "@tanstack/react-query";

import { fetchNearbySouls } from "@/lib/wikidata";

export function useNearbySouls(lat: number, lon: number, radiusKm: number) {
  return useQuery({
    queryKey: ["nearby-souls", lat, lon, radiusKm],
    queryFn: () => fetchNearbySouls(lat, lon, radiusKm),
    staleTime: 1000 * 60 * 30, // 30 min — the dead don't move
  });
}
