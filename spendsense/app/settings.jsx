import { View, Text, StyleSheet } from "react-native";

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>App info, clear data, etc.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", paddingTop: 60, paddingHorizontal: 20 },
  title: { color: "#FFF", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#9CA3AF", marginTop: 8 },
});
