import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const TAGLINES = [
  "The most interesting people nearby are already dead.",
  "Meet the locals. The permanent ones.",
  "Remarkable lives, just underfoot.",
];

function FadeUp({
  delay = 0,
  children,
}: {
  delay?: number;
  children: ReactNode;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function Onboarding() {
  const [tagline] = useState(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
  );

  return (
    <View className="flex-1 bg-bg">
      <Image
        source={require("../../assets/hero.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
      />
      <LinearGradient
        colors={[
          "rgba(5,5,5,0.60)",
          "rgba(5,5,5,0.00)",
          "rgba(5,5,5,0.00)",
          "rgba(5,5,5,0.45)",
          "rgba(5,5,5,0.92)",
          "#050505",
        ]}
        locations={[0, 0.18, 0.42, 0.62, 0.84, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1" />

        {/* content */}
        <FadeUp>
          <View className="gap-4 px-6 pb-2">
            <View>
              {/* <Text
                className="text-ink font-display-md"
                style={{ fontSize: 26, lineHeight: 30, letterSpacing: -0.5 }}
              >
                The
              </Text> */}
              <Text
                className="text-ink font-display"
                style={{ fontSize: 56, lineHeight: 54, letterSpacing: -1.8 }}
              >
                Nearly{"\n"}Departed
              </Text>
            </View>

            <Text
              className="text-ink font-sans-medium"
              style={{ fontSize: 17, lineHeight: 24, maxWidth: 330 }}
            >
              {tagline}
            </Text>

            {/* primary CTA */}
            <Pressable
              onPress={() =>
                router.push({ pathname: "/explore", params: { locate: "1" } })
              }
              className="mt-1 active:opacity-90"
            >
              <View className="flex-row items-center justify-center rounded-full bg-ink py-[18px]">
                <Feather name="map-pin" size={18} color="#0a0a0a" />
                <Text
                  className="font-sans-semibold ml-2"
                  style={{ color: "#0a0a0a", fontSize: 16 }}
                >
                  Use my location
                </Text>
                <View
                  className="absolute right-2 h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(10,10,10,0.07)" }}
                >
                  <Feather name="arrow-right" size={16} color="#0a0a0a" />
                </View>
              </View>
            </Pressable>

            {/* secondary entry — same footprint as primary; visible outline fill (blur is invisible on black) */}
            <Pressable
              onPress={() => router.push("/auth")}
              className="flex-row items-center justify-center rounded-full py-[18px] active:opacity-85"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.30)",
              }}
            >
              <Feather name="user" size={17} color="#fff" />
              <Text
                className="text-ink font-sans-semibold ml-2"
                style={{ fontSize: 16 }}
              >
                Sign in or create account
              </Text>
            </Pressable>

            <Text
              className="text-ink-faint font-sans mt-1 text-center"
              style={{ fontSize: 11, lineHeight: 16 }}
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
        </FadeUp>
      </SafeAreaView>
    </View>
  );
}
