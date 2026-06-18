import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";
import { PlaceSearch } from "@/components/place-search";
import { SoulCard } from "@/components/soul-card";
import { SoulsMap } from "@/components/souls-map";
import { useDeviceLocation } from "@/hooks/use-device-location";
import { useNearbySouls } from "@/hooks/use-nearby-souls";
import type { Place } from "@/lib/geocode";
import { groupByCemetery } from "@/lib/wikidata";

const RADII = [10, 25, 50, 150];
const zoomFor = (r: number) =>
  r <= 10 ? 12 : r <= 25 ? 10.5 : r <= 50 ? 9.5 : 8;

export default function Discover() {
  const { locate } = useLocalSearchParams<{ locate?: string }>();
  const loc = useDeviceLocation(locate !== "0");
  const [radius, setRadius] = useState(25);

  // "search anywhere" — a picked place overrides the device location for the query
  const [place, setPlace] = useState<Place | null>(null);
  const activeLat = place?.lat ?? loc.lat;
  const activeLon = place?.lon ?? loc.lon;

  const {
    data: souls,
    isLoading,
    isError,
  } = useNearbySouls(activeLat, activeLon, radius);
  const sections = useMemo(() => groupByCemetery(souls ?? []), [souls]);
  const total = souls?.length ?? 0;
  const placeLabel = place
    ? `near ${place.label}`
    : loc.status === "granted"
      ? "near you"
      : "Denver (sample)";

  // walk-up mode: tap a cemetery pin to focus the list on just that resting place
  const [focused, setFocused] = useState<string | null>(null);
  const focusedSection = focused
    ? sections.find((s) => s.title === focused)
    : null;
  const visibleSections = focusedSection ? [focusedSection] : sections;

  const toggleCemetery = (title: string) =>
    setFocused((prev) => (prev === title ? null : title));

  const mapCenter: [number, number] = focusedSection?.coord
    ? focusedSection.coord
    : [activeLat, activeLon];
  const mapZoom = focusedSection ? 14 : zoomFor(radius);

  return (
    <View className="bg-bg flex-1">
      {/* map band */}
      <View style={{ flex: 4 }}>
        <SoulsMap
          center={mapCenter}
          zoom={mapZoom}
          userCenter={[loc.lat, loc.lon]}
          sections={sections}
          selected={focused}
          onSelectCemetery={toggleCemetery}
          onRecenter={() => setFocused(null)}
        />
        <LinearGradient
          colors={[
            "rgba(5,5,5,0.7)",
            "rgba(5,5,5,0)",
            "rgba(5,5,5,0)",
            "rgba(5,5,5,0.92)",
          ]}
          locations={[0, 0.22, 0.62, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <SafeAreaView
          edges={["top"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
          <View className="px-4 pt-1" pointerEvents="box-none">
            <BackButton />
          </View>
        </SafeAreaView>
      </View>

      {/* sheet */}
      <View
        className="bg-bg rounded-t-[28px] border-t border-line"
        style={{ flex: 5, marginTop: -24 }}
      >
        <View
          className="mb-1 mt-3 h-1 w-10 self-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
        />

        {focusedSection ? (
          <View className="px-5 pb-2 pt-1">
            <Pressable
              onPress={() => setFocused(null)}
              className="flex-row items-center gap-1.5 self-start active:opacity-70"
            >
              <Feather
                name="chevron-left"
                size={15}
                color="rgba(255,255,255,0.6)"
              />
              <Text
                className="text-ink-dim"
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 12,
                }}
              >
                All nearby
              </Text>
            </Pressable>
            <Text
              className="font-display text-ink mt-1.5"
              style={{ fontSize: 21, letterSpacing: -0.3 }}
              numberOfLines={1}
            >
              {focusedSection.title}
            </Text>
            <Text
              className="font-sans text-ink-dim mt-0.5"
              style={{ fontSize: 12 }}
            >
              {focusedSection.data.length}{" "}
              {focusedSection.data.length === 1 ? "soul" : "souls"} rest here ·{" "}
              {focusedSection.dist.toFixed(1)} km away
            </Text>
          </View>
        ) : (
          <View className="px-5 pb-2 pt-1">
            <PlaceSearch
              onPick={(p) => {
                setPlace(p);
                setFocused(null);
              }}
            />
            {place ? (
              <Pressable
                onPress={() => setPlace(null)}
                className="mt-2 flex-row items-center gap-1.5 self-start active:opacity-70"
              >
                <Feather name="x" size={13} color="rgba(255,255,255,0.6)" />
                <Text
                  className="text-ink-dim"
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 12,
                  }}
                >
                  Back to my location
                </Text>
              </Pressable>
            ) : null}
            <View className="mt-3 flex-row gap-2">
              {RADII.map((r) => {
                const active = r === radius;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRadius(r)}
                    className={`rounded-full border px-3.5 py-1.5 ${active ? "border-ink bg-ink" : "border-line"}`}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 12,
                        color: active ? "#0a0a0a" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      {r} km
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text
              className="font-sans text-ink-dim mt-3"
              style={{ fontSize: 13 }}
            >
              {loc.status === "loading"
                ? "Finding you…"
                : isLoading
                  ? "Consulting the records…"
                  : isError
                    ? "Query failed — pick a radius to retry."
                    : `${total} notable souls within ${radius} km · ${placeLabel}`}
            </Text>
          </View>
        )}

        {isLoading ? (
          <View className="flex-1 items-center pt-10">
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text
              className="font-sans text-ink-dim text-center"
              style={{ fontSize: 14 }}
            >
              Couldn&apos;t reach Wikidata. Check your connection and try
              another radius.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={visibleSections}
            keyExtractor={(item) => item.qid}
            renderItem={({ item }) => <SoulCard soul={item} />}
            renderSectionHeader={({ section }) =>
              focusedSection ? null : (
                <View className="bg-bg flex-row items-center justify-between border-b border-line px-5 py-2.5">
                  <Text
                    className="text-ink-dim"
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 11,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {section.title} · {section.dist.toFixed(1)} km
                  </Text>
                  <Text
                    className="text-ink-faint"
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 11,
                    }}
                  >
                    {section.data.length}
                  </Text>
                </View>
              )
            }
            stickySectionHeadersEnabled
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={
              <View className="items-center px-8 pt-16">
                <Text
                  className="font-sans text-ink-dim text-center"
                  style={{ fontSize: 14 }}
                >
                  No notable burials in this radius. Try widening it.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
