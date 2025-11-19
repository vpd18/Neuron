// app/groups.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./theme";

const GROUPS_KEY = "@spendsense_groups";
const ACTIVE_GROUP_KEY = "@spendsense_active_group_id";

export default function GroupsScreen() {
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);

  // Create group modal
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");

  // Group details (members + expenses) modal
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Member form
  const [memberName, setMemberName] = useState("");

  // Expense form
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payerId, setPayerId] = useState(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);

  // Load groups + active group on mount
  useEffect(() => {
    (async () => {
      await loadGroups();
      await loadActiveGroup();
    })();
  }, []);

  const loadGroups = async () => {
    try {
      const json = await AsyncStorage.getItem(GROUPS_KEY);
      if (json) setGroups(JSON.parse(json));
    } catch (error) {
      console.log("Error loading groups", error);
    }
  };

  const saveGroups = async (nextGroups) => {
    try {
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(nextGroups));
    } catch (error) {
      console.log("Error saving groups", error);
    }
  };

  const loadActiveGroup = async () => {
    try {
      const id = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);
      if (id) setActiveGroupId(id);
    } catch (e) {
      console.log("Error loading active group", e);
    }
  };

  const updateGroupInList = async (updatedGroup) => {
    const next = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    setGroups(next);
    await saveGroups(next);
  };

  // ----- Active group -----
  const handleSetActiveGroup = async (groupId) => {
    setActiveGroupId(groupId);
    try {
      await AsyncStorage.setItem(ACTIVE_GROUP_KEY, groupId);
    } catch (e) {
      console.log("Error saving active group", e);
    }
  };

  // ----- Create group -----
  const handleOpenCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalVisible(false);
    setGroupName("");
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    const newGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      createdAt: new Date().toISOString(),
      members: [],
      expenses: [],
    };

    const next = [newGroup, ...groups];
    setGroups(next);
    await saveGroups(next);
    handleCloseCreateModal();
  };

  const handleDeleteGroup = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    Alert.alert(
      "Delete group?",
      `Are you sure you want to delete "${group.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const next = groups.filter((g) => g.id !== groupId);
            setGroups(next);
            await saveGroups(next);
            if (activeGroupId === groupId) {
              setActiveGroupId(null);
              await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
            }
          },
        },
      ]
    );
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // ----- Group details + members + expenses -----
  const openGroupDetails = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const withDefaults = {
      ...group,
      members: group.members || [],
      expenses: group.expenses || [],
    };

    setSelectedGroup(withDefaults);

    const memberIds = withDefaults.members.map((m) => m.id);
    setPayerId(memberIds[0] || null);
    setSelectedParticipantIds(memberIds);
    setMemberName("");
    setExpenseDesc("");
    setExpenseCategory("");
    setExpenseAmount("");
    setIsDetailsVisible(true);
  };

  const closeGroupDetails = () => {
    setIsDetailsVisible(false);
    setSelectedGroup(null);
    setMemberName("");
    setExpenseDesc("");
    setExpenseCategory("");
    setExpenseAmount("");
    setSelectedParticipantIds([]);
    setPayerId(null);
  };

  // ----- Members -----
  const handleAddMember = async () => {
    if (!selectedGroup || !memberName.trim()) return;

    const newMember = {
      id: Date.now().toString(),
      name: memberName.trim(),
    };

    const updatedGroup = {
      ...selectedGroup,
      members: [...(selectedGroup.members || []), newMember],
    };

    setSelectedGroup(updatedGroup);
    setMemberName("");

    const memberIds = updatedGroup.members.map((m) => m.id);
    if (!payerId) setPayerId(memberIds[0] || null);
    if (selectedParticipantIds.length === 0) setSelectedParticipantIds(memberIds);

    await updateGroupInList(updatedGroup);
  };

  const handleRemoveMember = (memberId) => {
    if (!selectedGroup) return;

    const member = selectedGroup.members.find((m) => m.id === memberId);
    if (!member) return;

    Alert.alert(
      "Remove member?",
      `Remove "${member.name}" from this group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const filteredMembers = selectedGroup.members.filter(
              (m) => m.id !== memberId
            );

            const updatedGroup = {
              ...selectedGroup,
              members: filteredMembers,
            };

            setSelectedGroup(updatedGroup);

            if (payerId === memberId) {
              const remainingIds = filteredMembers.map((m) => m.id);
              setPayerId(remainingIds[0] || null);
            }
            setSelectedParticipantIds((prev) =>
              prev.filter((id) => id !== memberId)
            );

            await updateGroupInList(updatedGroup);
          },
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };

  const renderMemberChip = (member) => (
    <TouchableOpacity
      key={member.id}
      style={styles.memberChip}
      onLongPress={() => handleRemoveMember(member.id)}
      delayLongPress={300}
    >
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{getInitials(member.name)}</Text>
      </View>
      <Text style={styles.memberName}>{member.name}</Text>
    </TouchableOpacity>
  );

  // ----- Expenses -----
  const getMemberName = (group, memberId) =>
    group?.members?.find((m) => m.id === memberId)?.name || "Unknown";

  const toggleParticipant = (memberId) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddExpense = async () => {
    if (!selectedGroup) return;
    if (!expenseDesc.trim() || !expenseAmount.trim()) return;

    const numericAmount = parseFloat(expenseAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;
    if (!payerId) return;

    const participants =
      selectedParticipantIds.length > 0
        ? selectedParticipantIds
        : selectedGroup.members.map((m) => m.id);

    if (participants.length === 0) return;

    const perHeadRaw = numericAmount / participants.length;
    const perHead = Math.round(perHeadRaw * 100) / 100;

    const newExpense = {
      id: Date.now().toString(),
      description: expenseDesc.trim(),
      category: expenseCategory.trim() || null,
      amount: numericAmount,
      payerId,
      participantIds: participants,
      createdAt: new Date().toISOString(),
      splits: participants.map((id) => ({
        memberId: id,
        share: perHead,
      })),
    };

    const updatedGroup = {
      ...selectedGroup,
      expenses: [newExpense, ...(selectedGroup.expenses || [])],
    };

    setSelectedGroup(updatedGroup);
    setExpenseDesc("");
    setExpenseCategory("");
    setExpenseAmount("");

    await updateGroupInList(updatedGroup);
  };

  const handleDeleteExpense = (expenseId) => {
    if (!selectedGroup) return;

    const expense = selectedGroup.expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    Alert.alert(
      "Delete expense?",
      `Delete "${expense.description}" (₹${expense.amount}) from this group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedGroup = {
              ...selectedGroup,
              expenses: selectedGroup.expenses.filter((e) => e.id !== expenseId),
            };
            setSelectedGroup(updatedGroup);
            await updateGroupInList(updatedGroup);
          },
        },
      ]
    );
  };

  const renderExpenseRow = (expense) => {
    const payerName = getMemberName(selectedGroup, expense.payerId);
    const firstSplit = expense.splits?.[0];
    const perHead = firstSplit ? firstSplit.share : null;

    return (
      <TouchableOpacity
        key={expense.id}
        style={styles.expenseCard}
        onLongPress={() => handleDeleteExpense(expense.id)}
        delayLongPress={300}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.expenseTitle}>{expense.description}</Text>

          {expense.category ? (
            <Text style={styles.expenseMetaSmall}>{expense.category}</Text>
          ) : null}

          <Text style={styles.expenseMeta}>
            Paid by {payerName} • Split between {expense.participantIds.length}{" "}
            people
          </Text>

          {perHead != null && (
            <Text style={styles.expenseMetaSmall}>
              ≈ ₹ {perHead} per person (equal split)
            </Text>
          )}
        </View>
        <Text style={styles.expenseAmount}>₹ {expense.amount}</Text>
      </TouchableOpacity>
    );
  };

  const groupTotal = selectedGroup?.expenses?.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  // ----- Balances (who owes / should receive) -----
  const computeBalances = (group) => {
    if (!group || !group.members || !group.expenses) return [];

    const balancesMap = {};
    group.members.forEach((m) => {
      balancesMap[m.id] = 0;
    });

    group.expenses.forEach((expense) => {
      const participants = expense.participantIds || [];
      if (participants.length === 0) return;

      const perHead =
        expense.splits?.[0]?.share ??
        Math.round((expense.amount / participants.length) * 100) / 100;

      participants.forEach((memberId) => {
        if (balancesMap[memberId] === undefined) balancesMap[memberId] = 0;
        balancesMap[memberId] -= perHead;
      });

      if (balancesMap[expense.payerId] === undefined) {
        balancesMap[expense.payerId] = 0;
      }
      balancesMap[expense.payerId] += expense.amount;
    });

    const balances = group.members.map((m) => ({
      memberId: m.id,
      name: m.name,
      balance: Math.round((balancesMap[m.id] || 0) * 100) / 100,
    }));

    balances.sort((a, b) => b.balance - a.balance);
    return balances;
  };

  const balances = computeBalances(selectedGroup);

  // ----- Group list item -----
  const renderGroup = ({ item }) => {
    const isActive = item.id === activeGroupId;
    const memberCount = item.members?.length || 0;
    const expenseCount = item.expenses?.length || 0;
    const totalAmount = (item.expenses || []).reduce(
      (sum, e) => sum + e.amount,
      0
    );

    return (
      <TouchableOpacity
        style={[
          styles.groupCard,
          isActive && { borderColor: palette.PRIMARY, borderWidth: 1.5 },
        ]}
        onPress={() => openGroupDetails(item.id)}
        onLongPress={() => handleDeleteGroup(item.id)}
        delayLongPress={400}
      >
        <View style={styles.groupIcon}>
          <Ionicons name="people" size={20} color={palette.TEXT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMeta}>
            {memberCount} member{memberCount === 1 ? "" : "s"} • {expenseCount}{" "}
            expense{expenseCount === 1 ? "" : "s"}
          </Text>
          <Text style={styles.groupMetaSmall}>
            Total: ₹ {totalAmount.toFixed(0)} • Created{" "}
            {formatDate(item.createdAt) || "recently"}
          </Text>
        </View>
        {isActive ? (
          <View style={styles.activeBadge}>
            <Ionicons name="sparkles-outline" size={14} color={palette.PRIMARY} />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={palette.MUTED} />
        )}
      </TouchableOpacity>
    );
  };

  // ----- Render -----
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Groups</Text>
          <Text style={styles.screenSubtitle}>
            Track and split shared expenses
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={styles.infoCard}>
        <Ionicons name="bulb-outline" size={22} color="#FACC15" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.infoTitle}>Workflow</Text>
          <Text style={styles.infoText}>
            Create a group → add members → log expenses with payer & category.
            We’ll show who owes who inside each group.
          </Text>
        </View>
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your groups</Text>
        <Text style={styles.sectionCount}>{groups.length} total</Text>
      </View>

      {/* Groups list */}
      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-circle-outline" size={44} color={palette.MUTED} />
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap “New group” to start tracking Flatmates, Goa Trip, etc.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={{ paddingBottom: 160 }}
        />
      )}

      {/* FAB: New group */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: palette.PRIMARY }]} onPress={handleOpenCreateModal}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>New group</Text>
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCreateModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseCreateModal}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create group</Text>
              <Pressable onPress={handleCloseCreateModal}>
                <Ionicons name="close" size={22} color={palette.MUTED} />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Group name</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g. Flatmates, Goa Trip, College Fest"
              placeholderTextColor={palette.MUTED}
              style={styles.input}
            />

            <TouchableOpacity
              style={[
                styles.modalButton,
                !groupName.trim() && { opacity: 0.4 },
              ]}
              disabled={!groupName.trim()}
              onPress={handleCreateGroup}
            >
              <Text style={styles.modalButtonText}>Create</Text>
            </TouchableOpacity>

            <Text style={styles.modalHint}>
              Long-press a group in the list to delete it.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Group Details Modal (scrollable) */}
      <Modal
        visible={isDetailsVisible}
        transparent
        animationType="slide"
        onRequestClose={closeGroupDetails}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeGroupDetails}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Header with Active group button */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="people"
                    size={20}
                    color={palette.TEXT}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.modalTitle}>
                    {selectedGroup?.name || "Group"}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {selectedGroup &&
                    (selectedGroup.id === activeGroupId ? (
                      <View style={[styles.activeBadge, { backgroundColor: palette.CARD_ELEVATED }]}>
                        <Ionicons
                          name="sparkles-outline"
                          size={14}
                          color={palette.PRIMARY}
                        />
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.setActiveButton, { borderColor: palette.PRIMARY }]}
                        onPress={() =>
                          handleSetActiveGroup(selectedGroup.id)
                        }
                      >
                        <Ionicons
                          name="radio-button-on-outline"
                          size={14}
                          color={palette.PRIMARY}
                        />
                        <Text style={[styles.setActiveText, { color: palette.PRIMARY }]}>Set active</Text>
                      </TouchableOpacity>
                    ))}
                  <Pressable
                    onPress={closeGroupDetails}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="close" size={22} color={palette.MUTED} />
                  </Pressable>
                </View>
              </View>

              {/* Members section */}
              <Text style={styles.modalLabel}>Members</Text>
              {selectedGroup?.members?.length ? (
                <View style={styles.membersContainer}>
                  {selectedGroup.members.map(renderMemberChip)}
                </View>
              ) : (
                <Text style={styles.membersEmpty}>
                  No members yet. Add your first member below.
                </Text>
              )}

              <Text style={[styles.modalLabel, { marginTop: 12 }]}>
                Add member
              </Text>
              <TextInput
                value={memberName}
                onChangeText={setMemberName}
                placeholder="e.g. You, Vishnu, Arun"
                placeholderTextColor={palette.MUTED}
                style={styles.input}
              />

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  !memberName.trim() && { opacity: 0.4 },
                ]}
                disabled={!memberName.trim()}
                onPress={handleAddMember}
              >
                <Text style={styles.modalButtonText}>Add member</Text>
              </TouchableOpacity>

              {/* Balances section */}
              <View style={styles.balancesHeaderRow}>
                <Text style={[styles.modalLabel, { marginTop: 16 }]}>
                  Balances
                </Text>
                {selectedGroup && (
                  <Text style={styles.expensesSummary}>
                    Total: ₹ {groupTotal?.toFixed(0) || 0} •{" "}
                    {selectedGroup.expenses?.length || 0} expenses
                  </Text>
                )}
              </View>

              {selectedGroup?.expenses?.length ? (
                balances.length ? (
                  <View style={styles.balancesList}>
                    {balances.map((b) => {
                      let line = "";
                      let color = "#22C55E";
                      if (b.balance > 0) {
                        line = `${b.name} should receive ₹ ${b.balance.toFixed(0)}`;
                        color = "#22C55E";
                      } else if (b.balance < 0) {
                        line = `${b.name} owes ₹ ${Math.abs(b.balance).toFixed(0)}`;
                        color = "#F97316";
                      } else {
                        line = `${b.name} is settled up`;
                        color = palette.MUTED;
                      }

                      return (
                        <View key={b.memberId} style={styles.balanceRow}>
                          <Text style={[styles.balanceText, { color }]}>
                            {line}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.membersEmpty}>
                    No balances yet. Add expenses to see who owes what.
                  </Text>
                )
              ) : (
                <Text style={styles.membersEmpty}>
                  No expenses yet. Balances will appear after you add expenses.
                </Text>
              )}

              {/* Expenses section */}
              <View style={styles.expensesHeaderRow}>
                <Text style={[styles.modalLabel, { marginTop: 16 }]}>
                  Group expenses
                </Text>
              </View>

              {selectedGroup?.expenses?.length ? (
                <View style={styles.expensesList}>
                  {selectedGroup.expenses.map(renderExpenseRow)}
                </View>
              ) : (
                <Text style={styles.membersEmpty}>
                  No expenses yet. Add the first shared expense below.
                </Text>
              )}

              {/* Add expense form */}
              <Text style={[styles.modalLabel, { marginTop: 16 }]}>
                Add expense
              </Text>
              <TextInput
                value={expenseDesc}
                onChangeText={setExpenseDesc}
                placeholder="Description (e.g. Dinner, Cab, Rent)"
                placeholderTextColor={palette.MUTED}
                style={styles.input}
              />
              <TextInput
                value={expenseCategory}
                onChangeText={setExpenseCategory}
                placeholder="Category (e.g. Food, Travel, Bills)"
                placeholderTextColor={palette.MUTED}
                style={[styles.input, { marginTop: 8 }]}
              />
              <TextInput
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                placeholder="Amount (₹)"
                placeholderTextColor={palette.MUTED}
                keyboardType="numeric"
                style={[styles.input, { marginTop: 8 }]}
              />

              {/* Paid by */}
              <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                Paid by
              </Text>
              <View style={styles.payerRow}>
                {selectedGroup?.members?.length ? (
                  selectedGroup.members.map((m) => {
                    const isSelected = payerId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.pill,
                          isSelected && { backgroundColor: palette.PRIMARY, borderColor: palette.PRIMARY },
                        ]}
                        onPress={() => setPayerId(m.id)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            isSelected && { color: "#FFFFFF", fontWeight: "600" },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.membersEmpty}>
                    Add at least one member to select a payer.
                  </Text>
                )}
              </View>

              {/* Split between */}
              <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                Split between
              </Text>
              <View style={styles.payerRow}>
                {selectedGroup?.members?.length ? (
                  selectedGroup.members.map((m) => {
                    const isSelected = selectedParticipantIds.includes(m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.pill,
                          isSelected && { backgroundColor: palette.PRIMARY, borderColor: palette.PRIMARY },
                        ]}
                        onPress={() => toggleParticipant(m.id)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            isSelected && { color: "#FFFFFF", fontWeight: "600" },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.membersEmpty}>
                    Add members to split the expense.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  (!expenseDesc.trim() ||
                    !expenseAmount.trim() ||
                    !payerId ||
                    (selectedGroup?.members?.length || 0) === 0) && {
                    opacity: 0.4,
                  },
                ]}
                disabled={
                  !expenseDesc.trim() ||
                  !expenseAmount.trim() ||
                  !payerId ||
                  (selectedGroup?.members?.length || 0) === 0
                }
                onPress={handleAddExpense}
              >
                <Text style={styles.modalButtonText}>Add expense</Text>
              </TouchableOpacity>

              <Text style={styles.modalHint}>
                Equal split: amount ÷ selected participants. Long-press an
                expense to delete it.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 18,
      padding: 12,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
      marginBottom: 16,
    },
    infoTitle: {
      color: p.TEXT,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 2,
    },
    infoText: {
      color: p.MUTED,
      fontSize: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sectionTitle: {
      color: p.TEXT,
      fontSize: 16,
      fontWeight: "700",
    },
    sectionCount: {
      color: p.MUTED,
      fontSize: 12,
    },
    groupCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD_ELEVATED,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: p.BORDER || "#111827",
    },
    groupIcon: {
      width: 38,
      height: 38,
      borderRadius: 999,
      backgroundColor: p.BORDER || "#111827",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    groupName: {
      color: p.TEXT,
      fontSize: 15,
      fontWeight: "600",
    },
    groupMeta: {
      color: p.MUTED,
      fontSize: 12,
      marginTop: 2,
    },
    groupMetaSmall: {
      color: p.MUTED,
      fontSize: 11,
      marginTop: 2,
    },
    activeBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    activeBadgeText: {
      color: p.PRIMARY,
      fontSize: 11,
      marginLeft: 4,
      fontWeight: "600",
    },
    setActiveButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
    },
    setActiveText: {
      color: p.PRIMARY,
      fontSize: 11,
      marginLeft: 4,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      marginTop: 48,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      color: p.TEXT,
      fontSize: 16,
      fontWeight: "700",
      marginTop: 16,
    },
    emptySubtitle: {
      color: p.MUTED,
      fontSize: 13,
      textAlign: "center",
      marginTop: 6,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 90,
      flexDirection: "row",
      borderRadius: 999,
      paddingHorizontal: 20,
      paddingVertical: 12,
      alignItems: "center",
      elevation: 3,
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
      backgroundColor: p.CARD,
      padding: 16,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
      maxHeight: "90%",
    },
    modalScrollContent: {
      paddingBottom: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    modalTitle: {
      color: p.TEXT,
      fontSize: 18,
      fontWeight: "700",
    },
    modalLabel: {
      color: p.MUTED,
      fontSize: 13,
      marginBottom: 6,
      marginTop: 6,
    },
    input: {
      backgroundColor: p.CARD,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: p.TEXT,
      fontSize: 14,
    },
    modalButton: {
      backgroundColor: p.PRIMARY,
      borderRadius: 999,
      paddingVertical: 11,
      alignItems: "center",
      marginTop: 8,
    },
    modalButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },
    modalHint: {
      color: p.MUTED,
      fontSize: 11,
      marginTop: 8,
      textAlign: "center",
    },
    membersContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 4,
    },
    membersEmpty: {
      color: p.MUTED,
      fontSize: 12,
      marginBottom: 4,
    },
    memberChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
      marginRight: 6,
      marginBottom: 6,
    },
    memberAvatar: {
      width: 22,
      height: 22,
      borderRadius: 999,
      backgroundColor: p.BORDER || "#111827",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 6,
    },
    memberAvatarText: {
      color: p.TEXT,
      fontSize: 11,
      fontWeight: "700",
    },
    memberName: {
      color: p.TEXT,
      fontSize: 13,
    },
    balancesHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    balancesList: {
      marginTop: 4,
    },
    balanceRow: {
      paddingVertical: 3,
    },
    balanceText: {
      fontSize: 12,
      fontWeight: "600",
    },
    expensesHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    expensesSummary: {
      color: p.MUTED,
      fontSize: 11,
    },
    expensesList: {
      marginTop: 4,
    },
    expenseCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.CARD,
      borderRadius: 14,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: p.BORDER || "#111827",
    },
    expenseTitle: {
      color: p.TEXT,
      fontSize: 14,
      fontWeight: "600",
    },
    expenseMeta: {
      color: p.MUTED,
      fontSize: 12,
      marginTop: 2,
    },
    expenseMetaSmall: {
      color: p.MUTED,
      fontSize: 11,
      marginTop: 2,
    },
    expenseAmount: {
      color: "#F97316",
      fontSize: 15,
      fontWeight: "700",
      marginLeft: 10,
    },
    payerRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 4,
    },
    pill: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: p.BORDER || "#1F2937",
      backgroundColor: p.CARD,
      marginRight: 6,
      marginBottom: 6,
    },
    pillSelected: {
      backgroundColor: p.PRIMARY,
      borderColor: p.PRIMARY,
    },
    pillText: {
      color: p.MUTED,
      fontSize: 12,
    },
    pillTextSelected: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });
}
