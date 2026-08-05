import { useNavigation } from "@react-navigation/native";
import { type ReactElement } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { ITEM_TYPES, type ItemTypeConfig } from "../config/itemTypes";
import type { FieldLogNavigation } from "../navigation/types";

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

export default function ChooseItemTypeScreen(): ReactElement {
  const navigation = useNavigation<FieldLogNavigation>();

  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(item) => item.type}
      contentContainerClassName="bg-background pb-8"
      renderSectionHeader={({ section }) => (
        <View className="bg-sidebar-accent px-4 py-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable
          className="flex-row items-center border-b border-border bg-card px-4 py-3.5"
          onPress={() =>
            navigation.navigate("AddItem", { item_type: item.type })
          }
        >
          <Text className="flex-1 text-base text-card-foreground">
            {item.label}
          </Text>
          <Text className="text-xl text-muted-foreground">›</Text>
        </Pressable>
      )}
    />
  );
}
