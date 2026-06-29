import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ITEM_TYPE_MAP,
  SpecField,
  formatPickerLabel,
} from "../config/itemTypes";
import { fetchItemById, updateItem, Item } from "../db/database";

export default function EditItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { itemId } = route.params as { itemId: string };

  const [item, setItem] = useState<Item | null>(null);

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
  const [specValues, setSpecValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<{
    manufacturer?: string;
    model?: string;
  }>({});
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
    if (!result.canceled) setGallery((prev) => [...prev, result.assets[0].uri]);
  };

  const removePhoto = (uri: string) =>
    setGallery((prev) => prev.filter((u) => u !== uri));

  const [customFields, setCustomFields] = useState<
    { label: string; value: string }[]
  >([]);
  const addCustomField = () =>
    setCustomFields((prev) => [...prev, { label: "", value: "" }]);
  const updateCustomField = (i: number, key: "label" | "value", val: string) =>
    setCustomFields((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)),
    );
  const removeCustomField = (i: number) =>
    setCustomFields((prev) => prev.filter((_, idx) => idx !== i));

  useEffect(() => {
    fetchItemById(itemId).then((i) => {
      if (!i) return;
      setItem(i);
      setManufacturer(i.manufacturer ?? "");
      setModel(i.model ?? "");
      setNickname(i.nickname ?? "");
      setVariant(i.variant ?? "");
      setSerialNumber(i.serial_number ?? "");
      setStatus(i.status ?? "own");
      setPurchaseDate(i.purchase_date ?? "");
      setPurchasePrice(
        i.purchase_price != null ? String(i.purchase_price) : "",
      );
      setSeller(i.seller ?? "");
      setWarranty(i.warranty ?? "");
      setMaterial(i.material ?? "");
      setFinish(i.finish ?? "");
      setColor(i.color ?? "");
      setWeightG(i.weight_g != null ? String(i.weight_g) : "");
      setDimensions(i.dimensions ?? "");
      setStorageLocation(i.storage_location ?? "");
      setNotes(i.notes ?? "");
      // Pre-fill spec values
      const sv: Record<string, any> = {};
      const cfg = ITEM_TYPE_MAP[i.item_type];
      if (cfg) {
        for (const section of cfg.specSections) {
          for (const field of section.fields) {
            const v = i.specs[field.key];
            if (v !== undefined && v !== null) {
              if (field.input === "boolean") {
                sv[field.key] = !!v;
              } else {
                sv[field.key] = String(v);
              }
            }
          }
        }
      }
      setSpecValues(sv);
      if (!ITEM_TYPE_MAP[i.item_type] && Array.isArray(i.specs.custom_fields)) {
        setCustomFields(i.specs.custom_fields);
      }
      setGallery(i.gallery ?? []);
    });
  }, [itemId]);

  const config = item ? ITEM_TYPE_MAP[item.item_type] : null;
  const isCustom = item ? !config : false;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: config?.label ? `Edit ${config.label}` : "Edit Item",
    });
  }, [navigation, config]);

  const setSpec = (key: string, value: any) => {
    setSpecValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!manufacturer.trim())
      newErrors.manufacturer = "Manufacturer is required";
    if (!model.trim()) newErrors.model = "Model is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const specs: Record<string, any> = {};
    if (config) {
      for (const section of config.specSections) {
        for (const field of section.fields) {
          const val = specValues[field.key];
          if (val === undefined || val === null || val === "") continue;
          if (field.input === "boolean") {
            specs[field.key] = val ? 1 : 0;
          } else if (field.input === "number") {
            const n = parseFloat(val);
            if (!isNaN(n)) specs[field.key] = n;
          } else {
            specs[field.key] = val;
          }
        }
      }
    }

    if (isCustom) {
      const filled = customFields.filter((f) => f.label.trim());
      if (filled.length > 0) specs.custom_fields = filled;
    }

    await updateItem(itemId, {
      cover_photo: gallery[0] ?? null,
      gallery,
      manufacturer: manufacturer.trim() || null,
      model: model.trim() || null,
      variant: variant.trim() || null,
      nickname: nickname.trim() || null,
      serial_number: serialNumber.trim() || null,
      status,
      purchase_date: purchaseDate.trim() || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      seller: seller.trim() || null,
      warranty: warranty.trim() || null,
      material: material.trim() || null,
      finish: finish.trim() || null,
      color: color.trim() || null,
      weight_g: weightG ? parseFloat(weightG) : null,
      dimensions: dimensions.trim() || null,
      storage_location: storageLocation.trim() || null,
      notes: notes.trim() || null,
      specs,
    });

    navigation.goBack();
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
              selectedValue={val ?? ""}
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
            value={val ?? ""}
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

  if (!item) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
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

      <Text style={styles.sectionHeader}>Required</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Manufacturer</Text>
        <TextInput
          style={[styles.input, errors.manufacturer ? styles.inputError : null]}
          value={manufacturer}
          onChangeText={setManufacturer}
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
        />
        {errors.model ? (
          <Text style={styles.errorText}>{errors.model}</Text>
        ) : null}
      </View>

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
            <View key={i} style={styles.customFieldRow}>
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
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 12,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: "#555", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#e25555" },
  errorText: { color: "#e25555", fontSize: 12, marginTop: 3 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
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
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoDeleteText: { color: "#fff", fontSize: 14, lineHeight: 16 },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#4a90e2",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddText: { fontSize: 32, color: "#4a90e2", lineHeight: 36 },
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
    borderColor: "#e25555",
    alignItems: "center",
    justifyContent: "center",
  },
  removeFieldText: { color: "#e25555", fontSize: 18, lineHeight: 20 },
  addFieldButton: {
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  addFieldText: { color: "#4a90e2", fontSize: 14, fontWeight: "600" },
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
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  boolToggleOn: { borderColor: "#4a90e2", backgroundColor: "#4a90e2" },
  boolInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ccc",
  },
  boolInnerOn: { backgroundColor: "#fff" },
  saveButton: {
    marginTop: 32,
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
