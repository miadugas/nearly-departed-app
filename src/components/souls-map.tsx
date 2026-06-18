import Feather from "@expo/vector-icons/Feather";
import { Text, View } from "react-native";

import type { CemeterySection } from "@/lib/wikidata";

// MapLibre is a native module — on web we render a placeholder so the rest of
// the app still bundles and is verifiable. The real map runs in a dev build.
type Props = {
  center: [number, number];
  zoom: number;
  userCenter: [number, number];
  sections: CemeterySection[];
  selected: string | null;
  onSelectCemetery?: (title: string) => void;
  onRecenter?: () => void;
};

export function SoulsMap({ sections }: Props) {
  return (
    <View className="bg-panel flex-1 items-center justify-center">
      <Feather name="map" size={26} color="rgba(255,255,255,0.25)" />
      <Text className="font-sans text-ink-faint mt-3" style={{ fontSize: 12 }}>
        Map renders in the native app ({sections.length} cemeteries nearby)
      </Text>
    </View>
  );
}
