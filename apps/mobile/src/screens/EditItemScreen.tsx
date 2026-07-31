import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { styled } from "nativewind";
import { type ReactElement, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  formatPickerLabel,
  ITEM_TYPE_MAP,
  type SpecField,
} from "../config/itemTypes";
import {
  fetchItemById,
  type Item,
  type SpecValue,
  updateItem,
} from "../db/database";
import { syncCurrentUserItemBestEffort } from "../db/sync";
import type { FieldLogNavigation, FieldLogRoute } from "../navigation/types";

type StoredCustomField = { label: string; value: string };
type CustomFieldDraft = StoredCustomField & { id: string };

const StyledPicker = styled(Picker);

function createCustomFieldDraft(
  field: StoredCustomField = { label: "", value: "" },
): CustomFieldDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...field,
  };
}

function isStoredCustomField(value: SpecValue): value is StoredCustomField {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof value.label === "string" &&
    typeof value.value === "string"
  );
}

const addFieldButtonClass =
  "mb-2 items-center rounded-lg border border-dashed border-accent py-2.5";
const boolRowClass = "mb-3.5 flex-row items-center justify-between py-1";
const centeredClass = "flex-1 items-center justify-center bg-background";
const customFieldRowClass = "mb-2.5 flex-row items-center gap-2";
const errorTextClass = "mt-1 text-xs text-destructive";
const fieldGroupClass = "mb-3.5";
const fieldLabelClass = "mb-1 text-sm text-card-foreground";
const inputClass =
  "rounded-lg border border-border bg-background p-2.5 text-base text-foreground";
const inputErrorClass =
  "rounded-lg border border-destructive bg-background p-2.5 text-base text-foreground";
const pickerWrapperClass =
  "overflow-hidden rounded-lg border border-border bg-background";
const sectionHeaderClass =
  "mb-3 mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground";
const textareaClass = `${inputClass} min-h-20`;

export default function EditItemScreen(): ReactElement {
  const navigation = useNavigation<FieldLogNavigation>();
  const route = useRoute<FieldLogRoute<"EditItem">>();
  const { itemId } = route.params;

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
  const [specValues, setSpecValues] = useState<Record<string, SpecValue>>({});
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
    const firstAsset = result.canceled ? undefined : result.assets[0];
    if (firstAsset) setGallery((prev) => [...prev, firstAsset.uri]);
  };

  const removePhoto = (uri: string) =>
    setGallery((prev) => prev.filter((u) => u !== uri));

  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const addCustomField = () =>
    setCustomFields((prev) => [...prev, createCustomFieldDraft()]);
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
      const sv: Record<string, SpecValue> = {};
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
      const customFieldsValue = i.specs.custom_fields;
      if (!ITEM_TYPE_MAP[i.item_type] && Array.isArray(customFieldsValue)) {
        setCustomFields(
          customFieldsValue
            .filter(isStoredCustomField)
            .map((field) => createCustomFieldDraft(field)),
        );
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

  const setSpec = (key: string, value: SpecValue) => {
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

    if (isCustom) {
      const filled = customFields
        .filter((f) => f.label.trim())
        .map(({ label, value }) => ({ label, value }));
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
    syncCurrentUserItemBestEffort(itemId);

    navigation.goBack();
  };

  const renderField = (field: SpecField) => {
    const val = specValues[field.key];
    const label = field.unit ? `${field.label} (${field.unit})` : field.label;

    if (field.input === "boolean") {
      const boolVal = !!val;
      return (
        <View key={field.key} className={boolRowClass}>
          <Text className={fieldLabelClass}>{field.label}</Text>
          <Pressable
            className={`h-7 w-11 items-center justify-center rounded-full border-2 ${
              boolVal
                ? "border-accent bg-accent"
                : "border-border bg-sidebar-accent"
            }`}
            onPress={() => setSpec(field.key, !boolVal)}
          >
            <View
              className={`h-5 w-5 rounded-full ${
                boolVal ? "bg-accent-foreground" : "bg-muted-foreground"
              }`}
            />
          </Pressable>
        </View>
      );
    }

    if (field.input === "picker" && field.options) {
      return (
        <View key={field.key} className={fieldGroupClass}>
          <Text className={fieldLabelClass}>{label}</Text>
          <View className={pickerWrapperClass}>
            <StyledPicker
              className="bg-background text-foreground"
              selectedValue={val ?? ""}
              onValueChange={(v: string) => setSpec(field.key, v)}
            >
              <Picker.Item label="—" value="" />
              {field.options.map((opt) => (
                <Picker.Item
                  key={opt}
                  label={formatPickerLabel(opt)}
                  value={opt}
                />
              ))}
            </StyledPicker>
          </View>
        </View>
      );
    }

    if (field.input === "textarea") {
      return (
        <View key={field.key} className={fieldGroupClass}>
          <Text className={fieldLabelClass}>{label}</Text>
          <TextInput
            className={textareaClass}
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
      <View key={field.key} className={fieldGroupClass}>
        <Text className={fieldLabelClass}>{label}</Text>
        <TextInput
          className={inputClass}
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
      <View className={centeredClass}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerClassName="bg-background p-4 pb-12"
      keyboardShouldPersistTaps="handled"
    >
      <Text className={sectionHeaderClass}>Photos</Text>
      <View className="mb-2 flex-row flex-wrap gap-2.5">
        {gallery.map((uri) => (
          <Pressable key={uri} onPress={() => removePhoto(uri)}>
            <Image className="h-20 w-20 rounded-lg" source={{ uri }} />
            <View className="absolute right-0.5 top-0.5 h-5 w-5 items-center justify-center rounded-full bg-black/70">
              <Text className="text-sm leading-4 text-foreground">×</Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          className="h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-accent"
          onPress={pickPhoto}
        >
          <Text className="text-3xl leading-9 text-primary">+</Text>
        </Pressable>
      </View>

      <Text className={sectionHeaderClass}>Required</Text>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Manufacturer</Text>
        <TextInput
          className={errors.manufacturer ? inputErrorClass : inputClass}
          value={manufacturer}
          onChangeText={setManufacturer}
        />
        {errors.manufacturer ? (
          <Text className={errorTextClass}>{errors.manufacturer}</Text>
        ) : null}
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Model</Text>
        <TextInput
          className={errors.model ? inputErrorClass : inputClass}
          value={model}
          onChangeText={setModel}
        />
        {errors.model ? (
          <Text className={errorTextClass}>{errors.model}</Text>
        ) : null}
      </View>

      <Text className={sectionHeaderClass}>Identity</Text>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Nickname</Text>
        <TextInput
          className={inputClass}
          value={nickname}
          onChangeText={setNickname}
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Variant</Text>
        <TextInput
          className={inputClass}
          value={variant}
          onChangeText={setVariant}
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Serial Number</Text>
        <TextInput
          className={inputClass}
          value={serialNumber}
          onChangeText={setSerialNumber}
        />
      </View>

      <Text className={sectionHeaderClass}>Ownership</Text>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Status</Text>
        <View className={pickerWrapperClass}>
          <StyledPicker
            className="bg-background text-foreground"
            selectedValue={status}
            onValueChange={(v: string) => setStatus(v)}
          >
            <Picker.Item label="Own" value="own" />
            <Picker.Item label="Wishlist" value="wishlist" />
            <Picker.Item label="Sold" value="sold" />
            <Picker.Item label="Lost" value="lost" />
            <Picker.Item label="Gifted" value="gifted" />
          </StyledPicker>
        </View>
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Purchase Date (YYYY-MM-DD)</Text>
        <TextInput
          className={inputClass}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Purchase Price</Text>
        <TextInput
          className={inputClass}
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Seller</Text>
        <TextInput
          className={inputClass}
          value={seller}
          onChangeText={setSeller}
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Warranty</Text>
        <TextInput
          className={inputClass}
          value={warranty}
          onChangeText={setWarranty}
        />
      </View>

      <Text className={sectionHeaderClass}>Physical</Text>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Material</Text>
        <TextInput
          className={inputClass}
          value={material}
          onChangeText={setMaterial}
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Finish</Text>
        <TextInput
          className={inputClass}
          value={finish}
          onChangeText={setFinish}
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Color</Text>
        <TextInput
          className={inputClass}
          value={color}
          onChangeText={setColor}
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Weight (g)</Text>
        <TextInput
          className={inputClass}
          value={weightG}
          onChangeText={setWeightG}
          keyboardType="decimal-pad"
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Dimensions</Text>
        <TextInput
          className={inputClass}
          value={dimensions}
          onChangeText={setDimensions}
        />
      </View>

      <Text className={sectionHeaderClass}>Organization</Text>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Storage Location</Text>
        <TextInput
          className={inputClass}
          value={storageLocation}
          onChangeText={setStorageLocation}
        />
      </View>
      <View className={fieldGroupClass}>
        <Text className={fieldLabelClass}>Notes</Text>
        <TextInput
          className={textareaClass}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {config?.specSections.map((section) => (
        <View key={section.title}>
          <Text className={sectionHeaderClass}>{section.title}</Text>
          {section.fields.map(renderField)}
        </View>
      ))}

      {/* Custom fields (custom item types only) */}
      {isCustom && (
        <>
          <Text className={sectionHeaderClass}>Custom Fields</Text>
          {customFields.map((field, i) => (
            <View key={field.id} className={customFieldRowClass}>
              <TextInput
                className={`${inputClass} basis-2/5`}
                value={field.label}
                onChangeText={(v) => updateCustomField(i, "label", v)}
                placeholder="Field name"
              />
              <TextInput
                className={`${inputClass} basis-3/5`}
                value={field.value}
                onChangeText={(v) => updateCustomField(i, "value", v)}
                placeholder="Value"
              />
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full border border-destructive"
                onPress={() => removeCustomField(i)}
              >
                <Text className="text-lg leading-5 text-destructive">×</Text>
              </Pressable>
            </View>
          ))}
          <Pressable className={addFieldButtonClass} onPress={addCustomField}>
            <Text className="text-sm font-semibold text-primary">
              + Add field
            </Text>
          </Pressable>
        </>
      )}

      <Pressable
        className="mt-8 items-center rounded-lg bg-accent py-4"
        onPress={handleSave}
      >
        <Text className="text-base font-bold text-accent-foreground">
          Save Changes
        </Text>
      </Pressable>
    </ScrollView>
  );
}
