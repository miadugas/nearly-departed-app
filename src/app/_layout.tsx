import "@/global.css";

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

import { FavoritesProvider } from "@/lib/favorites/context";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    "ClashDisplay-Medium": require("../../assets/fonts/ClashDisplay-Medium.ttf"),
    "ClashDisplay-Semibold": require("../../assets/fonts/ClashDisplay-Semibold.ttf"),
    "ClashDisplay-Bold": require("../../assets/fonts/ClashDisplay-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#050505" },
            animation: "slide_from_right",
          }}
        />
      </FavoritesProvider>
    </QueryClientProvider>
  );
}
