import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { router } from "expo-router";
import { type ComponentProps } from "react";
import { Alert, FlatList, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";
import { useAuth } from "@/lib/auth/context";
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

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

// Settings/about row — icon, label, chevron. Matches the app's list idiom
// (thin divider, tap-to-glass) instead of boxing each item in its own card.
function LinkRow({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:bg-glass flex-row items-center gap-3 border-b border-line px-5 py-4"
    >
      <Feather name={icon} size={17} color="rgba(255,255,255,0.55)" />
      <Text className="text-ink font-sans flex-1" style={{ fontSize: 15 }}>
        {label}
      </Text>
      <Feather name="chevron-right" size={17} color="rgba(255,255,255,0.3)" />
    </Pressable>
  );
}

export default function Profile() {
  const { favorites, remove, isReady } = useFavorites();
  const { user, signOut } = useAuth();

  const signedIn = !!user;
  const email = user?.email ?? "";
  const avatarInitial = (email || "?").trim().charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in anytime with your email.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          signOut().catch(() => {});
        },
      },
    ]);
  };

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
              {/* profile block — signed-in identity or guest CTA */}
              <View className="items-center px-6 pb-6 pt-4">
                <View
                  className="h-[76px] w-[76px] items-center justify-center rounded-full border border-line"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  {signedIn ? (
                    <Text
                      className="text-ink font-display"
                      style={{ fontSize: 32 }}
                    >
                      {avatarInitial}
                    </Text>
                  ) : (
                    <MaterialCommunityIcons
                      name="skull-outline"
                      size={36}
                      color="rgba(255,255,255,0.5)"
                    />
                  )}
                </View>
                <Text
                  className="text-ink font-display mt-4"
                  style={{ fontSize: 24, letterSpacing: -0.5 }}
                  numberOfLines={1}
                >
                  {signedIn ? email : "Guest"}
                </Text>
                <Text
                  className="text-ink-dim font-sans mt-1 text-center"
                  style={{ fontSize: 13, lineHeight: 18 }}
                >
                  {signedIn
                    ? "You're signed in."
                    : "Not signed in — your saves live on this device."}
                </Text>

                {signedIn ? (
                  <Pressable
                    onPress={handleSignOut}
                    className="mt-5 flex-row items-center gap-2 rounded-full active:opacity-80"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.18)",
                      paddingVertical: 11,
                      paddingHorizontal: 20,
                    }}
                  >
                    <Feather name="log-out" size={15} color="#fff" />
                    <Text
                      className="text-ink font-sans-semibold"
                      style={{ fontSize: 14 }}
                    >
                      Sign out
                    </Text>
                  </Pressable>
                ) : (
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
                )}
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
          ListFooterComponent={
            <View>
              {/* about / legal — gives the screen real utility and a floor */}
              <Text
                className="text-ink-faint px-5 pb-2 pt-8"
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                }}
              >
                About
              </Text>
              <View className="border-t border-line">
                <LinkRow
                  icon="mail"
                  label="Support"
                  onPress={() => {
                    Linking.openURL("mailto:nearlydepartedapp@gmail.com").catch(
                      () => {},
                    );
                  }}
                />
                <LinkRow
                  icon="file-text"
                  label="Terms of Service"
                  onPress={() => router.push("/legal/terms")}
                />
                <LinkRow
                  icon="shield"
                  label="Privacy Policy"
                  onPress={() => router.push("/legal/privacy")}
                />
              </View>

              <Text
                className="text-ink-faint font-sans text-center"
                style={{ fontSize: 12, marginTop: 28, letterSpacing: 0.2 }}
              >
                Nearly Departed · v{APP_VERSION}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
