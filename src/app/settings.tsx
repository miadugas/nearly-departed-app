import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";
import { useUnits } from "@/lib/units/context";

export default function Settings() {
  const { unit, setUnit } = useUnits();

  return (
    <View className="bg-bg flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-4 pt-1">
          <BackButton />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="text-ink font-serif pt-4 text-center"
            style={{ fontSize: 40, lineHeight: 42, letterSpacing: -0.8 }}
            numberOfLines={1}
          >
            Settings
          </Text>
          <Text
            className="text-ink-dim font-sans mt-2 text-center"
            style={{ fontSize: 12.5 }}
          >
            Preferences live on this device.
          </Text>

          <View
            className="mt-9 flex-row items-center gap-3 border-b border-t border-line py-4"
          >
            <Text className="text-ink font-sans flex-1" style={{ fontSize: 17 }}>
              Distances
            </Text>
            <View
              className="flex-row rounded-full"
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.40)",
                backgroundColor: "rgba(255,255,255,0.14)",
                overflow: "hidden",
              }}
            >
              {(["km", "mi"] as const).map((option) => {
                const active = unit === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setUnit(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={
                      option === "km" ? "Kilometres" : "Miles"
                    }
                    hitSlop={{ top: 8, bottom: 8 }}
                    className="items-center justify-center"
                    style={{
                      minWidth: 54,
                      height: 34,
                      backgroundColor: active ? "#ffffff" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 13,
                        color: active ? "#0a0a0a" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Text
            className="text-ink-dim font-sans mt-3"
            style={{ fontSize: 13, lineHeight: 19 }}
          >
            Every distance in the app — search radius, cemetery listings, and
            each soul&apos;s detail page — follows this choice.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
