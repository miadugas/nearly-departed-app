import "@/global.css";

import {
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";

import { AuthProvider } from "@/lib/auth/context";
import { AvatarProvider } from "@/lib/avatar/context";
import {
  installCrashBreadcrumb,
  reportPendingCrash,
} from "@/lib/crash-report";
import { FavoritesProvider } from "@/lib/favorites/context";
import { LocationProvider } from "@/lib/location/context";
import { UnitsProvider } from "@/lib/units/context";

// Supabase's session refresh retries by design when the backend is unreachable
// (e.g. free-tier project paused); sync degrades to local-only on purpose, so
// this specific retryable error is noise. Any other auth error stays loud.
LogBox.ignoreLogs([/AuthRetryableFetchError/]);

const queryClient = new QueryClient();

export default function RootLayout() {
  // Crash breadcrumbs: hook the fatal handler now, upload any crumb from a
  // previous session once, off the critical path.
  useEffect(() => {
    installCrashBreadcrumb();
    reportPendingCrash();
  }, []);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    "ClashDisplay-Medium": require("../../assets/fonts/ClashDisplay-Medium.ttf"),
    "ClashDisplay-Semibold": require("../../assets/fonts/ClashDisplay-Semibold.ttf"),
    "ClashDisplay-Bold": require("../../assets/fonts/ClashDisplay-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AvatarProvider>
          <FavoritesProvider>
            <UnitsProvider>
            <LocationProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#050505" },
                animation: "slide_from_right",
              }}
            />
            </LocationProvider>
            </UnitsProvider>
          </FavoritesProvider>
        </AvatarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
