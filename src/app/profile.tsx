import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";
import { useFavorites } from "@/lib/favorites/context";
import type { FavoriteSoul } from "@/lib/favorites/types";
import { thumbUrl, year } from "@/lib/wikidata";

function FavoriteRow({
  fav,
  onRemove,
}: {
  fav: FavoriteSoul;
  onRemove: () => void;
}) {
  const initial = (fav.label || "?").trim().charAt(0).toUpperCase();
  const a = year(fav.dob);
  const b = year(fav.dod);
  const years = a || b ? `${a || "?"}–${b || "?"}` : "";

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/person/[qid]",
          params: { qid: fav.qid, data: JSON.stringify(fav) },
        })
      }
      className="active:bg-glass flex-row items-center gap-3 border-b border-line px-5 py-4"
    >
      {fav.image ? (
        <Image
          source={{ uri: thumbUrl(fav.image) }}
          style={{ width: 52, height: 52, borderRadius: 14 }}
          contentFit="cover"
        />
      ) : (
        <View className="bg-panel-2 h-[52px] w-[52px] items-center justify-center rounded-2xl border border-line">
          <Text
            className="font-display text-ink-faint"
            style={{ fontSize: 21 }}
          >
            {initial}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          className="font-display text-ink"
          style={{ fontSize: 17, letterSpacing: -0.3 }}
          numberOfLines={1}
        >
          {fav.label}
        </Text>
        <Text
          className="font-sans text-ink-dim"
          style={{ fontSize: 12, marginTop: 2 }}
          numberOfLines={1}
        >
          {[years, fav.place].filter(Boolean).join(" · ") || fav.desc || "—"}
        </Text>
      </View>

      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Remove from saved"
        className="h-9 w-9 items-center justify-center active:opacity-60"
      >
        <FontAwesome name="heart" size={16} color="#FF6B81" />
      </Pressable>
    </Pressable>
  );
}

export default function Profile() {
  const { favorites, remove, isReady } = useFavorites();

  return (
    <View className="bg-bg flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-4 pt-1">
          <BackButton />
        </View>

        <FlatList
          data={favorites}
          keyExtractor={(f) => f.qid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            <View>
              {/* stubbed profile block — guest until accounts land */}
              <View className="items-center px-6 pb-6 pt-4">
                <View
                  className="h-[76px] w-[76px] items-center justify-center rounded-full border border-line"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <Feather
                    name="user"
                    size={30}
                    color="rgba(255,255,255,0.5)"
                  />
                </View>
                <Text
                  className="text-ink font-display mt-4"
                  style={{ fontSize: 24, letterSpacing: -0.5 }}
                >
                  Guest
                </Text>
                <Text
                  className="text-ink-dim font-sans mt-1 text-center"
                  style={{ fontSize: 13, lineHeight: 18 }}
                >
                  Not signed in — your saves live on this device.
                </Text>

                <Pressable
                  onPress={() => router.push("/auth")}
                  className="mt-5 flex-row items-center gap-2 rounded-full active:opacity-80"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.26)",
                    paddingVertical: 11,
                    paddingHorizontal: 20,
                  }}
                >
                  <Feather name="log-in" size={15} color="#fff" />
                  <Text
                    className="text-ink font-sans-semibold"
                    style={{ fontSize: 14 }}
                  >
                    Sign in to sync
                  </Text>
                </Pressable>
              </View>

              {/* saved section label */}
              <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
                <Text
                  className="text-ink-faint"
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 11,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                  }}
                >
                  Saved
                </Text>
                {favorites.length > 0 ? (
                  <Text
                    className="text-ink-faint"
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 11,
                      letterSpacing: 1,
                    }}
                  >
                    {favorites.length}
                  </Text>
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <FavoriteRow fav={item} onRemove={() => remove(item.qid)} />
          )}
          ListEmptyComponent={
            isReady ? (
              <View className="items-center px-10 pt-10">
                <FontAwesome
                  name="heart-o"
                  size={28}
                  color="rgba(255,255,255,0.25)"
                />
                <Text
                  className="text-ink-dim font-sans mt-4 text-center"
                  style={{ fontSize: 14, lineHeight: 20 }}
                >
                  No saved souls yet.{"\n"}Tap the heart on anyone to keep them
                  here.
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}
