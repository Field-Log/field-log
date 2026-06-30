import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  fetchItems,
  fetchCarriedItemIdsForDate,
  toggleCarried,
  fetchMostCarried,
  fetchCollections,
  fetchItemIdsInCollection,
  Item,
} from "../db/database";
import { ITEM_TYPE_MAP, getItemLabel } from "../config/itemTypes";
import { C } from "../theme/colors";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(base: string, days: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type ItemRow = Item & { carried: boolean };
type Collection = { id: string; name: string };

export default function LogScreen() {
  const [date, setDate] = useState(todayString());
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysCarriedMap, setDaysCarriedMap] = useState<Record<string, number>>(
    {},
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [collectionItemIds, setCollectionItemIds] = useState<Set<string>>(
    new Set(),
  );
  const today = todayString();

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const [allItems, carried, mostCarried, cols] = await Promise.all([
      fetchItems(),
      fetchCarriedItemIdsForDate(d),
      fetchMostCarried(),
      fetchCollections(),
    ]);
    const map: Record<string, number> = {};
    for (const mc of mostCarried) map[mc.item_id] = mc.days_carried;
    setDaysCarriedMap(map);
    setCollections(cols);

    const carriedSet = new Set(
      carried.map((c) => `${c.item_type}:${c.item_id}`),
    );
    const combined: ItemRow[] = allItems.map((item) => ({
      ...item,
      carried: carriedSet.has(`${item.item_type}:${item.id}`),
    }));
    setRows(combined);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(date);
    }, [date, load]),
  );

  const handleDateChange = (delta: number) => {
    const next = offsetDate(date, delta);
    if (next > today) return;
    setDate(next);
  };

  const handleToggle = async (row: ItemRow) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id && r.item_type === row.item_type
          ? { ...r, carried: !r.carried }
          : r,
      ),
    );
    await toggleCarried(row.id, row.item_type, date);
  };

  const handleCollectionPress = async (colId: string) => {
    if (activeCollection === colId) {
      setActiveCollection(null);
      setCollectionItemIds(new Set());
    } else {
      const ids = await fetchItemIdsInCollection(colId);
      setCollectionItemIds(new Set(ids));
      setActiveCollection(colId);
    }
  };

  const visibleRows = activeCollection
    ? rows.filter((r) => collectionItemIds.has(r.id))
    : rows;

  const dateLabel = date === today ? "Today" : date;
  const carriedCount = visibleRows.filter((r) => r.carried).length;

  return (
    <View style={styles.container}>
      {/* Date nav */}
      <View style={styles.header}>
        <Pressable onPress={() => handleDateChange(-1)} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.dateMeta}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          {carriedCount > 0 && (
            <Text style={styles.carriedCount}>{carriedCount} carried</Text>
          )}
        </View>
        <Pressable
          onPress={() => handleDateChange(1)}
          disabled={date >= today}
          style={styles.arrow}
        >
          <Text style={[styles.arrowText, date >= today && styles.disabled]}>
            ›
          </Text>
        </Pressable>
      </View>

      {/* Collection filter */}
      {collections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {collections.map((col) => (
            <Pressable
              key={col.id}
              style={[
                styles.chip,
                activeCollection === col.id && styles.chipActive,
              ]}
              onPress={() => handleCollectionPress(col.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCollection === col.id && styles.chipTextActive,
                ]}
              >
                {col.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : visibleRows.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>
            {activeCollection
              ? "No items in this collection."
              : "No items in your library yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(r) => `${r.item_type}-${r.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, item.carried && styles.rowCarried]}
              onPress={() => handleToggle(item)}
            >
              <View style={[styles.checkbox, item.carried && styles.checked]}>
                {item.carried && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{getItemLabel(item)}</Text>
                <Text style={styles.type}>
                  {ITEM_TYPE_MAP[item.item_type]?.label ?? item.item_type}
                </Text>
              </View>
              {daysCarriedMap[item.id] != null && (
                <Text style={styles.streak}>{daysCarriedMap[item.id]}d</Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: C.border,
    gap: 24,
    backgroundColor: C.bg,
  },
  arrow: { padding: 8 },
  arrowText: { fontSize: 28, color: C.text },
  disabled: { color: C.textMuted },
  dateMeta: { alignItems: "center", minWidth: 120 },
  dateLabel: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: C.text,
  },
  carriedCount: { fontSize: 12, color: C.accentBright, marginTop: 2 },
  filterBar: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.purple,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.purple },
  chipText: { color: C.purple, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: C.text },
  list: { padding: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: C.textMuted, fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  rowCarried: { borderColor: C.accent },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: C.accent, borderColor: C.accent },
  checkmark: { color: C.text, fontSize: 14, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: C.text },
  type: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  streak: { fontSize: 12, color: C.textSub, fontVariant: ["tabular-nums"] },
});
