import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// UI-only for now — the actual Apple/Google/email auth + saved favorites
// is the Supabase layer (next lift). Buttons drop into the app as a stub.
function AuthButton({
  icon,
  label,
  variant,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  variant: "solid" | "glass";
  onPress: () => void;
}) {
  const inner = (
    <View className="flex-row items-center justify-center py-[17px]">
      <View className="absolute left-5">{icon}</View>
      <Text
        className="font-sans-semibold"
        style={{
          fontSize: 16,
          color: variant === "solid" ? "#0a0a0a" : "#fff",
        }}
      >
        {label}
      </Text>
    </View>
  );
  return (
    <Pressable onPress={onPress} className="active:opacity-90">
      {variant === "solid" ? (
        <View className="rounded-full bg-ink">{inner}</View>
      ) : (
        <BlurView
          intensity={24}
          tint="dark"
          className="overflow-hidden rounded-full border border-line"
        >
          {inner}
        </BlurView>
      )}
    </Pressable>
  );
}

export default function Auth() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSignup = mode === "signup";

  // stub: pretend auth succeeded and drop into the app
  const stubIn = () =>
    router.replace({ pathname: "/explore", params: { locate: "1" } });

  return (
    <View className="bg-bg flex-1">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* back */}
        <View className="px-4 pt-1">
          <Pressable
            onPress={() => router.back()}
            className="self-start active:opacity-70"
          >
            <BlurView
              intensity={24}
              tint="dark"
              className="h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full border border-line"
            >
              <Feather name="chevron-left" size={20} color="#fff" />
            </BlurView>
          </Pressable>
        </View>

        <View className="flex-1 justify-end px-6 pb-2">
          <Text
            className="text-ink font-display"
            style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.2 }}
          >
            {isSignup ? "Create your\naccount" : "Welcome\nback"}
          </Text>
          <Text
            className="text-ink-dim font-sans mb-8 mt-3"
            style={{ fontSize: 15, lineHeight: 22, maxWidth: 320 }}
          >
            Save the souls you find and pick up wherever you left off — across
            every device.
          </Text>

          <View className="gap-3">
            <AuthButton
              variant="solid"
              icon={<FontAwesome name="apple" size={19} color="#0a0a0a" />}
              label="Continue with Apple"
              onPress={stubIn}
            />
            <AuthButton
              variant="glass"
              icon={<FontAwesome name="google" size={17} color="#fff" />}
              label="Continue with Google"
              onPress={stubIn}
            />
            <AuthButton
              variant="glass"
              icon={<Feather name="mail" size={18} color="#fff" />}
              label="Continue with email"
              onPress={stubIn}
            />
          </View>

          <Text
            className="text-ink-faint font-sans mt-6 text-center"
            style={{ fontSize: 11, lineHeight: 16 }}
          >
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
