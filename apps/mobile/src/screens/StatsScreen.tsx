import { useFocusEffect } from "@react-navigation/native";
import { type ReactElement, useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { getItemLabel } from "../config/itemTypes";
import {
  fetchCarryDatesForItem,
  fetchInkStats,
  fetchItemById,
  fetchMostCarried,
} from "../db/database";

function computeCurrentStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const set = new Set(sortedDates);
  let cursor: string | null = set.has(today)
    ? today
    : set.has(yesterday)
      ? yesterday
      : null;
  let count = 0;
  while (cursor && set.has(cursor)) {
    count++;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return count;
}

type RankedRow = {
  rank: number;
  item_id: string;
  item_type: string;
  days_carried: number;
  label: string;
  streak: number;
};

function sinceDate30() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function StatsScreen(): ReactElement {
  const [view, setView] = useState<"carry" | "ink">("carry");
  const [allTime, setAllTime] = useState(true);
  const [rows, setRows] = useState<RankedRow[]>([]);
  const [inkRows, setInkRows] = useState<{ ink: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isAllTime: boolean) => {
    setLoading(true);
    const [raw, inks] = await Promise.all([
      fetchMostCarried(isAllTime ? undefined : { sinceDate: sinceDate30() }),
      fetchInkStats(),
    ]);

    const resolved = await Promise.all(
      raw.map(async (r, i) => {
        const [item, dates] = await Promise.all([
          fetchItemById(r.item_id),
          fetchCarryDatesForItem(r.item_id),
        ]);
        const label = item ? getItemLabel(item) : r.item_id;
        const streak = computeCurrentStreak(dates);
        return { rank: i + 1, ...r, label, streak };
      }),
    );

    setRows(resolved);
    setInkRows(inks);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(allTime);
    }, [allTime, load]),
  );

  return (
    <View className="flex-1 bg-background">
      {/* Top-level view toggle */}
      <View className="m-4 flex-row overflow-hidden rounded-lg border border-accent">
        <Pressable
          className={`flex-1 items-center py-2.5 ${
            view === "carry" ? "bg-accent" : "bg-card"
          }`}
          onPress={() => setView("carry")}
        >
          <Text
            className={`text-sm font-semibold ${
              view === "carry" ? "text-accent-foreground" : "text-primary"
            }`}
          >
            Most Carried
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 items-center py-2.5 ${
            view === "ink" ? "bg-accent" : "bg-card"
          }`}
          onPress={() => setView("ink")}
        >
          <Text
            className={`text-sm font-semibold ${
              view === "ink" ? "text-accent-foreground" : "text-primary"
            }`}
          >
            Ink Usage
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-8" />
      ) : view === "carry" ? (
        <>
          <View className="mx-4 mb-3 flex-row overflow-hidden rounded-lg border border-border">
            <Pressable
              className={`flex-1 items-center py-2 ${
                allTime ? "bg-card" : "bg-sidebar-accent"
              }`}
              onPress={() => {
                setAllTime(true);
                load(true);
              }}
            >
              <Text
                className={`text-sm ${
                  allTime
                    ? "font-bold text-primary"
                    : "font-medium text-muted-foreground"
                }`}
              >
                All-time
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2 ${
                !allTime ? "bg-card" : "bg-sidebar-accent"
              }`}
              onPress={() => {
                setAllTime(false);
                load(false);
              }}
            >
              <Text
                className={`text-sm ${
                  !allTime
                    ? "font-bold text-primary"
                    : "font-medium text-muted-foreground"
                }`}
              >
                Last 30 days
              </Text>
            </Pressable>
          </View>
          {rows.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-center text-base leading-6 text-muted-foreground">
                No carry data yet. Start logging!
              </Text>
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(r) => `${r.item_type}-${r.item_id}`}
              contentContainerClassName="px-4 pb-8"
              renderItem={({ item }) => (
                <View className="mb-2.5 flex-row items-center gap-3 rounded-lg border border-border bg-card p-3.5">
                  <Text className="w-8 text-sm font-bold text-muted-foreground">
                    #{item.rank}
                  </Text>
                  <Text
                    className="flex-1 text-base font-semibold text-card-foreground"
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {item.streak > 0 && (
                    <Text className="text-sm font-semibold text-chart-5">
                      {item.streak}🔥
                    </Text>
                  )}
                  <Text className="text-sm font-semibold text-primary">
                    {item.days_carried}d
                  </Text>
                </View>
              )}
            />
          )}
        </>
      ) : // Ink usage
      inkRows.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-base leading-6 text-muted-foreground">
            No ink changes logged yet.{"\n"}Add a log entry with type "Ink
            Change" and put the ink name in the notes field.
          </Text>
        </View>
      ) : (
        <FlatList
          data={inkRows}
          keyExtractor={(r) => r.ink}
          contentContainerClassName="px-4 pb-8"
          renderItem={({ item, index }) => (
            <View className="mb-2.5 flex-row items-center gap-3 rounded-lg border border-border bg-card p-3.5">
              <Text className="w-8 text-sm font-bold text-muted-foreground">
                #{index + 1}
              </Text>
              <Text
                className="flex-1 text-base font-semibold text-card-foreground"
                numberOfLines={1}
              >
                {item.ink}
              </Text>
              <Text className="text-sm font-semibold text-chart-1">
                {item.count}×
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
