import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/icon-button";
import { useAuth } from "@/lib/auth/context";

// Apple/Google are still stubs (separate native-config lift). "Continue with
// email" is live: passwordless 6-digit code via Supabase — no deep links.
function AuthButton({
  icon,
  label,
  variant,
  onPress,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  variant: "solid" | "glass";
  onPress: () => void;
  disabled?: boolean;
}) {
  const solid = variant === "solid";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className="h-[54px] flex-row items-center justify-center rounded-full active:opacity-90"
      style={[
        solid
          ? {
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.28,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 5,
            }
          : {
              backgroundColor: "rgba(255,255,255,0.10)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.26)",
            },
        disabled ? { opacity: 0.5 } : null,
      ]}
    >
      <View className="flex-row items-center" style={{ gap: 10 }}>
        {icon}
        <Text
          className="font-sans-semibold"
          style={{
            fontSize: 16,
            letterSpacing: 0.1,
            color: solid ? "#0a0a0a" : "#fff",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// Glass-style text field matching the auth buttons. Merges any caller `style`
// on top of the base look (so the code field can add letter-spacing/centering
// without wiping out the glass background).
function Field({ style, ...props }: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="rgba(255,255,255,0.4)"
      className="h-[54px] rounded-full px-5"
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.10)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.26)",
          color: "#fff",
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 16,
        },
        style,
      ]}
      {...props}
    />
  );
}

type Mode = "choose" | "email" | "code";

const COPY: Record<Mode, { title: ReactNode; subtitle: string }> = {
  choose: {
    title: <>Save the{"\n"}souls you find</>,
    subtitle:
      "Sign in to keep your favorites and pick up wherever you left off — across every device. No account needed to explore.",
  },
  email: {
    title: "What's your\nemail?",
    subtitle: "We'll send a 6-digit code — no password to remember.",
  },
  code: {
    title: "Enter the code",
    subtitle: "Check your inbox (and spam). It's good for a few minutes.",
  },
};

export default function Auth() {
  const { sendCode, verifyCode } = useAuth();
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soon = () =>
    Alert.alert(
      "Coming soon",
      "Apple and Google sign-in aren't wired up yet — use email for now.",
    );

  const handleSendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      await sendCode(email);
      setCode("");
      setMode("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setBusy(true);
    try {
      await verifyCode(email, code);
      // onAuthStateChange persists the session; drop the user into the app.
      router.replace({ pathname: "/explore", params: { locate: "0" } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't work.");
    } finally {
      setBusy(false);
    }
  };

  const copy = COPY[mode];
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <View className="bg-bg flex-1">
      <Image
        source={require("../../assets/auth-hero.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
      />
      <LinearGradient
        colors={[
          "rgba(5,5,5,0.55)",
          "rgba(5,5,5,0.30)",
          "rgba(5,5,5,0.85)",
          "#050505",
        ]}
        locations={[0, 0.32, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="px-4 pt-1">
          <BackButton />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
        >
          <View className="px-6">
            <Text
              className="text-ink font-display"
              style={{ fontSize: 40, lineHeight: 38, letterSpacing: -1.2 }}
            >
              {copy.title}
            </Text>
            <Text
              className="text-ink-dim font-sans"
              style={{
                fontSize: 15,
                lineHeight: 22,
                maxWidth: 320,
                marginTop: 4,
                marginBottom: 32,
              }}
            >
              {copy.subtitle}
            </Text>

            {mode === "choose" ? (
              <View style={{ gap: 12 }}>
                <AuthButton
                  variant="solid"
                  icon={
                    <FontAwesome
                      name="apple"
                      size={19}
                      color="#0a0a0a"
                      style={{ marginTop: -2 }}
                    />
                  }
                  label="Continue with Apple"
                  onPress={soon}
                />
                <AuthButton
                  variant="solid"
                  icon={
                    <Image
                      source={require("../../assets/google-g.png")}
                      style={{ width: 18, height: 18 }}
                      contentFit="contain"
                    />
                  }
                  label="Continue with Google"
                  onPress={soon}
                />
                <AuthButton
                  variant="glass"
                  icon={<Feather name="mail" size={18} color="#fff" />}
                  label="Continue with email"
                  onPress={() => {
                    setError(null);
                    setMode("email");
                  }}
                />
              </View>
            ) : null}

            {mode === "email" ? (
              <View style={{ gap: 12 }}>
                <Field
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="go"
                  onSubmitEditing={emailValid ? handleSendCode : undefined}
                />
                <AuthButton
                  variant="solid"
                  disabled={busy || !emailValid}
                  icon={
                    busy ? (
                      <ActivityIndicator color="#0a0a0a" />
                    ) : (
                      <Feather name="arrow-right" size={18} color="#0a0a0a" />
                    )
                  }
                  label={busy ? "Sending…" : "Send code"}
                  onPress={handleSendCode}
                />
                <Pressable
                  onPress={() => {
                    setError(null);
                    setMode("choose");
                  }}
                  className="active:opacity-60"
                >
                  <Text
                    className="text-ink-dim font-sans text-center"
                    style={{ fontSize: 13, marginTop: 4 }}
                  >
                    Use a different option
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {mode === "code" ? (
              <View style={{ gap: 12 }}>
                <Field
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
                  placeholder="123456"
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={6}
                  autoFocus
                  returnKeyType="go"
                  onSubmitEditing={code.length === 6 ? handleVerify : undefined}
                  style={{ letterSpacing: 8, textAlign: "center" }}
                />
                <AuthButton
                  variant="solid"
                  disabled={busy || code.length < 6}
                  icon={
                    busy ? (
                      <ActivityIndicator color="#0a0a0a" />
                    ) : (
                      <Feather name="check" size={18} color="#0a0a0a" />
                    )
                  }
                  label={busy ? "Verifying…" : "Verify & continue"}
                  onPress={handleVerify}
                />
                <View className="flex-row items-center justify-between px-1">
                  <Pressable
                    onPress={() => {
                      setError(null);
                      setCode("");
                      setMode("email");
                    }}
                    className="active:opacity-60"
                  >
                    <Text
                      className="text-ink-dim font-sans"
                      style={{ fontSize: 13 }}
                    >
                      Change email
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSendCode}
                    disabled={busy}
                    className="active:opacity-60"
                  >
                    <Text
                      className="text-ink-dim font-sans"
                      style={{ fontSize: 13 }}
                    >
                      Resend code
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {error ? (
              <Text
                className="font-sans text-center"
                style={{
                  color: "#FF6B81",
                  fontSize: 13,
                  lineHeight: 18,
                  marginTop: 14,
                }}
              >
                {error}
              </Text>
            ) : null}

            {mode === "choose" ? (
              <Text
                className="text-ink-faint font-sans text-center"
                style={{ fontSize: 11, lineHeight: 16, marginTop: 22 }}
              >
                By continuing you agree to our{" "}
                <Text
                  onPress={() => router.push("/legal/terms")}
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    textDecorationLine: "underline",
                  }}
                >
                  Terms
                </Text>{" "}
                and{" "}
                <Text
                  onPress={() => router.push("/legal/privacy")}
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    textDecorationLine: "underline",
                  }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
