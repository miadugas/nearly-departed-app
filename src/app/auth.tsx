import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";

// UI-only for now — real Apple/Google/email sign-in + saved favorites is the
// Supabase layer (next lift). Buttons currently just drop into the app.
function AuthButton({
  icon,
  label,
  variant,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  variant: "solid" | "glass";
  onPress: () => void;
}) {
  const solid = variant === "solid";
  return (
    <Pressable
      onPress={onPress}
      className="h-[54px] flex-row items-center justify-center rounded-full active:opacity-90"
      style={
        solid
          ? {
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.28,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 5,
            }
          : {
              backgroundColor: "rgba(255,255,255,0.10)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.26)",
            }
      }
    >
      <View className="flex-row items-center" style={{ gap: 10 }}>
        {icon}
        <Text
          className="font-sans-semibold"
          style={{
            fontSize: 16,
            letterSpacing: 0.1,
            color: solid ? "#0a0a0a" : "#fff",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Auth() {
  // stub until the backend exists — be honest that it's not wired yet
  const soon = () =>
    Alert.alert(
      "Accounts are coming soon",
      "Sign-in isn't wired up yet — for now you can explore and save favorites on this device.",
    );

  // email = guest bypass for now: drop into the app like "Browse" did
  const browse = () =>
    router.replace({ pathname: "/explore", params: { locate: "0" } });

  return (
    <View className="bg-bg flex-1">
      <Image
        source={require("../../assets/auth-hero.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
      />
      <LinearGradient
        colors={[
          "rgba(5,5,5,0.55)",
          "rgba(5,5,5,0.30)",
          "rgba(5,5,5,0.85)",
          "#050505",
        ]}
        locations={[0, 0.32, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* back */}
        <View className="px-4 pt-1">
          <BackButton />
        </View>

        <View className="flex-1 justify-end px-6">
          <Text
            className="text-ink font-display"
            style={{ fontSize: 40, lineHeight: 38, letterSpacing: -1.2 }}
          >
            Save the{"\n"}souls you find
          </Text>
          <Text
            className="text-ink-dim font-sans"
            style={{
              fontSize: 15,
              lineHeight: 22,
              maxWidth: 320,
              marginTop: 4,
              marginBottom: 32,
            }}
          >
            Sign in to keep your favorites and pick up wherever you left off —
            across every device. No account needed to explore.
          </Text>

          <View style={{ gap: 12 }}>
            <AuthButton
              variant="solid"
              icon={
                <FontAwesome
                  name="apple"
                  size={19}
                  color="#0a0a0a"
                  style={{ marginTop: -2 }}
                />
              }
              label="Continue with Apple"
              onPress={soon}
            />
            <AuthButton
              variant="solid"
              icon={
                <Image
                  source={require("../../assets/google-g.png")}
                  style={{ width: 18, height: 18 }}
                  contentFit="contain"
                />
              }
              label="Continue with Google"
              onPress={soon}
            />
            <AuthButton
              variant="glass"
              icon={<Feather name="mail" size={18} color="#fff" />}
              label="Continue with email"
              onPress={browse}
            />
          </View>

          <Text
            className="text-ink-faint font-sans text-center"
            style={{ fontSize: 11, lineHeight: 16, marginTop: 22 }}
          >
            By continuing you agree to our{" "}
            <Text
              onPress={() => router.push("/legal/terms")}
              style={{
                color: "rgba(255,255,255,0.7)",
                textDecorationLine: "underline",
              }}
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              onPress={() => router.push("/legal/privacy")}
              style={{
                color: "rgba(255,255,255,0.7)",
                textDecorationLine: "underline",
              }}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
