import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@/constants/colors";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="config-inicial" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      </Stack>
    </>
  );
}
