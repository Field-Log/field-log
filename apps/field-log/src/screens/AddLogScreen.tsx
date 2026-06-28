import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { insertLogEntry, LogEntryType } from "../db/database";

const ENTRY_TYPES: { value: LogEntryType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "maintenance", label: "Maintenance" },
  { value: "ink_change", label: "Ink Change" },
  { value: "config_change", label: "Config Change" },
];

export default function AddLogScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { itemId, itemType } = route.params as {
    itemId: string;
    itemType: string;
  };

  const [entryType, setEntryType] = useState<LogEntryType>("note");
  const [notes, setNotes] = useState("");
  const [condition, setCondition] = useState("");

  const handleSave = async () => {
    if (!notes) return;
    await insertLogEntry(Date.now().toString(), itemId, notes, condition, {
      itemType,
      entryType,
    });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Log Entry</Text>

      <Text style={styles.fieldLabel}>Type</Text>
      <View style={styles.typeRow}>
        {ENTRY_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[
              styles.typePill,
              entryType === t.value && styles.typePillActive,
            ]}
            onPress={() => setEntryType(t.value)}
          >
            <Text
              style={[
                styles.typePillText,
                entryType === t.value && styles.typePillTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="What happened?"
      />

      <Text style={styles.fieldLabel}>Condition (optional)</Text>
      <TextInput
        style={styles.input}
        value={condition}
        onChangeText={setCondition}
        placeholder="e.g. Excellent"
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  fieldLabel: { fontSize: 13, color: "#555", marginBottom: 6 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  typePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#aaa",
  },
  typePillActive: { backgroundColor: "#4a90e2", borderColor: "#4a90e2" },
  typePillText: { fontSize: 13, color: "#333" },
  typePillTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 15,
  },
  notes: { height: 100, textAlignVertical: "top" },
  saveButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
