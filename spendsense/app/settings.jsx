// app/settings.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// legacy FS import to keep writeAsStringAsync behavior for your current SDK
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { useTheme } from "./theme";

// Storage keys
const PERSONAL_KEY = "@spendsense_personal_expenses";
const GROUPS_KEY = "@spendsense_groups";
const ACTIVE_GROUP_KEY = "@spendsense_active_group_id";
const THEME_KEY = "@spendsense_theme";
const NOTIFY_KEY = "@spendsense_notifications";
// any additional keys you might have used previously
const PROFILE_KEY = "@spendsense_profile";

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, palette, toggleTheme } = useTheme();
  const styles = makeStyles(palette);

  const [notifications, setNotifications] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    console.log("[Settings] mounted");
    loadNotify();
  }, []);

  const loadNotify = async () => {
    try {
      const savedNotify = await AsyncStorage.getItem(NOTIFY_KEY);
      console.log("[Settings] loadNotify ->", savedNotify);
      setNotifications(savedNotify === null ? true : savedNotify === "true");
    } catch (e) {
      console.error("[Settings] loadNotify error", e);
    }
  };

  const handleToggleTheme = async (value) => {
    console.log("[Settings] handleToggleTheme ->", value);
    try {
      // update global theme (ThemeProvider will persist)
      toggleTheme(value);
    } catch (e) {
      console.error("[Settings] handleToggleTheme error", e);
      Alert.alert("Error", "Could not toggle theme.");
    }
  };

  const toggleNotifications = async (value) => {
    console.log("[Settings] toggleNotifications ->", value);
    try {
      setNotifications(value);
      await AsyncStorage.setItem(NOTIFY_KEY, value ? "true" : "false");
    } catch (e) {
      console.error("[Settings] toggleNotifications error", e);
      Alert.alert("Error", "Could not save notification preference.");
    }
  };

  const handleExportData = async () => {
    console.log("[Settings] handleExportData");
    setBusy(true);
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

      // Web fallback: use browser download
      if (Platform.OS === "web") {
        try {
          const blob = new Blob([jsonString], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `spendsense-export-${new Date().toISOString()}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          Alert.alert("Export complete", "Downloaded JSON file (web). Check your downloads.");
          console.log("[Settings] export -> downloaded (web)");
        } catch (e) {
          console.error("[Settings] web export error", e);
          Alert.alert("Error", "Web export failed. See console.");
        } finally {
          setBusy(false);
        }
        return;
      }

      // Native: write to documentDirectory (or fallback to cacheDirectory)
      const filename = `spendsense-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!dir) {
        console.warn("[Settings] FileSystem.documentDirectory is null. Using cacheDirectory.");
      }
      const fileUri = (dir || FileSystem.cacheDirectory) + filename;

      // Using legacy import ensures writeAsStringAsync is available in your environment
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      const info = await FileSystem.getInfoAsync(fileUri);

      Alert.alert("Export complete", `Saved to: ${fileUri}\nExists: ${info.exists}`);
      console.log("[Settings] export saved ->", fileUri, info);
    } catch (e) {
      console.error("[Settings] export error", e);
      Alert.alert("Error", "Failed to export data. See console for details.");
    } finally {
      setBusy(false);
    }
  };

  const confirmResetData = () => {
    Alert.alert(
      "Reset all data?",
      "This will delete ALL expenses and groups permanently.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: handleResetData },
      ]
    );
  };

  // Robust reset: remove all @spendsense* keys + explicit keys, then reload app
  const handleResetData = async () => {
    console.log("[Settings] handleResetData (start)");
    setBusy(true);
    try {
      // 1) List all keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("[Settings] all AsyncStorage keys BEFORE reset:", allKeys);

      // 2) Collect keys with prefix @spendsense
      const spendKeys = allKeys.filter((k) => k && k.startsWith("@spendsense"));
      // include known extra keys (profile etc.)
      const extras = [PROFILE_KEY];
      const keysToRemove = Array.from(new Set([...spendKeys, ...extras]));

      if (keysToRemove.length > 0) {
        console.log("[Settings] removing keys:", keysToRemove);
        await AsyncStorage.multiRemove(keysToRemove);
      } else {
        console.log("[Settings] no @spendsense keys found to remove");
      }

      // 3) Also remove explicit keys defensively
      const explicit = [PERSONAL_KEY, GROUPS_KEY, ACTIVE_GROUP_KEY, THEME_KEY, NOTIFY_KEY];
      console.log("[Settings] also removing explicit keys (if any):", explicit);
      await AsyncStorage.multiRemove(explicit);

      // 4) Reset local UI state
      setNotifications(true);
      try {
        // request ThemeProvider to reset to dark (if toggleTheme accepts boolean)
        toggleTheme(true);
      } catch (e) {
        console.warn("[Settings] toggleTheme during reset failed", e);
      }

      // 5) Inform user and reload so screens re-read storage
      Alert.alert(
        "Done",
        "All SpendSense data has been cleared. The app will reload to apply changes.",
        [
          {
            text: "OK",
            onPress: async () => {
              try {
                if (Updates && Updates.reloadAsync) {
                  console.log("[Settings] reloading app via Updates.reloadAsync()");
                  await Updates.reloadAsync();
                  return;
                }
              } catch (e) {
                console.warn("[Settings] Updates.reloadAsync failed", e);
              }

              // fallback: replace route to root to force remounts
              try {
                console.log("[Settings] fallback: replacing route to '/'");
                router.replace("/");
              } catch (e) {
                console.warn("[Settings] router.replace fallback failed", e);
                Alert.alert(
                  "Restart required",
                  "Please fully close and re-open the app to complete reset."
                );
              }
            },
          },
        ]
      );

      console.log("[Settings] handleResetData (done)");
    } catch (e) {
      console.error("[Settings] reset error", e);
      Alert.alert("Error", "Failed to reset data. See console.");
    } finally {
      setBusy(false);
    }
  };

  // Profile card press: navigate to /profile (not in tab bar)
  const openProfile = () => {
    router.push("/profile");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSubtitle}>Personalize your SpendSense experience</Text>
      </View>

      {/* Profile (clickable) */}
      <TouchableOpacity style={styles.profileCard} onPress={openProfile} activeOpacity={0.8}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={palette.TEXT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>You</Text>
          <Text style={styles.profileMeta}>Spend smarter, live better</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.MUTED} />
      </TouchableOpacity>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Dark mode</Text>
          <Text style={styles.settingDescription}>Always use the dark theme in the app.</Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={handleToggleTheme}
          thumbColor={isDark ? "#fff" : "#ccc"}
          trackColor={{ true: palette.PRIMARY, false: "#4B5563" }}
          disabled={busy}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Text style={styles.settingDescription}>Get reminders about your spending.</Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={toggleNotifications}
          thumbColor={notifications ? "#fff" : "#ccc"}
          trackColor={{ true: palette.PRIMARY, false: "#4B5563" }}
          disabled={busy}
        />
      </View>

      {/* Data Section */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Data</Text>

      <TouchableOpacity style={styles.linkRow} onPress={handleExportData} disabled={busy}>
        <View style={styles.linkIcon}>
          <Ionicons name="cloud-upload-outline" size={18} color={palette.TEXT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Export data</Text>
          <Text style={styles.settingDescription}>Save all your SpendSense data as a JSON file.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.MUTED} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkRow} onPress={confirmResetData} disabled={busy}>
        <View style={[styles.linkIcon, { borderColor: "#F97316" }]}>
          <Ionicons name="trash-bin-outline" size={18} color="#F97316" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, { color: "#F97316" }]}>Reset all data</Text>
          <Text style={styles.settingDescription}>Permanently delete all expenses and groups.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.MUTED} />
      </TouchableOpacity>

      {/* About */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>About</Text>
      <View style={styles.footerTextContainer}>
        <Text style={styles.footerText}>SpendSense • v0.2</Text>
        <Text style={styles.footerSubText}>Built with Expo, React Native & Expo Router</Text>
      </View>
    </SafeAreaView>
  );
}

// dynamic styles factory so UI follows palette
function makeStyles(p) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.BG,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    headerRow: {
      marginBottom: 16,
    },
    screenTitle: {
      color: p.TEXT,
      fontSize: 24,
      fontWeight: "800",
    },
    screenSubtitle: {
      color: p.MUTED,
      fontSize: 13,
      marginTop: 4,
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 18,
      padding: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: p.CARD,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    profileName: {
      color: p.TEXT,
      fontSize: 16,
      fontWeight: "700",
    },
    profileMeta: {
      color: p.MUTED,
      fontSize: 12,
      marginTop: 2,
    },
    sectionTitle: {
      color: p.TEXT,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 8,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 18,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: p.BORDER || "#111827",
    },
    settingLabel: {
      color: p.TEXT,
      fontSize: 14,
      fontWeight: "600",
    },
    settingDescription: {
      color: p.MUTED,
      fontSize: 12,
      marginTop: 2,
      maxWidth: "95%",
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 18,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: p.BORDER || "#111827",
    },
    linkIcon: {
      width: 32,
      height: 32,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
      backgroundColor: p.CARD,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    footerTextContainer: {
      marginTop: 4,
    },
    footerText: {
      color: p.MUTED,
      fontSize: 12,
    },
    footerSubText: {
      color: p.MUTED,
      fontSize: 11,
      marginTop: 2,
    },
  });
}
