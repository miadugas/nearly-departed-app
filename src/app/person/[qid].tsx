import Feather from "@expo/vector-icons/Feather";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton, IconButton } from "@/components/icon-button";
import { heroUrl, year, type Soul } from "@/lib/wikidata";
import { fetchSummary } from "@/lib/wikipedia";

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
  const { data } = useLocalSearchParams<{ data: string }>();
  const soul: Soul | null = data ? JSON.parse(data) : null;
  const [expanded, setExpanded] = useState(false);

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

  const openDirections = () => {
    if (!soul.coord) return;
    const [lat, lon] = soul.coord;
    Linking.openURL(
      `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(soul.place)}`,
    );
  };

  return (
    <View className="bg-bg flex-1">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
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
                {soul.dist.toFixed(1)} km from you
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
              <Stat label="Born" value={year(soul.dob) || "?"} />
              <Stat label="Died" value={year(soul.dod) || "?"} noRight />
            </View>
            <View className="flex-row">
              <Stat label="Resting at" value={soul.place} small />
              <Stat
                label="Distance"
                value={`${soul.dist.toFixed(1)} km`}
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
          <IconButton name="heart" size={18} accessibilityLabel="Save" />
        </View>
      </SafeAreaView>

      {/* pinned CTA */}
      <View className="absolute bottom-0 left-0 right-0">
        <LinearGradient
          colors={["rgba(5,5,5,0)", "rgba(5,5,5,0.85)", "#050505"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={["bottom"]}>
          <View className="px-5 pb-2 pt-4">
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
        </SafeAreaView>
      </View>
    </View>
  );
}
