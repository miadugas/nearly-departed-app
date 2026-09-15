import { Keyboard, Pressable, Text, View } from "react-native";

import { formatRadius, type DistanceUnit } from "@/lib/units/format";
import type { SoulMode } from "@/lib/wikidata";

type Props = {
  mode: SoulMode;
  onModeChange: (m: SoulMode) => void;
  radiusSlot: number;
  onRadiusChange: (slot: number) => void;
  radii: number[];
  unit: DistanceUnit;
};

// Web fallback — @expo/ui/swift-ui is native-only, so web keeps the original
// two-row toggle + radius-chip layout (mirrors souls-map.tsx / .native.tsx).
export function DiscoveryControls({
  mode,
  onModeChange,
  radiusSlot,
  onRadiusChange,
  radii,
  unit,
}: Props) {
  return (
    <>
      <View className="flex-row items-center gap-2">
        {(
          [
            { key: "buried", label: "Buried here" },
            { key: "died", label: "Died here" },
          ] as const
        ).map(({ key, label }) => {
          const active = mode === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                Keyboard.dismiss();
                onModeChange(key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hitSlop={{ top: 8, bottom: 8 }}
              className="items-center justify-center rounded-full"
              style={{
                flex: 1,
                height: 34,
                borderWidth: 1,
                borderColor: active ? "#ffffff" : "rgba(255,255,255,0.40)",
                backgroundColor: active ? "#ffffff" : "rgba(255,255,255,0.14)",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 12,
                  color: active ? "#0a0a0a" : "rgba(255,255,255,0.7)",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-3 flex-row items-center gap-2">
        {radii.map((r, slot) => {
          const active = slot === radiusSlot;
          return (
            <Pressable
              key={r}
              onPress={() => {
                Keyboard.dismiss();
                onRadiusChange(slot);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${r} ${unit === "mi" ? "mile" : "kilometer"} radius`}
              accessibilityState={{ selected: active }}
              hitSlop={{ top: 8, bottom: 8 }}
              className="items-center justify-center rounded-full"
              style={{
                flex: 1,
                height: 34,
                borderWidth: 1,
                borderColor: active ? "#ffffff" : "rgba(255,255,255,0.40)",
                backgroundColor: active ? "#ffffff" : "rgba(255,255,255,0.14)",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 12,
                  color: active ? "#0a0a0a" : "rgba(255,255,255,0.7)",
                }}
              >
                {formatRadius(r, unit)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
