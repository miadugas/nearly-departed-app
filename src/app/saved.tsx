import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMemo } from "react";
import { SectionList, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FavoriteRow } from "@/components/favorite-row";
import { BackButton } from "@/components/icon-button";
import { TAB_BAR_HEIGHT, TabBar } from "@/components/tab-bar";
import { useFavorites } from "@/lib/favorites/context";
import { visitStampOf, type FavoriteSoul } from "@/lib/favorites/types";

// A single-row stand-in for "this section has a header but nothing in it".
// Carrying it as list data (rather than a section footer) keeps one rendering
// path and lets `keyExtractor` stay a plain `item.qid` read for both shapes.
type EmptyNotice = { qid: string; notice: string };
type SavedItem = FavoriteSoul | EmptyNotice;

type SavedSection = {
  title: string;
  // Explicit, because the Visited section's `data` can hold the notice row —
  // the header must count souls, not rendered rows.
  count: number;
  data: SavedItem[];
};

const NO_VISITS: EmptyNotice = {
  qid: "__no-visits__",
  notice:
    "Nothing dug up yet. Get within half a mile of a grave to log a visit.",
};

// FavoriteSoul never carries `notice`, so the `in` check narrows the union.
function isNotice(item: SavedItem): item is EmptyNotice {
  return "notice" in item;
}

export default function Saved() {
  const insets = useSafeAreaInsets();
  const { favorites, remove, isReady } = useFavorites();

  // Two systems over one list: visiting is proximity-verified and outranks a
  // bookmark, so visits get their own section at the top, ordered by when you
  // were there. The dig list is what's left to go find.
  const sections = useMemo<SavedSection[]>(() => {
    // SectionList only renders ListEmptyComponent when `sections` is empty,
    // so the "archive is empty" state has to come through as zero sections.
    if (favorites.length === 0) return [];

    const visited: { fav: FavoriteSoul; at: number }[] = [];
    const dig: FavoriteSoul[] = [];
    for (const fav of favorites) {
      const at = visitStampOf(fav);
      if (at === undefined) {
        dig.push(fav);
        continue;
      }
      visited.push({ fav, at });
    }

    visited.sort((a, b) => b.at - a.at);
    dig.sort((a, b) => b.savedAt - a.savedAt);

    const next: SavedSection[] = [
      {
        title: "Visited",
        count: visited.length,
        data: visited.length > 0 ? visited.map((v) => v.fav) : [NO_VISITS],
      },
    ];
    // Nothing left to dig up = no section at all; an empty header would read
    // as a bug, whereas zero visits is a prompt worth showing.
    if (dig.length > 0) {
      next.push({ title: "Dig list", count: dig.length, data: dig });
    }
    return next;
  }, [favorites]);

  return (
    <View className="bg-bg flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-4 pt-1">
          <BackButton />
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.qid}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 48 + TAB_BAR_HEIGHT + insets.bottom }}
          ListHeaderComponent={
            <View className="px-6 pb-5 pt-4">
              <Text
                className="text-ink font-serif text-center"
                style={{ fontSize: 40, lineHeight: 42, letterSpacing: -0.8 }}
                numberOfLines={1}
              >
                Saved souls
              </Text>
              <Text
                className="text-ink-dim font-sans mt-2 text-center"
                style={{ fontSize: 12.5 }}
              >
                {isReady
                  ? favorites.length === 1
                    ? "1 soul in your archive"
                    : `${favorites.length} souls in your archive`
                  : "Opening the archive…"}
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="bg-bg flex-row items-center justify-between border-b border-line px-5 py-2.5">
              <Text
                className="text-ink"
                numberOfLines={1}
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {section.title}
              </Text>
              <Text
                className="text-ink-faint"
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 11,
                }}
              >
                {section.count}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            if (isNotice(item)) {
              return (
                <Text
                  className="text-ink-dim font-sans px-5 py-4"
                  style={{ fontSize: 13 }}
                >
                  {item.notice}
                </Text>
              );
            }
            return (
              <FavoriteRow fav={item} onRemove={() => remove(item.qid)} />
            );
          }}
          ListEmptyComponent={
            isReady ? (
              <View className="items-center px-10 pt-12">
                <FontAwesome
                  name="heart-o"
                  size={28}
                  color="rgba(255,255,255,0.25)"
                />
                <Text
                  className="font-sans mt-5 text-center"
                  style={{ color: "#c9c5c9", fontSize: 15 }}
                >
                  Your archive is empty for now.
                </Text>
                <Text
                  className="text-ink-dim font-sans mt-1 text-center"
                  style={{ fontSize: 14, lineHeight: 20 }}
                >
                  Tap the heart on any soul to keep them here.
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      <TabBar />
    </View>
  );
}
