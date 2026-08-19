import { View } from "react-native";

/**
 * Outline headstone. None of the bundled icon sets ship one (MaterialCommunity
 * only has a solid `grave-stone`), and the app has no SVG runtime — so it's
 * drawn from borders, tuned to sit at Feather's stroke weight beside it.
 */
export function HeadstoneIcon({
  size = 22,
  color = "rgba(255,255,255,0.85)",
  strokeWidth = 1.7,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const w = size * 0.78;
  const h = size * 0.95;
  const bar = strokeWidth;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: w,
          height: h,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopLeftRadius: w / 2,
          borderTopRightRadius: w / 2,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          alignItems: "center",
          justifyContent: "center",
          gap: size * 0.11,
          paddingTop: size * 0.16,
        }}
      >
        {/* inscription — two short rules, the shorter one beneath */}
        <View
          style={{
            width: w * 0.46,
            height: bar,
            borderRadius: bar,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            width: w * 0.32,
            height: bar,
            borderRadius: bar,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
