import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

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

/**
 * Hooded reaper with a scythe — the mark for Processions. Drawn as a path
 * because no bundled icon set ships one; stroke weight and cap style are tuned
 * to sit beside Feather's icons without looking heavier.
 */
export function ReaperIcon({
  size = 22,
  color = "rgba(255,255,255,0.85)",
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* scythe — snath leaning across the robe, crescent blade over the top */}
      <Path
        d="M4.6 3.9 8.4 21.9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M4 3.4C10 .6 17.4 1.9 22 6.6c-5-3-11.9-3.6-18-.4z"
        fill={color}
      />
      {/* robe + skull: one path, evenodd — the skull is the hole */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.7 21.9V11.4a4.9 4.9 0 0 1 9.8 0v10.5zM13.6 7.4a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z"
        fill={color}
      />
      {/* eye sockets, punched back in as the icon colour */}
      <Circle cx="12.2" cy="10.6" r="1.25" fill={color} />
      <Circle cx="15" cy="10.6" r="1.25" fill={color} />
    </Svg>
  );
}
