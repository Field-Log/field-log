import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { type ReactElement, useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { getItemLabel, ITEM_TYPE_MAP } from "../config/itemTypes";
import {
  fetchAllTags,
  fetchCollections,
  fetchItemIdsForTag,
  fetchItemIdsInCollection,
  fetchItems,
  fetchMostCarried,
  type Item,
} from "../db/database";
import type { PocketTrashNavigation } from "../navigation/types";

export default function LibraryList(): ReactElement {
  const navigation = useNavigation<PocketTrashNavigation>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [collections, setCollections] = useState<
    { id: string; name: string }[]
  >([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [collectionItemIds, setCollectionItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagItemIds, setTagItemIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "date_added" | "most_carried">(
    "name",
  );
  const [carryMap, setCarryMap] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      fetchItems().then((result) => {
        if (!active) return;
        setItems(result);
        setLoading(false);
      });
      fetchCollections().then(setCollections);
      fetchAllTags().then(setTags);
      fetchMostCarried().then((mc) => {
        const m: Record<string, number> = {};
        for (const r of mc) m[r.item_id] = r.days_carried;
        setCarryMap(m);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-8">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-8">
        <Text className="text-center text-base text-muted-foreground">
          No items yet. Tap Add to get started.
        </Text>
      </View>
    );
  }

  const handleTagPress = async (tagId: string) => {
    if (activeTag === tagId) {
      setActiveTag(null);
      setTagItemIds(new Set());
    } else {
      const ids = await fetchItemIdsForTag(tagId);
      setTagItemIds(new Set(ids));
      setActiveTag(tagId);
    }
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

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "date_added")
      return b.created_at.localeCompare(a.created_at);
    if (sortBy === "most_carried")
      return (carryMap[b.id] ?? 0) - (carryMap[a.id] ?? 0);
    // name: nickname → manufacturer model
    const labelA = (a.nickname ?? `${a.manufacturer ?? ""} ${a.model ?? ""}`)
      .toLowerCase()
      .trim();
    const labelB = (b.nickname ?? `${b.manufacturer ?? ""} ${b.model ?? ""}`)
      .toLowerCase()
      .trim();
    return labelA.localeCompare(labelB);
  });

  // Build filter options from types present in the library
  const presentTypes = Array.from(new Set(items.map((i) => i.item_type)));
  const q = searchQuery.trim().toLowerCase();
  const filteredItems = sortedItems.filter((i) => {
    if (activeFilter !== "all" && i.item_type !== activeFilter) return false;
    if (activeCollection && !collectionItemIds.has(i.id)) return false;
    if (activeTag && !tagItemIds.has(i.id)) return false;
    if (!q) return true;
    return (
      i.manufacturer?.toLowerCase().includes(q) ||
      i.model?.toLowerCase().includes(q) ||
      i.nickname?.toLowerCase().includes(q) ||
      i.variant?.toLowerCase().includes(q)
    );
  });

  return (
    <View className="flex-1 bg-background">
      {/* Search bar */}
      <View className="border-b border-border bg-background px-3 pb-1 pt-2.5">
        <TextInput
          className="rounded-lg bg-background px-3.5 py-2.5 text-base text-foreground"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, manufacturer, model…"
          placeholderClassName="text-muted-foreground"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-3 py-2.5"
      >
        <Pressable
          className={`rounded-full border px-3.5 py-1.5 ${
            activeFilter === "all"
              ? "border-accent bg-accent"
              : "border-primary bg-background"
          }`}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            className={`text-sm font-semibold ${
              activeFilter === "all" ? "text-accent-foreground" : "text-primary"
            }`}
          >
            All
          </Text>
        </Pressable>
        {presentTypes.map((type) => (
          <Pressable
            key={type}
            className={`rounded-full border px-3.5 py-1.5 ${
              activeFilter === type
                ? "border-accent bg-accent"
                : "border-primary bg-background"
            }`}
            onPress={() => setActiveFilter(type)}
          >
            <Text
              className={`text-sm font-semibold ${
                activeFilter === type
                  ? "text-accent-foreground"
                  : "text-primary"
              }`}
            >
              {ITEM_TYPE_MAP[type]?.label ?? type}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Collection filter row */}
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

      {/* Tag filter row */}
      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-3 py-2.5"
        >
          {tags.map((tag) => (
            <Pressable
              key={tag.id}
              className={`rounded-full border px-3.5 py-1.5 ${
                activeTag === tag.id
                  ? "border-chart-2 bg-chart-2"
                  : "border-chart-2 bg-background"
              }`}
              onPress={() => handleTagPress(tag.id)}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTag === tag.id ? "text-background" : "text-chart-2"
                }`}
              >
                #{tag.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Sort bar */}
      <View className="flex-row gap-2 border-b border-border bg-background px-3 py-2">
        {(["name", "date_added", "most_carried"] as const).map((opt) => (
          <Pressable
            key={opt}
            className={`rounded-full border px-3 py-1 ${
              sortBy === opt
                ? "border-accent bg-card"
                : "border-border bg-sidebar-accent"
            }`}
            onPress={() => setSortBy(opt)}
          >
            <Text
              className={`text-xs font-medium ${
                sortBy === opt
                  ? "font-bold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {opt === "name"
                ? "Name"
                : opt === "date_added"
                  ? "Newest"
                  : "Most Carried"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <Pressable
            className="mb-3 rounded-lg border border-border bg-card p-4"
            onPress={() =>
              navigation.navigate("ItemDetail", {
                itemId: item.id,
                item_type: item.item_type,
              })
            }
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className="flex-1 text-base font-semibold text-card-foreground"
                numberOfLines={1}
              >
                {getItemLabel(item)}
              </Text>
              <View className="shrink-0 rounded-full bg-accent px-2.5 py-1">
                <Text className="text-xs font-semibold text-accent-foreground">
                  {ITEM_TYPE_MAP[item.item_type]?.label ?? item.item_type}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
