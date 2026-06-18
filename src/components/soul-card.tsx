import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { lifespan, thumbUrl, type Soul } from "@/lib/wikidata";

export function SoulCard({ soul }: { soul: Soul }) {
  const initial = (soul.label || "?").trim().charAt(0).toUpperCase();
  const years = lifespan(soul);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/person/[qid]",
          params: { qid: soul.qid, data: JSON.stringify(soul) },
        })
      }
      className="flex-row gap-3 border-b border-line px-5 py-4 active:bg-glass"
    >
      {soul.image ? (
        <Image
          source={{ uri: thumbUrl(soul.image) }}
          style={{ width: 54, height: 54, borderRadius: 14 }}
          contentFit="cover"
        />
      ) : (
        <View className="bg-panel-2 h-[54px] w-[54px] items-center justify-center rounded-2xl border border-line">
          <Text
            className="font-display text-ink-faint"
            style={{ fontSize: 22 }}
          >
            {initial}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          className="font-display text-ink"
          style={{ fontSize: 18, letterSpacing: -0.3 }}
        >
          {soul.label}
          {years ? (
            <Text className="font-sans text-ink-faint" style={{ fontSize: 12 }}>
              {`   ${years}`}
            </Text>
          ) : null}
        </Text>

        <Text
          className="font-sans text-ink-dim"
          style={{ fontSize: 13, lineHeight: 18, marginTop: 2 }}
          numberOfLines={2}
        >
          {soul.desc || "—"}
        </Text>

        {soul.occs.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {soul.occs.slice(0, 3).map((o) => (
              <View
                key={o}
                className="rounded-full border border-line px-2 py-0.5"
              >
                <Text
                  className="text-ink-dim"
                  style={{
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 10,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {o}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="mt-2 flex-row items-center">
          <Text className="font-sans text-ink-faint" style={{ fontSize: 11 }}>
            {soul.place} · {soul.dist.toFixed(1)} km
          </Text>
          <View style={{ flex: 1 }} />
          <Feather
            name="chevron-right"
            size={16}
            color="rgba(255,255,255,0.45)"
          />
        </View>
      </View>
    </Pressable>
  );
}
