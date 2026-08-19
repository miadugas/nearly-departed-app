import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BackButton, IconButton } from "@/components/icon-button";
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

  // ── collapsible sheet ──────────────────────────────────────────────────────
  // The map fills the screen; the sheet is an overlay translated by `shift`
  // (0 = expanded, dragMax = collapsed with only the header peeking out).
  // Dragging the handle strip tracks the finger 1:1; release springs to the
  // nearest snap point, biased by fling velocity. The header (handle, search,
  // radius chips, status row) never leaves the screen.
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetH = Math.round((winH * 5) / 9) + 24;
  const [headerH, setHeaderH] = useState(220);
  const dragMax = Math.max(0, sheetH - headerH - insets.bottom - 8);

  const [collapsed, setCollapsed] = useState(false);
  const shift = useMemo(() => new Animated.Value(0), []);
  // mutable context for gesture callbacks — never read during render
  const drag = useMemo(() => ({ collapsed: false, max: 0 }), []);
  useEffect(() => {
    drag.max = dragMax;
    // header height changed while collapsed (e.g. walk-up header) — re-seat
    if (drag.collapsed) shift.setValue(dragMax);
  }, [drag, dragMax, shift]);

  const settle = useMemo(
    () => (next: boolean) => {
      drag.collapsed = next;
      Animated.spring(shift, {
        toValue: next ? drag.max : 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 4,
      }).start();
      setCollapsed(next);
    },
    [drag, shift],
  );

  const handlePan = useMemo(
    () =>
      PanResponder.create({
        // capture-phase: the pill is a Pressable (its own responder), so the
        // wrapper must seize the gesture once real vertical motion starts —
        // taps stay with the Pressable, drags come here.
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          const base = drag.collapsed ? drag.max : 0;
          const next = Math.min(drag.max, Math.max(0, base + g.dy));
          shift.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const base = drag.collapsed ? drag.max : 0;
          const pos = Math.min(drag.max, Math.max(0, base + g.dy));
          const next =
            g.vy > 0.3 ? true : g.vy < -0.3 ? false : pos > drag.max / 2;
          Animated.spring(shift, {
            toValue: next ? drag.max : 0,
            useNativeDriver: true,
            velocity: g.vy,
            speed: 16,
            bounciness: 4,
          }).start();
          drag.collapsed = next;
          setCollapsed(next);
        },
      }),
    [drag, shift],
  );

  const toggleCemetery = (title: string) => {
    setFocused((prev) => (prev === title ? null : title));
    settle(false); // walk-up implies reading the list — surface it
  };

  const mapCenter: [number, number] = focusedSection?.coord
    ? focusedSection.coord
    : [activeLat, activeLon];
  const mapZoom = focusedSection ? 14 : zoomFor(radius);

  return (
    <View className="bg-bg flex-1">
      {/* map — full-bleed behind the sheet so collapsing reveals more of it */}
      <View style={StyleSheet.absoluteFill}>
        <SoulsMap
          center={mapCenter}
          zoom={mapZoom}
          userCenter={[loc.lat, loc.lon]}
          sections={sections}
          selected={focused}
          onSelectCemetery={toggleCemetery}
          onRecenter={() => setFocused(null)}
          controlShift={shift}
          controlBottom={sheetH + 16}
          viewPadding={sheetH - 24}
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
          <View
            className="flex-row items-center justify-between px-4 pt-1"
            pointerEvents="box-none"
          >
            <BackButton />
            <IconButton
              icon={
                <MaterialCommunityIcons
                  name="skull-outline"
                  size={20}
                  color="#fff"
                />
              }
              onPress={() => router.push("/profile")}
              accessibilityLabel="Profile"
            />
          </View>
        </SafeAreaView>
      </View>

      {/* sheet — rides `shift`; header stays on-screen, list slides away */}
      <Animated.View
        className="bg-bg rounded-t-[28px] border-t border-line"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -insets.bottom,
          height: sheetH + insets.bottom,
          transform: [{ translateY: shift }],
        }}
      >
        <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
          {/* drag strip — full-width so the sheet is grabbable, not just the pill */}
          <View {...handlePan.panHandlers}>
            <Pressable
              onPress={() => settle(!collapsed)}
              accessibilityRole="button"
              accessibilityLabel={
                collapsed ? "Expand results list" : "Collapse results list"
              }
              // 44pt-floor grab strip: the pill is decoration, the whole row is the target
              style={{
                minHeight: 44,
                justifyContent: "center",
                marginBottom: -12,
              }}
            >
              <View
                className="h-1 w-10 self-center rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              />
            </Pressable>
          </View>

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
                {focusedSection.data.length === 1 ? "soul" : "souls"} rest here
                · {focusedSection.dist.toFixed(1)} km away
              </Text>
            </View>
          ) : (
            <View className="px-5 pb-2 pt-1">
              <PlaceSearch
                onPick={(p) => {
                  setPlace(p);
                  setFocused(null);
                }}
                // collapsed sheet + keyboard would bury the field — surface it
                onFocus={() => settle(false)}
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
                      accessibilityRole="button"
                      accessibilityLabel={`${r} kilometer radius`}
                      accessibilityState={{ selected: active }}
                      hitSlop={{ top: 8, bottom: 8 }}
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
              <View className="mt-1 flex-row items-center justify-between">
                <Text
                  className="font-sans text-ink-dim mt-2"
                  style={{ fontSize: 13, flex: 1 }}
                >
                  {loc.status === "loading"
                    ? "Finding you…"
                    : isLoading
                      ? "Consulting the records…"
                      : isError
                        ? "Query failed — pick a radius to retry."
                        : `${total} notable souls within ${radius} km · ${placeLabel}`}
                </Text>
                <Pressable
                  onPress={() => settle(!collapsed)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    collapsed ? "Expand results list" : "Collapse results list"
                  }
                  hitSlop={6}
                  // shared glass-button recipe (IconButton/MapButton): one style, 44pt-friendly
                  className="ml-3 items-center justify-center rounded-full active:opacity-70"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: "rgba(255,255,255,0.14)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.32)",
                  }}
                >
                  <Feather
                    name={collapsed ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#fff"
                  />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* list fades out on the way down so no half-row peeks below the header */}
        <Animated.View
          style={{
            flex: 1,
            opacity: shift.interpolate({
              inputRange: [0, Math.max(1, dragMax)],
              outputRange: [1, 0],
            }),
          }}
        >
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
              contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
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
        </Animated.View>
      </Animated.View>
    </View>
  );
}
