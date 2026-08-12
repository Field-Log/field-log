import { mobileEnv } from "../env";

export type MobileThemeMode = "dark" | "light" | "system";
export type MobileDimensionUnit = "in" | "mm";
export type MobileWeightUnit = "g" | "oz";
export type MobileCurrencyCode =
  | "CAD"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "JPY"
  | "CHF"
  | "NZD";

export type MobileUserSettings = {
  currencyCode: MobileCurrencyCode;
  dimensionUnit: MobileDimensionUnit;
  theme: MobileThemeMode;
  weightUnit: MobileWeightUnit;
};

export type MobileUserSettingsPatch = Partial<MobileUserSettings>;

export const defaultMobileUserSettings: MobileUserSettings = {
  currencyCode: "USD",
  dimensionUnit: "in",
  theme: "system",
  weightUnit: "g",
};

export const mobileCurrencyCodes: MobileCurrencyCode[] = [
  "CAD",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "JPY",
  "CHF",
  "NZD",
];

function createUserSettingsUrl() {
  if (!mobileEnv.EXPO_PUBLIC_API_URL) {
    throw new Error("User settings require EXPO_PUBLIC_API_URL.");
  }

  return `${mobileEnv.EXPO_PUBLIC_API_URL.replace(/\/+$/, "")}/api/v0/user/settings`;
}

export async function fetchUserSettings(
  token: string,
): Promise<MobileUserSettings> {
  const response = await fetch(createUserSettingsUrl(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`User settings request failed: ${response.status}`);
  }

  return parseUserSettings(await response.json());
}

export async function patchUserSettings(input: {
  settings: MobileUserSettingsPatch;
  token: string;
}): Promise<MobileUserSettings> {
  const response = await fetch(createUserSettingsUrl(), {
    body: JSON.stringify(input.settings),
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(`User settings update failed: ${response.status}`);
  }

  return parseUserSettings(await response.json());
}

function parseUserSettings(value: unknown): MobileUserSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return defaultMobileUserSettings;
  }

  const settings = value as Partial<MobileUserSettings>;

  return {
    currencyCode: isCurrencyCode(settings.currencyCode)
      ? settings.currencyCode
      : defaultMobileUserSettings.currencyCode,
    dimensionUnit:
      settings.dimensionUnit === "mm"
        ? "mm"
        : defaultMobileUserSettings.dimensionUnit,
    theme: isThemeMode(settings.theme)
      ? settings.theme
      : defaultMobileUserSettings.theme,
    weightUnit:
      settings.weightUnit === "oz"
        ? "oz"
        : defaultMobileUserSettings.weightUnit,
  };
}

function isCurrencyCode(value: unknown): value is MobileCurrencyCode {
  return mobileCurrencyCodes.includes(value as MobileCurrencyCode);
}

function isThemeMode(value: unknown): value is MobileThemeMode {
  return value === "dark" || value === "light" || value === "system";
}
