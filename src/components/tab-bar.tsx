import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Linking, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { YOU_BLUE } from "@/lib/colors";
import { useLocation } from "@/lib/location/context";
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
  const loc = useLocation();
  const { status: locStatus, request: requestLocation } = loc;
  // Until location is granted, the Location tab is the app's one call to
  // action, so it wears the map dot's blue and breathes to earn a look.
  const wantsLocation = locStatus !== "granted";
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!wantsLocation) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [wantsLocation, pulse]);

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
        const isLocation = tab.href === "/explore";
        const asking = isLocation && wantsLocation;
        const color = asking ? YOU_BLUE : active ? PINK : IDLE;
        const label = isLocation
          ? wantsLocation
            ? "Use My Location"
            : "Your Location"
          : tab.label;

        const onPress = () => {
          if (asking) {
            // iOS won't re-prompt once hard-denied; Settings is the only way back.
            if (locStatus === "blocked") Linking.openSettings();
            else requestLocation();
            if (!active) router.navigate(tab.href);
            return;
          }
          if (active) emitTabReselect(tab.href);
          else router.navigate(tab.href);
        };

        return (
          <Pressable
            key={tab.href}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            className="flex-1 items-center justify-center active:opacity-70"
            style={{ height: TAB_BAR_HEIGHT, gap: 3 }}
          >
            <Animated.View style={asking ? { opacity: pulse } : undefined}>
              {tab.render(color)}
            </Animated.View>
            <Animated.Text
              className="font-sans-semibold"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                color,
                fontSize: 10.5,
                letterSpacing: 0.2,
                ...(asking ? { opacity: pulse } : null),
              }}
            >
              {label}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}
