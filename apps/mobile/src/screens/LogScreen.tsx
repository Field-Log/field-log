import { useFocusEffect } from "@react-navigation/native";
import { type ReactElement, useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { getItemLabel, ITEM_TYPE_MAP } from "../config/itemTypes";
import {
  fetchCarriedItemIdsForDate,
  fetchCollections,
  fetchItemIdsInCollection,
  fetchItems,
  fetchMostCarried,
  type Item,
  toggleCarried,
} from "../db/database";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type ItemRow = Item & { carried: boolean };
type Collection = { id: string; name: string };

export default function LogScreen(): ReactElement {
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
    <View className="flex-1 bg-background">
      {/* Date nav */}
      <View className="flex-row items-center justify-center gap-6 border-b border-border bg-background py-3.5">
        <Pressable className="p-2" onPress={() => handleDateChange(-1)}>
          <Text className="text-3xl text-foreground">‹</Text>
        </Pressable>
        <View className="min-w-32 items-center">
          <Text className="text-center text-lg font-semibold text-foreground">
            {dateLabel}
          </Text>
          {carriedCount > 0 && (
            <Text className="mt-0.5 text-xs text-primary">
              {carriedCount} carried
            </Text>
          )}
        </View>
        <Pressable
          className="p-2"
          onPress={() => handleDateChange(1)}
          disabled={date >= today}
        >
          <Text
            className={`text-3xl ${
              date >= today ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            ›
          </Text>
        </Pressable>
      </View>

      {/* Collection filter */}
      {collections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-3 py-2.5"
        >
          {collections.map((col) => (
            <Pressable
              key={col.id}
              className={`rounded-full border px-3.5 py-1.5 ${
                activeCollection === col.id
                  ? "border-chart-4 bg-chart-4"
                  : "border-chart-4 bg-background"
              }`}
              onPress={() => handleCollectionPress(col.id)}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeCollection === col.id
                    ? "text-background"
                    : "text-chart-4"
                }`}
              >
                {col.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator className="mt-8" />
      ) : visibleRows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-muted-foreground">
            {activeCollection
              ? "No items in this collection."
              : "No items in your library yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(r) => `${r.item_type}-${r.id}`}
          contentContainerClassName="p-4"
          renderItem={({ item }) => (
            <Pressable
              className={`mb-2.5 flex-row items-center gap-3.5 rounded-lg border bg-card p-3.5 ${
                item.carried ? "border-accent" : "border-border"
              }`}
              onPress={() => handleToggle(item)}
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                  item.carried
                    ? "border-accent bg-accent"
                    : "border-muted-foreground"
                }`}
              >
                {item.carried && (
                  <Text className="text-sm font-bold text-accent-foreground">
                    ✓
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-card-foreground">
                  {getItemLabel(item)}
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {ITEM_TYPE_MAP[item.item_type]?.label ?? item.item_type}
                </Text>
              </View>
              {daysCarriedMap[item.id] != null && (
                <Text className="text-xs text-card-foreground">
                  {daysCarriedMap[item.id]}d
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
