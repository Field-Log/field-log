import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getItemLabel, ITEM_TYPE_MAP } from "../config/itemTypes";
import {
  fetchCarriedItemIdsForDate,
  fetchItems,
  fetchMostCarried,
  type Item,
  toggleCarried,
} from "../db/database";
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

export default function LogScreen() {
  const [date, setDate] = useState(todayString());
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysCarriedMap, setDaysCarriedMap] = useState<Record<string, number>>(
    {},
  );
  const today = todayString();

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const [allItems, carried, mostCarried] = await Promise.all([
      fetchItems(),
      fetchCarriedItemIdsForDate(d),
      fetchMostCarried(),
    ]);
    const map: Record<string, number> = {};
    for (const mc of mostCarried) map[mc.item_id] = mc.days_carried;
    setDaysCarriedMap(map);

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

  const dateLabel = date === today ? "Today" : date;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => handleDateChange(-1)} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : rows.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>No items in your library yet.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => `${r.item_type}-${r.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => handleToggle(item)}>
              <View style={[styles.checkbox, item.carried && styles.checked]} />
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
  dateLabel: {
    fontSize: 18,
    fontWeight: "600",
    minWidth: 120,
    textAlign: "center",
    color: C.text,
  },
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.textMuted,
  },
  checked: { backgroundColor: C.accent, borderColor: C.accent },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: C.text },
  type: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  streak: { fontSize: 12, color: C.textSub, fontVariant: ["tabular-nums"] },
});
