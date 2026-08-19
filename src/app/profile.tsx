import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { router } from "expo-router";
import { type ComponentProps, type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeadstoneIcon } from "@/components/icons";
import { BackButton } from "@/components/icon-button";
import {
  AvatarPickerModal,
  NameEditorModal,
} from "@/components/profile-modals";
import { useAuth } from "@/lib/auth/context";
import { avatarSource } from "@/lib/avatar/avatars";
import { useAvatar } from "@/lib/avatar/context";
import { useFavorites } from "@/lib/favorites/context";
import { progressToNext, rankFor } from "@/lib/ranks";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const PINK = "#ff6f87";

// Menu destination: icon, title, one line of what is behind it, chevron.
function MenuRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      className="active:bg-glass flex-row items-center gap-4 border-b border-line py-5"
    >
      <View style={{ width: 30, alignItems: "center" }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text className="text-ink font-sans" style={{ fontSize: 17 }}>
          {title}
        </Text>
        <Text
          className="text-ink-dim font-sans"
          style={{ fontSize: 13.5, marginTop: 5, lineHeight: 18 }}
        >
          {description}
        </Text>
      </View>
      <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
    </Pressable>
  );
}

// Bare, icon-led action — sign out and its destructive twin.
function AccountAction({
  icon,
  label,
  destructive,
  busy,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  destructive?: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  const tint = destructive ? PINK : "#ffffff";
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!busy }}
      hitSlop={8}
      className="flex-row items-center gap-5 self-start active:opacity-60"
      style={{ opacity: busy ? 0.6 : 1 }}
    >
      {busy ? (
        <ActivityIndicator color={tint} style={{ width: 22 }} />
      ) : (
        <Feather name={icon} size={22} color={tint} />
      )}
      <Text className="font-sans" style={{ fontSize: 17, color: tint }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Profile() {
  const { favorites, isReady } = useFavorites();
  const { user, signOut, deleteAccount } = useAuth();
  const { avatarId, setAvatarId, displayName, setDisplayName } = useAvatar();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const signedIn = !!user;
  const email = user?.email ?? "";
  const name = displayName ?? (signedIn ? email.split("@")[0] : "Guest");
  const avatarInitial = (name || "?").trim().charAt(0).toUpperCase();
  const count = favorites.length;
  const rank = rankFor(count);
  const progress = progressToNext(count);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account and any synced data. Saves on this device are kept. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => {
            setDeleting(true);
            deleteAccount()
              .then(({ appleRevoked }) => {
                const manualRevocationInstructions =
                  appleRevoked === false
                    ? "\n\nTo revoke Sign in with Apple manually: Settings → [your name] → Sign-In & Security → Sign in with Apple → Nearly Departed → Stop Using."
                    : "";
                Alert.alert(
                  "Account deleted",
                  `Your account and synced data are gone. Your on-device saves are still here.${manualRevocationInstructions}`,
                );
              })
              .catch(() => {
                Alert.alert(
                  "Couldn't delete account",
                  "Something went wrong. Check your connection and try again, or email nearlydepartedapp@gmail.com.",
                );
              })
              .finally(() => setDeleting(false));
          },
        },
      ],
    );
  };

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
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 56 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start justify-between pt-1">
            <View style={{ flex: 1 }}>
              <BackButton />
              <Text
                className="font-serif mt-5"
                style={{
                  color: PINK,
                  fontSize: 46,
                  lineHeight: 47,
                  letterSpacing: -1,
                }}
                numberOfLines={2}
              >
                {name}&apos;s archive
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/settings")}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              hitSlop={8}
              className="mt-1 items-center justify-center rounded-full active:opacity-70"
              style={{
                width: 46,
                height: 46,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.40)",
              }}
            >
              <Feather name="settings" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* identity — avatar, name, contact, tagline */}
          <View className="mt-8 flex-row items-center gap-5">
            <Pressable
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Change avatar"
              style={{ width: 118, height: 118 }}
            >
              <View
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: 59,
                  borderWidth: 2,
                  borderColor: "#f4f1f2",
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#252525",
                }}
              >
                {avatarId ? (
                  <Image
                    source={avatarSource(avatarId)}
                    style={{ width: 118, height: 118 }}
                    contentFit="cover"
                  />
                ) : signedIn ? (
                  <Text className="text-ink font-serif" style={{ fontSize: 46 }}>
                    {avatarInitial}
                  </Text>
                ) : (
                  <MaterialCommunityIcons
                    name="skull-outline"
                    size={48}
                    color="rgba(255,255,255,0.55)"
                  />
                )}
              </View>
              <View
                style={{
                  position: "absolute",
                  right: -6,
                  bottom: 2,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.44)",
                  backgroundColor: "#252525",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="edit-2" size={15} color="#fff" />
              </View>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Pressable
                onPress={() => setNameEditorOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Edit display name"
                hitSlop={6}
                className="active:opacity-70"
              >
                <Text
                  className="text-ink font-serif"
                  style={{ fontSize: 40, lineHeight: 43, letterSpacing: -0.8 }}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              </Pressable>
              {signedIn ? (
                <Text
                  className="text-ink-dim font-sans mt-2"
                  style={{ fontSize: 12.5 }}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              ) : null}
              {/* rank — standing in the archive, earned by saved souls */}
              <View className="mt-3 flex-row items-center gap-2">
                <Feather name="award" size={15} color={PINK} />
                <Text
                  className="font-serif"
                  style={{ color: PINK, fontSize: 22, lineHeight: 24 }}
                  numberOfLines={1}
                >
                  {rank.title}
                </Text>
              </View>
              <Text
                className="font-sans mt-1.5"
                style={{ color: "#c5c1c5", fontSize: 13, lineHeight: 18 }}
              >
                {rank.blurb}
              </Text>
              {progress ? (
                <Text
                  className="text-ink-faint font-sans mt-1.5"
                  style={{ fontSize: 12 }}
                >
                  {progress}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            className="mt-10"
            style={{ height: 1, backgroundColor: "rgba(255,255,255,0.16)" }}
          />

          {/* saved souls — the count is the hero, the art keeps it company */}
          <View className="mt-9">
            <Text
              className="text-ink-faint font-sans-semibold"
              style={{
                fontSize: 12,
                letterSpacing: 2.6,
                textTransform: "uppercase",
              }}
            >
              Saved souls
            </Text>
            <View className="flex-row items-start justify-between">
              <View style={{ flex: 1 }}>
                <Text
                  className="text-ink font-serif mt-3"
                  style={{ fontSize: 104, lineHeight: 98 }}
                >
                  {isReady ? count : "—"}
                </Text>
                <Pressable
                  onPress={() => router.push("/saved")}
                  accessibilityRole="button"
                  accessibilityLabel="View saved souls"
                  hitSlop={8}
                  className="mt-7 flex-row items-center gap-3 self-start active:opacity-70"
                >
                  <Text
                    className="font-sans"
                    style={{ color: PINK, fontSize: 18 }}
                  >
                    View saved souls
                  </Text>
                  <Feather name="chevron-right" size={20} color={PINK} />
                </Pressable>
              </View>
              <Image
                source={require("@/assets/images/potion-heart.png")}
                style={{ width: 150, height: 150, opacity: 0.9 }}
                contentFit="contain"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </View>

            {isReady && count === 0 ? (
              <View className="mt-4 items-center px-4">
                <Text
                  className="font-sans text-center"
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
            ) : null}
          </View>

          {/* destinations */}
          <View
            className="mt-10"
            style={{
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.16)",
            }}
          >
            <MenuRow
              icon={<HeadstoneIcon size={22} />}
              title="Cemetourists"
              description="The do's & don'ts of visiting well."
              onPress={() => router.push("/cemetourists")}
            />
            <MenuRow
              icon={
                <Feather
                  name="heart"
                  size={22}
                  color="rgba(255,255,255,0.85)"
                />
              }
              title="Saved souls"
              description="View and manage your archive."
              onPress={() => router.push("/saved")}
            />
            <MenuRow
              icon={
                <Feather
                  name="shield"
                  size={22}
                  color="rgba(255,255,255,0.85)"
                />
              }
              title="Privacy"
              description="How your data is handled, in plain English."
              onPress={() => router.push("/legal/privacy")}
            />
            <MenuRow
              icon={
                <Feather
                  name="file-text"
                  size={22}
                  color="rgba(255,255,255,0.85)"
                />
              }
              title="Terms of Service"
              description="The rules of the road, and the graveyard."
              onPress={() => router.push("/legal/terms")}
            />
            <MenuRow
              icon={
                <Feather
                  name="mail"
                  size={22}
                  color="rgba(255,255,255,0.85)"
                />
              }
              title="Support"
              description="Get help or send us a message."
              onPress={() => {
                Linking.openURL("mailto:nearlydepartedapp@gmail.com").catch(
                  () => {},
                );
              }}
            />
          </View>

          {/* account */}
          <View className="mt-10 gap-7">
            {signedIn ? (
              <>
                <AccountAction
                  icon="log-out"
                  label="Sign out"
                  onPress={handleSignOut}
                />
                <AccountAction
                  icon="trash-2"
                  label={deleting ? "Deleting account…" : "Delete account"}
                  destructive
                  busy={deleting}
                  onPress={handleDeleteAccount}
                />
              </>
            ) : (
              <AccountAction
                icon="log-in"
                label="Sign in to sync"
                onPress={() => router.push("/auth")}
              />
            )}
          </View>

          <Text
            className="text-ink-faint font-sans mt-12 text-center"
            style={{ fontSize: 12, letterSpacing: 0.2 }}
          >
            Nearly Departed · v{APP_VERSION}
          </Text>
        </ScrollView>
      </SafeAreaView>

      <AvatarPickerModal
        visible={pickerOpen}
        selected={avatarId}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          setAvatarId(id);
          setPickerOpen(false);
        }}
      />
      <NameEditorModal
        key={`${nameEditorOpen}:${displayName ?? ""}`}
        visible={nameEditorOpen}
        name={displayName}
        onClose={() => setNameEditorOpen(false)}
        onSave={setDisplayName}
      />
    </View>
  );
}
