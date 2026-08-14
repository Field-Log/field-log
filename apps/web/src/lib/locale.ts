import {
  DEFAULT_LOCALE,
  type LocalePreference,
  resolveLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@pocket-trash/localizations";

export const localeStorageKey = "field-log.locale";
export const supportedLocales = SUPPORTED_LOCALES;

export function localeLabel(locale: SupportedLocale) {
  switch (locale) {
    case "en":
      return "English";
    case "es-MX":
      return "Español (México)";
  }
}

export function browserLocalePreferences(): readonly LocalePreference[] {
  if (typeof navigator === "undefined") return [];

  return navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
}

export function readStoredLocale(): SupportedLocale | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(localeStorageKey);
  const locale = resolveLocale(stored);

  return locale === DEFAULT_LOCALE && stored !== DEFAULT_LOCALE ? null : locale;
}

export function writeStoredLocale(locale: SupportedLocale) {
  window.localStorage.setItem(localeStorageKey, locale);
}

export function resolveBrowserLocale() {
  return resolveWebLocale(readStoredLocale(), browserLocalePreferences());
}

export function resolveWebLocale(
  storedLocale: LocalePreference,
  preferences: readonly LocalePreference[],
) {
  return resolveLocale(storedLocale, ...preferences);
}

export function localeHeader() {
  return [readStoredLocale(), ...browserLocalePreferences()]
    .filter((value): value is string => typeof value === "string" && !!value)
    .join(",");
}
