import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { searchPlaces } from "@/lib/geocode";

// vitest hoists vi.mock above the imports at transform time, so fetchWithTimeout
// is already the mock by the time the module under test loads.
vi.mock("@/lib/fetch-timeout", () => ({ fetchWithTimeout: vi.fn() }));

const mockResponse = (json: unknown, ok = true) =>
  ({ ok, status: 200, json: async () => json }) as Response;

describe("searchPlaces", () => {
  beforeEach(() => vi.mocked(fetchWithTimeout).mockReset());

  it("maps Photon features to places and builds a readable label", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      mockResponse({
        features: [
          {
            geometry: { coordinates: [-0.1276, 51.5072] },
            properties: {
              name: "Highgate Cemetery",
              city: "London",
              state: "England",
              country: "UK",
            },
          },
        ],
      }),
    );

    expect(await searchPlaces("highgate")).toEqual([
      {
        label: "Highgate Cemetery, London, England, UK",
        lat: 51.5072,
        lon: -0.1276,
      },
    ]);
  });

  it("drops the city when it duplicates the name", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      mockResponse({
        features: [
          {
            geometry: { coordinates: [2.3522, 48.8566] },
            properties: { name: "Paris", city: "Paris", country: "France" },
          },
        ],
      }),
    );

    expect((await searchPlaces("paris"))[0].label).toBe("Paris, France");
  });

  it("skips features with no coordinates", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      mockResponse({ features: [{ properties: { name: "Nowhere" } }] }),
    );

    expect(await searchPlaces("x")).toEqual([]);
  });

  it("throws when the response is not ok", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(mockResponse({}, false));

    await expect(searchPlaces("x")).rejects.toThrow(/Place search failed/);
  });
});
