import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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

import { DiscoveryControls } from "@/components/discovery-controls";
import { PlaceSearch } from "@/components/place-search";
import { SoulCard } from "@/components/soul-card";
import { SoulsMap } from "@/components/souls-map";
import { LoadingScreen } from "@/components/loading-screen";
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
import {
  type CemeterySection,
  type Soul,
  type SoulMode,
  groupByCemetery,
} from "@/lib/wikidata";

const zoomFor = (r: number) =>
  r <= 10 ? 12 : r <= 25 ? 10.5 : r <= 50 ? 9.5 : 8;

// Delayed + min-hold flag: a spinner that flashes for a 200ms fetch reads
// as a glitch, and one that pops in for 50ms reads as a flicker. Show only
// after `delay`, and once shown keep it at least `minVisible`.
function useSettledFlag(active: boolean, delay = 120, minVisible = 500) {
  const [shown, setShown] = useState(false);
  // When the spinner actually went up. The hide path needs it to size the
  // remaining hold, and a ref keeps `shown` out of the effect's deps — taking
  // it there would restart the effect on the flip and cancel its own timer.
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => {
        shownAt.current = Date.now();
        setShown(true);
      }, delay);
      return () => clearTimeout(t);
    }
    // Settled before the delay elapsed — nothing was ever drawn, nothing to hold.
    if (shownAt.current === null) {
      setShown(false);
      return;
    }
    const remaining = Math.max(0, minVisible - (Date.now() - shownAt.current));
    const t = setTimeout(() => {
      shownAt.current = null;
      setShown(false);
    }, remaining);
    return () => clearTimeout(t);
  }, [active, delay, minVisible]);

  return shown;
}

export default function Discover() {
  const { unit } = useUnits();
  const { locate } = useLocalSearchParams<{ locate?: string }>();
  const loc = useLocation();
  const { status: locStatus, request: requestLocation } = loc;

  // Both entry points that land here on purpose — onboarding's "Use my
  // location" and finishing sign-in — ask straight away. A frame of delay lets
  // the Apple sheet finish dismissing before the system alert goes up.
  const autoAsked = useRef(false);
  useEffect(() => {
    // "fallback" is the untouched state the provider starts in — anything else
    // means we already asked. Latch inside the timer, not before it: a
    // double-invoked effect clears the pending timeout, and latching early
    // would make the second run skip and the prompt never fire.
    if (locate === "0" || autoAsked.current || locStatus !== "fallback") return;
    const t = setTimeout(() => {
      autoAsked.current = true;
      requestLocation();
    }, 350);
    return () => clearTimeout(t);
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

  // buried vs died — session state, not persisted (see plan decision 1)
  const [mode, setMode] = useState<SoulMode>("buried");

  const { data, isLoading, isError, isPlaceholderData } = useNearbySouls(
    activeLat,
    activeLon,
    radiusKm,
    mode,
  );
  const souls = data?.souls;
  // keepPreviousData hands back the *previous* list under a new lat/lon/radius
  // key, so this is exactly "you're looking at results for the old query".
  const refreshing = isPlaceholderData;
  const showRefreshing = useSettledFlag(refreshing);
  const sections = useMemo(() => groupByCemetery(souls ?? []), [souls]);

  // Cover the cold-start / post-sign-in wait so the seed city never flashes as
  // if it were real results. keepPreviousData means `isLoading` is only true
  // before anything has ever loaded, so this can't come back on a radius
  // change — no latch needed.
  // Floor the loader at 1s. On a warm connection the location + query gap is
  // 200-400ms, and a panel that appears and vanishes inside half a second
  // reads as a glitch. 1s is the "uninterrupted flow of thought" threshold —
  // long enough to register as a deliberate beat, short enough not to stall.
  const [minHeld, setMinHeld] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinHeld(true), 1000);
    return () => clearTimeout(t);
  }, []);
  const showLoader =
    locate !== "0" &&
    (!minHeld || locStatus === "loading" || (isLoading && !souls));
  const total = souls?.length ?? 0;
  // the picked place now lives in the search field itself — the status row
  // only names a location when there isn't one visibly selected above it
  const placeLabel = place
    ? null
    : loc.status === "granted"
      ? "near you"
      : "Denver (sample)";

  // walk-up mode: tap a pin to focus the list on just that place
  const [focused, setFocused] = useState<string | null>(null);
  const focusedSection = focused
    ? sections.find((s) => s.title === focused)
    : null;
  // memoised so the scroll-to-top effect below doesn't re-run every render
  const visibleSections = useMemo(
    () => (focusedSection ? [focusedSection] : sections),
    [focusedSection, sections],
  );

  // Swapping stale results for fresh ones at the user's old scroll offset reads
  // as the list "jumping". Once a genuinely new query settles, go back to the
  // top so the first row of the new answer is the first thing they see.
  const listRef = useRef<SectionList<Soul, CemeterySection>>(null);
  const settledKey = `${activeLat},${activeLon},${radiusKm},${mode}`;
  // Seeded with the first key so the initial load doesn't scroll a list that
  // is already at the top.
  const lastSettledKey = useRef(settledKey);
  useEffect(() => {
    if (isPlaceholderData || !souls) return;
    if (lastSettledKey.current === settledKey) return;
    lastSettledKey.current = settledKey;
    if (visibleSections.length === 0 || visibleSections[0].data.length === 0)
      return;
    try {
      listRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: false,
        viewOffset: 0,
      });
    } catch {
      // scrollToLocation throws if the list unmounted mid-frame — nothing to do
    }
  }, [isPlaceholderData, souls, settledKey, visibleSections]);

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
  const mapBounds = useMemo(():
    [number, number, number, number] | undefined => {
    if (focusedSection) return undefined;

    const cosLat = Math.max(0.2, Math.cos((activeLat * Math.PI) / 180));
    const radiusBox = (): [number, number, number, number] => {
      const latDelta = radiusKm / 111;
      const lonDelta = radiusKm / (111 * cosLat);
      return [
        activeLon - lonDelta,
        activeLat - latDelta,
        activeLon + lonDelta,
        activeLat + latDelta,
      ];
    };

    return radiusBox();
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
                accessibilityLabel="Back to all nearby places"
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
                {focusedSection.data.length === 1 ? "soul" : "souls"}{" "}
                {mode === "died" ? "died here" : "rest here"}·{" "}
                {formatDistance(focusedSection.dist, unit)} away
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
                selected={place}
                onClear={() => {
                  setPlace(null);
                  setFocused(null);
                }}
              />
              <View className="mt-3">
                <DiscoveryControls
                  mode={mode}
                  onModeChange={setMode}
                  radiusSlot={radiusSlot}
                  onRadiusChange={setRadiusSlot}
                  radii={RADII}
                  unit={unit}
                />
              </View>
              {mode === "died" ? (
                <Pressable
                  onPress={() => router.push("/died-here")}
                  accessibilityRole="button"
                  accessibilityLabel="How Died here works"
                  className="flex-row items-center active:opacity-70"
                  style={{ minHeight: 44, marginTop: 4 }}
                >
                  <Text
                    className="font-sans text-ink-dim"
                    style={{ fontSize: 12, flex: 1 }}
                  >
                    Only recorded death spots are shown ·{" "}
                    <Text className="text-ink font-sans-semibold">
                      How this works
                    </Text>
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color="rgba(255,255,255,0.45)"
                  />
                </Pressable>
              ) : null}
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
                  ) : showRefreshing ? (
                    // stale results are still on screen for a new key — say so
                    // rather than letting the old count read as the answer
                    "Consulting the records…"
                  ) : (
                    // the count and where you are carry the meaning; the
                    // connective words stay dim so they don't compete
                    <>
                      <Text className="font-sans-semibold text-ink">
                        {total}
                      </Text>
                      {` notable souls within ${formatRadius(radius, unit)}`}
                      {placeLabel ? (
                        <>
                          {" · "}
                          <Text className="font-sans-semibold text-ink">
                            {placeLabel}
                          </Text>
                        </>
                      ) : null}
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
            <View style={{ flex: 1 }}>
              {/* dim + lock the stale list while the new one loads, so nobody
                  taps a row that's about to be replaced */}
              <View
                style={{ flex: 1, opacity: showRefreshing ? 0.3 : 1 }}
                pointerEvents={showRefreshing ? "none" : "auto"}
              >
                <SectionList
                  ref={listRef}
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
                  // Rows are variable height (1-2 desc lines, 0-2 chip rows) and
                  // ~150 of them virtualize across many small sticky sections.
                  // Scrolling back up re-measures recycled rows and shifts the
                  // viewport under the finger; anchoring to the first visible
                  // item absorbs that, and the wider window renders enough
                  // ahead/behind that fewer rows get re-measured at all. No
                  // getItemLayout — the heights genuinely vary.
                  maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                  windowSize={21}
                  initialNumToRender={12}
                  maxToRenderPerBatch={12}
                  contentContainerStyle={{ paddingBottom: 32 }}
                  ListEmptyComponent={
                    <View className="items-center px-8 pt-16">
                      <Text
                        className="font-sans text-ink-dim text-center"
                        style={{ fontSize: 14 }}
                      >
                        {mode === "died"
                          ? "No recorded death spots in this radius. Try widening it."
                          : "No notable burials in this radius. Try widening it."}
                      </Text>
                    </View>
                  }
                />
              </View>
              {showRefreshing ? (
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    { alignItems: "center", paddingTop: 40 },
                  ]}
                  accessibilityLiveRegion="polite"
                >
                  <ActivityIndicator color="#ffffff" />
                  <Text
                    className="font-sans text-ink-dim mt-3"
                    style={{ fontSize: 13 }}
                  >
                    Consulting the records…
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>
      </Animated.View>

      <TabBar />
      <LoadingScreen
        visible={showLoader}
        message={
          locStatus === "loading"
            ? "Finding you\u2026"
            : "Finding the departed\u2026"
        }
      />
    </View>
  );
}
