// app/splash.jsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { ThemeProvider, useTheme } from "./_theme";

export default function SplashScreen() {
  const router = useRouter();
  const { palette } = useTheme();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      router.replace("welcome"); // instant (no animation)
    }, 1650);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: palette.BG }]}>
      <Animated.View
        style={{
          opacity: fade,
          transform: [{ scale }, { translateY }],
          alignItems: "center",
        }}
      >
        <View
          style={[
            styles.logoCircle,
            {
              backgroundColor: palette.CARD_ELEVATED,
              borderColor: palette.PRIMARY,
            },
          ]}
        >
          <Text style={[styles.logoText, { color: palette.PRIMARY }]}>₹</Text>
        </View>

        <Text style={[styles.title, { color: palette.TEXT }]}>SpendSense</Text>
        <Text style={[styles.subtitle, { color: palette.MUTED }]}>
          Smart • Simple • Seamless
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  logoText: { fontSize: 42, fontWeight: "900" },
  title: { fontSize: 30, fontWeight: "800", marginTop: 6 },
  subtitle: { fontSize: 13, marginTop: 8, opacity: 0.8 },
});
