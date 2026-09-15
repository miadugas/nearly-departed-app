import Feather from "@expo/vector-icons/Feather";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";

// Same footprint as the person page's secondary button (glass fill + 1px
// outline). Blur is invisible on this background, so the fill is a literal
// alpha wash.
const SECONDARY_SURFACE = {
  backgroundColor: "rgba(255,255,255,0.12)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.30)",
} as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="text-ink-faint"
      style={{
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 11,
        letterSpacing: 1.6,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

function CountsRow({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-3 py-2.5">
      <View style={{ width: 17, paddingTop: 2 }}>
        <Feather name="check" size={16} color="rgba(255,255,255,0.55)" />
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

function LinkButton({
  label,
  url,
  icon,
}: {
  label: string;
  url: string;
  icon: "external-link" | "book-open";
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      className="mt-3 flex-row items-center justify-center rounded-full py-[18px] active:opacity-85"
      style={SECONDARY_SURFACE}
    >
      <Feather name={icon} size={17} color="#fff" />
      <Text
        className="text-ink font-sans-semibold ml-2"
        style={{ fontSize: 16 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function DiedHere() {
  return (
    <View className="bg-bg flex-1">
      <SafeAreaView edges={["top"]}>
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-1">
          <BackButton />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-ink font-display text-center"
          style={{ fontSize: 30, letterSpacing: -0.5 }}
          numberOfLines={1}
        >
          Died here
        </Text>
        <Text
          className="text-ink-dim font-sans mt-2 text-center"
          style={{ fontSize: 12.5 }}
        >
          Flip the map from where notable people are buried to where they died —
          the hospital, the hotel, the battlefield.
        </Text>

        <View className="mt-8">
          <SectionLabel>What counts</SectionLabel>
          <View className="mt-2">
            <CountsRow text="A recorded spot. Wikidata knows a place of death for most notable people, but for most of them it's only the city. A city is one pin on a map, so we skip it." />
            <CountsRow text="Anything with its own coordinates and no population count stays — hospitals, hotels, theaters, parks, battlefields." />
          </View>
        </View>

        <View className="mt-7">
          <SectionLabel>Why the list is shorter</SectionLabel>
          <Text
            className="text-ink font-sans mt-2"
            style={{ fontSize: 15, lineHeight: 22 }}
          >
            Denver has hundreds of notable burials and only a few dozen recorded
            death spots. Imagine the noise in Boston or Philadelphia. No thank
            you. No one wants that. Best way to fix it? Read on…
          </Text>
        </View>

        <View className="mt-7">
          <SectionLabel>Give back</SectionLabel>
          <Text
            className="text-ink font-sans mt-2"
            style={{ fontSize: 15, lineHeight: 22 }}
          >
            Everything on this map comes from Wikidata — the free,
            volunteer-built record behind Wikipedia&apos;s fact boxes, the
            knowledge panels in your search results, and apps like this one.
            Nobody owns it. Everybody uses it.
          </Text>
          <Text
            className="text-ink font-sans mt-3"
            style={{ fontSize: 15, lineHeight: 22 }}
          >
            Know where someone died? Add place of death to their Wikidata item.
            The next search reads it, and so does everyone else&apos;s.
          </Text>
          <View className="mt-4">
            <LinkButton
              label="Open Wikidata"
              url="https://www.wikidata.org/"
              icon="external-link"
            />
            <LinkButton
              label="How to edit Wikidata"
              url="https://www.wikidata.org/wiki/Wikidata:Introduction#How_can_I_contribute%3F"
              icon="book-open"
            />
          </View>
        </View>

        <Text
          className="text-ink-dim font-sans text-center"
          style={{
            fontSize: 13,
            marginTop: 32,
          }}
        >
          Every person page has an &quot;Improve this record on Wikidata&quot;
          link.
        </Text>
      </ScrollView>
    </View>
  );
}
