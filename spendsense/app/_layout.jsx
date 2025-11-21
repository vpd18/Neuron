// app/_layout.jsx
import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "./theme";
import { ScaledSheet } from "react-native-size-matters";

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
      {/* Splash → Welcome → Tabs */}
      <Stack.Screen name="splash" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* Root wrapper eliminates white flash on transitions */}
      <View style={styles.rootWrapper}>
        <RootStackWrapper />
      </View>
    </ThemeProvider>
  );
}

const styles = ScaledSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: "#050816", // dark fallback to match theme
  },
});
