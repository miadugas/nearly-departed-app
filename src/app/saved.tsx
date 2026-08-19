import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FavoriteRow } from "@/components/favorite-row";
import { BackButton } from "@/components/icon-button";
import { useFavorites } from "@/lib/favorites/context";

export default function Saved() {
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
          contentContainerStyle={{ paddingBottom: 48 }}
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
          renderItem={({ item }) => (
            <FavoriteRow fav={item} onRemove={() => remove(item.qid)} />
          )}
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
    </View>
  );
}
