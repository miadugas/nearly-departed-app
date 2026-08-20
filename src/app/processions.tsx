import Feather from "@expo/vector-icons/Feather";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";

const PINK = "#ff6f87";

// What a procession is, told once, before the feature exists. The point is to
// establish the noun — a guided walk is "a procession" — so the eventual
// release isn't introducing new vocabulary to people who already use the app.
const STEPS: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  {
    icon: "map",
    text: "A route through one cemetery, in walking order — not a list you sort out yourself at the gate.",
  },
  {
    icon: "book-open",
    text: "Ten to fifteen stops, each with a few lines on who's here and why the walk goes this way.",
  },
  {
    icon: "map-pin",
    text: "Pins checked on foot, so the marker you're standing at is the one you came for.",
  },
];

function Step({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View className="flex-row items-start gap-4 py-3.5">
      <View style={{ width: 22, paddingTop: 2 }}>
        <Feather name={icon} size={18} color={PINK} />
      </View>
      <Text
        className="text-ink font-sans flex-1"
        style={{ fontSize: 15, lineHeight: 22 }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function Processions() {
  return (
    <View className="bg-bg flex-1">
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pb-1 pt-1">
          <BackButton />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 56,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-ink font-serif text-center"
          style={{ fontSize: 40, lineHeight: 44, letterSpacing: -0.8 }}
        >
          Processions
        </Text>
        <Text
          className="text-ink-dim font-sans mt-2 text-center"
          style={{ fontSize: 12.5 }}
        >
          Guided walks. Coming to Nearly Departed.
        </Text>

        <Text
          className="text-ink font-serif mt-8"
          style={{ fontSize: 22, lineHeight: 28 }}
        >
          Discovery shows you who&apos;s near. A procession tells you where to
          start, where to go next, and why any of it matters.
        </Text>

        <View className="mt-6 border-t border-line pt-2">
          {STEPS.map((step) => (
            <Step key={step.icon} icon={step.icon} text={step.text} />
          ))}
        </View>

        <View className="mt-8 border-t border-line pt-6">
          <Text
            className="text-ink-faint"
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            And your own
          </Text>
          <Text
            className="text-ink font-sans mt-3"
            style={{ fontSize: 15, lineHeight: 22 }}
          >
            You&apos;ll be able to build your own, too — pick the stops, set the
            order, say why each one earned its place.
          </Text>
          <Text
            className="text-ink-dim font-sans mt-3"
            style={{ fontSize: 15, lineHeight: 22 }}
          >
            Yours stays private unless you hand someone the link. Then they walk
            it exactly the way you laid it out.
          </Text>
        </View>

        <Text
          className="text-ink-faint font-sans mt-10 text-center"
          style={{ fontSize: 13, lineHeight: 19, fontStyle: "italic" }}
        >
          The first walks are being mapped on foot right now.
        </Text>
      </ScrollView>
    </View>
  );
}
