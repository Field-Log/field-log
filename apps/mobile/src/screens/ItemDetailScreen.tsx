import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  formatPickerLabel,
  getItemLabel,
  ITEM_TYPE_MAP,
} from "../config/itemTypes";
import {
  addItemToCollection,
  addTagToItem,
  deleteItem,
  fetchAllTags,
  fetchCarryDatesForItem,
  fetchCollections,
  fetchCollectionsForItem,
  fetchItemById,
  fetchLogEntriesForItem,
  fetchTagsForItem,
  type Item,
  type LogEntryType,
  removeItemFromCollection,
  removeTagFromItem,
  toggleCarried,
  upsertTag,
} from "../db/database";
import {
  deleteSyncedCurrentUserItemBestEffort,
  deleteSyncedCurrentUserLogEntryBestEffort,
  syncCurrentUserLogEntryBestEffort,
} from "../db/sync";
import type { FieldLogNavigation, FieldLogRoute } from "../navigation/types";
import { C } from "../theme/colors";

const ENTRY_TYPE_LABELS: Record<LogEntryType, string> = {
  carried: "Carried",
  maintenance: "Maintenance",
  note: "Note",
  ink_change: "Ink change",
  config_change: "Config change",
};

type LogEntry = {
  id: string;
  entry_type: LogEntryType;
  entry_date: string;
  notes: string | null;
  condition: string | null;
  created_at: string;
};

function computeStreak(sortedDates: string[]): {
  current: number;
  longest: number;
} {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const set = new Set(sortedDates);

  // current streak: count backwards from today
  let current = 0;
  let cursor: string | null = set.has(today)
    ? today
    : set.has(yesterday)
      ? yesterday
      : null;
  while (cursor !== null && set.has(cursor)) {
    current++;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }

  // longest streak
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const previousDate = sortedDates[i - 1];
    const currentDate = sortedDates[i];
    if (!previousDate || !currentDate) continue;

    const prev = new Date(previousDate);
    const curr = new Date(currentDate);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);
  return { current, longest };
}

function CarryHeatmap({ carryDates }: { carryDates: Set<string> }) {
  const WEEKS = 13;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Align to nearest Sunday so columns are Sun–Sat
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const cells: { date: string; carried: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; carried: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + w * 7 + d);
      const iso = day.toISOString().slice(0, 10);
      const future = day > today;
      week.push({ date: iso, carried: !future && carryDates.has(iso) });
    }
    cells.push(week);
  }

  return (
    <View style={heatStyles.wrap}>
      <View style={heatStyles.grid}>
        {cells.map((week) => (
          <View key={week[0]?.date ?? "empty-week"} style={heatStyles.col}>
            {week.map((cell) => (
              <View
                key={cell.date}
                style={[heatStyles.cell, cell.carried && heatStyles.cellOn]}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={heatStyles.label}>Carry history — last {WEEKS} weeks</Text>
    </View>
  );
}

const heatStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  grid: { flexDirection: "row", gap: 3 },
  col: { flexDirection: "column", gap: 3 },
  cell: { width: 14, height: 14, borderRadius: 3, backgroundColor: C.heatOff },
  cellOn: { backgroundColor: C.heatOn },
  label: { fontSize: 11, color: C.textMuted, marginTop: 6, textAlign: "right" },
});

export default function ItemDetailScreen() {
  const route = useRoute<FieldLogRoute<"ItemDetail">>();
  const navigation = useNavigation<FieldLogNavigation>();
  const { itemId, item_type } = route.params;

  const [item, setItem] = useState<Item | null>(null);
  const [carriedToday, setCarriedToday] = useState<boolean | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [itemCollections, setItemCollections] = useState<
    { id: string; name: string }[]
  >([]);
  const [allCollections, setAllCollections] = useState<
    { id: string; name: string; description: string | null }[]
  >([]);
  const [itemTags, setItemTags] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [newTag, setNewTag] = useState("");
  const [carryDates, setCarryDates] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<{ current: number; longest: number }>({
    current: 0,
    longest: 0,
  });

  useFocusEffect(
    useCallback(() => {
      fetchItemById(itemId).then((i) => setItem(i ?? null));
      fetchLogEntriesForItem(itemId, item_type).then(setLogEntries);
      fetchCollectionsForItem(itemId).then(setItemCollections);
      fetchCollections().then(setAllCollections);
      fetchTagsForItem(itemId).then(setItemTags);
      fetchAllTags().then(setAllTags);
      fetchCarryDatesForItem(itemId).then((dates) => {
        const today = new Date().toISOString().slice(0, 10);
        setCarryDates(new Set(dates));
        setStreak(computeStreak(dates));
        setCarriedToday(dates.includes(today));
      });
    }, [itemId, item_type]),
  );

  const config = ITEM_TYPE_MAP[item_type];

  const handleMarkCarried = async () => {
    if (!item) return;
    const today = new Date().toISOString().slice(0, 10);
    const nowCarried = await toggleCarried(itemId, item_type, today);
    const entryId = `${itemId}_${today}_carried`;
    setCarriedToday(nowCarried);
    if (nowCarried) {
      syncCurrentUserLogEntryBestEffort(entryId);
    } else {
      deleteSyncedCurrentUserLogEntryBestEffort(entryId);
    }
    const nextDates = new Set(carryDates);
    if (nowCarried) {
      nextDates.add(today);
    } else {
      nextDates.delete(today);
    }
    setCarryDates(nextDates);
    setStreak(computeStreak([...nextDates].sort()));
    Alert.alert(
      nowCarried ? "Marked as carried" : "Removed from today",
      nowCarried
        ? `${getItemLabel(item)} is marked as carried today.`
        : `${getItemLabel(item)} was removed from today's carry log.`,
    );
  };

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      "Delete item",
      `Are you sure you want to delete ${getItemLabel(item)}? This also removes all its log entries.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteItem(itemId);
            deleteSyncedCurrentUserItemBestEffort(itemId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleToggleCollection = async (collectionId: string) => {
    const inIt = itemCollections.some((c) => c.id === collectionId);
    if (inIt) {
      await removeItemFromCollection(itemId, collectionId);
    } else {
      await addItemToCollection(itemId, collectionId);
    }
    fetchCollectionsForItem(itemId).then(setItemCollections);
  };

  const handleToggleTag = async (tagId: string) => {
    const hasIt = itemTags.some((t) => t.id === tagId);
    if (hasIt) {
      await removeTagFromItem(itemId, tagId);
    } else {
      await addTagToItem(itemId, tagId);
    }
    fetchTagsForItem(itemId).then(setItemTags);
  };

  const handleAddNewTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    const tagId = await upsertTag(name);
    await addTagToItem(itemId, tagId);
    setNewTag("");
    fetchTagsForItem(itemId).then(setItemTags);
    fetchAllTags().then(setAllTags);
  };

  const fieldRow = (
    label: string,
    value: string | number | null | undefined,
  ) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <View key={label} style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{String(value)}</Text>
      </View>
    );
  };

  if (!item) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  const carryLabel =
    carriedToday === true
      ? "Carried Today (tap to undo)"
      : "Mark Carried Today";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.carryButton} onPress={handleMarkCarried}>
        <Text style={styles.carryButtonText}>{carryLabel}</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("EditItem", { itemId })}
        >
          <Text style={styles.secondaryText}>Edit</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            navigation.navigate("AddLog", { itemId, itemType: item_type })
          }
        >
          <Text style={styles.secondaryText}>Add log</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={[styles.secondaryText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </View>

      {/* Gallery */}
      {item.gallery && item.gallery.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.galleryScroll}
        >
          {item.gallery.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.galleryImage} />
          ))}
        </ScrollView>
      )}

      <CarryHeatmap carryDates={carryDates} />

      {(streak.current > 0 || streak.longest > 0) && (
        <View style={styles.streakRow}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{streak.current}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{streak.longest}</Text>
            <Text style={styles.streakLabel}>best streak</Text>
          </View>
        </View>
      )}

      <Text style={styles.header}>{config?.label ?? item_type}</Text>

      {/* Universal fields */}
      {fieldRow("Manufacturer", item.manufacturer)}
      {fieldRow("Model", item.model)}
      {fieldRow("Nickname", item.nickname)}
      {fieldRow("Variant", item.variant)}
      {fieldRow("Serial Number", item.serial_number)}
      {fieldRow("Status", item.status)}
      {fieldRow("Purchase Date", item.purchase_date)}
      {item.purchase_price != null
        ? fieldRow("Purchase Price", item.purchase_price)
        : null}
      {fieldRow("Material", item.material)}
      {fieldRow("Finish", item.finish)}
      {fieldRow("Color", item.color)}
      {item.weight_g != null ? fieldRow("Weight", `${item.weight_g} g`) : null}
      {fieldRow("Dimensions", item.dimensions)}
      {fieldRow("Storage Location", item.storage_location)}
      {fieldRow("Notes", item.notes)}

      {/* Custom fields (custom item types) */}
      {!config &&
        Array.isArray(item.specs.custom_fields) &&
        item.specs.custom_fields.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Details</Text>
            {(
              item.specs.custom_fields as { label: string; value: string }[]
            ).map((f) => (f.label ? fieldRow(f.label, f.value) : null))}
          </View>
        )}

      {/* Type-specific spec sections */}
      {config?.specSections.map((section) => {
        const visibleFields = section.fields.filter((f) => {
          const v = item.specs[f.key];
          return v !== undefined && v !== null && v !== "";
        });
        if (visibleFields.length === 0) return null;
        return (
          <View key={section.title}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {visibleFields.map((f) => {
              const v = item.specs[f.key];
              let display: string;
              if (f.input === "boolean") {
                display = v ? "Yes" : "No";
              } else if (f.unit) {
                display = `${v} ${f.unit}`;
              } else if (f.input === "picker") {
                display = formatPickerLabel(String(v));
              } else {
                display = String(v);
              }
              return fieldRow(f.label, display);
            })}
          </View>
        );
      })}

      {/* Collections */}
      {allCollections.length > 0 && (
        <View style={styles.collectionsSection}>
          <Text style={styles.sectionHeader}>Collections</Text>
          <View style={styles.collectionChips}>
            {allCollections.map((col) => {
              const active = itemCollections.some((c) => c.id === col.id);
              return (
                <Pressable
                  key={col.id}
                  style={[
                    styles.collectionChip,
                    active && styles.collectionChipActive,
                  ]}
                  onPress={() => handleToggleCollection(col.id)}
                >
                  <Text
                    style={[
                      styles.collectionChipText,
                      active && styles.collectionChipTextActive,
                    ]}
                  >
                    {col.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Tags */}
      <View style={styles.tagsSection}>
        <Text style={styles.sectionHeader}>Tags</Text>
        <View style={styles.tagChips}>
          {allTags.map((tag) => {
            const active = itemTags.some((t) => t.id === tag.id);
            return (
              <Pressable
                key={tag.id}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => handleToggleTag(tag.id)}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    active && styles.tagChipTextActive,
                  ]}
                >
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.tagInput]}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="New tag…"
            onSubmitEditing={handleAddNewTag}
            returnKeyType="done"
          />
          <Pressable style={styles.tagAddButton} onPress={handleAddNewTag}>
            <Text style={styles.tagAddText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Log history */}
      <View style={styles.logSection}>
        <Text style={styles.logHeader}>Log history</Text>
        {logEntries.length === 0 ? (
          <Text style={styles.logEmpty}>No log entries yet.</Text>
        ) : (
          logEntries.map((entry) => (
            <View key={entry.id} style={styles.logCard}>
              <View style={styles.logCardTop}>
                <Text style={styles.logType}>
                  {ENTRY_TYPE_LABELS[entry.entry_type]}
                </Text>
                <Text style={styles.logDate}>{entry.entry_date}</Text>
              </View>
              {entry.notes ? (
                <Text style={styles.logNotes}>{entry.notes}</Text>
              ) : null}
              {entry.condition ? (
                <Text style={styles.logCondition}>
                  Condition: {entry.condition}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: C.bg },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
  carryButton: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  carryButtonText: { color: C.text, fontSize: 16, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryText: { fontSize: 14, fontWeight: "600", color: C.textSub },
  deleteButton: { borderColor: C.danger },
  deleteText: { color: C.danger },
  streakRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  streakBadge: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  streakNum: { fontSize: 28, fontWeight: "800", color: C.streakNum },
  streakLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: C.text },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 10,
  },
  fieldRow: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: C.textMuted },
  fieldValue: { fontSize: 16, fontWeight: "500", color: C.text },
  galleryScroll: { marginBottom: 16, marginHorizontal: -20 },
  galleryImage: { width: 200, height: 150, borderRadius: 8, marginLeft: 16 },
  collectionsSection: { marginTop: 24 },
  collectionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  collectionChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  collectionChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  collectionChipText: { fontSize: 13, color: C.textSub },
  collectionChipTextActive: { color: C.text, fontWeight: "600" },
  tagsSection: { marginTop: 24 },
  tagChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagChipActive: { backgroundColor: C.teal, borderColor: C.teal },
  tagChipText: { fontSize: 13, color: C.textSub },
  tagChipTextActive: { color: C.text, fontWeight: "600" },
  tagInputRow: { flexDirection: "row", gap: 8 },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: C.bgInput,
    color: C.text,
  },
  tagAddButton: {
    backgroundColor: C.teal,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
  },
  tagAddText: { color: C.text, fontWeight: "600", fontSize: 14 },
  logSection: { marginTop: 28 },
  logHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  logEmpty: { fontSize: 14, color: C.textMuted },
  logCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: C.bgCard,
  },
  logCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  logType: { fontSize: 13, fontWeight: "600", color: C.accentBright },
  logDate: { fontSize: 12, color: C.textMuted },
  logNotes: { fontSize: 14, color: C.text, marginTop: 2 },
  logCondition: { fontSize: 12, color: C.textSub, marginTop: 4 },
});
