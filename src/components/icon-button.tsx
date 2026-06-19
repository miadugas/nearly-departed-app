import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

type FeatherName = ComponentProps<typeof Feather>["name"];

// One round glass icon button used for back / heart / etc. across screens.
// Solid translucent fill (NOT BlurView tint="dark") so it stays visible over
// dark maps and photos alike.
export function IconButton({
  name,
  icon,
  onPress,
  size = 20,
  color = "#fff",
  accessibilityLabel,
  style,
}: {
  name?: FeatherName;
  // Custom icon node — wins over `name`. Use for non-Feather glyphs (e.g. a
  // filled FontAwesome heart) while keeping the shared round-glass chrome.
  icon?: ReactNode;
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
          backgroundColor: "rgba(255,255,255,0.14)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.32)",
          // soft shadow lifts the control off maps/photos for legibility
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
        style,
      ]}
    >
      {icon ??
        (name ? <Feather name={name} size={size} color={color} /> : null)}
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
