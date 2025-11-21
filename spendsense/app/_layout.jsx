// app/_layout.jsx
import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "./theme";

function RootStackWrapper() {
  const { palette } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: { backgroundColor: palette.BG },
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* Root wrapper prevents white flash */}
      <View style={{ flex: 1, backgroundColor: "#050816" }}>
        <RootStackWrapper />
      </View>
    </ThemeProvider>
  );
}
