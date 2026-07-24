export const currencyCodes = [
  "CAD",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "JPY",
  "CHF",
  "NZD",
] as const;

export const dimensionUnits = ["in", "mm"] as const;
export const featureFlagAudiences = ["global", "admin", "user"] as const;
export const featureFlagOverrideSources = ["admin", "user"] as const;
export const themeModes = ["dark", "light"] as const;
export const weightUnits = ["g", "oz"] as const;

export type CurrencyCode = (typeof currencyCodes)[number];
export type DimensionUnit = (typeof dimensionUnits)[number];
export type FeatureFlagAudience = (typeof featureFlagAudiences)[number];
export type FeatureFlagOverrideSource =
  (typeof featureFlagOverrideSources)[number];
export type ThemeMode = (typeof themeModes)[number];
export type WeightUnit = (typeof weightUnits)[number];
