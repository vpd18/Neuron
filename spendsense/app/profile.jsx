// app/profile.jsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./theme";

const PROFILE_KEY = "@spendsense_profile";

export default function ProfileScreen() {
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          setName(p.name || "");
          setEmail(p.email || "");
          setPhone(p.phone || "");
          setNote(p.note || "");
        }
      } catch (e) {
        console.warn("[Profile] load error", e);
      }
    })();
  }, []);

  const saveProfile = async () => {
    setBusy(true);
    try {
      const payload = { name: name.trim(), email: email.trim(), phone: phone.trim(), note: note.trim(), updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(payload));
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e) {
      console.error("[Profile] save error", e);
      Alert.alert("Error", "Failed to save profile. See console.");
    } finally {
      setBusy(false);
    }
  };

  const clearProfile = async () => {
    Alert.alert("Clear profile?", "Remove saved profile details?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(PROFILE_KEY);
            setName("");
            setEmail("");
            setPhone("");
            setNote("");
            Alert.alert("Cleared", "Profile cleared.");
          } catch (e) {
            console.error("[Profile] clear error", e);
            Alert.alert("Error", "Failed to clear profile. See console.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Your profile</Text>
          <Text style={styles.screenSubtitle}>Edit details shown on settings</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={palette.TEXT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{name || "You"}</Text>
            <Text style={styles.profileMeta}>{email || phone || "No contact added"}</Text>
          </View>
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. You, Arun Kumar"
          placeholderTextColor={palette.MUTED}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={palette.MUTED}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          placeholderTextColor={palette.MUTED}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="A small bio or reminder"
          placeholderTextColor={palette.MUTED}
          multiline
          numberOfLines={3}
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
        />

        <TouchableOpacity
          style={[styles.saveButton, busy && { opacity: 0.6 }]}
          onPress={saveProfile}
          disabled={busy}
        >
          <Text style={styles.saveButtonText}>Save profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearProfile}
        >
          <Text style={styles.clearButtonText}>Clear profile</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(p) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.BG },
    headerRow: { paddingHorizontal: 0, paddingBottom: 8, paddingTop: 4, marginBottom: 8 },
    screenTitle: { color: p.TEXT, fontSize: 22, fontWeight: "800", paddingHorizontal: 16 },
    screenSubtitle: { color: p.MUTED, fontSize: 13, paddingHorizontal: 16, marginTop: 4 },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 14,
      padding: 12,
      margin: 16,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: p.CARD,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    profileName: { color: p.TEXT, fontSize: 16, fontWeight: "700" },
    profileMeta: { color: p.MUTED, fontSize: 12, marginTop: 2 },

    label: { color: p.MUTED, marginHorizontal: 16, marginTop: 14, marginBottom: 6, fontSize: 13 },
    input: {
      marginHorizontal: 16,
      backgroundColor: p.CARD,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: p.TEXT,
      fontSize: 14,
    },

    saveButton: {
      marginHorizontal: 16,
      marginTop: 18,
      backgroundColor: p.PRIMARY,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    saveButtonText: { color: "#fff", fontWeight: "700" },

    clearButton: {
      marginHorizontal: 16,
      marginTop: 10,
      backgroundColor: "transparent",
      paddingVertical: 10,
      alignItems: "center",
    },
    clearButtonText: { color: p.MUTED, fontWeight: "700" },
  });
}
