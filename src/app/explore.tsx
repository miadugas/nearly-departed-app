import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  type GestureResponderEvent,
  Keyboard,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlaceSearch } from "@/components/place-search";
import { SoulCard } from "@/components/soul-card";
import { SoulsMap } from "@/components/souls-map";
import { TAB_BAR_HEIGHT, TabBar } from "@/components/tab-bar";
import { useLocation } from "@/lib/location/context";
import { onTabReselect } from "@/lib/tab-signal";
import { useNearbySouls } from "@/hooks/use-nearby-souls";
import type { Place } from "@/lib/geocode";
import { useUnits } from "@/lib/units/context";
import {
  RADIUS_CHOICES,
  formatDistance,
  formatRadius,
  radiusToKm,
} from "@/lib/units/format";
import { groupByCemetery } from "@/lib/wikidata";

const zoomFor = (r: number) =>
  r <= 10 ? 12 : r <= 25 ? 10.5 : r <= 50 ? 9.5 : 8;

export default function Discover() {
  const { unit } = useUnits();
  const { locate } = useLocalSearchParams<{ locate?: string }>();
  const loc = useLocation();
  const { status: locStatus, request: requestLocation } = loc;

  // Reached from onboarding's "Use my location", so ask straight away. Any
  // other entry point (sign-in) leaves it to the Location tab.
  const autoAsked = useRef(false);
  useEffect(() => {
    if (locate === "0" || autoAsked.current || locStatus === "granted") return;
    autoAsked.current = true;
    requestLocation();
  }, [locate, locStatus, requestLocation]);
  // The chosen radius is a slot, not a number, so switching units keeps the
  // same rung of the ladder (25 km ↔ 15 mi) without any state juggling.
  const RADII = RADIUS_CHOICES[unit];
  const [radiusSlot, setRadiusSlot] = useState(1);
  const radius = RADII[radiusSlot] ?? RADII[1];
  const radiusKm = radiusToKm(radius, unit);

  // "search anywhere" — a picked place overrides the device location for the query
  const [place, setPlace] = useState<Place | null>(null);
  const activeLat = place?.lat ?? loc.lat;
  const activeLon = place?.lon ?? loc.lon;

  const {
    data: souls,
    isLoading,
    isError,
  } = useNearbySouls(activeLat, activeLon, radiusKm);
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
  const dragMax = Math.max(0, sheetH - headerH - 8);

  const [collapsed, setCollapsed] = useState(false);
  const shift = useMemo(() => new Animated.Value(0), []);
  // mutable context for gesture callbacks — never read during render
  const dragRef = useRef({
    collapsed: false,
    max: 0,
    startY: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
  });
  useEffect(() => {
    dragRef.current.max = dragMax;
    // header height changed while collapsed (e.g. walk-up header) — re-seat
    if (dragRef.current.collapsed) shift.setValue(dragMax);
  }, [dragMax, shift]);

  const settle = useCallback(
    (next: boolean) => {
      // collapsing means typing is over; expanding may BE the focus path —
      // dismissing there would kill the keyboard the moment search opens it
      if (next) Keyboard.dismiss();
      const drag = dragRef.current;
      drag.collapsed = next;
      Animated.spring(shift, {
        toValue: next ? drag.max : 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 4,
      }).start();
      setCollapsed(next);
    },
    [shift],
  );

  // Raw responder props rather than PanResponder.create(): the latter is called
  // during render and closes over the gesture ref, which the React Compiler
  // rejects ("cannot access refs during render"). These callbacks only ever run
  // at event time, so the ref reads are safe and the lint rule is satisfied.
  const onTouchStart = useCallback((e: GestureResponderEvent) => {
    const drag = dragRef.current;
    drag.startY = e.nativeEvent.pageY;
    drag.lastY = drag.startY;
    drag.lastT = e.nativeEvent.timestamp;
    drag.velocity = 0;
    drag.moved = false;
  }, []);

  const onTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const drag = dragRef.current;
      const { pageY, timestamp } = e.nativeEvent;
      const dy = pageY - drag.startY;
      if (!drag.moved && Math.abs(dy) <= 6) return;
      drag.moved = true;
      Keyboard.dismiss();
      const dt = timestamp - drag.lastT;
      if (dt > 0) drag.velocity = (pageY - drag.lastY) / dt;
      drag.lastY = pageY;
      drag.lastT = timestamp;
      const base = drag.collapsed ? drag.max : 0;
      shift.setValue(Math.min(drag.max, Math.max(0, base + dy)));
    },
    [shift],
  );

  const onTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      const drag = dragRef.current;
      if (!drag.moved) {
        settle(!drag.collapsed); // a tap, not a drag
        return;
      }
      const dy = e.nativeEvent.pageY - drag.startY;
      const base = drag.collapsed ? drag.max : 0;
      const pos = Math.min(drag.max, Math.max(0, base + dy));
      const next =
        drag.velocity > 0.3
          ? true
          : drag.velocity < -0.3
            ? false
            : pos > drag.max / 2;
      drag.collapsed = next;
      Animated.spring(shift, {
        toValue: next ? drag.max : 0,
        useNativeDriver: true,
        velocity: drag.velocity,
        speed: 16,
        bounciness: 4,
      }).start();
      setCollapsed(next);
    },
    [settle, shift],
  );

  // recenter is declarative: bumping the nonce nudges the camera center by
  // ~1cm, so the Camera props change and it flies home even after a manual pan
  const [homeNonce, setHomeNonce] = useState(0);
  const recenter = useCallback(() => {
    Keyboard.dismiss();
    setPlace(null);
    setFocused(null);
    setHomeNonce((n) => n + 1);
  }, []);
  // tapping Location while already here flies the map home
  useEffect(() => onTabReselect("/explore", recenter), [recenter]);

  const toggleCemetery = (title: string) => {
    setFocused((prev) => (prev === title ? null : title));
    settle(false); // walk-up implies reading the list — surface it
  };

  const mapCenter: [number, number] = focusedSection?.coord
    ? focusedSection.coord
    : [activeLat + homeNonce * 1e-7, activeLon];
  const mapZoom = focusedSection ? 14 : zoomFor(radiusKm);

  // Frame the search radius around you, so the map always shows the area the
  // list is describing — 5 mi reads tight, 90 mi reads wide. Everything in the
  // list is inside this box by definition, nearest included. Walk-up mode opts
  // out: there the camera belongs on the chosen cemetery.
  const mapBounds = useMemo((): [number, number, number, number] | undefined => {
    if (focusedSection) return undefined;
    const latDelta = radiusKm / 111;
    const lonDelta =
      radiusKm / (111 * Math.max(0.2, Math.cos((activeLat * Math.PI) / 180)));
    return [
      activeLon - lonDelta,
      activeLat - latDelta,
      activeLon + lonDelta,
      activeLat + latDelta,
    ];
  }, [focusedSection, radiusKm, activeLat, activeLon]);

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
          onPressMap={() => setFocused(null)}
          viewPadding={
            (collapsed ? headerH : sheetH - 24) + TAB_BAR_HEIGHT + insets.bottom
          }
          bounds={mapBounds}
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
      </View>

      {/* sheet — rides `shift`; header stays on-screen, list slides away */}
      <Animated.View
        className="bg-bg rounded-t-[28px] border-t border-line"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: TAB_BAR_HEIGHT + insets.bottom,
          height: sheetH,
          transform: [{ translateY: shift }],
        }}
      >
        <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
          {/* drag strip — full-width so the sheet is grabbable, not just the pill */}
          <View
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={onTouchStart}
            onResponderMove={onTouchMove}
            onResponderRelease={onTouchEnd}
            onResponderTerminate={onTouchEnd}
          >
            <View
              accessible
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
            </View>
          </View>

          {focusedSection ? (
            <View className="px-5 pb-2 pt-1">
              <Pressable
                onPress={() => setFocused(null)}
                accessibilityRole="button"
                accessibilityLabel="Back to all nearby cemeteries"
                // the only way out of walk-up mode, and the label is only 18pt
                // tall — grow the target with slop so the layout doesn't shift
                hitSlop={{ top: 14, bottom: 14, left: 22, right: 26 }}
                className="flex-row items-center gap-1.5 self-start active:opacity-70"
              >
                <Feather name="chevron-left" size={15} color="#ffffff" />
                <Text
                  className="text-ink"
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
                · {formatDistance(focusedSection.dist, unit)} away
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
              <View className="mt-3 flex-row items-center gap-2">
                {RADII.map((r, slot) => {
                  const active = slot === radiusSlot;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => {
                        Keyboard.dismiss();
                        setRadiusSlot(slot);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${r} ${unit === "mi" ? "mile" : "kilometer"} radius`}
                      accessibilityState={{ selected: active }}
                      hitSlop={{ top: 8, bottom: 8 }}
                      className="items-center justify-center rounded-full"
                      style={{
                        flex: 1,
                        height: 34,
                        borderWidth: 1,
                        borderColor: active ? "#ffffff" : "rgba(255,255,255,0.40)",
                        backgroundColor: active
                          ? "#ffffff"
                          : "rgba(255,255,255,0.14)",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_600SemiBold",
                          fontSize: 12,
                          color: active ? "#0a0a0a" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {formatRadius(r, unit)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text
                  className="font-sans text-ink-dim"
                  style={{ fontSize: 13, flex: 1 }}
                >
                  {loc.status === "loading" ? (
                    "Finding you…"
                  ) : isLoading ? (
                    "Consulting the records…"
                  ) : isError ? (
                    "Query failed — pick a radius to retry."
                  ) : (
                    // the count and where you are carry the meaning; the
                    // connective words stay dim so they don't compete
                    <>
                      <Text className="font-sans-semibold text-ink">
                        {total}
                      </Text>
                      {` notable souls within ${formatRadius(radius, unit)} · `}
                      <Text className="font-sans-semibold text-ink">
                        {placeLabel}
                      </Text>
                    </>
                  )}
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
                    borderColor: "rgba(255,255,255,0.40)",
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
                    {/* long names truncate; the distance and count never do */}
                    <View
                      className="mr-5 flex-1 flex-row items-center"
                      style={{ minWidth: 0 }}
                    >
                      <Text
                        className="text-ink"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                          flexShrink: 1,
                          // hard cap so a long name always leaves room for the
                          // distance and count instead of crowding them
                          maxWidth: "68%",
                          fontFamily: "PlusJakartaSans_600SemiBold",
                          fontSize: 11,
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                        }}
                      >
                        {section.title}
                      </Text>
                      <Text
                        className="text-ink"
                        numberOfLines={1}
                        style={{
                          flexShrink: 0,
                          fontFamily: "PlusJakartaSans_600SemiBold",
                          fontSize: 11,
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                        }}
                      >
                        {" · "}
                        {formatDistance(section.dist, unit)}
                      </Text>
                    </View>
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
        </Animated.View>
      </Animated.View>

      <TabBar />
    </View>
  );
}
