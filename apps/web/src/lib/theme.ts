export type ThemeMode = "light" | "dark" | "system";

export const themeStorageKey = "field-log.theme";

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function resolvedTheme(theme: ThemeMode) {
  if (theme !== "system") return theme;

  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle(
    "dark",
    resolvedTheme(theme) === "dark",
  );
}
