// app/settings.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";

// Theme colors
const BG = "#050816";
const CARD = "#020617";
const CARD_ELEVATED = "#0F172A";
const TEXT = "#E5E7EB";
const MUTED = "#9CA3AF";
const PRIMARY = "#4F46E5";

// Storage keys
const PERSONAL_KEY = "@spendsense_personal_expenses";
const GROUPS_KEY = "@spendsense_groups";
const ACTIVE_GROUP_KEY = "@spendsense_active_group_id";
const THEME_KEY = "@spendsense_theme";
const NOTIFY_KEY = "@spendsense_notifications";

export default function SettingsScreen() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedTheme = await AsyncStorage.getItem(THEME_KEY);
    const savedNotify = await AsyncStorage.getItem(NOTIFY_KEY);

    if (savedTheme !== null) setDarkMode(savedTheme === "true");
    if (savedNotify !== null) setNotifications(savedNotify === "true");
  };

  const toggleTheme = async (value) => {
    setDarkMode(value);
    await AsyncStorage.setItem(THEME_KEY, value.toString());
  };

  const toggleNotifications = async (value) => {
    setNotifications(value);
    await AsyncStorage.setItem(NOTIFY_KEY, value.toString());
  };

  // EXPORT WITHOUT expo-sharing (safe + works everywhere)
  const handleExportData = async () => {
    try {
      const personal = await AsyncStorage.getItem(PERSONAL_KEY);
      const groups = await AsyncStorage.getItem(GROUPS_KEY);
      const active = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);

      const exportData = {
        personal_expenses: personal ? JSON.parse(personal) : [],
        groups: groups ? JSON.parse(groups) : [],
        active_group: active || null,
        exported_at: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      const fileUri = FileSystem.cacheDirectory + "spendsense-export.json";
      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      Alert.alert(
        "Export complete",
        "Your data has been exported.\n\nFile saved at:\n" + fileUri
      );
    } catch (e) {
      console.log("Export error:", e);
      Alert.alert("Error", "Failed to export data.");
    }
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset all data?",
      "This will delete ALL expenses and groups permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                PERSONAL_KEY,
                GROUPS_KEY,
                ACTIVE_GROUP_KEY,
              ]);
              Alert.alert("Done", "All SpendSense data has been cleared.");
            } catch (e) {
              Alert.alert("Error", "Failed to reset data.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSubtitle}>
          Personalize your SpendSense experience
        </Text>
      </View>

      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={TEXT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>You</Text>
          <Text style={styles.profileMeta}>Spend smarter, live better</Text>
        </View>
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Dark mode</Text>
          <Text style={styles.settingDescription}>
            Always use the dark theme in the app.
          </Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={toggleTheme}
          thumbColor={darkMode ? "#fff" : "#ccc"}
          trackColor={{ true: PRIMARY, false: "#4B5563" }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Text style={styles.settingDescription}>
            Get reminders about your spending.
          </Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={toggleNotifications}
          thumbColor={notifications ? "#fff" : "#ccc"}
          trackColor={{ true: PRIMARY, false: "#4B5563" }}
        />
      </View>

      {/* Data Section */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Data</Text>

      <TouchableOpacity style={styles.linkRow} onPress={handleExportData}>
        <View style={styles.linkIcon}>
          <Ionicons name="cloud-upload-outline" size={18} color={TEXT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Export data</Text>
          <Text style={styles.settingDescription}>
            Save all your SpendSense data as a JSON file.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6B7280" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkRow} onPress={handleResetData}>
        <View style={[styles.linkIcon, { borderColor: "#F97316" }]}>
          <Ionicons name="trash-bin-outline" size={18} color="#F97316" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, { color: "#F97316" }]}>
            Reset all data
          </Text>
          <Text style={styles.settingDescription}>
            Permanently delete all expenses and groups.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6B7280" />
      </TouchableOpacity>

      {/* About */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>About</Text>
      <View style={styles.footerTextContainer}>
        <Text style={styles.footerText}>SpendSense • v0.2</Text>
        <Text style={styles.footerSubText}>
          Built with Expo, React Native & Expo Router
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    marginBottom: 16,
  },
  screenTitle: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "800",
  },
  screenSubtitle: {
    color: MUTED,
    fontSize: 13,
    marginTop: 4,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_ELEVATED,
    borderRadius: 18,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileName: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  profileMeta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD_ELEVATED,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#111827",
  },
  settingLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  settingDescription: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
    maxWidth: "95%",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_ELEVATED,
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#111827",
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  footerTextContainer: {
    marginTop: 4,
  },
  footerText: {
    color: MUTED,
    fontSize: 12,
  },
  footerSubText: {
    color: "#4B5563",
    fontSize: 11,
    marginTop: 2,
  },
});