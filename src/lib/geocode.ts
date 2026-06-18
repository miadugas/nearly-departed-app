// Free, no-key place search via Photon (OpenStreetMap). Turns a typed place
// name into coordinates so "search anywhere" can reuse the nearby-souls query.

export type Place = { label: string; lat: number; lon: number };

export async function searchPlaces(query: string): Promise<Place[]> {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
  );
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const json = await res.json();

  return (json.features ?? [])
    .map((f: any): Place | null => {
      const coords = f?.geometry?.coordinates;
      if (!Array.isArray(coords)) return null;
      const [lon, lat] = coords;
      const p = f.properties ?? {};
      const parts = [
        p.name,
        p.city && p.city !== p.name ? p.city : null,
        p.state,
        p.country,
      ].filter(Boolean);
      return { label: parts.join(", ") || p.name || "Unknown place", lat, lon };
    })
    .filter((p: Place | null): p is Place => p !== null);
}
