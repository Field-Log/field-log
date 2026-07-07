import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useLayoutEffect, useState } from "react";
import {
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
  ITEM_TYPE_MAP,
  type SpecField,
} from "../config/itemTypes";
import { insertItem, type SpecValue } from "../db/database";
import type { FieldLogNavigation, FieldLogRoute } from "../navigation/types";
import { C } from "../theme/colors";

type CustomFieldDraft = {
  id: string;
  label: string;
  value: string;
};

function createCustomFieldDraft(): CustomFieldDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: "",
    value: "",
  };
}

export default function AddItemScreen() {
  const navigation = useNavigation<FieldLogNavigation>();
  const route = useRoute<FieldLogRoute<"AddItem">>();
  const { item_type } = route.params;
  const isCustom = item_type === "__custom__";
  const config = ITEM_TYPE_MAP[item_type];

  const [customTypeName, setCustomTypeName] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isCustom ? "Custom item" : (config?.label ?? "Add Item"),
    });
  }, [navigation, config, isCustom]);

  // Core fields
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [nickname, setNickname] = useState("");
  const [variant, setVariant] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState("own");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [seller, setSeller] = useState("");
  const [warranty, setWarranty] = useState("");
  const [material, setMaterial] = useState("");
  const [finish, setFinish] = useState("");
  const [color, setColor] = useState("");
  const [weightG, setWeightG] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Spec fields (keyed by field.key)
  const [specValues, setSpecValues] = useState<Record<string, SpecValue>>({});
  const [errors, setErrors] = useState<{
    manufacturer?: string;
    model?: string;
    customTypeName?: string;
  }>({});

  // Photos
  const [gallery, setGallery] = useState<string[]>([]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    const firstAsset = result.canceled ? undefined : result.assets[0];
    if (firstAsset) setGallery((prev) => [...prev, firstAsset.uri]);
  };

  const removePhoto = (uri: string) =>
    setGallery((prev) => prev.filter((u) => u !== uri));

  // Custom fields (for custom item types)
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const addCustomField = () =>
    setCustomFields((prev) => [...prev, createCustomFieldDraft()]);
  const updateCustomField = (i: number, key: "label" | "value", val: string) =>
    setCustomFields((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)),
    );
  const removeCustomField = (i: number) =>
    setCustomFields((prev) => prev.filter((_, idx) => idx !== i));

  const setSpec = (key: string, value: SpecValue) => {
    setSpecValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!manufacturer.trim())
      newErrors.manufacturer = "Manufacturer is required";
    if (!model.trim()) newErrors.model = "Model is required";
    if (isCustom && !customTypeName.trim())
      newErrors.customTypeName = "Item type name is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    // Build specs object
    const specs: Record<string, SpecValue> = {};
    if (config) {
      for (const section of config.specSections) {
        for (const field of section.fields) {
          const val = specValues[field.key];
          if (val === undefined || val === null || val === "") continue;
          if (field.input === "boolean") {
            specs[field.key] = val ? 1 : 0;
          } else if (field.input === "number") {
            const n = parseFloat(String(val));
            if (!isNaN(n)) specs[field.key] = n;
          } else {
            specs[field.key] = val;
          }
        }
      }
    }

    const id = Date.now().toString();
    // Include custom fields in specs
    if (isCustom) {
      const filled = customFields
        .filter((f) => f.label.trim())
        .map(({ label, value }) => ({ label, value }));
      if (filled.length > 0) specs.custom_fields = filled;
    }

    const storedType = isCustom ? customTypeName.trim() : item_type;
    await insertItem({
      id,
      item_type: storedType,
      name: null,
      manufacturer: manufacturer.trim() || null,
      model: model.trim() || null,
      variant: variant.trim() || null,
      nickname: nickname.trim() || null,
      serial_number: serialNumber.trim() || null,
      status,
      purchase_date: purchaseDate.trim() || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      current_value: null,
      seller: seller.trim() || null,
      warranty: warranty.trim() || null,
      material: material.trim() || null,
      finish: finish.trim() || null,
      color: color.trim() || null,
      weight_g: weightG ? parseFloat(weightG) : null,
      dimensions: dimensions.trim() || null,
      storage_location: storageLocation.trim() || null,
      is_favorite: 0,
      is_carried: 0,
      cover_photo: gallery[0] ?? null,
      gallery,
      notes: notes.trim() || null,
      specs,
    });

    navigation.getParent()?.navigate("Library", { screen: "LibraryList" });
  };

  const renderField = (field: SpecField) => {
    const val = specValues[field.key];
    const label = field.unit ? `${field.label} (${field.unit})` : field.label;

    if (field.input === "boolean") {
      const boolVal = !!val;
      return (
        <View key={field.key} style={styles.boolRow}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <Pressable
            style={[styles.boolToggle, boolVal && styles.boolToggleOn]}
            onPress={() => setSpec(field.key, !boolVal)}
          >
            <View style={[styles.boolInner, boolVal && styles.boolInnerOn]} />
          </Pressable>
        </View>
      );
    }

    if (field.input === "picker" && field.options) {
      return (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={val ?? field.options[0]}
              onValueChange={(v) => setSpec(field.key, v)}
            >
              <Picker.Item label="—" value="" />
              {field.options.map((opt) => (
                <Picker.Item
                  key={opt}
                  label={formatPickerLabel(opt)}
                  value={opt}
                />
              ))}
            </Picker>
          </View>
        </View>
      );
    }

    if (field.input === "textarea") {
      return (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={
              typeof val === "string" ? val : val != null ? String(val) : ""
            }
            onChangeText={(t) => setSpec(field.key, t)}
            placeholder={field.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      );
    }

    return (
      <View key={field.key} style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.input}
          value={val != null ? String(val) : ""}
          onChangeText={(t) => setSpec(field.key, t)}
          placeholder={field.placeholder}
          keyboardType={field.input === "number" ? "decimal-pad" : "default"}
        />
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Custom type name */}
      {isCustom && (
        <>
          <Text style={styles.sectionHeader}>Item type</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Type name *</Text>
            <TextInput
              style={[
                styles.input,
                errors.customTypeName ? styles.inputError : null,
              ]}
              value={customTypeName}
              onChangeText={setCustomTypeName}
              placeholder="e.g. Zippo, Paracord, Patch"
              autoFocus
            />
            {errors.customTypeName ? (
              <Text style={styles.errorText}>{errors.customTypeName}</Text>
            ) : null}
          </View>
        </>
      )}

      {/* Photos */}
      <Text style={styles.sectionHeader}>Photos</Text>
      <View style={styles.photoRow}>
        {gallery.map((uri) => (
          <Pressable key={uri} onPress={() => removePhoto(uri)}>
            <Image source={{ uri }} style={styles.photo} />
            <View style={styles.photoDelete}>
              <Text style={styles.photoDeleteText}>×</Text>
            </View>
          </Pressable>
        ))}
        <Pressable style={styles.photoAdd} onPress={pickPhoto}>
          <Text style={styles.photoAddText}>+</Text>
        </Pressable>
      </View>

      {/* Required */}
      <Text style={styles.sectionHeader}>Required</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Manufacturer</Text>
        <TextInput
          style={[styles.input, errors.manufacturer ? styles.inputError : null]}
          value={manufacturer}
          onChangeText={setManufacturer}
          placeholder="e.g. Lamy, Spyderco"
        />
        {errors.manufacturer ? (
          <Text style={styles.errorText}>{errors.manufacturer}</Text>
        ) : null}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Model</Text>
        <TextInput
          style={[styles.input, errors.model ? styles.inputError : null]}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Safari, Para 3"
        />
        {errors.model ? (
          <Text style={styles.errorText}>{errors.model}</Text>
        ) : null}
      </View>

      {/* Identity */}
      <Text style={styles.sectionHeader}>Identity</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nickname</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Variant</Text>
        <TextInput
          style={styles.input}
          value={variant}
          onChangeText={setVariant}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Serial Number</Text>
        <TextInput
          style={styles.input}
          value={serialNumber}
          onChangeText={setSerialNumber}
        />
      </View>

      {/* Ownership */}
      <Text style={styles.sectionHeader}>Ownership</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={status} onValueChange={setStatus}>
            <Picker.Item label="Own" value="own" />
            <Picker.Item label="Wishlist" value="wishlist" />
            <Picker.Item label="Sold" value="sold" />
            <Picker.Item label="Lost" value="lost" />
            <Picker.Item label="Gifted" value="gifted" />
          </Picker>
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Purchase Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Purchase Price</Text>
        <TextInput
          style={styles.input}
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Seller</Text>
        <TextInput
          style={styles.input}
          value={seller}
          onChangeText={setSeller}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Warranty</Text>
        <TextInput
          style={styles.input}
          value={warranty}
          onChangeText={setWarranty}
        />
      </View>

      {/* Physical */}
      <Text style={styles.sectionHeader}>Physical</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Material</Text>
        <TextInput
          style={styles.input}
          value={material}
          onChangeText={setMaterial}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Finish</Text>
        <TextInput
          style={styles.input}
          value={finish}
          onChangeText={setFinish}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Color</Text>
        <TextInput style={styles.input} value={color} onChangeText={setColor} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Weight (g)</Text>
        <TextInput
          style={styles.input}
          value={weightG}
          onChangeText={setWeightG}
          keyboardType="decimal-pad"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Dimensions</Text>
        <TextInput
          style={styles.input}
          value={dimensions}
          onChangeText={setDimensions}
        />
      </View>

      {/* Organization */}
      <Text style={styles.sectionHeader}>Organization</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Storage Location</Text>
        <TextInput
          style={styles.input}
          value={storageLocation}
          onChangeText={setStorageLocation}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Type-specific spec sections */}
      {config?.specSections.map((section) => (
        <View key={section.title}>
          <Text style={styles.sectionHeader}>{section.title}</Text>
          {section.fields.map(renderField)}
        </View>
      ))}

      {/* Custom fields (custom item types only) */}
      {isCustom && (
        <>
          <Text style={styles.sectionHeader}>Custom Fields</Text>
          {customFields.map((field, i) => (
            <View key={field.id} style={styles.customFieldRow}>
              <TextInput
                style={[styles.input, styles.customFieldLabel]}
                value={field.label}
                onChangeText={(v) => updateCustomField(i, "label", v)}
                placeholder="Field name"
              />
              <TextInput
                style={[styles.input, styles.customFieldValue]}
                value={field.value}
                onChangeText={(v) => updateCustomField(i, "value", v)}
                placeholder="Value"
              />
              <Pressable
                style={styles.removeFieldButton}
                onPress={() => removeCustomField(i)}
              >
                <Text style={styles.removeFieldText}>×</Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addFieldButton} onPress={addCustomField}>
            <Text style={styles.addFieldText}>+ Add field</Text>
          </Pressable>
        </>
      )}

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, backgroundColor: C.bg },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 12,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: C.textSub, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: C.bgInput,
    color: C.text,
  },
  inputError: { borderColor: C.danger },
  errorText: { color: C.danger, fontSize: 12, marginTop: 3 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.bgInput,
    overflow: "hidden",
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  photo: { width: 80, height: 80, borderRadius: 8 },
  photoDelete: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoDeleteText: { color: C.text, fontSize: 14, lineHeight: 16 },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.accent,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddText: { fontSize: 32, color: C.accentBright, lineHeight: 36 },
  customFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  customFieldLabel: { flex: 2 },
  customFieldValue: { flex: 3 },
  removeFieldButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  removeFieldText: { color: C.danger, fontSize: 18, lineHeight: 20 },
  addFieldButton: {
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  addFieldText: { color: C.accentBright, fontSize: 14, fontWeight: "600" },
  boolRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingVertical: 4,
  },
  boolToggle: {
    width: 44,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bgMuted,
  },
  boolToggleOn: { borderColor: C.accent, backgroundColor: C.accent },
  boolInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.textMuted,
  },
  boolInnerOn: { backgroundColor: C.text },
  saveButton: {
    marginTop: 32,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: { color: C.text, fontSize: 16, fontWeight: "700" },
});
