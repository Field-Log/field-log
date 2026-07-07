import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { ITEM_TYPES, type ItemTypeConfig } from "../config/itemTypes";
import type { FieldLogNavigation } from "../navigation/types";
import { C } from "../theme/colors";

type Section = {
  title: string;
  data: ItemTypeConfig[];
};

const SECTIONS: Section[] = [
  {
    title: "Writing",
    data: ITEM_TYPES.filter((t) =>
      ["fountain_pen", "ballpoint_pen", "pencil", "ink", "notebook"].includes(
        t.type,
      ),
    ),
  },
  {
    title: "Carry",
    data: ITEM_TYPES.filter((t) =>
      [
        "knife",
        "multitool",
        "tool",
        "flashlight",
        "wallet",
        "key_organizer",
        "bag",
        "fidget",
        "medical_kit",
      ].includes(t.type),
    ),
  },
  {
    title: "Tech",
    data: ITEM_TYPES.filter((t) =>
      ["electronics", "audio", "camera", "lens", "optic"].includes(t.type),
    ),
  },
  {
    title: "Wearables",
    data: ITEM_TYPES.filter((t) => ["watch", "clothing"].includes(t.type)),
  },
  {
    title: "Other",
    data: ITEM_TYPES.filter((t) =>
      ["outdoor_gear", "consumable"].includes(t.type),
    ),
  },
  {
    title: "Custom",
    data: [
      { type: "__custom__", label: "Custom item type…", specSections: [] },
    ],
  },
];

export default function ChooseItemTypeScreen() {
  const navigation = useNavigation<FieldLogNavigation>();

  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(item) => item.type}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() =>
            navigation.navigate("AddItem", { item_type: item.type })
          }
        >
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32, backgroundColor: C.bg },
  sectionHeader: {
    backgroundColor: C.bgMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowLabel: { flex: 1, fontSize: 16, color: C.text },
  chevron: { fontSize: 20, color: C.textMuted },
});
