import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";
import { Markdown } from "@/components/markdown";

export function LegalScreen({
  title,
  source,
}: {
  title: string;
  source: string;
}) {
  return (
    <View className="bg-bg flex-1">
      <SafeAreaView edges={["top"]}>
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-1">
          <BackButton />
          <Text
            className="font-display text-ink"
            style={{ fontSize: 18, letterSpacing: -0.2 }}
          >
            {title}
          </Text>
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
        <Markdown source={source} />
      </ScrollView>
    </View>
  );
}
