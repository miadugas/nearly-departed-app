import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BackButton, IconButton } from "@/components/icon-button";
import { HeadstoneIcon } from "@/components/icons-drawn";
import { ACCENT } from "@/lib/colors";
import { useFavorites } from "@/lib/favorites/context";
import { haversineKm, VISIT_RADIUS_KM } from "@/lib/geo";
import { useLocation } from "@/lib/location/context";
import { useUnits } from "@/lib/units/context";
import { formatDistance } from "@/lib/units/format";
import { heroUrl, lifeYears, type Soul } from "@/lib/wikidata";
import { fetchSummary } from "@/lib/wikipedia";

// The page's secondary button recipe (same footprint as the primary CTA, glass
// fill + 1px outline), matching the sign-in screen. Blur is invisible on this
// background, so the fill is a literal alpha wash.
const SECONDARY_SURFACE = {
  backgroundColor: "rgba(255,255,255,0.12)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.30)",
} as const;

function Stat({
  label,
  value,
  sub,
  noRight,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  noRight?: boolean;
  small?: boolean;
}) {
  return (
    <View
      style={{ width: "50%" }}
      className={`border-line p-4 ${noRight ? "" : "border-r"}`}
    >
      <Text
        className="text-ink-faint"
        style={{ fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <Text
        className="font-display text-ink"
        style={{
          fontSize: small ? 15 : 22,
          letterSpacing: -0.2,
          marginTop: 6,
          lineHeight: small ? 19 : 24,
        }}
      >
        {value}
      </Text>
      {sub ? (
        <Text
          className="font-sans text-ink-dim"
          style={{ fontSize: 12, marginTop: 3 }}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

export default function PersonDetail() {
  const { unit } = useUnits();
  const { data } = useLocalSearchParams<{ data: string }>();
  // Param data crosses process/serialization boundaries (deep links, restored
  // navigation state, remote-synced favorites) — a malformed payload must fall
  // back to the empty screen, not throw during render (fatal in Release).
  let soul: Soul | null = null;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.qid === "string") {
        soul = { ...parsed, occs: Array.isArray(parsed.occs) ? parsed.occs : [] };
      }
    } catch {
      soul = null;
    }
  }
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const { isFavorite, toggle, isVisited, markVisited } = useFavorites();
  const loc = useLocation();
  const saved = soul ? isFavorite(soul.qid) : false;
  const visited = soul ? isVisited(soul.qid) : false;
  // Proximity is measured from the *device*, never from `soul.dist` — that one
  // is relative to whatever place was searched, so it would happily let you log
  // a visit to a grave you're reading about from another city.
  const kmFromDevice =
    soul?.coord && loc.status === "granted"
      ? haversineKm([loc.lat, loc.lon], soul.coord)
      : null;

  const summary = useQuery({
    queryKey: ["summary", soul?.qid ?? "none"],
    queryFn: () => fetchSummary(soul!.article as string),
    enabled: !!soul?.article,
    staleTime: Infinity,
  });

  if (!soul) return <View className="bg-bg flex-1" />;

  const initial = (soul.label || "?").trim().charAt(0).toUpperCase();
  const heroUri = soul.image
    ? heroUrl(soul.image)
    : (summary.data?.thumbnail ?? null);
  const epithet = soul.occs.slice(0, 3).join(" · ") || soul.desc;
  const bio =
    summary.data?.extract ||
    (summary.isLoading ? "Reading the record…" : soul.desc);
  // Favorites don't store distance (it's location-dependent), so guard it.
  const hasDist = Number.isFinite(soul.dist);

  const openDirections = () => {
    if (!soul.coord) return;
    const [lat, lon] = soul.coord;
    Linking.openURL(
      `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(soul.place)}`,
    );
  };

  // Four mutually exclusive states, resolved top-down so the earliest true one
  // wins. Returns null when there's nothing honest to offer.
  const renderVisitAction = () => {
    // Already logged. A visit is a fact, not a toggle — nothing to undo here,
    // so this is a badge that happens to share the button's footprint.
    if (visited) {
      return (
        <View
          className="mb-3 flex-row items-center justify-center rounded-full py-[18px]"
          style={SECONDARY_SURFACE}
          accessibilityRole="text"
          accessibilityLabel="Visited"
        >
          <HeadstoneIcon size={18} color="#fff" />
          <Text
            className="text-ink font-sans-semibold ml-2"
            style={{ fontSize: 16 }}
          >
            Visited
          </Text>
        </View>
      );
    }

    // No coordinate means proximity can never be verified — offering the
    // control at all would be a promise the app can't keep.
    if (!soul.coord) return null;

    if (loc.status !== "granted") {
      return (
        <Pressable
          onPress={loc.request}
          className="mb-3 flex-row items-center justify-center rounded-full py-[18px] active:opacity-85"
          style={SECONDARY_SURFACE}
          accessibilityRole="button"
          accessibilityLabel="Turn on location to log a visit"
        >
          <Feather name="map-pin" size={17} color="#fff" />
          <Text
            className="text-ink font-sans-semibold ml-2"
            style={{ fontSize: 16 }}
          >
            Turn on location to log a visit
          </Text>
        </Pressable>
      );
    }

    // Unreachable given the two guards above; keeps the distance non-null.
    if (kmFromDevice === null) return null;

    if (kmFromDevice <= VISIT_RADIUS_KM) {
      return (
        <Pressable
          onPress={() => markVisited(soul)}
          className="mb-3 flex-row items-center justify-center rounded-full py-[18px] active:opacity-85"
          style={SECONDARY_SURFACE}
          accessibilityRole="button"
          accessibilityLabel="Mark visited"
        >
          <Feather name="check" size={17} color="#fff" />
          <Text
            className="text-ink font-sans-semibold ml-2"
            style={{ fontSize: 16 }}
          >
            Mark visited
          </Text>
        </Pressable>
      );
    }

    const away = formatDistance(kmFromDevice, unit);
    return (
      <Pressable
        disabled
        className="mb-3 flex-row items-center justify-center rounded-full py-[18px]"
        style={[SECONDARY_SURFACE, { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={`Too far to log a visit, ${away} away`}
      >
        <Feather name="map-pin" size={17} color="#fff" />
        <Text
          className="text-ink font-sans-semibold ml-2"
          style={{ fontSize: 16 }}
        >
          Visit to log · {away} away
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="bg-bg flex-1">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* hero */}
        <View style={{ height: 440 }}>
          {heroUri ? (
            <Image
              source={{ uri: heroUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="top"
            />
          ) : (
            <View className="bg-panel absolute inset-0 items-center justify-center">
              <Text
                className="font-display text-ink"
                style={{ fontSize: 140, opacity: 0.12 }}
              >
                {initial}
              </Text>
            </View>
          )}
          <LinearGradient
            colors={[
              "rgba(5,5,5,0.55)",
              "rgba(5,5,5,0)",
              "rgba(5,5,5,0)",
              "rgba(5,5,5,0.55)",
              "#050505",
            ]}
            locations={[0, 0.26, 0.5, 0.78, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* title block */}
          <View className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <View
                className="h-1.5 w-1.5 rounded-full bg-ink"
                style={{ boxShadow: "0 0 6px rgba(255,255,255,0.7)" }}
              />
              <Text
                className="text-ink-dim"
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                }}
              >
                {hasDist ? `${formatDistance(soul.dist, unit)} from you` : soul.place}
              </Text>
            </View>
            <Text
              className="font-display text-ink"
              style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.2 }}
            >
              {soul.label}
            </Text>
            {epithet ? (
              <Text
                className="font-sans-medium text-ink-dim"
                style={{ fontSize: 14, marginTop: 8 }}
                numberOfLines={1}
              >
                {epithet}
              </Text>
            ) : null}
          </View>
        </View>

        {/* body */}
        <View className="px-6 pt-6">
          {/* stat grid */}
          <View className="overflow-hidden rounded-3xl border border-line">
            <View className="flex-row border-b border-line">
              <Stat label="Born" value={lifeYears(soul).born || "?"} />
              <Stat label="Died" value={lifeYears(soul).died || "?"} noRight />
            </View>
            <View className="flex-row">
              <Stat label="Resting at" value={soul.place} small />
              <Stat
                label="Distance"
                value={hasDist ? formatDistance(soul.dist, unit) : "—"}
                noRight
              />
            </View>
          </View>

          {/* the life */}
          <Text
            className="font-display text-ink"
            style={{ fontSize: 19, marginTop: 30, marginBottom: 12 }}
          >
            The life
          </Text>
          <Text
            className="font-sans text-ink"
            style={{ fontSize: 15, lineHeight: 24, opacity: 0.78 }}
            numberOfLines={expanded ? undefined : 5}
          >
            {bio || "No further record found."}
          </Text>
          {bio && bio.length > 240 ? (
            <Pressable
              onPress={() => setExpanded((e) => !e)}
              className="mt-3 active:opacity-70"
            >
              <Text
                className="font-sans-semibold text-ink"
                style={{ fontSize: 13 }}
              >
                {expanded ? "Read less" : "Read more"}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() =>
              Linking.openURL(
                soul.article ?? `https://www.wikidata.org/wiki/${soul.qid}`,
              )
            }
            className="mt-5 active:opacity-70"
          >
            <Text
              className="font-sans-semibold text-ink-dim"
              style={{ fontSize: 12 }}
            >
              {soul.article
                ? "Full Wikipedia article ›"
                : "View Wikidata record ›"}
            </Text>
          </Pressable>

          {/* tags */}
          {soul.occs.length > 0 && (
            <View className="mt-6 flex-row flex-wrap gap-2">
              {soul.occs.slice(0, 6).map((o) => (
                <View
                  key={o}
                  className="bg-glass rounded-full border border-line px-3.5 py-2"
                >
                  <Text
                    className="font-sans-medium text-ink-dim"
                    style={{ fontSize: 11 }}
                  >
                    {o}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* floating nav */}
      <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0">
        <View className="flex-row items-center justify-between px-4 pt-1">
          <BackButton />
          <IconButton
            icon={
              <FontAwesome
                // outline = kept, filled = been there — same rule as the Saved list
                name={visited ? "heart" : "heart-o"}
                size={17}
                color={saved ? ACCENT : "#fff"}
              />
            }
            onPress={() => toggle(soul)}
            accessibilityLabel={
              saved
                ? visited
                  ? "Remove from saved · visited"
                  : "Remove from saved"
                : "Save"
            }
          />
        </View>
      </SafeAreaView>

      {/* CTA bar — in normal flow, not an overlay, so the end of the article is
          never hidden on first paint. The cost is a fixed strip of screen the
          content can't use; accepted, because a measured paddingBottom can only
          fix the overlap *after* the bar has laid out and the reader has
          already seen covered text. */}
      <View
        className="bg-bg border-t border-line px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {renderVisitAction()}
        <Pressable
          onPress={openDirections}
          className="active:opacity-90"
          disabled={!soul.coord}
        >
          <View
            className="flex-row items-center justify-center rounded-full bg-ink py-[18px]"
            style={{ opacity: soul.coord ? 1 : 0.5 }}
          >
            <Feather name="navigation" size={18} color="#0a0a0a" />
            <Text
              className="font-sans-semibold ml-2"
              style={{ color: "#0a0a0a", fontSize: 16 }}
            >
              Get directions
            </Text>
            <View
              className="absolute right-2 h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
            >
              <Feather name="arrow-right" size={16} color="#0a0a0a" />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
