import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AVATARS, type AvatarId } from "@/lib/avatar/avatars";
import { checkDisplayName } from "@/lib/name-policy";
import { sanitizeDisplayName } from "@/lib/sync/merge";

function AvatarCell({
  selected,
  label,
  onPress,
  children,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <View style={{ width: "25%", alignItems: "center", paddingVertical: 10 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: selected ? 2 : 0,
          borderColor: "#FF6B81",
        }}
      >
        <View
          className="border-line"
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
          }}
        >
          {children}
        </View>
      </Pressable>
    </View>
  );
}

// Bottom-sheet avatar picker — a transparent, slide-up Modal (no new deps)
// matching the app's dark idiom. "None" is a pinned first cell that clears
// the selection back to the skull/initial default.
export function AvatarPickerModal({
  visible,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: AvatarId | null;
  onClose: () => void;
  onSelect: (id: AvatarId | null) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close avatar picker"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        />
        <SafeAreaView
          edges={["bottom"]}
          className="bg-bg border-t border-line"
          style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          <Text
            className="text-ink-faint px-5 pb-3 pt-5"
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            Choose your ghoul
          </Text>
          <ScrollView
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 12,
              paddingBottom: 24,
            }}
          >
            <AvatarCell
              selected={selected === null}
              label="None"
              onPress={() => onSelect(null)}
            >
              <MaterialCommunityIcons
                name="skull-outline"
                size={28}
                color="rgba(255,255,255,0.5)"
              />
            </AvatarCell>
            {AVATARS.map((avatar) => (
              <AvatarCell
                key={avatar.id}
                selected={selected === avatar.id}
                label={avatar.label}
                onPress={() => onSelect(avatar.id)}
              >
                <Image
                  source={avatar.source}
                  style={{ width: 60, height: 60 }}
                  contentFit="cover"
                />
              </AvatarCell>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Bottom-sheet display-name editor — keyboard avoidance keeps both intent
// actions reachable while the focused field is open.
export function NameEditorModal({
  visible,
  name,
  onClose,
  onSave,
}: {
  visible: boolean;
  name: string | null;
  onClose: () => void;
  onSave: (name: string | null) => void;
}) {
  const [draft, setDraft] = useState(name ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    // Policy first (it explains itself), then the shared sanitizer for shape.
    const verdict = checkDisplayName(draft);
    if (!verdict.ok) {
      setError(verdict.reason);
      return;
    }
    setError(null);
    onSave(verdict.name === null ? null : sanitizeDisplayName(verdict.name));
    onClose();
  };

  const handleClear = () => {
    setError(null);
    onSave(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close display name editor"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView
            edges={["bottom"]}
            className="bg-bg border-t border-line"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <Text
              className="text-ink-faint px-5 pb-3 pt-5"
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 11,
                letterSpacing: 1.6,
                textTransform: "uppercase",
              }}
            >
              What should we call you?
            </Text>
            <TextInput
              value={draft}
              onChangeText={(next) => {
                setDraft(next);
                if (error) setError(null);
              }}
              autoFocus={visible}
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              placeholder="Your display name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="mx-5 h-[54px] rounded-full px-5"
              style={{
                backgroundColor: "rgba(255,255,255,0.10)",
                borderWidth: 1,
                borderColor: error ? "#ff6f87" : "rgba(255,255,255,0.26)",
                color: "#fff",
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
              }}
            />
            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="font-sans px-6 pt-2"
                style={{ color: "#ff6f87", fontSize: 13, lineHeight: 18 }}
              >
                {error}
              </Text>
            ) : null}
            <View className="flex-row gap-3 px-5 pb-5 pt-4">
              <Pressable
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear display name"
                className="h-[50px] flex-1 items-center justify-center rounded-full active:opacity-70"
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.26)",
                }}
              >
                <Text className="font-sans-semibold text-ink" style={{ fontSize: 15 }}>
                  Clear
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Save display name"
                className="h-[50px] flex-1 items-center justify-center rounded-full active:opacity-80"
                style={{ backgroundColor: "#fff" }}
              >
                <Text
                  className="font-sans-semibold"
                  style={{ color: "#0a0a0a", fontSize: 15 }}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
