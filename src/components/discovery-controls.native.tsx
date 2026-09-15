import { Host, HStack, Picker, Text } from "@expo/ui/swift-ui";
import {
  clipped,
  foregroundColor,
  frame,
  labelsHidden,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { Keyboard, useWindowDimensions } from "react-native";

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

// Timer-app style: two wheel pickers side by side in one native SwiftUI host,
// replacing the old two-row toggle + chip layout. 96pt shows ~3 rows per wheel.
export function DiscoveryControls({
  mode,
  onModeChange,
  radiusSlot,
  onRadiusChange,
  radii,
  unit,
}: Props) {
  // header has 20pt padding each side; 8 = HStack spacing between the two wheels
  const { width } = useWindowDimensions();
  const colWidth = (width - 40 - 8) / 2;

  return (
    <Host matchContents colorScheme="dark" style={{ width: "100%" }}>
      <HStack spacing={8}>
        <Picker
          selection={mode}
          onSelectionChange={(v) => {
            Keyboard.dismiss();
            onModeChange(v as SoulMode);
          }}
          modifiers={[
            pickerStyle("wheel"),
            labelsHidden(),
            frame({ width: colWidth, height: 96 }),
            clipped(),
          ]}
        >
          <Text modifiers={[tag("buried"), foregroundColor("#ffffff")]}>
            Buried here
          </Text>
          <Text modifiers={[tag("died"), foregroundColor("#ffffff")]}>
            Died here
          </Text>
        </Picker>
        <Picker
          selection={radiusSlot}
          onSelectionChange={(v) => {
            Keyboard.dismiss();
            onRadiusChange(v as number);
          }}
          modifiers={[
            pickerStyle("wheel"),
            labelsHidden(),
            frame({ width: colWidth, height: 96 }),
            clipped(),
          ]}
        >
          {radii.map((r, slot) => (
            <Text key={r} modifiers={[tag(slot), foregroundColor("#ffffff")]}>
              {formatRadius(r, unit)}
            </Text>
          ))}
        </Picker>
      </HStack>
    </Host>
  );
}
