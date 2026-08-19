import { describe, expect, it } from "vitest";

import {
  RADIUS_CHOICES,
  formatDistance,
  formatRadius,
  isDistanceUnit,
  kmToMiles,
  radiusToKm,
} from "./format";

describe("formatDistance", () => {
  it("keeps kilometres as given, to one decimal", () => {
    expect(formatDistance(0.94, "km")).toBe("0.9 km");
    expect(formatDistance(12, "km")).toBe("12.0 km");
  });

  it("converts to miles", () => {
    expect(formatDistance(1.60934, "mi")).toBe("1.0 mi");
    expect(formatDistance(10, "mi")).toBe("6.2 mi");
  });

  it("degrades to an em dash for non-finite input", () => {
    expect(formatDistance(Number.NaN, "km")).toBe("—");
    expect(formatDistance(Number.POSITIVE_INFINITY, "mi")).toBe("—");
  });
});

describe("radius handling", () => {
  it("offers round numbers in each unit", () => {
    expect(RADIUS_CHOICES.km).toEqual([10, 25, 50, 150]);
    expect(RADIUS_CHOICES.mi).toEqual([5, 15, 30, 90]);
  });

  it("labels chips in the active unit", () => {
    expect(formatRadius(25, "km")).toBe("25 km");
    expect(formatRadius(15, "mi")).toBe("15 mi");
  });

  it("always queries in kilometres", () => {
    expect(radiusToKm(25, "km")).toBe(25);
    expect(radiusToKm(10, "mi")).toBeCloseTo(16.09, 2);
  });
});

describe("isDistanceUnit", () => {
  it("accepts only the two known units", () => {
    expect(isDistanceUnit("km")).toBe(true);
    expect(isDistanceUnit("mi")).toBe(true);
    expect(isDistanceUnit("miles")).toBe(false);
    expect(isDistanceUnit(null)).toBe(false);
  });
});

describe("kmToMiles", () => {
  it("uses the standard conversion", () => {
    expect(kmToMiles(1)).toBeCloseTo(0.621371, 6);
  });
});
