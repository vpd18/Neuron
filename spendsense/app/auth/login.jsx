// app/auth/login.jsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme";

export default function Login() {
  const router = useRouter();
  const { palette } = useTheme();

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: palette.BG, opacity: fade },
      ]}
    >
      <Text style={[styles.title, { color: palette.TEXT }]}>Sign In</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor={palette.MUTED}
        style={[
          styles.input,
          { backgroundColor: palette.CARD, borderColor: palette.BORDER },
        ]}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor={palette.MUTED}
        secureTextEntry
        style={[
          styles.input,
          { backgroundColor: palette.CARD, borderColor: palette.BORDER },
        ]}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: palette.PRIMARY }]}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/signup")}>
        <Text style={[styles.switchText, { color: palette.PRIMARY }]}>
          Don’t have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 30 },
  input: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    fontSize: 14,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  switchText: { textAlign: "center", fontWeight: "600", marginTop: 10 },
});
