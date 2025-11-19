// app/index.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PERSONAL_KEY = "@spendsense_personal_expenses";

export default function PersonalScreen() {
  const [expenses, setExpenses] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const json = await AsyncStorage.getItem(PERSONAL_KEY);
      if (json) {
        setExpenses(JSON.parse(json));
      }
    } catch (error) {
      console.log("Error loading personal expenses", error);
    }
  };

  const saveExpenses = async (next) => {
    try {
      await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(next));
    } catch (error) {
      console.log("Error saving personal expenses", error);
    }
  };

 // Totals
const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

// compute "today" based on stored date string
const todayString = new Date().toLocaleDateString("en-IN");
const todayTotal = expenses.reduce((sum, e) => {
  if (!e.date) return sum;
  return e.date === todayString ? sum + (e.amount || 0) : sum;
}, 0);


  const handleOpenAdd = () => {
    setIsAddModalVisible(true);
  };

  const handleCloseAdd = () => {
    setIsAddModalVisible(false);
    setTitle("");
    setAmount("");
    setCategory("");
  };

  const handleSaveExpense = async () => {
    if (!title.trim() || !amount.trim()) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const newExpense = {
      id: Date.now().toString(),
      title: title.trim(),
      amount: numericAmount,
      category: category.trim() || null,
      date: new Date().toLocaleDateString("en-IN"),
    };

    const next = [newExpense, ...expenses];
    setExpenses(next);
    await saveExpenses(next);
    handleCloseAdd();
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        {item.category ? (
          <Text style={styles.expenseCategory}>{item.category}</Text>
        ) : null}
        {item.date ? (
          <Text style={styles.expenseDate}>{item.date}</Text>
        ) : null}
      </View>
      <Text style={styles.expenseAmount}>₹ {item.amount}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.appTitle}>SpendSense</Text>
          <Text style={styles.appSubtitle}>Personal expense tracker</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>₹</Text>
        </View>
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total spent</Text>
            <Text style={styles.summaryValue}>₹ {total.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryChip}>
            <Ionicons name="trending-up" size={18} color="#22C55E" />
            <Text style={styles.summaryChipText}>On track</Text>
          </View>
        </View>
        <View style={styles.summaryRowBottom}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Today</Text>
            <Text style={styles.summaryItemValue}>₹ {todayTotal}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Entries</Text>
            <Text style={styles.summaryItemValue}>{expenses.length}</Text>
          </View>
        </View>
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent expenses</Text>
        <TouchableOpacity>
          <Text style={styles.sectionAction}>View all</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses list */}
      {expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={40} color="#6B7280" />
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap “Add expense” to start tracking your spending.
          </Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          renderItem={renderExpense}
          contentContainerStyle={{ paddingBottom: 160 }}

        />
      )}

      {/* FAB: Add Expense */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenAdd}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Add expense</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseAdd}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseAdd}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add expense</Text>
              <Pressable onPress={handleCloseAdd}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Coffee, Groceries"
              placeholderTextColor="#6B7280"
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 250"
              keyboardType="numeric"
              placeholderTextColor="#6B7280"
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Category (optional)</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Food, Travel"
              placeholderTextColor="#6B7280"
              style={styles.input}
            />

            <TouchableOpacity
              style={[
                styles.modalButton,
                (!title.trim() || !amount.trim()) && { opacity: 0.4 },
              ]}
              disabled={!title.trim() || !amount.trim()}
              onPress={handleSaveExpense}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const BG = "#050816";
const CARD = "#020617";
const CARD_ELEVATED = "#0F172A";
const TEXT = "#E5E7EB";
const MUTED = "#9CA3AF";
const PRIMARY = "#4F46E5";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  appTitle: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "800",
  },
  appSubtitle: {
    color: MUTED,
    fontSize: 13,
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1D4ED8",
  },
  avatarText: {
    color: TEXT,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: CARD_ELEVATED,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: MUTED,
    fontSize: 13,
  },
  summaryValue: {
    color: TEXT,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#022C22",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  summaryChipText: {
    color: "#BBF7D0",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  summaryRowBottom: {
    flexDirection: "row",
    marginTop: 18,
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
  },
  summaryItemLabel: {
    color: MUTED,
    fontSize: 12,
  },
  summaryItemValue: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionAction: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "600",
  },
  expenseCard: {
    backgroundColor: CARD_ELEVATED,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#111827",
  },
  expenseTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
  },
  expenseCategory: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  expenseDate: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },
  expenseAmount: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  fab: {
    position: "absolute",
    right: 20,          // ⬅ bottom-right instead of center
    bottom: 90,         // ⬅ lifted above system buttons + tab bar
    flexDirection: "row",
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 4,
  },

  fabText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: CARD,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
  },
  modalLabel: {
    color: MUTED,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
    fontSize: 14,
  },
  modalButton: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 16,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
