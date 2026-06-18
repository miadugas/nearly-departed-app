import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

type FeatherName = ComponentProps<typeof Feather>["name"];

// One round glass icon button used for back / heart / etc. across screens.
// Solid translucent fill (NOT BlurView tint="dark") so it stays visible over
// dark maps and photos alike.
export function IconButton({
  name,
  onPress,
  size = 20,
  color = "#fff",
  accessibilityLabel,
  style,
}: {
  name: FeatherName;
  onPress?: () => void;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      className="h-[42px] w-[42px] items-center justify-center self-start rounded-full active:opacity-70"
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.12)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.26)",
        },
        style,
      ]}
    >
      <Feather name={name} size={size} color={color} />
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <IconButton
      name="chevron-left"
      onPress={onPress ?? (() => router.back())}
      accessibilityLabel="Go back"
    />
  );
}
