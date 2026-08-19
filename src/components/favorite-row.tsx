import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { FavoriteSoul } from "@/lib/favorites/types";
import { lifeYears, thumbUrl } from "@/lib/wikidata";

export function FavoriteRow({
  fav,
  onRemove,
}: {
  fav: FavoriteSoul;
  onRemove: () => void;
}) {
  const initial = (fav.label || "?").trim().charAt(0).toUpperCase();
  const { born: a, died: b } = lifeYears(fav);
  const years = a || b ? `${a || "?"}–${b || "?"}` : "";

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/person/[qid]",
          params: { qid: fav.qid, data: JSON.stringify(fav) },
        })
      }
      className="active:bg-glass flex-row items-center gap-3 border-b border-line px-5 py-4"
    >
      {fav.image ? (
        <Image
          source={{ uri: thumbUrl(fav.image) }}
          style={{ width: 52, height: 52, borderRadius: 14 }}
          contentFit="cover"
        />
      ) : (
        <View className="bg-panel-2 h-[52px] w-[52px] items-center justify-center rounded-2xl border border-line">
          <Text
            className="font-display text-ink-faint"
            style={{ fontSize: 21 }}
          >
            {initial}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          className="font-display text-ink"
          style={{ fontSize: 17, letterSpacing: -0.3 }}
          numberOfLines={1}
        >
          {fav.label}
        </Text>
        <Text
          className="font-sans text-ink-dim"
          style={{ fontSize: 12, marginTop: 2 }}
          numberOfLines={1}
        >
          {[years, fav.place].filter(Boolean).join(" · ") || fav.desc || "—"}
        </Text>
      </View>

      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Remove from saved"
        className="h-9 w-9 items-center justify-center active:opacity-60"
      >
        <FontAwesome name="heart" size={16} color="#FF6B81" />
      </Pressable>
    </Pressable>
  );
}

// One cell in the avatar picker grid — a fixed-size ring that only shows
// color when selected, wrapping a constant-size circular thumbnail so
// selecting/deselecting never nudges the artwork inside it.
