import { describe, expect, it } from "vitest";

import { haversineKm, VISIT_RADIUS_KM } from "@/lib/geo";

const PARIS: [number, number] = [48.8566, 2.3522];
const LONDON: [number, number] = [51.5072, -0.1276];

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm(PARIS, PARIS)).toBe(0);
  });

  it("matches the known Paris–London great-circle distance", () => {
    expect(haversineKm(PARIS, LONDON)).toBeCloseTo(343.5, 0);
  });

  it("is symmetric", () => {
    expect(haversineKm(PARIS, LONDON)).toBeCloseTo(
      haversineKm(LONDON, PARIS),
      10,
    );
  });

  it("reads a few hundred metres as inside the visit radius", () => {
    // ~0.33 km north of Paris centre — the same-cemetery case.
    const nearby: [number, number] = [48.8596, 2.3522];
    expect(haversineKm(PARIS, nearby)).toBeLessThan(VISIT_RADIUS_KM);
  });
});
