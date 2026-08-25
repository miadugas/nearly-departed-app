import { useEffect, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text } from "react-native";

/**
 * Cold-start / post-sign-in wait. The artwork's ground is exactly the `bg`
 * token, so `contain` letterboxes into an identical field — no seam, no crop
 * at any aspect ratio. The status line is live text under the baked wordmark.
 *
 * Stays mounted and cross-fades rather than unmounting: cutting a full-screen
 * panel straight to the map reads as a jump, and the fade is what makes the
 * hand-off feel like one motion.
 */
export function LoadingScreen({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  const [opacity] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      // slower on the way out — the reveal is the part you feel
      duration: visible ? 160 : 450,
      easing: visible ? Easing.out(Easing.quad) : Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[StyleSheet.absoluteFill, { backgroundColor: "#050505", opacity }]}
    >
      <Image
        source={require("../../assets/images/nearly-departed-loading-050505.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
        accessible
        accessibilityLabel="Nearly Departed"
      />
      <Text
        className="font-sans text-ink-faint"
        style={{
          position: "absolute",
          // just below the wordmark, which sits at ~63% of the artwork's height
          top: "66.5%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 13.5,
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
