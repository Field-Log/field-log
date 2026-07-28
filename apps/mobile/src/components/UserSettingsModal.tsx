import { useAuth } from "@clerk/expo";
import { loggerMessages } from "@package/logger";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { logger } from "../lib/logger";
import {
  defaultMobileUserSettings,
  fetchUserSettings,
  type MobileCurrencyCode,
  type MobileDimensionUnit,
  type MobileThemeMode,
  type MobileUserSettings,
  type MobileUserSettingsPatch,
  type MobileWeightUnit,
  mobileCurrencyCodes,
  patchUserSettings,
} from "../lib/user-settings";
import { C } from "../theme/colors";

type UserSettingsModalProps = {
  onClose: () => void;
  visible: boolean;
};

const themeOptions: Array<{ label: string; value: MobileThemeMode }> = [
  { label: "Dark", value: "dark" },
  { label: "Light", value: "light" },
  { label: "System", value: "system" },
];

const dimensionOptions: Array<{ label: string; value: MobileDimensionUnit }> = [
  { label: "Inches", value: "in" },
  { label: "Millimeters", value: "mm" },
];

const weightOptions: Array<{ label: string; value: MobileWeightUnit }> = [
  { label: "Grams", value: "g" },
  { label: "Ounces", value: "oz" },
];

export function UserSettingsModal({
  onClose,
  visible,
}: UserSettingsModalProps): ReactElement {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<MobileUserSettings>(
    defaultMobileUserSettings,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!visible) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Missing session token.");
      }

      setSettings(await fetchUserSettings(token));
    } catch (loadError: unknown) {
      logger.warn(loggerMessages.mobile.userSettingsFetchFailed, {
        error: loadError,
      });
      setError("Settings are unavailable.");
    } finally {
      setLoading(false);
    }
  }, [getToken, visible]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function saveSettings(patch: MobileUserSettingsPatch): Promise<void> {
    setSettings((current) => ({ ...current, ...patch }));
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Missing session token.");
      }

      setSettings(await patchUserSettings({ settings: patch, token }));
    } catch (saveError: unknown) {
      logger.warn(loggerMessages.mobile.userSettingsSaveFailed, {
        error: saveError,
      });
      setError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable
            accessibilityLabel="Close settings"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {loading ? <ActivityIndicator /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <SettingsGroup label="Theme">
            <SegmentedControl
              disabled={saving}
              onChange={(theme) => {
                saveSettings({ theme: theme as MobileThemeMode });
              }}
              options={themeOptions}
              value={settings.theme}
            />
          </SettingsGroup>
          <SettingsGroup label="Dimensions">
            <SegmentedControl
              disabled={saving}
              onChange={(dimensionUnit) => {
                saveSettings({
                  dimensionUnit: dimensionUnit as MobileDimensionUnit,
                });
              }}
              options={dimensionOptions}
              value={settings.dimensionUnit}
            />
          </SettingsGroup>
          <SettingsGroup label="Weight">
            <SegmentedControl
              disabled={saving}
              onChange={(weightUnit) => {
                saveSettings({ weightUnit: weightUnit as MobileWeightUnit });
              }}
              options={weightOptions}
              value={settings.weightUnit}
            />
          </SettingsGroup>
          <SettingsGroup label="Currency">
            <View style={styles.currencyGrid}>
              {mobileCurrencyCodes.map((currencyCode) => (
                <OptionButton
                  disabled={saving}
                  key={currencyCode}
                  label={currencyLabel(currencyCode)}
                  onPress={() => saveSettings({ currencyCode })}
                  selected={settings.currencyCode === currencyCode}
                />
              ))}
            </View>
          </SettingsGroup>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SettingsGroup({
  children,
  label,
}: {
  children: ReactElement;
  label: string;
}): ReactElement {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl({
  disabled,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}): ReactElement {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <OptionButton
          disabled={disabled}
          key={option.value}
          label={option.label}
          onPress={() => onChange(option.value)}
          selected={option.value === value}
        />
      ))}
    </View>
  );
}

function OptionButton({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.optionButton,
        selected ? styles.optionButtonSelected : null,
        disabled ? styles.optionButtonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.optionButtonText,
          selected ? styles.optionButtonTextSelected : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function currencyLabel(code: MobileCurrencyCode): string {
  switch (code) {
    case "CAD":
      return "$ CAD";
    case "USD":
      return "$ USD";
    case "EUR":
      return "EUR";
    case "GBP":
      return "GBP";
    case "AUD":
      return "$ AUD";
    case "JPY":
      return "JPY";
    case "CHF":
      return "CHF";
    case "NZD":
      return "$ NZD";
  }
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeButtonText: { color: C.text, fontSize: 14, fontWeight: "700" },
  content: {
    gap: 18,
    padding: 16,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  error: {
    color: C.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  header: {
    alignItems: "center",
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionButton: {
    alignItems: "center",
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionButtonDisabled: {
    opacity: 0.55,
  },
  optionButtonSelected: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  optionButtonText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  optionButtonTextSelected: {
    color: C.bg,
  },
  screen: { backgroundColor: C.bg, flex: 1 },
  segmented: {
    flexDirection: "row",
    gap: 8,
  },
  title: { color: C.text, fontSize: 18, fontWeight: "700" },
});
