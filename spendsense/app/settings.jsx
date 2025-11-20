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
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
const PROFILE_KEY = "@spendsense_profile";

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, palette, toggleTheme } = useTheme();
  const styles = makeStyles(palette);

  const [notifications, setNotifications] = useState(true);
  const [busy, setBusy] = useState(false);

  // ---------- PROFILE ----------
  const [profile, setProfile] = useState(null);
  const [profileEditVisible, setProfileEditVisible] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNote, setEditNote] = useState("");

  const rawUserName = profile?.name?.trim();
  const CURRENT_USER_NAME =
    rawUserName && rawUserName.length ? rawUserName : "You";

  // ---------- STATS STATES ----------
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    personalThisMonth: 0,
    groupThisMonth: 0,
    totalThisMonth: 0,
    personalAllTime: 0,
    groupAllTime: 0,
    totalAllTime: 0,
    monthlyCategories: [], // [{ category, total }]
    lifetimeByMonth: [], // [{ key, label, total }]
  });

  useEffect(() => {
    loadNotify();
    loadProfile();
  }, []);

  const loadNotify = async () => {
    try {
      const savedNotify = await AsyncStorage.getItem(NOTIFY_KEY);
      setNotifications(savedNotify === null ? true : savedNotify === "true");
    } catch (e) {
      console.error("[Settings] loadNotify error", e);
    }
  };

  const loadProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        setProfile(JSON.parse(raw));
      }
    } catch (e) {
      console.warn("[Settings] profile load error", e);
    }
  };

  const handleToggleTheme = (value) => {
    try {
      toggleTheme(value);
    } catch (e) {
      Alert.alert("Error", "Could not toggle theme.");
    }
  };

  const toggleNotifications = async (value) => {
    try {
      setNotifications(value);
      await AsyncStorage.setItem(NOTIFY_KEY, value ? "true" : "false");
    } catch (e) {
      Alert.alert("Error", "Could not save notification preference.");
    }
  };

  // ---------- DATE HELPERS ----------
  const getMonthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  };
  const getCurrentMonthKey = () => getMonthKey(new Date());

  const getMonthKeyPadded = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${month}`; // YYYY-MM
  };

  // ---------- TRACK EXPENSES (WITH CATEGORY + LIFETIME GRAPH) ----------
  const handleOpenStats = async () => {
    setStatsLoading(true);
    try {
      // PERSONAL
      let personal = [];
      const personalJson = await AsyncStorage.getItem(PERSONAL_KEY);
      if (personalJson) personal = JSON.parse(personalJson);

      const currentMonthKey = getCurrentMonthKey();

      let personalAllTime = 0;
      let personalThisMonth = 0;

      const monthlyCategoryMap = {}; // category => total this month (personal + group share)
      const lifetimeMonthMap = {}; // "YYYY-MM" => total (all time)

      personal.forEach((e) => {
        const amount = Number(e.amount) || 0;
        personalAllTime += amount;

        if (!e.date) return;

        const [day, month, year] = e.date.split("/");
        const d = new Date(Number(year), Number(month) - 1, Number(day));
        if (isNaN(d)) return;

        const simpleKey = getMonthKey(d);
        const paddedKey = getMonthKeyPadded(d);

        // Lifetime (personal)
        lifetimeMonthMap[paddedKey] =
          (lifetimeMonthMap[paddedKey] || 0) + amount;

        // This month (personal)
        if (simpleKey === currentMonthKey) {
          personalThisMonth += amount;
          const cat = e.category || "Personal (uncategorized)";
          monthlyCategoryMap[cat] =
            (monthlyCategoryMap[cat] || 0) + amount;
        }
      });

      // GROUP SHARE (based on profile name)
      let groups = [];
      const groupsJson = await AsyncStorage.getItem(GROUPS_KEY);
      if (groupsJson) groups = JSON.parse(groupsJson);

      const nameLower = rawUserName ? rawUserName.toLowerCase() : null;

      let groupAllTime = 0;
      let groupThisMonth = 0;

      if (nameLower) {
        groups.forEach((g) => {
          const members = g.members || [];
          const expenses = g.expenses || [];

          const userIds = members
            .filter((m) => m.name?.toLowerCase() === nameLower)
            .map((m) => m.id);

          if (!userIds.length) return;

          expenses.forEach((exp) => {
            const participants = exp.participantIds || [];
            const amount = Number(exp.amount) || 0;
            if (!participants.length || !amount) return;

            // this is close to your original logic, but a bit safer
            let perHead;
            if (Array.isArray(exp.splits) && exp.splits.length) {
              // assume same share per participant from first split
              perHead =
                Number(exp.splits[0].share ?? exp.splits[0].amount) ||
                amount / participants.length;
            } else {
              perHead = amount / participants.length;
            }

            const countUser = participants.filter((id) =>
              userIds.includes(id)
            ).length;
            if (!countUser) return;

            const share = perHead * countUser;

            const createdAt = exp.createdAt || new Date().toISOString();
            const d = new Date(createdAt);
            if (isNaN(d)) return;

            const simpleKey = getMonthKey(d);
            const paddedKey = getMonthKeyPadded(d);

            // Lifetime (group share)
            lifetimeMonthMap[paddedKey] =
              (lifetimeMonthMap[paddedKey] || 0) + share;

            groupAllTime += share;

            // This month (group share)
            if (simpleKey === currentMonthKey) {
              groupThisMonth += share;
              const cat =
                exp.category ||
                (exp.title ? `Group: ${exp.title}` : "Group (uncategorized)");
              monthlyCategoryMap[cat] =
                (monthlyCategoryMap[cat] || 0) + share;
            }
          });
        });
      }

      const totalAllTime = personalAllTime + groupAllTime;
      const totalThisMonth = personalThisMonth + groupThisMonth;

      const monthlyCategories = Object.entries(monthlyCategoryMap)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      const lifetimeByMonth = Object.entries(lifetimeMonthMap)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, total]) => {
          const [year, month] = key.split("-");
          const label = `${month}/${String(year).slice(-2)}`; // e.g. 03/25
          return { key, label, total };
        });

      setStats({
        personalThisMonth,
        groupThisMonth,
        totalThisMonth,
        personalAllTime,
        groupAllTime,
        totalAllTime,
        monthlyCategories,
        lifetimeByMonth,
      });

      setStatsModalVisible(true);
    } catch (e) {
      console.error("Stats error", e);
      Alert.alert("Error", "Unable to compute stats.");
    } finally {
      setStatsLoading(false);
    }
  };

  // ---------- EXPORT ----------
  const handleExportData = async () => {
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

      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spendsense-export-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        Alert.alert("Export complete", "Downloaded JSON file.");
        setBusy(false);
        return;
      }

      const filename = `spendsense-export-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;

      const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const fileUri = dir + filename;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      Alert.alert("Export complete", `Saved to: ${fileUri}`);
    } catch (e) {
      Alert.alert("Error", "Failed to export data.");
    } finally {
      setBusy(false);
    }
  };

  // ---------- RESET ----------
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

  const handleResetData = async () => {
    setBusy(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const spendKeys = allKeys.filter((k) => k.startsWith("@spendsense"));
      const extras = [PROFILE_KEY];
      const toRemove = [...new Set([...spendKeys, ...extras])];

      await AsyncStorage.multiRemove(toRemove);
      await AsyncStorage.multiRemove([
        PERSONAL_KEY,
        GROUPS_KEY,
        ACTIVE_GROUP_KEY,
        THEME_KEY,
        NOTIFY_KEY,
      ]);

      setNotifications(true);
      toggleTheme(true);

      Alert.alert("Done", "Data cleared. App will reload.", [
        {
          text: "OK",
          onPress: async () => {
            try {
              await Updates.reloadAsync();
            } catch {
              router.replace("/");
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert("Error", "Reset failed.");
    } finally {
      setBusy(false);
    }
  };

  // ---------- PROFILE EDIT HELPERS ----------
  const openProfileEditor = () => {
    setEditName(profile?.name || "");
    setEditEmail(profile?.email || "");
    setEditPhone(profile?.phone || "");
    setEditNote(profile?.note || "");
    setProfileEditVisible(true);
  };

  const saveProfileInsideSettings = async () => {
    try {
      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        note: editNote.trim(),
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(payload));
      setProfile(payload);
      setProfileEditVisible(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e) {
      console.error("[Settings] profile save error", e);
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Settings</Text>
          <Text style={styles.screenSubtitle}>
            Personalize your SpendSense experience
          </Text>
        </View>

        {/* ---- TRACK EXPENSES CARD ---- */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={handleOpenStats}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={palette.TEXT} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{CURRENT_USER_NAME}</Text>
            <Text style={styles.profileMeta}>
              Tap to track your total expenses
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: palette.PRIMARY,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Ionicons name="stats-chart-outline" size={16} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              Track
            </Text>
          </View>
        </TouchableOpacity>

        {/* ---- PREFERENCES ---- */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Dark mode</Text>
            <Text style={styles.settingDescription}>
              Always use the dark theme in the app.
            </Text>
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
            <Text style={styles.settingDescription}>
              Get reminders about your spending.
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            thumbColor={notifications ? "#fff" : "#ccc"}
            trackColor={{ true: palette.PRIMARY, false: "#4B5563" }}
            disabled={busy}
          />
        </View>

        {/* ---- PROFILE SECTION ---- */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Profile</Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={openProfileEditor}
          disabled={busy}
        >
          <View style={styles.linkIcon}>
            <Ionicons name="create-outline" size={18} color={palette.TEXT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Edit profile</Text>
            <Text style={styles.settingDescription}>
              Change your name, email & phone number.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.MUTED} />
        </TouchableOpacity>

        {/* ---- DATA ---- */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Data</Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={handleExportData}
          disabled={busy}
        >
          <View style={styles.linkIcon}>
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={palette.TEXT}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Export data</Text>
            <Text style={styles.settingDescription}>
              Save all your SpendSense data as a JSON file.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.MUTED} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={confirmResetData}
          disabled={busy}
        >
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
          <Ionicons name="chevron-forward" size={18} color={palette.MUTED} />
        </TouchableOpacity>

        {/* ---- ABOUT ---- */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>About</Text>

        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>SpendSense • v0.2</Text>
          <Text style={styles.footerSubText}>
            Built with Expo, React Native & Expo Router
          </Text>
        </View>
      </ScrollView>

            {/* ---------- STATS MODAL ---------- */}
      <Modal
        visible={statsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatsModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
          onPress={() => setStatsModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: palette.CARD,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: palette.BORDER,
              maxHeight: "80%", // <= important
            }}
            onPress={() => {}}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      backgroundColor: palette.CARD_ELEVATED,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ color: palette.TEXT, fontWeight: "700" }}
                    >
                      {CURRENT_USER_NAME[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <Text
                      style={{
                        color: palette.TEXT,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {CURRENT_USER_NAME}'s expenses
                    </Text>
                    <Text style={{ color: palette.MUTED, fontSize: 12 }}>
                      Personal + group share overview
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setStatsModalVisible(false)}>
                  <Ionicons name="close" size={22} color={palette.MUTED} />
                </Pressable>
              </View>

              {statsLoading ? (
                <Text
                  style={{
                    color: palette.MUTED,
                    textAlign: "center",
                    paddingVertical: 20,
                  }}
                >
                  Calculating...
                </Text>
              ) : (
                <>
                  {/* THIS MONTH */}
                  <View style={styles.statsCard}>
                    <Text style={styles.statsCardLabel}>This month</Text>
                    <Text style={styles.statsCardValue}>
                      ₹ {stats.totalThisMonth.toFixed(0)}
                    </Text>

                    <View style={styles.statsRow}>
                      <Text style={styles.statsRowLabel}>Personal</Text>
                      <Text style={styles.statsRowValue}>
                        ₹ {stats.personalThisMonth.toFixed(0)}
                      </Text>
                    </View>

                    <View style={styles.statsRow}>
                      <Text style={styles.statsRowLabel}>
                        Groups (your share)
                      </Text>
                      <Text style={styles.statsRowValue}>
                        ₹ {stats.groupThisMonth.toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {/* ALL TIME */}
                  <View style={styles.statsCard}>
                    <Text style={styles.statsCardLabel}>All time</Text>
                    <Text style={styles.statsCardValue}>
                      ₹ {stats.totalAllTime.toFixed(0)}
                    </Text>

                    <View style={styles.statsRow}>
                      <Text style={styles.statsRowLabel}>Personal</Text>
                      <Text style={styles.statsRowValue}>
                        ₹ {stats.personalAllTime.toFixed(0)}
                      </Text>
                    </View>

                    <View style={styles.statsRow}>
                      <Text style={styles.statsRowLabel}>
                        Groups (your share)
                      </Text>
                      <Text style={styles.statsRowValue}>
                        ₹ {stats.groupAllTime.toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {/* MONTHLY CATEGORY BREAKDOWN WITH COLOUR TAGS + BARS */}
                  <View style={styles.statsCard}>
                    <Text style={styles.statsCardLabel}>
                      This month by category
                    </Text>
                    {stats.monthlyCategories.length === 0 ? (
                      <Text style={styles.emptyNote}>
                        No category-wise data for this month yet.
                      </Text>
                    ) : (
                      (() => {
                        const maxCat = Math.max(
                          ...stats.monthlyCategories.map((c) => c.total)
                        );
                        const safeMax = maxCat || 1;
                        const colorPalette = [
                          palette.PRIMARY,
                          "#22C55E",
                          "#F97316",
                          "#38BDF8",
                          "#E11D48",
                          "#A855F7",
                        ];

                        return stats.monthlyCategories.map((item, index) => {
                          const ratio = item.total / safeMax;
                          const widthPercent = 10 + ratio * 90;
                          const color =
                            colorPalette[index % colorPalette.length];
                          const softColor = color + "33";

                          return (
                            <View key={item.category} style={styles.categoryItem}>
                              <View style={styles.categoryHeaderRow}>
                                <View
                                  style={[
                                    styles.categoryTag,
                                    { backgroundColor: softColor },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.categoryDot,
                                      { backgroundColor: color },
                                    ]}
                                  />
                                  <Text style={styles.categoryTagText}>
                                    {item.category}
                                  </Text>
                                </View>
                                <Text style={styles.categoryAmount}>
                                  ₹ {item.total.toFixed(0)}
                                </Text>
                              </View>
                              <View style={styles.categoryBarTrack}>
                                <View
                                  style={[
                                    styles.categoryBarFill,
                                    {
                                      width: `${widthPercent}%`,
                                      backgroundColor: color,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          );
                        });
                      })()
                    )}
                  </View>

                  {/* LIFETIME MONTH-WISE "GRAPH" (HORIZONTAL SCROLL) */}
                  <View style={styles.statsCard}>
                    <Text style={styles.statsCardLabel}>
                      Lifetime month-wise trends
                    </Text>
                    {stats.lifetimeByMonth.length === 0 ? (
                      <Text style={styles.emptyNote}>
                        Add some expenses to see your month-wise trends.
                      </Text>
                    ) : (
                      <View style={styles.chartContainer}>
                        {(() => {
                          const max = Math.max(
                            ...stats.lifetimeByMonth.map((m) => m.total)
                          );
                          const safeMax = max || 1;

                          return (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.barRow}
                            >
                              {stats.lifetimeByMonth.map((m) => {
                                const h = (m.total / safeMax) * 140;
                                return (
                                  <View key={m.key} style={styles.barWrapper}>
                                    <Text style={styles.barValue}>
                                      ₹{m.total.toFixed(0)}
                                    </Text>
                                    <View
                                      style={[
                                        styles.bar,
                                        {
                                          height: h,
                                          backgroundColor: palette.PRIMARY,
                                        },
                                      ]}
                                    />
                                    <Text style={styles.barLabel}>
                                      {m.label}
                                    </Text>
                                  </View>
                                );
                              })}
                            </ScrollView>
                          );
                        })()}
                      </View>
                    )}
                  </View>

                  <Text
                    style={{
                      color: palette.MUTED,
                      fontSize: 11,
                      textAlign: "center",
                      marginTop: 6,
                    }}
                  >
                    Group share is calculated based on your saved profile name.
                  </Text>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- PROFILE EDIT MODAL ---------- */}
      <Modal
        visible={profileEditVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileEditVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
          onPress={() => setProfileEditVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: palette.CARD,
              padding: 16,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: palette.BORDER,
            }}
            onPress={() => {}}
          >
            <Text
              style={{
                color: palette.TEXT,
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              Edit profile
            </Text>

            {/* Name */}
            <Text style={{ color: palette.MUTED, fontSize: 12 }}>Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={palette.MUTED}
            />

            {/* Email */}
            <Text
              style={{ color: palette.MUTED, fontSize: 12, marginTop: 10 }}
            >
              Email
            </Text>
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={palette.MUTED}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Phone */}
            <Text
              style={{ color: palette.MUTED, fontSize: 12, marginTop: 10 }}
            >
              Phone
            </Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={palette.MUTED}
              keyboardType="phone-pad"
            />

            {/* Note */}
            <Text
              style={{ color: palette.MUTED, fontSize: 12, marginTop: 10 }}
            >
              Note
            </Text>
            <TextInput
              value={editNote}
              onChangeText={setEditNote}
              style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
              placeholder="Short bio"
              placeholderTextColor={palette.MUTED}
              multiline
            />

            <TouchableOpacity
              style={{
                backgroundColor: palette.PRIMARY,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 16,
              }}
              onPress={saveProfileInsideSettings}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Save changes
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- DYNAMIC STYLES ----------
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
      borderColor: p.BORDER,
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
      borderColor: p.BORDER,
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
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 18,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: p.BORDER,
    },
    linkIcon: {
      width: 32,
      height: 32,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: p.BORDER,
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

    // Stats Card
    statsCard: {
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 18,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: p.BORDER,
    },
    statsCardLabel: {
      color: p.MUTED,
      fontSize: 12,
      marginBottom: 4,
    },
    statsCardValue: {
      color: p.TEXT,
      fontSize: 22,
      fontWeight: "800",
      marginTop: 4,
      marginBottom: 8,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    statsRowLabel: {
      color: p.MUTED,
      fontSize: 12,
    },
    statsRowValue: {
      color: p.TEXT,
      fontSize: 13,
      fontWeight: "600",
    },

    emptyNote: {
      color: p.MUTED,
      fontSize: 12,
      marginTop: 4,
    },

    // Category styles
    categoryItem: {
      marginTop: 8,
    },
    categoryHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    categoryTag: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginRight: 6,
    },
    categoryTagText: {
      color: p.TEXT,
      fontSize: 12,
      fontWeight: "500",
    },
    categoryAmount: {
      color: p.TEXT,
      fontSize: 13,
      fontWeight: "600",
    },
    categoryBarTrack: {
      width: "100%",
      height: 6,
      borderRadius: 999,
      backgroundColor: p.CARD,
      marginTop: 4,
      overflow: "hidden",
    },
    categoryBarFill: {
      height: "100%",
      borderRadius: 999,
    },

    // Lifetime chart
    chartContainer: {
      marginTop: 8,
      height: 200,
      justifyContent: "flex-end",
    },
    barRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingRight: 4,
    },
    barWrapper: {
      alignItems: "center",
      marginHorizontal: 6,
      minWidth: 40,
    },
    bar: {
      width: 18,
      borderRadius: 9,
    },
    barValue: {
      fontSize: 10,
      color: p.MUTED,
      marginBottom: 4,
    },
    barLabel: {
      marginTop: 4,
      fontSize: 11,
      color: p.MUTED,
    },

    // Shared input style (profile edit modal)
    input: {
      backgroundColor: p.CARD,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.BORDER,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: p.TEXT,
      fontSize: 14,
      marginTop: 4,
    },
  });
}
