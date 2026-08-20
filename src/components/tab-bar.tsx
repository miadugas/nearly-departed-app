import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { emitTabReselect } from "@/lib/tab-signal";

const PINK = "#ff6f87";
const IDLE = "rgba(255,255,255,0.55)";

/** Bar height above the home indicator. Screens reserve this much space. */
export const TAB_BAR_HEIGHT = 58;

type Tab = {
  href: "/explore" | "/profile" | "/saved" | "/settings";
  label: string;
  render: (color: number | string) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/explore",
    label: "Location",
    render: (color) => (
      <Feather name="navigation" size={20} color={color as string} />
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    render: (color) => (
      <MaterialCommunityIcons
        name="skull-outline"
        size={22}
        color={color as string}
      />
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    render: (color) => (
      <Feather name="heart" size={20} color={color as string} />
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    render: (color) => (
      <Feather name="settings" size={20} color={color as string} />
    ),
  },
];

/**
 * Persistent quick-access bar. The app routes through a Stack rather than
 * expo-router Tabs, so this uses `navigate`: it pops back to a destination
 * already in the stack instead of stacking a duplicate, which keeps the back
 * button pointing at the screen you actually came from. Tapping the tab you're
 * already on resets that screen (see `tab-signal`).
 */
export function TabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View
      className="bg-bg border-t border-line"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom,
        flexDirection: "row",
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const color = active ? PINK : IDLE;
        return (
          <Pressable
            key={tab.href}
            onPress={() => {
              if (active) emitTabReselect(tab.href);
              else router.navigate(tab.href);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            className="flex-1 items-center justify-center active:opacity-70"
            style={{ height: TAB_BAR_HEIGHT, gap: 3 }}
          >
            {tab.render(color)}
            <Text
              className="font-sans-semibold"
              style={{ color, fontSize: 10.5, letterSpacing: 0.2 }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
