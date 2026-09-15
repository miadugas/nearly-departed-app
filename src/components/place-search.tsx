import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { searchPlaces, type Place } from "@/lib/geocode";

export function PlaceSearch({
  onPick,
  onFocus,
  selected,
  onClear,
}: {
  onPick: (place: Place) => void;
  onFocus?: () => void;
  selected: Place | null;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 280);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useQuery({
    queryKey: ["geocode", debounced],
    queryFn: () => searchPlaces(debounced),
    enabled: debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const open = q.length >= 2 && q !== pickedLabel;

  // Explore clears the place on tab re-select (recenter) — the field must
  // follow. Adjusted during render (React's documented state-mirrors-a-prop
  // escape hatch, using state rather than a ref — refs can't be touched
  // during render) so the clear lands in the same commit as the prop change.
  const [prevSelected, setPrevSelected] = useState(selected);
  if (prevSelected !== selected) {
    setPrevSelected(selected);
    if (selected === null && pickedLabel !== null) {
      setQ("");
      setPickedLabel(null);
    }
  }

  const isPickedText = selected !== null && q === pickedLabel;

  return (
    <View style={{ position: "relative", zIndex: 20 }}>
      <View
        className="bg-glass flex-row items-center gap-2 rounded-full border border-line px-4"
        style={{ height: 44 }}
      >
        <Feather name="search" size={16} color="rgba(255,255,255,0.5)" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search a place — city, cemetery…"
          placeholderTextColor="rgba(255,255,255,0.50)"
          className="text-ink flex-1"
          style={{
            fontFamily: isPickedText
              ? "PlusJakartaSans_600SemiBold"
              : "PlusJakartaSans_400Regular",
            fontSize: 14,
            letterSpacing: 0,
          }}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          onFocus={onFocus}
        />
        {q.length > 0 && (
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setQ("");
              setPickedLabel(null);
              onClear();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              selected ? "Clear place, back to your location" : "Clear search"
            }
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.92)",
              }}
            >
              <Feather name="x" size={13} color="#0a0a0a" />
            </View>
          </Pressable>
        )}
      </View>

      {open && (
        <View
          className="bg-panel-2 absolute left-0 right-0 overflow-hidden rounded-2xl border border-line"
          style={{
            top: 50,
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          }}
        >
          {isFetching && !data ? (
            <View className="items-center p-4">
              <ActivityIndicator color="#ffffff" />
            </View>
          ) : data && data.length > 0 ? (
            data.map((p, i) => (
              <Pressable
                key={`${p.lat},${p.lon},${i}`}
                onPress={() => {
                  Keyboard.dismiss(); // picking navigates the map — typing is done
                  onPick(p);
                  setQ(p.label);
                  setPickedLabel(p.label);
                }}
                className="flex-row items-center gap-3 border-b border-line px-4 py-3 active:bg-glass"
              >
                <Feather
                  name="map-pin"
                  size={14}
                  color="rgba(255,255,255,0.45)"
                />
                <Text
                  numberOfLines={1}
                  className="text-ink font-sans-medium flex-1"
                  style={{ fontSize: 14 }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))
          ) : (
            <View className="p-4">
              <Text
                className="text-ink-faint font-sans"
                style={{ fontSize: 13 }}
              >
                No places found.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
