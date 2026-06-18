import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  Marker,
} from "@maplibre/maplibre-react-native";
import Feather from "@expo/vector-icons/Feather";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

import type { CemeterySection } from "@/lib/wikidata";

// Free, no-key dark vector basemap. The bespoke "Apple-enough" Maputnik style
// (on OpenFreeMap / Protomaps tiles) is the deliberate polish deliverable.
const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const YOU_BLUE = "#4c8dff";

type Props = {
  center: [number, number]; // [lat, lon] — current focus target (cemetery or you)
  zoom: number;
  userCenter: [number, number]; // [lat, lon] — always the device location
  sections: CemeterySection[];
  selected: string | null;
  onSelectCemetery?: (title: string) => void;
  onRecenter?: () => void;
};

function MapButton({
  name,
  onPress,
}: {
  name: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ marginTop: 8 }}>
      <BlurView
        intensity={30}
        tint="dark"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.16)",
        }}
      >
        <Feather name={name} size={18} color="#fff" />
      </BlurView>
    </Pressable>
  );
}

export function SoulsMap({
  center,
  zoom,
  userCenter,
  sections,
  selected,
  onSelectCemetery,
  onRecenter,
}: Props) {
  const [lat, lon] = center;
  const cameraRef = useRef<any>(null);
  const [view, setView] = useState({ center: [lon, lat], zoom });

  // follow parent focus / recenter changes
  useEffect(() => {
    setView({ center: [lon, lat], zoom });
  }, [lat, lon, zoom]);

  // pulsing "you" ring
  const pulse = useRef(new Animated.Value(0)).current;
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

  const zoomBy = (delta: number) =>
    setView((v) => {
      const z = Math.min(18, Math.max(3, v.zoom + delta));
      cameraRef.current?.zoomTo?.(z, 300);
      return { ...v, zoom: z };
    });
  const recenter = () => {
    cameraRef.current?.flyTo?.([userCenter[1], userCenter[0]], 600);
    onRecenter?.();
  };

  return (
    <View style={{ flex: 1 }}>
      <MapLibreMap mapStyle={DARK_STYLE} style={{ flex: 1 }}>
        <Camera
          ref={cameraRef}
          center={view.center as [number, number]}
          zoom={view.zoom}
          duration={600}
          easing="ease"
        />

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
            if (title) onSelectCemetery?.(title);
          }}
        >
          <Layer
            id="cemetery-dots"
            type="circle"
            style={{
              circleRadius: 7,
              circleColor: "#ffffff",
              circleStrokeColor: "#050505",
              circleStrokeWidth: 2,
            }}
          />
          <Layer
            id="cemetery-selected"
            type="circle"
            filter={["==", ["get", "title"], selected ?? "__none__"]}
            style={{
              circleRadius: 11,
              circleColor: "#ffffff",
              circleStrokeColor: "#050505",
              circleStrokeWidth: 3,
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
                {selectedSection.dist.toFixed(1)} km
              </Text>
            </View>
          </Marker>
        )}
      </MapLibreMap>

      {/* floating controls */}
      <View style={{ position: "absolute", right: 12, bottom: 40 }}>
        <MapButton name="plus" onPress={() => zoomBy(1)} />
        <MapButton name="minus" onPress={() => zoomBy(-1)} />
        <MapButton name="navigation" onPress={recenter} />
      </View>
    </View>
  );
}
