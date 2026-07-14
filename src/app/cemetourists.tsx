import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";

const DOS = [
  "Go during posted hours. Locked gates mean no.",
  "Silence your phone before you're through the gate.",
  "Keep to paths; walk between headstones, not across graves.",
  "Keep it quiet — a funeral outranks tourism, every time. Wide berth or come back later.",
  "Driving in? Crawl (10–15 mph), park where posted, and pull over for processions. Never honk.",
  "Keep kids close and off the monuments. Give them a job — carrying flowers works.",
  "Close gates behind you.",
  "See damage? Tell the office. Don't fix it yourself.",
];

const DONTS = [
  "Don't touch, lean on, or rub headstones. Old stone is fragile; rubbings are banned in many cemeteries.",
  "Don't take anything — flowers, coins, stones on headstones. They were left on purpose, and they mean something.",
  "Don't move or rearrange anything for a better photo. And photograph headstones, not mourners.",
  "Don't leave anything that won't decompose — and pack out every wrapper.",
  "No alcohol. No picnics on graves. Pets only if posted, leashed, and cleaned up after.",
];

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

function EtiquetteRow({ icon, text }: { icon: "check" | "x"; text: string }) {
  return (
    <View className="flex-row items-start gap-3 py-2.5">
      <View style={{ width: 17, paddingTop: 2 }}>
        <Feather name={icon} size={16} color="rgba(255,255,255,0.55)" />
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

export default function Cemetourists() {
  return (
    <View className="bg-bg flex-1">
      {/* ambient decoration — flush to the top-right corner, behind content */}
      <Image
        source={require("@/assets/images/spider-hanging.png")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          opacity: 0.28,
          zIndex: 0,
        }}
        contentFit="contain"
        pointerEvents="none"
      />

      <View style={{ zIndex: 1, flex: 1 }}>
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
            className="text-ink font-display"
            style={{ fontSize: 28, letterSpacing: -0.5 }}
          >
            Cemetourists
          </Text>
          <Text
            className="text-ink-dim font-sans mt-1"
            style={{ fontSize: 14, lineHeight: 20 }}
          >
            The do&apos;s &amp; don&apos;ts of visiting well.
          </Text>

          <View className="mt-8">
            <SectionLabel>Do&apos;s</SectionLabel>
            <View className="mt-2">
              {DOS.map((item) => (
                <EtiquetteRow key={item} icon="check" text={item} />
              ))}
            </View>
          </View>

          <View className="mt-7">
            <SectionLabel>Don&apos;ts</SectionLabel>
            <View className="mt-2">
              {DONTS.map((item) => (
                <EtiquetteRow key={item} icon="x" text={item} />
              ))}
            </View>
          </View>

          <Text
            className="text-ink-faint font-sans text-center"
            style={{
              fontSize: 13,
              lineHeight: 19,
              marginTop: 32,
              fontStyle: "italic",
            }}
          >
            You&apos;re a guest in someone&apos;s forever home. Act like it.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
