import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
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
import type { FieldLogNavigation } from "../navigation/types";
import { C } from "../theme/colors";

export default function LibraryList() {
  const navigation = useNavigation<FieldLogNavigation>();
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>No items yet. Tap Add to get started.</Text>
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
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, manufacturer, model…"
          placeholderTextColor={C.textMuted}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        <Pressable
          style={[
            styles.filterChip,
            activeFilter === "all" && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === "all" && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {presentTypes.map((type) => (
          <Pressable
            key={type}
            style={[
              styles.filterChip,
              activeFilter === type && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === type && styles.filterChipTextActive,
              ]}
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
          contentContainerStyle={styles.filterBar}
        >
          {collections.map((col) => (
            <Pressable
              key={col.id}
              style={[
                styles.collectionChip,
                activeCollection === col.id && styles.collectionChipActive,
              ]}
              onPress={() => handleCollectionPress(col.id)}
            >
              <Text
                style={[
                  styles.collectionChipText,
                  activeCollection === col.id &&
                    styles.collectionChipTextActive,
                ]}
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
          contentContainerStyle={styles.filterBar}
        >
          {tags.map((tag) => (
            <Pressable
              key={tag.id}
              style={[
                styles.tagChip,
                activeTag === tag.id && styles.tagChipActive,
              ]}
              onPress={() => handleTagPress(tag.id)}
            >
              <Text
                style={[
                  styles.tagChipText,
                  activeTag === tag.id && styles.tagChipTextActive,
                ]}
              >
                #{tag.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Sort bar */}
      <View style={styles.sortBar}>
        {(["name", "date_added", "most_carried"] as const).map((opt) => (
          <Pressable
            key={opt}
            style={[styles.sortPill, sortBy === opt && styles.sortPillActive]}
            onPress={() => setSortBy(opt)}
          >
            <Text
              style={[
                styles.sortPillText,
                sortBy === opt && styles.sortPillTextActive,
              ]}
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
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("ItemDetail", {
                itemId: item.id,
                item_type: item.item_type,
              })
            }
          >
            <View style={styles.row}>
              <Text style={styles.title} numberOfLines={1}>
                {getItemLabel(item)}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
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

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: C.bg,
  },
  empty: { fontSize: 16, color: C.textMuted, textAlign: "center" },
  filterBar: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accent,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: C.accent },
  filterChipText: { color: C.accentBright, fontSize: 13, fontWeight: "600" },
  filterChipTextActive: { color: C.text },
  searchBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  searchInput: {
    backgroundColor: C.bgInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: C.text,
  },
  collectionChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.purple,
    marginRight: 8,
  },
  collectionChipActive: { backgroundColor: C.purple },
  collectionChipText: { color: C.purple, fontSize: 13, fontWeight: "600" },
  collectionChipTextActive: { color: C.text },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.teal,
    marginRight: 8,
  },
  tagChipActive: { backgroundColor: C.teal },
  tagChipText: { color: C.teal, fontSize: 13, fontWeight: "600" },
  tagChipTextActive: { color: C.text },
  sortBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgMuted,
  },
  sortPillActive: { borderColor: C.accent, backgroundColor: C.bgCard },
  sortPillText: { fontSize: 12, color: C.textMuted, fontWeight: "500" },
  sortPillTextActive: { color: C.accentBright, fontWeight: "700" },
  list: { padding: 16 },
  card: {
    backgroundColor: C.bgCard,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "600", flex: 1, color: C.text },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: C.accent,
    flexShrink: 0,
  },
  badgeText: { color: C.text, fontSize: 11, fontWeight: "600" },
});
