import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { type ReactElement, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
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

const centeredClass = "flex-1 items-center justify-center bg-background";
const fieldLabelClass = "text-xs text-muted-foreground";
const fieldRowClass = "mb-3";
const fieldValueClass = "text-base font-medium text-foreground";
const sectionHeaderClass =
  "mb-2.5 mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground";

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

function CarryHeatmap({
  carryDates,
}: {
  carryDates: Set<string>;
}): ReactElement {
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
    <View className="mb-5">
      <View className="flex-row gap-1">
        {cells.map((week) => (
          <View key={week[0]?.date ?? "empty-week"} className="flex-col gap-1">
            {week.map((cell) => (
              <View
                key={cell.date}
                className={`h-3.5 w-3.5 rounded-sm ${
                  cell.carried ? "bg-primary" : "bg-sidebar-accent"
                }`}
              />
            ))}
          </View>
        ))}
      </View>
      <Text className="mt-1.5 text-right text-xs text-muted-foreground">
        Carry history — last {WEEKS} weeks
      </Text>
    </View>
  );
}

export default function ItemDetailScreen(): ReactElement {
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
      <View key={label} className={fieldRowClass}>
        <Text className={fieldLabelClass}>{label}</Text>
        <Text className={fieldValueClass}>{String(value)}</Text>
      </View>
    );
  };

  if (!item) {
    return (
      <View className={centeredClass}>
        <ActivityIndicator />
      </View>
    );
  }

  const carryLabel =
    carriedToday === true
      ? "Carried Today (tap to undo)"
      : "Mark Carried Today";

  return (
    <ScrollView contentContainerClassName="bg-background p-5">
      <Pressable
        className="mb-3 items-center rounded-lg bg-accent py-3.5"
        onPress={handleMarkCarried}
      >
        <Text className="text-base font-semibold text-accent-foreground">
          {carryLabel}
        </Text>
      </Pressable>

      <View className="mb-6 flex-row gap-2.5">
        <Pressable
          className="flex-1 items-center rounded-lg border border-border py-2.5"
          onPress={() => navigation.navigate("EditItem", { itemId })}
        >
          <Text className="text-sm font-semibold text-card-foreground">
            Edit
          </Text>
        </Pressable>
        <Pressable
          className="flex-1 items-center rounded-lg border border-border py-2.5"
          onPress={() =>
            navigation.navigate("AddLog", { itemId, itemType: item_type })
          }
        >
          <Text className="text-sm font-semibold text-card-foreground">
            Add log
          </Text>
        </Pressable>
        <Pressable
          className="flex-1 items-center rounded-lg border border-destructive py-2.5"
          onPress={handleDelete}
        >
          <Text className="text-sm font-semibold text-destructive">Delete</Text>
        </Pressable>
      </View>

      {/* Gallery */}
      {item.gallery && item.gallery.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 mb-4"
        >
          {item.gallery.map((uri) => (
            <Image
              key={uri}
              className="ml-4 h-36 w-52 rounded-lg"
              source={{ uri }}
            />
          ))}
        </ScrollView>
      )}

      <CarryHeatmap carryDates={carryDates} />

      {(streak.current > 0 || streak.longest > 0) && (
        <View className="mb-5 flex-row gap-3">
          <View className="flex-1 items-center rounded-lg bg-card p-3.5">
            <Text className="text-3xl font-extrabold text-primary">
              {streak.current}
            </Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              day streak
            </Text>
          </View>
          <View className="flex-1 items-center rounded-lg bg-card p-3.5">
            <Text className="text-3xl font-extrabold text-primary">
              {streak.longest}
            </Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              best streak
            </Text>
          </View>
        </View>
      )}

      <Text className="mb-5 text-2xl font-bold text-foreground">
        {config?.label ?? item_type}
      </Text>

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
            <Text className={sectionHeaderClass}>Details</Text>
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
            <Text className={sectionHeaderClass}>{section.title}</Text>
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
        <View className="mt-6">
          <Text className={sectionHeaderClass}>Collections</Text>
          <View className="mt-1 flex-row flex-wrap gap-2">
            {allCollections.map((col) => {
              const active = itemCollections.some((c) => c.id === col.id);
              return (
                <Pressable
                  key={col.id}
                  className={`rounded-full border px-3.5 py-1.5 ${
                    active
                      ? "border-accent bg-accent"
                      : "border-border bg-background"
                  }`}
                  onPress={() => handleToggleCollection(col.id)}
                >
                  <Text
                    className={`text-sm ${
                      active
                        ? "font-semibold text-accent-foreground"
                        : "text-card-foreground"
                    }`}
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
      <View className="mt-6">
        <Text className={sectionHeaderClass}>Tags</Text>
        <View className="mb-3 mt-1 flex-row flex-wrap gap-2">
          {allTags.map((tag) => {
            const active = itemTags.some((t) => t.id === tag.id);
            return (
              <Pressable
                key={tag.id}
                className={`rounded-full border px-3 py-1 ${
                  active
                    ? "border-chart-2 bg-chart-2"
                    : "border-border bg-background"
                }`}
                onPress={() => handleToggleTag(tag.id)}
              >
                <Text
                  className={`text-sm ${
                    active
                      ? "font-semibold text-background"
                      : "text-card-foreground"
                  }`}
                >
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={newTag}
            onChangeText={setNewTag}
            placeholder="New tag…"
            onSubmitEditing={handleAddNewTag}
            returnKeyType="done"
          />
          <Pressable
            className="justify-center rounded-lg bg-chart-2 px-4 py-2"
            onPress={handleAddNewTag}
          >
            <Text className="text-sm font-semibold text-background">Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Log history */}
      <View className="mt-7">
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Log history
        </Text>
        {logEntries.length === 0 ? (
          <Text className="text-sm text-muted-foreground">
            No log entries yet.
          </Text>
        ) : (
          logEntries.map((entry) => (
            <View
              key={entry.id}
              className="mb-2.5 rounded-lg border border-border bg-card p-3"
            >
              <View className="mb-1 flex-row justify-between">
                <Text className="text-sm font-semibold text-primary">
                  {ENTRY_TYPE_LABELS[entry.entry_type]}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {entry.entry_date}
                </Text>
              </View>
              {entry.notes ? (
                <Text className="mt-0.5 text-sm text-card-foreground">
                  {entry.notes}
                </Text>
              ) : null}
              {entry.condition ? (
                <Text className="mt-1 text-xs text-card-foreground">
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
