import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  Marker,
} from "@maplibre/maplibre-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { useUnits } from "@/lib/units/context";
import { formatDistance } from "@/lib/units/format";
import type { CemeterySection } from "@/lib/wikidata";
import { YOU_BLUE } from "@/lib/colors";

// Free, no-key dark vector basemap. The bespoke "Apple-enough" Maputnik style
// (on OpenFreeMap / Protomaps tiles) is the deliberate polish deliverable.
const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";


type Props = {
  center: [number, number]; // [lat, lon] — current focus target (cemetery or you)
  zoom: number;
  userCenter: [number, number]; // [lat, lon] — always the device location
  sections: CemeterySection[];
  selected: string | null;
  onSelectCemetery?: (title: string) => void;
  // tapping bare map (not a pin) leaves walk-up mode
  onPressMap?: () => void;
  // camera bottom inset in points — the sheet covers the lower screen, so camera
  // targets center in the visible band above it instead of behind the sheet
  viewPadding?: number;
  // [west, south, east, north] — when set, the camera frames this box instead
  // of centering, so the nearest results are on screen with you
  bounds?: [number, number, number, number];
};

export function SoulsMap({
  center,
  zoom,
  userCenter,
  sections,
  selected,
  onSelectCemetery,
  onPressMap,
  viewPadding,
  bounds,
}: Props) {
  const { unit } = useUnits();
  const [lat, lon] = center;
  const cameraRef = useRef<any>(null);
  // Memoized camera target — a stable reference so the Camera only re-animates
  // when the focus point actually changes, not on every parent re-render.
  const padding = useMemo(
    () => ({ bottom: viewPadding ?? 0 }),
    [viewPadding],
  );
  const view = useMemo(
    () => ({ center: [lon, lat] as [number, number], zoom }),
    [lat, lon, zoom],
  );
  const framed = useMemo(
    () => (bounds ? ([...bounds] as [number, number, number, number]) : null),
    [bounds],
  );

  // pulsing "you" ring
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.2],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  const cems = sections.filter((s) => s.coord);
  const featureCollection = {
    type: "FeatureCollection" as const,
    features: cems.map((s) => ({
      type: "Feature" as const,
      id: s.title,
      geometry: {
        type: "Point" as const,
        coordinates: [s.coord![1], s.coord![0]],
      },
      properties: { title: s.title },
    })),
  };
  const selectedSection = cems.find((s) => s.title === selected);
  // A pin tap also bubbles to the map, which would select then immediately
  // deselect. The pin stamps this first; the map press ignores that window.
  const pinTapAt = useRef(0);


  return (
    <View style={{ flex: 1 }}>
      <MapLibreMap
        mapStyle={DARK_STYLE}
        style={{ flex: 1 }}
        onPress={() => {
          if (Date.now() - pinTapAt.current < 300) return;
          onPressMap?.();
        }}
      >
        {framed ? (
          <Camera
            ref={cameraRef}
            bounds={framed}
            padding={padding}
            duration={600}
            easing="ease"
          />
        ) : (
          <Camera
            ref={cameraRef}
            center={view.center as [number, number]}
            zoom={view.zoom}
            padding={padding}
            duration={600}
            easing="ease"
          />
        )}

        {/* you — blue, pulsing */}
        <Marker lngLat={[lon, lat]} anchor="center">
          <View
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: YOU_BLUE,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              }}
            />
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: YOU_BLUE,
                borderWidth: 3,
                borderColor: "#ffffff",
                boxShadow: "0 0 10px rgba(76,141,255,0.8)",
              }}
            />
          </View>
        </Marker>

        {/* tappable cemetery pins (layer-based taps are reliable) */}
        <GeoJSONSource
          id="cemeteries"
          data={featureCollection}
          onPress={(e: any) => {
            const features = e?.features ?? e?.nativeEvent?.features;
            const title = features?.[0]?.properties?.title as
              | string
              | undefined;
            if (title) {
              pinTapAt.current = Date.now();
              onSelectCemetery?.(title);
            }
          }}
        >
          <Layer
            id="cemetery-dots"
            type="circle"
            paint={{
              "circle-radius": 7,
              "circle-color": "#ffffff",
              "circle-stroke-color": "#050505",
              "circle-stroke-width": 2,
            }}
          />
          <Layer
            id="cemetery-selected"
            type="circle"
            filter={["==", ["get", "title"], selected ?? "__none__"]}
            paint={{
              "circle-radius": 11,
              "circle-color": "#ffffff",
              "circle-stroke-color": "#050505",
              "circle-stroke-width": 3,
            }}
          />
        </GeoJSONSource>

        {/* callout for the selected cemetery (display only) */}
        {selectedSection?.coord && (
          <Marker
            lngLat={[selectedSection.coord[1], selectedSection.coord[0]]}
            anchor="bottom"
          >
            <View
              style={{
                marginBottom: 18,
                maxWidth: 220,
                paddingVertical: 9,
                paddingHorizontal: 13,
                borderRadius: 13,
                backgroundColor: "rgba(10,10,10,0.94)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: "#ffffff",
                  fontFamily: "ClashDisplay-Semibold",
                  fontSize: 14,
                  letterSpacing: -0.2,
                }}
              >
                {selectedSection.title}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {selectedSection.data.length}{" "}
                {selectedSection.data.length === 1 ? "soul" : "souls"} ·{" "}
                {formatDistance(selectedSection.dist, unit)}
              </Text>
            </View>
          </Marker>
        )}
      </MapLibreMap>

    </View>
  );
}
