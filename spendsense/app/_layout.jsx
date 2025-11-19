// app/_layout.jsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BG = "#050816";
const CARD = "#020617";
const TEXT = "#E5E7EB";
const MUTED = "#6B7280";
const PRIMARY = "#4F46E5";
const BORDER = "#111827";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: BG, // dark header
        },
        headerTitleStyle: {
          color: TEXT,
          fontSize: 20,
          fontWeight: "700",
        },
        headerTintColor: TEXT,

        // ⬇️ Full-width tab bar, just lifted above system buttons
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 24,           // <--- key line: move bar up from bottom
          backgroundColor: CARD,
          borderTopColor: BORDER,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
          borderTopWidth: 1,
          elevation: 8,
        },

        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        // Give content space so it doesn't hide behind the raised tab bar
        sceneStyle: {
          backgroundColor: BG,
          paddingBottom: 90,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Personal",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
