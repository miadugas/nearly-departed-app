// Distances arrive from Wikidata in kilometres; the user picks how they read.
export type DistanceUnit = "km" | "mi";

const MILES_PER_KM = 0.621371;

export function isDistanceUnit(value: unknown): value is DistanceUnit {
  return value === "km" || value === "mi";
}

export function kmToMiles(km: number): number {
  return km * MILES_PER_KM;
}

export function milesToKm(miles: number): number {
  return miles / MILES_PER_KM;
}

/** "0.9 km" / "0.6 mi" — one decimal, matching the app's existing precision. */
export function formatDistance(km: number, unit: DistanceUnit): string {
  if (!Number.isFinite(km)) return "—";
  const value = unit === "mi" ? kmToMiles(km) : km;
  return `${value.toFixed(1)} ${unit}`;
}

/** Radius choices offered per unit, in that unit's own round numbers. */
export const RADIUS_CHOICES: Record<DistanceUnit, number[]> = {
  km: [10, 25, 50, 150],
  mi: [5, 15, 30, 90],
};

/** Chip label: "25 km" / "15 mi". */
export function formatRadius(value: number, unit: DistanceUnit): string {
  return `${value} ${unit}`;
}

/** The query always runs in km, whatever the chip said. */
export function radiusToKm(value: number, unit: DistanceUnit): number {
  return unit === "mi" ? milesToKm(value) : value;
}
