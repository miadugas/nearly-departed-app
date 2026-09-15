import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { ACCENT } from "@/lib/colors";
import {
  type FavoriteSoul,
  placeKindOfFav,
  visitStampOf,
} from "@/lib/favorites/types";
import { lifeYears, thumbUrl } from "@/lib/wikidata";

// The drawer revealed by swiping the row left. `rightActions` is an absolute-fill
// row-reverse container, so a fixed-width child stretches to the row's height for
// free — no measuring, no height plumbing from the row.
function RemoveAction({ onRemove }: { onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel="Remove from saved"
      className="bg-panel-2 w-24 items-center justify-center active:opacity-70"
    >
      <Feather name="trash-2" size={20} color="#ffffff" />
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 12,
          color: "#ffffff",
          marginTop: 6,
        }}
      >
        Remove
      </Text>
    </Pressable>
  );
}

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
  // Saved is the default; only a proximity-verified visit stamps the row.
  const visited = visitStampOf(fav) !== undefined;
  // A death-place favorite must never read like a grave.
  const place =
    placeKindOfFav(fav) === "death" ? `died · ${fav.place}` : fav.place;

  // WHY RNGH here but not in the Discover sheet: explore.tsx drives its sheet
  // drag with raw responder props precisely because the Pressables inside it
  // swallowed the pan handlers. A list row is the textbook Swipeable case —
  // the gesture owns the horizontal axis, the Pressable owns the tap, and
  // RNGH arbitrates between them, so there is no conflict to work around.
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => <RemoveAction onRemove={onRemove} />}
    >
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/person/[qid]",
            params: { qid: fav.qid, data: JSON.stringify(fav) },
          })
        }
        // VoiceOver never gets the swipe, so removal is exposed as a rotor
        // action on the row itself.
        accessibilityActions={[{ name: "delete", label: "Remove from saved" }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName !== "delete") return;
          onRemove();
        }}
        className="active:bg-glass bg-bg flex-row items-center gap-3 border-b border-line px-5 py-4"
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
            {[years, place].filter(Boolean).join(" · ") || fav.desc || "—"}
          </Text>
        </View>

        {/* Indicator, not a control — removal lives on the swipe now. Same 36pt
            box as the old button so the row's layout is unchanged. */}
        <View
          accessibilityLabel={visited ? "Visited" : "Saved"}
          className="h-9 w-9 items-center justify-center"
        >
          {/* outline = kept, filled = been there; the section header names the
              state, the heart is what you scan row to row */}
          <FontAwesome
            name={visited ? "heart" : "heart-o"}
            size={16}
            color={ACCENT}
          />
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

// One cell in the avatar picker grid — a fixed-size ring that only shows
// color when selected, wrapping a constant-size circular thumbnail so
// selecting/deselecting never nudges the artwork inside it.
