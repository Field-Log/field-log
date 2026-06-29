import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import {
  getReminderSettings,
  scheduleCarryReminder,
  cancelCarryReminder,
  requestNotificationPermission,
} from "../utils/notifications";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  fetchCollections,
  insertCollection,
  deleteCollection,
  fetchItems,
} from "../db/database";

export default function SettingsScreen() {
  const [collections, setCollections] = useState<
    { id: string; name: string; description: string | null }[]
  >([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);

  const { user, signOut } = useAuth();

  const reload = () => fetchCollections().then(setCollections);

  const handleExport = async () => {
    try {
      const items = await fetchItems();
      const payload = {
        exportedAt: new Date().toISOString(),
        version: 1,
        items,
      };
      const json = JSON.stringify(payload, null, 2);
      const path = `${FileSystem.cacheDirectory}field-log-export.json`;
      await FileSystem.writeAsStringAsync(path, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "Export Field Log data",
      });
    } catch (e) {
      Alert.alert("Export failed", String(e));
    }
  };

  useEffect(() => {
    reload();
    getReminderSettings().then(({ enabled, hour, minute }) => {
      setReminderEnabled(enabled);
      setReminderHour(hour);
      setReminderMinute(minute);
    });
  }, []);

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Permission needed",
          "Please enable notifications in Settings to use carry reminders.",
        );
        return;
      }
      await scheduleCarryReminder(reminderHour, reminderMinute);
    } else {
      await cancelCarryReminder();
    }
    setReminderEnabled(value);
  };

  const handleUpdateReminderTime = async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    if (reminderEnabled) {
      await scheduleCarryReminder(hour, minute);
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await insertCollection(name, newDesc.trim() || undefined);
    setNewName("");
    setNewDesc("");
    reload();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      `Delete "${name}"?`,
      "Items in this collection will not be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCollection(id);
            reload();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Account */}
      <Text style={styles.sectionHeader}>Account</Text>
      {user ? (
        <View style={styles.accountRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountEmail}>
              {user.email ?? user.displayName ?? "Signed in"}
            </Text>
            <Text style={styles.accountSub}>Syncing to cloud</Text>
          </View>
          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.empty}>Not signed in.</Text>
      )}

      <Text style={[styles.sectionHeader, { marginTop: 28 }]}>Data</Text>
      <Pressable style={styles.exportButton} onPress={handleExport}>
        <Text style={styles.exportButtonText}>Export all items to JSON</Text>
      </Pressable>
      <Text style={styles.exportHint}>
        Saves a JSON file you can AirDrop, email, or save to Files. Your data is
        also included in iCloud device backups automatically.
      </Text>

      <Text style={[styles.sectionHeader, { marginTop: 32 }]}>
        Notifications
      </Text>
      <View style={styles.reminderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>Daily carry reminder</Text>
          <Text style={styles.reminderSub}>
            {reminderEnabled
              ? `Reminds you at ${String(reminderHour).padStart(2, "0")}:${String(reminderMinute).padStart(2, "0")} every day`
              : "Off"}
          </Text>
        </View>
        <Switch value={reminderEnabled} onValueChange={handleToggleReminder} />
      </View>
      {reminderEnabled && (
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Time</Text>
          <View style={styles.timePickers}>
            {[18, 19, 20, 21, 22].map((h) => (
              <Pressable
                key={h}
                style={[
                  styles.timePill,
                  reminderHour === h && styles.timePillActive,
                ]}
                onPress={() => handleUpdateReminderTime(h, reminderMinute)}
              >
                <Text
                  style={[
                    styles.timePillText,
                    reminderHour === h && styles.timePillTextActive,
                  ]}
                >
                  {h > 12 ? `${h - 12}pm` : `${h}am`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Text style={[styles.sectionHeader, { marginTop: 32 }]}>Collections</Text>

      {collections.length === 0 ? (
        <Text style={styles.empty}>No collections yet.</Text>
      ) : (
        collections.map((col) => (
          <View key={col.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{col.name}</Text>
              {col.description ? (
                <Text style={styles.rowDesc}>{col.description}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => handleDelete(col.id, col.name)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}

      <Text style={styles.subHeader}>New collection</Text>
      <TextInput
        style={styles.input}
        value={newName}
        onChangeText={setNewName}
        placeholder="Name (required)"
      />
      <TextInput
        style={styles.input}
        value={newDesc}
        onChangeText={setNewDesc}
        placeholder="Description (optional)"
      />
      <Pressable style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>Add Collection</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 12,
  },
  empty: { fontSize: 14, color: "#aaa", marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  rowName: { fontSize: 15, fontWeight: "600", color: "#222" },
  rowDesc: { fontSize: 13, color: "#888", marginTop: 2 },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e25555",
  },
  deleteText: { color: "#e25555", fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#7c5cbf",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  accountEmail: { fontSize: 15, fontWeight: "600", color: "#222" },
  accountSub: { fontSize: 12, color: "#2a9d8f", marginTop: 2 },
  signOutButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  signOutText: { fontSize: 13, fontWeight: "600", color: "#666" },
  exportButton: {
    backgroundColor: "#333",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  exportButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  exportHint: { fontSize: 12, color: "#999", lineHeight: 18, marginBottom: 8 },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
    gap: 12,
  },
  reminderTitle: { fontSize: 15, fontWeight: "600", color: "#222" },
  reminderSub: { fontSize: 12, color: "#888", marginTop: 2 },
  timeRow: { marginBottom: 8 },
  timeLabel: { fontSize: 13, color: "#666", marginBottom: 8 },
  timePickers: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  timePillActive: { backgroundColor: "#4a90e2", borderColor: "#4a90e2" },
  timePillText: { fontSize: 13, color: "#444", fontWeight: "500" },
  timePillTextActive: { color: "#fff", fontWeight: "700" },
});
