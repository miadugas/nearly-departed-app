import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";
import { Markdown } from "@/components/markdown";

export function LegalScreen({ source }: { source: string }) {
  // Lift the H1 and the two date lines out of the markdown and typeset them
  // as a centered header: one-line title, dates joined on a single line.
  const title =
    source.match(/^#\s*(.+?)(?:\s+—.*)?$/m)?.[1] ?? "Legal";
  const effective = source.match(/\*\*Effective date:\*\*\s*(.+)/)?.[1];
  const updated = source.match(/\*\*Last updated:\*\*\s*(.+)/)?.[1];
  const body = source
    .replace(/^#[^\n]*\n/, "")
    .replace(/\*\*Effective date:\*\*[^\n]*\n?/, "")
    .replace(/\*\*Last updated:\*\*[^\n]*\n?/, "");

  return (
    <View className="bg-bg flex-1">
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pb-1 pt-1">
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
          className="font-display text-ink text-center"
          style={{ fontSize: 30, letterSpacing: -0.5 }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {(effective || updated) && (
          <Text
            className="font-sans text-ink-dim mt-2 text-center"
            style={{ fontSize: 12.5 }}
            numberOfLines={1}
          >
            {effective ? (
              <>
                <Text className="font-sans-semibold text-ink">Effective</Text>{" "}
                {effective}
              </>
            ) : null}
            {effective && updated ? "  ·  " : null}
            {updated ? (
              <>
                <Text className="font-sans-semibold text-ink">Updated</Text>{" "}
                {updated}
              </>
            ) : null}
          </Text>
        )}
        <View style={{ height: 18 }} />
        <Markdown source={body} />
      </ScrollView>
    </View>
  );
}
