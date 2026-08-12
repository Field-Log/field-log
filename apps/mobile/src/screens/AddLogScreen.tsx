import { useNavigation, useRoute } from "@react-navigation/native";
import { type ReactElement, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { insertLogEntry, type LogEntryType } from "../db/database";
import { syncCurrentUserLogEntryBestEffort } from "../db/sync";
import type {
  PocketTrashNavigation,
  PocketTrashRoute,
} from "../navigation/types";

const ENTRY_TYPES: { value: LogEntryType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "maintenance", label: "Maintenance" },
  { value: "ink_change", label: "Ink Change" },
  { value: "config_change", label: "Config Change" },
];

export default function AddLogScreen(): ReactElement {
  const route = useRoute<PocketTrashRoute<"AddLog">>();
  const navigation = useNavigation<PocketTrashNavigation>();
  const { itemId, itemType } = route.params;

  const [entryType, setEntryType] = useState<LogEntryType>("note");
  const [notes, setNotes] = useState("");
  const [condition, setCondition] = useState("");

  const handleSave = async () => {
    if (!notes) return;
    const id = Date.now().toString();
    await insertLogEntry(id, itemId, notes, condition, {
      itemType,
      entryType,
    });
    syncCurrentUserLogEntryBestEffort(id);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerClassName="flex-grow bg-background p-5">
      <Text className="mb-5 text-2xl font-bold text-foreground">
        Add Log Entry
      </Text>

      <Text className="mb-1.5 text-sm text-card-foreground">Type</Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {ENTRY_TYPES.map((t) => (
          <Pressable
            key={t.value}
            className={`rounded-full border px-3.5 py-2 ${
              entryType === t.value
                ? "border-accent bg-accent"
                : "border-border bg-background"
            }`}
            onPress={() => setEntryType(t.value)}
          >
            <Text
              className={`text-sm ${
                entryType === t.value
                  ? "text-accent-foreground"
                  : "text-card-foreground"
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-1.5 text-sm text-card-foreground">Notes</Text>
      <TextInput
        className="mb-4 h-24 rounded-lg border border-border bg-background p-2.5 text-base text-foreground"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="What happened?"
        textAlignVertical="top"
      />

      <Text className="mb-1.5 text-sm text-card-foreground">
        Condition (optional)
      </Text>
      <TextInput
        className="mb-4 rounded-lg border border-border bg-background p-2.5 text-base text-foreground"
        value={condition}
        onChangeText={setCondition}
        placeholder="e.g. Excellent"
      />

      <Pressable
        className="mt-2 items-center rounded-lg bg-accent py-3.5"
        onPress={handleSave}
      >
        <Text className="text-base font-semibold text-accent-foreground">
          Save
        </Text>
      </Pressable>
    </ScrollView>
  );
}
